import { getExternalStyleSheets, getExternalScripts } from "./entry";
import {
  getWujieById,
  rawAppendChild,
  rawHeadInsertBefore,
  rawBodyInsertBefore,
  rawDocumentQuerySelector,
  rawAddEventListener,
  rawRemoveEventListener,
} from "./common";
import {
  isFunction,
  isHijackingTag,
  requestIdleCallback,
  error,
  warn,
  nextTick,
  isExcludeUrl,
  getExcludes,
  getCurUrl,
} from "./utils";
import { insertScriptToIframe } from "./iframe";
import Wujie from "./sandbox";
import { getPatchStyleElements } from "./shadow";
import { getCssLoader } from "./plugin";
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
function handleStylesheetElementPatch(stylesheetElement: HTMLStyleElement, sandbox: Wujie) {
  if (!stylesheetElement.innerHTML || sandbox.degrade) return;
  const [hostStyleSheetElement, fontStyleSheetElement] = getPatchStyleElements([stylesheetElement.sheet]);
  if (hostStyleSheetElement) {
    sandbox.shadowRoot.head.appendChild(hostStyleSheetElement);
  }
  if (fontStyleSheetElement) {
    sandbox.shadowRoot.host.appendChild(fontStyleSheetElement);
  }
}

/**
 * 劫持处理样式元素的属性
 */

type stylesheetElement = HTMLStyleElement & {
  _hasPatch?: boolean; // 判断新增的style标签是否被劫持
};

function patchStylesheetElement(
  stylesheetElement: stylesheetElement,
  cssLoader: (code: string, url: string, base: string) => string,
  sandbox: Wujie,
  curUrl: string
) {
  if (stylesheetElement._hasPatch) return;
  const innerHTMLDesc = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
  const innerTextDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerText");
  const textContentDesc = Object.getOwnPropertyDescriptor(Node.prototype, "textContent");
  Object.defineProperties(stylesheetElement, {
    innerHTML: {
      get: function () {
        return innerHTMLDesc.get.call(stylesheetElement);
      },
      set: function (code: string) {
        innerHTMLDesc.set.call(stylesheetElement, cssLoader(code, "", curUrl));
        nextTick(() => handleStylesheetElementPatch(this, sandbox));
      },
    },
    innerText: {
      get: function () {
        return innerTextDesc.get.call(stylesheetElement);
      },
      set: function (code: string) {
        innerTextDesc.set.call(stylesheetElement, cssLoader(code, "", curUrl));
        nextTick(() => handleStylesheetElementPatch(this, sandbox));
      },
    },
    textContent: {
      get: function () {
        return textContentDesc.get.call(stylesheetElement);
      },
      set: function (code: string) {
        textContentDesc.set.call(stylesheetElement, cssLoader(code, "", curUrl));
        nextTick(() => handleStylesheetElementPatch(this, sandbox));
      },
    },
    appendChild: {
      value: function (node: Node): Node {
        nextTick(() => handleStylesheetElementPatch(this, sandbox));
        if (node.nodeType === Node.TEXT_NODE) {
          return rawAppendChild.call(
            stylesheetElement,
            stylesheetElement.ownerDocument.createTextNode(cssLoader(node.textContent, "", curUrl))
          );
        } else return rawAppendChild(node);
      },
    },
    _hasPatch: {
      get: function () {
        return true;
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
    const sandbox = getWujieById(wujieId);

    if (!isHijackingTag(element.tagName) || !wujieId) {
      return rawDOMAppendOrInsertBefore.call(this, element, refChild) as T;
    }

    const { styleSheetElements, replace, fetch, plugins, iframe, lifecycles, proxyLocation } = sandbox;
    const iframeDocument = iframe.contentDocument;
    const curUrl = getCurUrl(proxyLocation);

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
                  const cssLoader = getCssLoader({ plugins, replace });
                  stylesheetElement.innerHTML = cssLoader(content, src, curUrl);
                  styleSheetElements.push(stylesheetElement);
                  rawDOMAppendOrInsertBefore.call(this, stylesheetElement, refChild);
                  // 处理样式补丁
                  handleStylesheetElementPatch(stylesheetElement, sandbox);
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
          const cssLoader = getCssLoader({ plugins, replace });
          content && (stylesheetElement.innerHTML = cssLoader(content, "", curUrl));
          patchStylesheetElement(stylesheetElement, cssLoader, sandbox, curUrl);
          const res = rawDOMAppendOrInsertBefore.call(this, element, refChild);
          // 处理样式补丁
          handleStylesheetElementPatch(stylesheetElement, sandbox);
          return res;
        }
        case "SCRIPT": {
          const { src, text, type, crossOrigin } = element as HTMLScriptElement;
          // 排除js
          if (!isExcludeUrl(src, getExcludes("jsExcludes", plugins))) {
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
 * 记录head和body的事件，等重新渲染复用head和body时需要清空事件
 */
function patchEventListener(element: HTMLHeadElement | HTMLBodyElement) {
  const listenerMap = new Map<string, EventListenerOrEventListenerObject[]>();
  element.__cacheListeners = listenerMap;

  element.addEventListener = (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => {
    const listeners = listenerMap.get(type) || [];
    listenerMap.set(type, [...listeners, listener]);
    return rawAddEventListener.call(element, type, listener, options);
  };

  element.removeEventListener = (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => {
    const typeListeners = listenerMap.get(type);
    const index = typeListeners?.indexOf(listener);
    if (typeListeners?.length && index !== -1) {
      typeListeners.splice(index, 1);
    }
    return rawRemoveEventListener.call(element, type, listener, options);
  };
}

/**
 * 清空head和body的绑定的事件
 */
export function removeEventListener(element: HTMLHeadElement | HTMLBodyElement) {
  const listenerMap = element.__cacheListeners;
  [...listenerMap.entries()].forEach(([type, listeners]) => {
    listeners.forEach((listener) => rawRemoveEventListener.call(element, type, listener));
  });
}

/**
 * patch head and body in render
 * intercept appendChild and insertBefore
 */
export function patchRenderEffect(render: ShadowRoot | Document, id: string, degrade: boolean): void {
  // 降级场景dom渲染在iframe中，iframe移动后事件自动销毁，不需要记录
  if (!degrade) {
    patchEventListener(render.head);
    patchEventListener(render.body as HTMLBodyElement);
  }

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
