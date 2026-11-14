import { patchElementEffect, renderIframeReplaceApp } from "./iframe";
import { renderElementToContainer } from "./shadow";
import { pushUrlToWindow } from "./sync";
import { documentProxyProperties, rawDocumentQuerySelector } from "./common";
import { WUJIE_TIPS_RELOAD_DISABLED, WUJIE_TIPS_GET_ELEMENT_BY_ID } from "./constant";
import { getTargetValue, getDegradeIframe, isCallable, checkProxyFunction, warn, stopMainAppRun } from "./utils";

type LocationNavigateMode = "href" | "assign" | "replace";

function renderInIframe(iframe: HTMLIFrameElement, url: string) {
  const { shadowRoot, id, degrade, degradeAttrs } = iframe.contentWindow.__WUJIE;
  if (degrade) {
    renderIframeReplaceApp(window.decodeURIComponent(url), getDegradeIframe(id).parentElement, degradeAttrs);
    return;
  }
  renderIframeReplaceApp(url, shadowRoot.host.parentElement, degradeAttrs);
}

function isHashOnlyChange(targetUrl: string, currentUrl: string): boolean {
  return targetUrl.includes("#") && targetUrl.split("#")[0] === currentUrl.split("#")[0];
}

/**
 * 子应用 location.href 赋值、location.assign、location.replace 的跳转，与原生语义保持一致：
 * - 相对地址基于子应用当前地址解析；
 * - 只改变 hash 时在 js iframe 内完成同文档跳转，不重新渲染；
 * - 其余情况渲染新的 iframe 替换子应用并同步到主应用 url（replace 不新增历史记录），浏览器后退时恢复原应用。
 */
function locationNavigate(
  iframe: HTMLIFrameElement,
  value: string | URL,
  mode: LocationNavigateMode,
  mainHostPath: string,
  appHostPath: string
): void {
  const sandbox = iframe.contentWindow.__WUJIE;
  const location = iframe.contentWindow.location;
  const currentUrl = location.href.replace(mainHostPath, appHostPath);
  const url = new URL(String(value), currentUrl).href;
  if (isHashOnlyChange(url, currentUrl)) {
    const iframeUrl = url.replace(appHostPath, mainHostPath);
    if (mode === "replace") location.replace(iframeUrl);
    else location.assign(iframeUrl);
    return;
  }
  sandbox.hrefFlag = true;
  if (sandbox.degrade) {
    const iframeBody = rawDocumentQuerySelector.call(iframe.contentDocument, "body");
    renderElementToContainer(sandbox.document.documentElement, iframeBody);
  }
  renderInIframe(iframe, url);
  pushUrlToWindow(sandbox.id, url, mode === "replace");
}

function isScriptSelector(selector: unknown): boolean {
  return typeof selector === "string" && selector.trim().toLowerCase() === "script";
}

/**
 * 子应用脚本都在 js iframe 中执行，shadowRoot / 渲染 iframe 中没有可执行的 script。
 * 与 getElementsByTagName("script") 保持一致从 js iframe 获取；
 * 用原生 querySelectorAll 而不是 document.scripts，保证返回值仍是 NodeList（scripts 是 HTMLCollection，没有 forEach）。
 */
function queryIframeScripts(iframe: HTMLIFrameElement): NodeListOf<HTMLScriptElement> {
  return iframe.contentWindow.__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR_ALL__.call(iframe.contentDocument, "script");
}

/**
 * 非降级情况下window、document、location代理
 */
export function proxyGenerator(
  iframe: HTMLIFrameElement,
  urlElement: HTMLAnchorElement,
  mainHostPath: string,
  appHostPath: string
): {
  proxyWindow: Window;
  proxyDocument: Object;
  proxyLocation: Object;
  proxyRevoke: () => void;
} {
  const { proxy: proxyWindow, revoke: revokeWindow } = Proxy.revocable(iframe.contentWindow, {
    get: (target: Window, p: PropertyKey): any => {
      // location进行劫持
      if (p === "location") {
        return target.__WUJIE.proxyLocation;
      }
      // 判断自身
      if (p === "self" || (p === "window" && Object.getOwnPropertyDescriptor(window, "window").get)) {
        return target.__WUJIE.proxy;
      }
      // 不要绑定this
      if (p === "__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__" || p === "__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR_ALL__") {
        return target[p];
      }
      // https://262.ecma-international.org/8.0/#sec-proxy-object-internal-methods-and-internal-slots-get-p-receiver
      const descriptor = Object.getOwnPropertyDescriptor(target, p);
      if (descriptor?.configurable === false && descriptor?.writable === false) {
        return target[p];
      }
      // 修正this指针指向
      return getTargetValue(target, p);
    },

    set: (target: Window, p: PropertyKey, value: any) => {
      checkProxyFunction(target, value);
      target[p] = value;
      return true;
    },

    has: (target: Window, p: PropertyKey) => p in target,
  });

  // proxy document
  const { proxy: proxyDocument, revoke: revokeDocument } = Proxy.revocable(
    {},
    {
      get: function (_fakeDocument, propKey) {
        const document = window.document;
        const { shadowRoot, proxyLocation } = iframe.contentWindow.__WUJIE;
        // iframe初始化完成后，webcomponent还未挂在上去，此时运行了主应用代码，必须中止
        if (!shadowRoot) stopMainAppRun();
        const rawCreateElement = iframe.contentWindow.__WUJIE_RAW_DOCUMENT_CREATE_ELEMENT__;
        const rawCreateTextNode = iframe.contentWindow.__WUJIE_RAW_DOCUMENT_CREATE_TEXT_NODE__;
        // need fix
        if (propKey === "createElement" || propKey === "createTextNode") {
          return new Proxy(document[propKey], {
            apply(_createElement, _ctx, args) {
              const rawCreateMethod = propKey === "createElement" ? rawCreateElement : rawCreateTextNode;
              const element = rawCreateMethod.apply(iframe.contentDocument, args);
              patchElementEffect(element, iframe.contentWindow);
              return element;
            },
          });
        }
        if (propKey === "documentURI" || propKey === "URL") {
          return (proxyLocation as Location).href;
        }

        // from shadowRoot
        if (
          propKey === "getElementsByTagName" ||
          propKey === "getElementsByClassName" ||
          propKey === "getElementsByName"
        ) {
          return new Proxy(shadowRoot.querySelectorAll, {
            apply(querySelectorAll, _ctx, args) {
              let arg = args[0];
              if (_ctx !== iframe.contentDocument) {
                return _ctx[propKey].apply(_ctx, args);
              }

              if (propKey === "getElementsByTagName" && arg === "script") {
                return iframe.contentDocument.scripts;
              }
              if (propKey === "getElementsByClassName") arg = "." + arg;
              if (propKey === "getElementsByName") arg = `[name="${arg}"]`;

              // FIXME: This string must be a valid CSS selector string; if it's not, a SyntaxError exception is thrown;
              // so we should ensure that the program can execute normally in case of exceptions.
              // reference: https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll

              let res: NodeList[] | [];
              try {
                res = querySelectorAll.call(shadowRoot, arg);
              } catch (error) {
                res = [];
              }

              return res;
            },
          });
        }
        if (propKey === "getElementById") {
          return new Proxy(shadowRoot.querySelector, {
            // case document.querySelector.call
            apply(target, ctx, args) {
              if (ctx !== iframe.contentDocument) {
                return ctx[propKey]?.apply(ctx, args);
              }
              try {
                return (
                  target.call(shadowRoot, `[id="${args[0]}"]`) ||
                  iframe.contentWindow.__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__.call(
                    iframe.contentWindow.document,
                    `#${args[0]}`
                  )
                );
              } catch (error) {
                warn(WUJIE_TIPS_GET_ELEMENT_BY_ID);
                return null;
              }
            },
          });
        }
        if (propKey === "querySelector" || propKey === "querySelectorAll") {
          const rawPropMap = {
            querySelector: "__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__",
            querySelectorAll: "__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR_ALL__",
          };
          return new Proxy(shadowRoot[propKey], {
            apply(target, ctx, args) {
              if (ctx !== iframe.contentDocument) {
                return ctx[propKey]?.apply(ctx, args);
              }
              if (propKey === "querySelectorAll" && isScriptSelector(args[0])) {
                return queryIframeScripts(iframe);
              }
              // 二选一，优先shadowDom，除非采用array合并，排除base，防止对router造成影响
              return (
                target.apply(shadowRoot, args) ||
                (args[0] === "base"
                  ? null
                  : iframe.contentWindow[rawPropMap[propKey]].call(iframe.contentWindow.document, args[0]))
              );
            },
          });
        }
        if (propKey === "documentElement" || propKey === "scrollingElement") return shadowRoot.firstElementChild;
        if (propKey === "forms") return shadowRoot.querySelectorAll("form");
        if (propKey === "images") return shadowRoot.querySelectorAll("img");
        if (propKey === "links") return shadowRoot.querySelectorAll("a");
        const { ownerProperties, shadowProperties, shadowMethods, documentProperties, documentMethods } =
          documentProxyProperties;
        if (ownerProperties.concat(shadowProperties).includes(propKey.toString())) {
          if (propKey === "activeElement" && shadowRoot.activeElement === null) return shadowRoot.body;
          return shadowRoot[propKey];
        }
        if (shadowMethods.includes(propKey.toString())) {
          return getTargetValue(shadowRoot, propKey) ?? getTargetValue(document, propKey);
        }
        // from window.document
        if (documentProperties.includes(propKey.toString())) {
          return document[propKey];
        }
        if (documentMethods.includes(propKey.toString())) {
          return getTargetValue(document, propKey);
        }
      },
    }
  );

  // proxy location
  const { proxy: proxyLocation, revoke: revokeLocation } = Proxy.revocable(
    {},
    {
      get: function (_fakeLocation, propKey) {
        const location = iframe.contentWindow.location;
        if (
          propKey === "host" ||
          propKey === "hostname" ||
          propKey === "protocol" ||
          propKey === "port" ||
          propKey === "origin"
        ) {
          return urlElement[propKey];
        }
        if (propKey === "href") {
          return location[propKey].replace(mainHostPath, appHostPath);
        }
        if (propKey === "reload") {
          warn(WUJIE_TIPS_RELOAD_DISABLED);
          return () => null;
        }
        if (propKey === "replace" || propKey === "assign") {
          return new Proxy(location[propKey], {
            apply(_target, _ctx, args) {
              locationNavigate(iframe, args[0], propKey, mainHostPath, appHostPath);
            },
          });
        }
        return getTargetValue(location, propKey);
      },
      set: function (_fakeLocation, propKey, value) {
        if (propKey === "href") {
          locationNavigate(iframe, value, "href", mainHostPath, appHostPath);
          return true;
        }
        iframe.contentWindow.location[propKey] = value;
        return true;
      },
      ownKeys: function () {
        return Object.keys(iframe.contentWindow.location).filter((key) => key !== "reload");
      },
      getOwnPropertyDescriptor: function (_target, key) {
        return { enumerable: true, configurable: true, value: this[key] };
      },
    }
  );
  // revoke 后引擎清空代理的 [[ProxyTarget]] / [[ProxyHandler]]，使捕获了 iframe / urlElement
  // 的 handler 闭包不可达，从而释放对 iframe 的强引用
  const proxyRevoke = () => {
    revokeWindow();
    revokeDocument();
    revokeLocation();
  };
  return { proxyWindow, proxyDocument, proxyLocation, proxyRevoke };
}

/**
 * 降级情况下document、location代理处理
 */
export function localGenerator(
  iframe: HTMLIFrameElement,
  urlElement: HTMLAnchorElement,
  mainHostPath: string,
  appHostPath: string
): {
  proxyDocument: Object;
  proxyLocation: Object;
  proxyRevoke: () => void;
} {
  // 降级模式无法使用 Proxy.revocable，改用可清空的引用：getter 闭包统一通过 iframeRef /
  // sandboxRef / locationRef 这三个 let 绑定访问 DOM，proxyRevoke 时置 null，闭包即丢失
  // 对 iframe 的强引用，斩断「主应用 → 代理闭包 → iframe」的引用链。
  let iframeRef: HTMLIFrameElement | null = iframe;
  let sandboxRef = iframe.contentWindow.__WUJIE;
  let locationRef: Location | null = iframe.contentWindow.location;
  // 代理 document
  const proxyDocument = {};
  // 特殊处理
  Object.defineProperties(proxyDocument, {
    createElement: {
      get: () => {
        return function (...args) {
          const element = iframeRef.contentWindow.__WUJIE_RAW_DOCUMENT_CREATE_ELEMENT__.apply(
            iframeRef.contentDocument,
            args
          );
          patchElementEffect(element, iframeRef.contentWindow);
          return element;
        };
      },
    },
    createTextNode: {
      get: () => {
        return function (...args) {
          const element = iframeRef.contentWindow.__WUJIE_RAW_DOCUMENT_CREATE_TEXT_NODE__.apply(
            iframeRef.contentDocument,
            args
          );
          patchElementEffect(element, iframeRef.contentWindow);
          return element;
        };
      },
    },
    documentURI: {
      get: () => (sandboxRef?.proxyLocation as Location)?.href,
    },
    URL: {
      get: () => (sandboxRef?.proxyLocation as Location)?.href,
    },
    getElementsByTagName: {
      get() {
        return function (...args) {
          const tagName = args[0];
          if (tagName === "script") {
            return iframeRef.contentDocument.scripts as any;
          }
          return sandboxRef.document.getElementsByTagName(tagName) as any;
        };
      },
    },
    querySelector: {
      get() {
        return function (...args) {
          if (isScriptSelector(args[0])) {
            return iframeRef.contentWindow.__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__.call(
              iframeRef.contentDocument,
              "script"
            ) as any;
          }
          return sandboxRef.document.querySelector.apply(sandboxRef.document, args) as any;
        };
      },
    },
    querySelectorAll: {
      get() {
        return function (...args) {
          if (isScriptSelector(args[0])) return queryIframeScripts(iframeRef) as any;
          return sandboxRef.document.querySelectorAll.apply(sandboxRef.document, args) as any;
        };
      },
    },
    getElementById: {
      get() {
        return function (...args) {
          const id = args[0];
          return (
            (sandboxRef.document.getElementById(id) as any) ||
            iframeRef.contentWindow.__WUJIE_RAW_DOCUMENT_HEAD__.querySelector(`#${id}`)
          );
        };
      },
    },
  });
  // 普通处理
  const {
    modifyLocalProperties,
    modifyProperties,
    ownerProperties,
    shadowProperties,
    shadowMethods,
    documentProperties,
    documentMethods,
  } = documentProxyProperties;
  modifyProperties
    .filter((key) => !modifyLocalProperties.includes(key))
    .concat(ownerProperties, shadowProperties, shadowMethods, documentProperties, documentMethods)
    .forEach((key) => {
      Object.defineProperty(proxyDocument, key, {
        get: () => {
          const value = sandboxRef?.document?.[key];
          return isCallable(value) ? value.bind(sandboxRef.document) : value;
        },
      });
    });

  // 代理 location
  const proxyLocation = {};
  const locationKeys = Object.keys(locationRef);
  const constantKey = ["host", "hostname", "port", "protocol", "origin"];
  constantKey.forEach((key) => {
    proxyLocation[key] = urlElement[key];
  });
  Object.defineProperties(proxyLocation, {
    href: {
      get: () => locationRef?.href.replace(mainHostPath, appHostPath),
      set: (value) => {
        locationNavigate(iframeRef, value, "href", mainHostPath, appHostPath);
      },
    },
    reload: {
      get() {
        warn(WUJIE_TIPS_RELOAD_DISABLED);
        return () => null;
      },
    },
    assign: {
      get: () => (url: string | URL) => locationNavigate(iframeRef, url, "assign", mainHostPath, appHostPath),
    },
    replace: {
      get: () => (url: string | URL) => locationNavigate(iframeRef, url, "replace", mainHostPath, appHostPath),
    },
  });
  locationKeys
    .filter((key) => !constantKey.concat(["href", "reload", "assign", "replace"]).includes(key))
    .forEach((key) => {
      Object.defineProperty(proxyLocation, key, {
        get: () => (isCallable(locationRef?.[key]) ? locationRef[key].bind(locationRef) : locationRef?.[key]),
      });
    });
  // 置空捕获的 DOM 引用，斩断 getter 闭包对 iframe / location / sandbox 的强引用
  const proxyRevoke = () => {
    iframeRef = null;
    sandboxRef = null;
    locationRef = null;
  };
  return { proxyDocument, proxyLocation, proxyRevoke };
}
