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
import { isFunction, isHijackingTag, requestIdleCallback, error, warn, nextTick, getCurUrl } from "./utils";
import { insertScriptToIframe, patchElementEffect } from "./iframe";
import Wujie from "./sandbox";
import { getPatchStyleElements } from "./shadow";
import { getCssLoader, getEffectLoaders, isMatchUrl } from "./plugin";
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
 * 样式元素的css变量处理，每个stylesheetElement单独节流
 */
function handleStylesheetElementPatch(stylesheetElement: HTMLStyleElement & { _patcher?: any }, sandbox: Wujie) {
  if (!stylesheetElement.innerHTML || sandbox.degrade) return;
  const patcher = () => {
    const [hostStyleSheetElement, fontStyleSheetElement] = getPatchStyleElements([stylesheetElement.sheet]);
    if (hostStyleSheetElement) {
      sandbox.shadowRoot.head.appendChild(hostStyleSheetElement);
    }
    if (fontStyleSheetElement) {
      sandbox.shadowRoot.host.appendChild(fontStyleSheetElement);
    }
    stylesheetElement._patcher = undefined;
  };
  if (stylesheetElement._patcher) {
    clearTimeout(stylesheetElement._patcher);
  }
  stylesheetElement._patcher = setTimeout(patcher, 50);
}

/**
 * 劫持处理样式元素的属性
 */
function patchStylesheetElement(
  stylesheetElement: HTMLStyleElement & { _hasPatchStyle?: boolean },
  cssLoader: (code: string, url: string, base: string) => string,
  sandbox: Wujie,
  curUrl: string
) {
  if (stylesheetElement._hasPatchStyle) return;
  const innerHTMLDesc = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
  const innerTextDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerText");
  const textContentDesc = Object.getOwnPropertyDescriptor(Node.prototype, "textContent");
  const RawInsertRule = stylesheetElement.sheet?.insertRule;
  // 这个地方将cssRule加到innerHTML中去，防止子应用切换之后丢失
  function patchSheetInsertRule() {
    if (!RawInsertRule) return;
    stylesheetElement.sheet.insertRule = (rule: string, index?: number): number => {
      stylesheetElement.innerHTML += rule;
      return RawInsertRule.call(stylesheetElement.sheet, rule, index);
    };
  }
  patchSheetInsertRule();
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
          const res = rawAppendChild.call(
            stylesheetElement,
            stylesheetElement.ownerDocument.createTextNode(cssLoader(node.textContent, "", curUrl))
          );
          // 当appendChild之后，样式元素的sheet对象发生改变，要重新patch
          patchSheetInsertRule();
          return res;
        } else return rawAppendChild(node);
      },
    },
    _hasPatchStyle: { get: () => true },
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

    const { styleSheetElements, replace, fetch, plugins, iframe, lifecycles, proxyLocation, fiber } = sandbox;

    if (!isHijackingTag(element.tagName) || !wujieId) {
      const res = rawDOMAppendOrInsertBefore.call(this, element, refChild) as T;
      patchElementEffect(element, iframe.contentWindow);
      return res;
    }

    const iframeDocument = iframe.contentDocument;
    const curUrl = getCurUrl(proxyLocation);

    // TODO 过滤可以开放
    if (element.tagName) {
      switch (element.tagName?.toUpperCase()) {
        case "LINK": {
          const { href, rel, type } = element as HTMLLinkElement;
          const styleFlag = rel === "stylesheet" || type === "text/css" || href.endsWith(".css");
          // 非 stylesheet 不做处理
          if (!styleFlag) return rawDOMAppendOrInsertBefore.call(this, element, refChild);
          // 排除css
          if (href && !isMatchUrl(href, getEffectLoaders("cssExcludes", plugins))) {
            getExternalStyleSheets(
              [{ src: href, ignore: isMatchUrl(href, getEffectLoaders("cssIgnores", plugins)) }],
              fetch,
              lifecycles.loadError
            ).forEach(({ src, ignore, contentPromise }) =>
              contentPromise.then(
                (content) => {
                  // 处理 ignore 样式
                  if (ignore && src) {
                    const stylesheetElement = iframeDocument.createElement("link");
                    stylesheetElement.setAttribute("type", "text/css");
                    stylesheetElement.setAttribute("ref", "stylesheet");
                    rawDOMAppendOrInsertBefore.call(this, stylesheetElement, refChild);
                    manualInvokeElementEvent(element, "load");
                  } else {
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
                  }
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
          const stylesheetElement: HTMLStyleElement = newChild as any;
          styleSheetElements.push(stylesheetElement);
          const content = stylesheetElement.innerHTML;
          const cssLoader = getCssLoader({ plugins, replace });
          content && (stylesheetElement.innerHTML = cssLoader(content, "", curUrl));
          const res = rawDOMAppendOrInsertBefore.call(this, element, refChild);
          // 处理样式补丁
          patchStylesheetElement(stylesheetElement, cssLoader, sandbox, curUrl);
          handleStylesheetElementPatch(stylesheetElement, sandbox);
          return res;
        }
        case "SCRIPT": {
          const { src, text, type, crossOrigin } = element as HTMLScriptElement;
          // 排除js
          if (!isMatchUrl(src, getEffectLoaders("jsExcludes", plugins))) {
            const execScript = (scriptResult: ScriptObject) => {
              // 假如子应用被连续渲染两次，两次渲染会导致处理流程的交叉污染
              if (sandbox.iframe === null) return warn(WUJIE_TIPS_REPEAT_RENDER);
              insertScriptToIframe(scriptResult, sandbox.iframe.contentWindow);
              // 只有外联转内联才需要手动触发load
              if (scriptResult.content) manualInvokeElementEvent(element, "load");
              element = null;
            };
            const scriptOptions = {
              src,
              module: type === "module",
              crossorigin: crossOrigin !== null,
              crossoriginType: crossOrigin || "",
              ignore: isMatchUrl(src, getEffectLoaders("jsIgnores", plugins)),
            } as ScriptObject;
            getExternalScripts([scriptOptions], fetch, lifecycles.loadError, fiber).forEach((scriptResult) =>
              scriptResult.contentPromise.then(
                (content) => {
                  if (sandbox.execQueue === null) return warn(WUJIE_TIPS_REPEAT_RENDER);
                  const execQueueLength = sandbox.execQueue?.length;
                  sandbox.execQueue.push(() =>
                    fiber
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
              fiber
                ? requestIdleCallback(() => {
                    insertScriptToIframe({ src: null, content: text }, sandbox.iframe.contentWindow);
                  })
                : insertScriptToIframe({ src: null, content: text }, sandbox.iframe.contentWindow)
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
  element._cacheListeners = listenerMap;

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
  const listenerMap = element._cacheListeners;
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
