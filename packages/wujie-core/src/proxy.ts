import { patchElementEffect, renderIframeReplaceApp } from "./iframe";
import { renderElementToContainer } from "./shadow";
import { pushUrlToWindow } from "./sync";
import { documentProxyProperties, rawDocumentQuerySelector } from "./common";
import { WUJIE_TIPS_RELOAD_DISABLED, WUJIE_TIPS_GET_ELEMENT_BY_ID } from "./constant";
import {
  getTargetValue,
  anchorElementGenerator,
  getDegradeIframe,
  isCallable,
  checkProxyFunction,
  warn,
  stopMainAppRun,
} from "./utils";

/**
 * location href 的set劫持操作
 */
function locationHrefSet(iframe: HTMLIFrameElement, value: string, appHostPath: string): boolean {
  const { shadowRoot, id, degrade, document, degradeAttrs } = iframe.contentWindow.__WUJIE;
  let url = value;
  if (!/^http/.test(url)) {
    let hrefElement = anchorElementGenerator(url);
    url = appHostPath + hrefElement.pathname + hrefElement.search + hrefElement.hash;
    hrefElement = null;
  }
  iframe.contentWindow.__WUJIE.hrefFlag = true;
  if (degrade) {
    const iframeBody = rawDocumentQuerySelector.call(iframe.contentDocument, "body");
    renderElementToContainer(document.documentElement, iframeBody);
    renderIframeReplaceApp(window.decodeURIComponent(url), getDegradeIframe(id).parentElement, degradeAttrs);
  } else renderIframeReplaceApp(url, shadowRoot.host.parentElement, degradeAttrs);
  pushUrlToWindow(id, url);
  return true;
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
} {
  const proxyWindow = new Proxy(iframe.contentWindow, {
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
      checkProxyFunction(value);
      target[p] = value;
      return true;
    },

    has: (target: Window, p: PropertyKey) => p in target,
  });

  // proxy document
  const proxyDocument = new Proxy(
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
  const proxyLocation = new Proxy(
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
        if (propKey === "replace") {
          return new Proxy(location[propKey], {
            apply(replace, _ctx, args) {
              return replace.call(location, args[0]?.replace(appHostPath, mainHostPath));
            },
          });
        }
        return getTargetValue(location, propKey);
      },
      set: function (_fakeLocation, propKey, value) {
        // 如果是跳转链接的话重开一个iframe
        if (propKey === "href") {
          return locationHrefSet(iframe, value, appHostPath);
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
  return { proxyWindow, proxyDocument, proxyLocation };
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
} {
  // 代理 document
  const proxyDocument = {};
  const sandbox = iframe.contentWindow.__WUJIE;
  // 特殊处理
  Object.defineProperties(proxyDocument, {
    createElement: {
      get: () => {
        return function (...args) {
          const element = iframe.contentWindow.__WUJIE_RAW_DOCUMENT_CREATE_ELEMENT__.apply(
            iframe.contentDocument,
            args
          );
          patchElementEffect(element, iframe.contentWindow);
          return element;
        };
      },
    },
    createTextNode: {
      get: () => {
        return function (...args) {
          const element = iframe.contentWindow.__WUJIE_RAW_DOCUMENT_CREATE_TEXT_NODE__.apply(
            iframe.contentDocument,
            args
          );
          patchElementEffect(element, iframe.contentWindow);
          return element;
        };
      },
    },
    documentURI: {
      get: () => (sandbox.proxyLocation as Location).href,
    },
    URL: {
      get: () => (sandbox.proxyLocation as Location).href,
    },
    getElementsByTagName: {
      get() {
        return function (...args) {
          const tagName = args[0];
          if (tagName === "script") {
            return iframe.contentDocument.scripts as any;
          }
          return sandbox.document.getElementsByTagName(tagName) as any;
        };
      },
    },
    getElementById: {
      get() {
        return function (...args) {
          const id = args[0];
          return (sandbox.document.getElementById(id) as any) || iframe.contentDocument.getElementById(id);
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
          const value = sandbox.document?.[key];
          return isCallable(value) ? value.bind(sandbox.document) : value;
        },
      });
    });

  // 代理 location
  const proxyLocation = {};
  const location = iframe.contentWindow.location;
  const locationKeys = Object.keys(location);
  const constantKey = ["host", "hostname", "port", "protocol", "port"];
  constantKey.forEach((key) => {
    proxyLocation[key] = urlElement[key];
  });
  Object.defineProperties(proxyLocation, {
    href: {
      get: () => location.href.replace(mainHostPath, appHostPath),
      set: (value) => {
        locationHrefSet(iframe, value, appHostPath);
      },
    },
    reload: {
      get() {
        warn(WUJIE_TIPS_RELOAD_DISABLED);
        return () => null;
      },
    },
  });
  locationKeys
    .filter((key) => !constantKey.concat(["href", "reload"]).includes(key))
    .forEach((key) => {
      Object.defineProperty(proxyLocation, key, {
        get: () => (isCallable(location[key]) ? location[key].bind(location) : location[key]),
      });
    });
  return { proxyDocument, proxyLocation };
}
