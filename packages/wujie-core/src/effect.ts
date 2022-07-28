import { getExternalStyleSheets, getExternalScripts } from "./entry";
import {
  getSandboxById,
  rawAppendChild,
  rawHeadInsertBefore,
  rawBodyInsertBefore,
  rawDocumentQuerySelector,
} from "./common";
import { isFunction, isHijackingTag, requestIdleCallback, compose, error, warn, nextTick } from "./utils";
import { insertScriptToIframe } from "./iframe";
import Wujie from "./sandbox";
import { getHostCssRules } from "./shadow";
import { WUJIE_DATA_ID, WUJIE_DATA_FLAG, WUJIE_TIPS_REPEAT_RENDER } from "./constant";
import { ScriptObject } from "./template";

function patchCustomEvent(
  e: CustomEvent,
  elementGetter: () => HTMLScriptElement | HTMLLinkElement | null
): CustomEvent {
  Object.defineProperties(e, {
    srcElement: {
      get: elementGetter,
    },
    target: {
      get: elementGetter,
    },
  });

  return e;
}

/**
 * 手动触发事件回调
 */
function manualInvokeElementEvent(element: HTMLLinkElement | HTMLScriptElement, event: string): void {
  const customEvent = new CustomEvent(event);
  const patchedEvent = patchCustomEvent(customEvent, () => element);
  if (isFunction(element[`on${event}`])) {
    element[`on${event}`](patchedEvent);
  } else {
    element.dispatchEvent(patchedEvent);
  }
}

/**
 * 样式元素的css变量处理
 */
function handleStylesheetElementHost(stylesheetElement: HTMLStyleElement, sandbox: Wujie) {
  if (!stylesheetElement.innerHTML || sandbox.degrade) return;
  const hostStyleSheetElement = getHostCssRules([stylesheetElement.sheet]);
  if (hostStyleSheetElement) {
    sandbox.shadowRoot.head.appendChild(hostStyleSheetElement);
  }
}

/**
 * 劫持处理样式元素的属性
 */
function patchStylesheetElement(
  stylesheetElement: HTMLStyleElement,
  cssLoader: (code: string) => string,
  sandbox: Wujie
) {
  const innerHTMLDesc = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
  const innerTextDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerText");
  const textContentDesc = Object.getOwnPropertyDescriptor(Node.prototype, "textContent");
  Object.defineProperties(stylesheetElement, {
    innerHTML: {
      get: function () {
        return innerHTMLDesc.get.call(stylesheetElement);
      },
      set: function (code: string) {
        innerHTMLDesc.set.call(stylesheetElement, cssLoader(code));
        nextTick(() => handleStylesheetElementHost(this, sandbox));
      },
    },
    innerText: {
      get: function () {
        return innerTextDesc.get.call(stylesheetElement);
      },
      set: function (code: string) {
        innerTextDesc.set.call(stylesheetElement, cssLoader(code));
        nextTick(() => handleStylesheetElementHost(this, sandbox));
      },
    },
    textContent: {
      get: function () {
        return textContentDesc.get.call(stylesheetElement);
      },
      set: function (code: string) {
        textContentDesc.set.call(stylesheetElement, cssLoader(code));
        nextTick(() => handleStylesheetElementHost(this, sandbox));
      },
    },
    appendChild: {
      value: function (node: Node): Node {
        nextTick(() => handleStylesheetElementHost(this, sandbox));
        if (node.nodeType === Node.TEXT_NODE) {
          return rawAppendChild.call(
            stylesheetElement,
            stylesheetElement.ownerDocument.createTextNode(cssLoader(node.textContent))
          );
        } else return rawAppendChild(node);
      },
    },
  });
}

function rewriteAppendOrInsertChild(opts: {
  rawDOMAppendOrInsertBefore: <T extends Node>(newChild: T, refChild?: Node | null) => T;
  wujieId: string;
}) {
  return function appendChildOrInsertBefore<T extends Node>(
    this: HTMLHeadElement | HTMLBodyElement,
    newChild: T,
    refChild?: Node | null
  ) {
    let element = newChild as any;
    const { rawDOMAppendOrInsertBefore, wujieId } = opts;
    const sandbox = getSandboxById(wujieId);

    if (!isHijackingTag(element.tagName) || !wujieId) {
      return rawDOMAppendOrInsertBefore.call(this, element, refChild) as T;
    }

    const { styleSheetElements, replace, fetch, plugins, iframe, lifecycles } = sandbox;
    const iframeDocument = iframe.contentDocument;

    // TODO 过滤可以开放
    if (element.tagName) {
      switch (element.tagName?.toUpperCase()) {
        case "LINK": {
          const { href } = element as HTMLLinkElement;
          // 排除css
          if (
            href &&
            !plugins
              .map((plugin) => plugin.cssExcludes)
              .reduce((pre, next) => pre.concat(next), [])
              .filter((item) => item)
              .includes(href)
          ) {
            getExternalStyleSheets([{ src: href }], fetch, lifecycles.loadError).forEach(({ src, contentPromise }) =>
              contentPromise.then(
                (content) => {
                  // 记录js插入样式，子应用重新激活时恢复
                  const stylesheetElement = iframeDocument.createElement("style");
                  // 处理css-loader插件
                  stylesheetElement.innerHTML = compose(plugins.map((plugin) => plugin.cssLoader))(
                    replace ? replace(content) : content,
                    src
                  );
                  styleSheetElements.push(stylesheetElement);
                  // 处理host的情况
                  handleStylesheetElementHost(stylesheetElement, sandbox);
                  rawDOMAppendOrInsertBefore.call(this, stylesheetElement, refChild);
                  manualInvokeElementEvent(element, "load");
                  element = null;
                },
                () => {
                  manualInvokeElementEvent(element, "error");
                  element = null;
                }
              )
            );
          }

          const comment = iframeDocument.createComment(`dynamic link ${href} replaced by wujie`);
          return rawDOMAppendOrInsertBefore.call(this, comment, refChild);
        }
        case "STYLE": {
          const stylesheetElement: HTMLLinkElement | HTMLStyleElement = newChild as any;
          styleSheetElements.push(stylesheetElement);
          const content = stylesheetElement.innerHTML;
          const cssLoader = (content) =>
            compose(plugins.map((plugin) => plugin.cssLoader))(replace ? replace(content) : content);
          content && (stylesheetElement.innerHTML = cssLoader(content));
          patchStylesheetElement(stylesheetElement, cssLoader, sandbox);
          // 处理host的情况
          nextTick(() => handleStylesheetElementHost(stylesheetElement, sandbox));
          return rawDOMAppendOrInsertBefore.call(this, element, refChild);
        }
        case "SCRIPT": {
          const { src, text, type, crossOrigin } = element as HTMLScriptElement;
          // 排除js
          if (
            src &&
            !plugins
              .map((plugin) => plugin.jsExcludes)
              .reduce((pre, next) => pre.concat(next), [])
              .filter((item) => item)
              .includes(src)
          ) {
            const execScript = (scriptResult) => {
              // 假如子应用被连续渲染两次，两次渲染会导致处理流程的交叉污染
              if (sandbox.iframe === null) return warn(WUJIE_TIPS_REPEAT_RENDER);
              insertScriptToIframe(scriptResult, sandbox.iframe.contentWindow);
              manualInvokeElementEvent(element, "load");
              element = null;
            };
            const scriptOptions = {
              src,
              module: type === "module",
              crossorigin: crossOrigin !== null,
              crossoriginType: crossOrigin || "",
            } as ScriptObject;
            getExternalScripts([scriptOptions], fetch, lifecycles.loadError).forEach((scriptResult) =>
              scriptResult.contentPromise.then(
                (content) => {
                  if (sandbox.execQueue === null) return warn(WUJIE_TIPS_REPEAT_RENDER);
                  const execQueueLength = sandbox.execQueue?.length;
                  sandbox.execQueue.push(() =>
                    sandbox.fiber
                      ? requestIdleCallback(() => {
                          execScript({ ...scriptResult, content });
                        })
                      : execScript({ ...scriptResult, content })
                  );
                  // 同步脚本如果都执行完了，需要手动触发执行
                  if (!execQueueLength) sandbox.execQueue.shift()();
                },
                () => {
                  manualInvokeElementEvent(element, "error");
                  element = null;
                }
              )
            );
          } else {
            const execQueueLength = sandbox.execQueue?.length;
            sandbox.execQueue.push(() =>
              requestIdleCallback(() => {
                insertScriptToIframe({ src: null, content: text }, sandbox.iframe.contentWindow);
              })
            );
            if (!execQueueLength) sandbox.execQueue.shift()();
          }
          // inline script never trigger the onload and onerror event
          const comment = iframeDocument.createComment(`dynamic script ${src} replaced by wujie`);
          return rawDOMAppendOrInsertBefore.call(this, comment, refChild);
        }
        // 修正子应用内部iframe的window.parent指向
        case "IFRAME": {
          // 嵌套的子应用的js-iframe需要插入子应用的js-iframe内部
          if (element.getAttribute(WUJIE_DATA_FLAG) === "") {
            return rawAppendChild.call(rawDocumentQuerySelector.call(this.ownerDocument, "html"), element);
          }
          const res = rawDOMAppendOrInsertBefore.call(this, element, refChild);
          try {
            // 降级的dom-iframe无需处理
            if (!element.getAttribute(WUJIE_DATA_ID)) {
              const patchScript = (element as HTMLIFrameElement).contentWindow.document.createElement("script");
              patchScript.type = "text/javascript";
              patchScript.innerHTML = `Array.prototype.slice.call(window.parent.frames).some(function(iframe){if(iframe.name === '${wujieId}'){window.parent = iframe;return true};return false})`;
              element.contentDocument.head.insertBefore(patchScript, element.contentDocument.head.firstChild);
            }
          } catch (e) {
            error(e);
          }
          return res;
        }
        default:
      }
    }
  };
}

/**
 * patch head and body in render
 * intercept appendChild and insertBefore
 */
export function patchRenderEffect(render: ShadowRoot | Document, id: string): void {
  render.head.appendChild = rewriteAppendOrInsertChild({
    rawDOMAppendOrInsertBefore: rawAppendChild,
    wujieId: id,
  }) as typeof rawAppendChild;
  render.head.insertBefore = rewriteAppendOrInsertChild({
    rawDOMAppendOrInsertBefore: rawHeadInsertBefore as any,
    wujieId: id,
  }) as typeof rawHeadInsertBefore;
  render.body.appendChild = rewriteAppendOrInsertChild({
    rawDOMAppendOrInsertBefore: rawAppendChild,
    wujieId: id,
  }) as typeof rawAppendChild;
  render.body.insertBefore = rewriteAppendOrInsertChild({
    rawDOMAppendOrInsertBefore: rawBodyInsertBefore as any,
    wujieId: id,
  }) as typeof rawBodyInsertBefore;
}
