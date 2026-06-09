import { getExternalStyleSheets, getExternalScripts } from "./entry";
import {
  getWujieById,
  rawAppendChild,
  rawElementContains,
  rawElementRemoveChild,
  rawHeadInsertBefore,
  rawBodyInsertBefore,
  rawInsertAdjacentElement,
  rawDocumentQuerySelector,
  rawAddEventListener,
  rawRemoveEventListener,
} from "./common";
import {
  isFunction,
  isHijackingTag,
  warn,
  nextTick,
  getCurUrl,
  getAbsolutePath,
  execHooks,
  isScriptElement,
  setTagToScript,
  getTagFromScript,
  setAttrsToElement,
} from "./utils";
import { insertScriptToIframe, patchElementEffect } from "./iframe";
import Wujie from "./sandbox";
import { getPatchStyleElements } from "./shadow";
import { getCssLoader, getEffectLoaders, isMatchUrl } from "./plugin";
import { WUJIE_SCRIPT_ID, WUJIE_DATA_FLAG, WUJIE_TIPS_REPEAT_RENDER, WUJIE_TIPS_NO_SCRIPT } from "./constant";
import { ScriptObject, parseTagAttributes } from "./template";

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
 * @internal 仅出于可测性导出，外部不应直接调用
 */
export function patchStylesheetElement(
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
      innerHTMLDesc ? (stylesheetElement.innerHTML += rule) : (stylesheetElement.innerText += rule);
      return RawInsertRule.call(stylesheetElement.sheet, rule, index);
    };
  }
  patchSheetInsertRule();

  if (innerHTMLDesc) {
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
    });
  }

  Object.defineProperties(stylesheetElement, {
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
    insertAdjacentElement: {
      value: function (this: HTMLStyleElement, position: InsertPosition, element: Element) {
        if (element.nodeName === "STYLE") {
          // 关联 issue: https://github.com/Tencent/wujie/issues/1059
          //
          // vite dev server 第一个 css 通过 head.appendChild 插入，后续每个 css 都走
          // lastInsertedStyle.insertAdjacentElement("afterend", style)，hot update 时
          // 直接 style.textContent = newContent。被 insertAdjacentElement 插入的 style
          // 必须获得与"第一个 style"完全一致的劫持能力，否则：
          //   1) 当前内容里的资源相对路径不会被 cssLoader 改写（@font-face 失效）；
          //   2) 后续 textContent / innerHTML / appendChild / sheet.insertRule
          //      绕过 wujie，hot update 全部脱管；
          //   3) 链式 insertAdjacentElement 创建的下游 style 直接走原生实现。
          // 因此这里必须复用与 case "STYLE" 完全一致的处理流程：先用 cssLoader 改写
          // 当前内容，再 patchStylesheetElement 把劫持递归装到新 style 上。
          const stylesheetElement = element as HTMLStyleElement;
          const content = stylesheetElement.innerHTML;
          if (content) stylesheetElement.innerHTML = cssLoader(content, "", curUrl);
          const res = rawInsertAdjacentElement.call(this, position, element);
          sandbox.styleSheetElements.push(stylesheetElement);
          patchStylesheetElement(stylesheetElement, cssLoader, sandbox, curUrl);
          handleStylesheetElementPatch(stylesheetElement, sandbox);
          return res;
        } else return rawInsertAdjacentElement.call(this, position, element);
      },
    },
    _hasPatchStyle: { get: () => true },
  });
}

// href 延迟赋值的兜底超时（毫秒）：超过该时间仍未拿到 href，则放弃监听并触发 error，
// 防止「href 永不到达」时 observer 闭包长期钉住子应用上下文。沿用 tinymce maxLoadTime 量级。
const DEFER_STYLE_HREF_TIMEOUT = 5000;

/**
 * 处理「先 appendChild(link) 后 setAttribute('href')」的延迟 href 场景。
 *
 * 通过 MutationObserver 监听 href 属性赋值，命中后走传入的 loadStyleSheet 完成加载。
 * 生命周期管理（避免内存泄漏）：
 *   1. 命中 / 超时 / 子应用已销毁 时立即 disconnect 并从 sandbox 出队；
 *   2. observer 登记到 sandbox.deferredStyleObservers，destroy 阶段统一兜底 disconnect；
 *   3. 回调内通过 wujieId 动态获取 sandbox，不捕获 sandbox/iframe，子应用销毁后闭包不再 pin 上下文。
 */
export function deferStyleSheetByHref(opts: {
  element: HTMLLinkElement;
  wujieId: string;
  iframeWindow: Window;
  loadStyleSheet: (href: string, element: HTMLLinkElement) => void;
}): void {
  let { element } = opts;
  const { wujieId, iframeWindow, loadStyleSheet } = opts;
  // 部分环境（jsdom / 老浏览器）可能不支持 MutationObserver，直接放弃延迟处理
  const MutationObserverCtor = (iframeWindow as any).MutationObserver;
  if (typeof MutationObserverCtor !== "function") return;

  let settled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const observer: MutationObserver = new MutationObserverCtor(() => {
    if (settled) return;
    const attrHref = element?.getAttribute("href");
    if (!attrHref) return;
    const realHref = element.href || attrHref;
    const target = element;
    finalize(() => target && loadStyleSheet(realHref, target));
  });

  // 统一收尾：disconnect + 出队 + 清理定时器，再执行收尾动作
  function finalize(action?: () => void) {
    if (settled) return;
    settled = true;
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    try {
      observer.disconnect();
    } catch (_) {
      /* noop */
    }
    // 动态获取 sandbox，子应用销毁后直接放手，闭包不再钉住上下文
    const sandbox = getWujieById(wujieId);
    const observers = sandbox?.deferredStyleObservers;
    if (Array.isArray(observers)) {
      const index = observers.indexOf(observer);
      if (index !== -1) observers.splice(index, 1);
    }
    if (sandbox) action?.();
    element = null;
  }

  const sandbox = getWujieById(wujieId);
  // 子应用已不存在则无需监听
  if (!sandbox || !Array.isArray(sandbox.deferredStyleObservers)) return;
  sandbox.deferredStyleObservers.push(observer);
  observer.observe(element, { attributes: true, attributeFilter: ["href"] });
  // 超时兜底：长时间没等到 href，放弃监听并触发 error，让上游（如 tinymce）的失败回调收尾
  timer = setTimeout(() => {
    const target = element;
    finalize();
    if (target) manualInvokeElementEvent(target, "error");
  }, DEFER_STYLE_HREF_TIMEOUT);
}

let dynamicScriptExecStack = Promise.resolve();
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
      execHooks(plugins, "appendOrInsertElementHook", element, iframe.contentWindow);
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
          if (!styleFlag) {
            const res = rawDOMAppendOrInsertBefore.call(this, element, refChild);
            execHooks(plugins, "appendOrInsertElementHook", element, iframe.contentWindow);
            return res;
          }

          // 拉取 css 内容并以 <style> 注入子应用、回调 link 的 load/error 事件。
          // 抽成闭包以便「append 时已有 href」与「append 后才 setAttribute('href')」两条路径复用。
         const loadStyleSheet = (realHref: string, linkElement: HTMLLinkElement) => {
           const attrHref = linkElement.getAttribute("href");
           const styleHref = attrHref ? getAbsolutePath(attrHref, (proxyLocation as Location).href) : realHref;
           const exclude = isMatchUrl(styleHref, getEffectLoaders("cssExcludes", plugins));
           if (!styleHref || exclude) return;

           // 立即创建占位 <style> 元素，避免异步加载期间重复插入
           // 保留原始 link 的属性（如 class），以便 checkLinkAndLoad 等去重逻辑能找到
           const rawAttrs = parseTagAttributes(linkElement.outerHTML);
           const placeholderElement = iframeDocument.createElement("style");
           setAttrsToElement(placeholderElement, rawAttrs);
           placeholderElement.setAttribute("data-wujie-css-href", styleHref);
           rawDOMAppendOrInsertBefore.call(this, placeholderElement, refChild);

           getExternalStyleSheets(
             [{ src: styleHref, ignore: isMatchUrl(styleHref, getEffectLoaders("cssIgnores", plugins)) }],
             fetch,
             lifecycles.loadError
           ).forEach(({ src, ignore, contentPromise }) =>
             contentPromise.then(
               (content) => {
                  if (ignore && src) {
                    // 忽略的元素应该直接把对应元素插入，而不是用新的 link 标签进行替代插入，保证 element 的上下文正常
                   // 移除占位元素，插入原始 link
                   placeholderElement.parentNode?.removeChild(placeholderElement);
                    rawDOMAppendOrInsertBefore.call(this, linkElement, refChild);
                  } else {
                   // 填充 CSS 内容到占位元素
                   // 处理css-loader插件
                   const cssLoader = getCssLoader({ plugins, replace });
                   placeholderElement.innerHTML = cssLoader(content, src, curUrl);
                   styleSheetElements.push(placeholderElement);
                   // 处理样式补丁
                   handleStylesheetElementPatch(placeholderElement, sandbox);
                   manualInvokeElementEvent(linkElement, "load");
                 }
                 if (element === linkElement) element = null;
                },
                () => {
                  manualInvokeElementEvent(linkElement, "error");
                  if (element === linkElement) element = null;
                }
              )
            );
          };

          if (href) {
            // 排除css
            if (!isMatchUrl(href, getEffectLoaders("cssExcludes", plugins))) {
              loadStyleSheet(href, element);
            }
          } else {
            // 关联 issue: https://github.com/Tencent/wujie/issues/224 https://github.com/Tencent/wujie/issues/974
            //
            // 部分库（如 tinymce 的 StyleSheetLoader）先 appendChild(link) 再
            // setAttribute('href', url)。此时 href 为空，若直接丢弃则该样式永远不会被加载，
            // 后续在游离 link 上设置 href 也不会触发浏览器加载，skin.min.css 等资源缺失。
            // 这里监听 href 的后续赋值，拿到真实 href 后再走与上面完全一致的加载流程。
            deferStyleSheetByHref({ element, wujieId, iframeWindow: iframe.contentWindow, loadStyleSheet });
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
          execHooks(plugins, "appendOrInsertElementHook", element, iframe.contentWindow);
          return res;
        }
        case "SCRIPT": {
          setTagToScript(element);
          const { src, text, type, crossOrigin } = element as HTMLScriptElement;
          // 排除js
          if (src && !isMatchUrl(src, getEffectLoaders("jsExcludes", plugins))) {
            const execScript = (scriptResult: ScriptObject) => {
              // 假如子应用被连续渲染两次，两次渲染会导致处理流程的交叉污染
              if (sandbox.iframe === null) return warn(WUJIE_TIPS_REPEAT_RENDER);
              const onload = () => {
                manualInvokeElementEvent(element, "load");
                element = null;
              };
              insertScriptToIframe({ ...scriptResult, onload }, sandbox.iframe.contentWindow, element);
            };
            const scriptOptions = {
              src,
              module: type === "module",
              crossorigin: crossOrigin !== null,
              crossoriginType: crossOrigin || "",
              ignore: isMatchUrl(src, getEffectLoaders("jsIgnores", plugins)),
              attrs: parseTagAttributes(element.outerHTML),
            } as ScriptObject;
            getExternalScripts([scriptOptions], fetch, lifecycles.loadError, fiber).forEach((scriptResult) => {
              dynamicScriptExecStack = dynamicScriptExecStack.then(() =>
                scriptResult.contentPromise.then(
                  (content) => {
                    if (sandbox.execQueue === null) return warn(WUJIE_TIPS_REPEAT_RENDER);
                    const execQueueLength = sandbox.execQueue?.length;
                    sandbox.execQueue.push(() =>
                      fiber
                        ? sandbox.requestIdleCallback(() => {
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
            });
          } else {
            const execQueueLength = sandbox.execQueue?.length;
            sandbox.execQueue.push(() =>
              fiber
                ? sandbox.requestIdleCallback(() => {
                    insertScriptToIframe(
                      { src: null, content: text, attrs: parseTagAttributes(element.outerHTML) },
                      sandbox.iframe.contentWindow,
                      element
                    );
                  })
                : insertScriptToIframe(
                    { src: null, content: text, attrs: parseTagAttributes(element.outerHTML) },
                    sandbox.iframe.contentWindow,
                    element
                  )
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
          execHooks(plugins, "appendOrInsertElementHook", element, iframe.contentWindow);
          return res;
        }
        default:
      }
    }
  };
}

function findScriptElementFromIframe(rawElement: HTMLScriptElement, wujieId: string) {
  const wujieTag = getTagFromScript(rawElement);
  const sandbox = getWujieById(wujieId);
  const { iframe } = sandbox;
  const targetScript = iframe.contentWindow.__WUJIE_RAW_DOCUMENT_HEAD__.querySelector(
    `script[${WUJIE_SCRIPT_ID}='${wujieTag}']`
  );
  if (targetScript === null) {
    warn(WUJIE_TIPS_NO_SCRIPT, `<script ${WUJIE_SCRIPT_ID}='${wujieTag}'/>`);
  }
  return { targetScript, iframe };
}

function rewriteContains(opts: { rawElementContains: (other: Node | null) => boolean; wujieId: string }) {
  return function contains(other: Node | null) {
    const element = other as HTMLElement;
    const { rawElementContains, wujieId } = opts;
    if (element && isScriptElement(element)) {
      const { targetScript } = findScriptElementFromIframe(element as HTMLScriptElement, wujieId);
      return targetScript !== null;
    }
    return rawElementContains(element);
  };
}

function rewriteRemoveChild(opts: { rawElementRemoveChild: <T extends Node>(child: T) => T; wujieId: string }) {
  return function removeChild(child: Node) {
    const element = child as HTMLElement;
    const { rawElementRemoveChild, wujieId } = opts;
    if (element && isScriptElement(element)) {
      const { targetScript, iframe } = findScriptElementFromIframe(element as HTMLScriptElement, wujieId);
      if (targetScript !== null) {
        return iframe.contentWindow.__WUJIE_RAW_DOCUMENT_HEAD__.removeChild(targetScript);
      }
      return null;
    }
    return rawElementRemoveChild(element);
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
  render.head.removeChild = rewriteRemoveChild({
    rawElementRemoveChild: rawElementRemoveChild.bind(render.head),
    wujieId: id,
  }) as typeof rawElementRemoveChild;
  render.head.contains = rewriteContains({
    rawElementContains: rawElementContains.bind(render.head),
    wujieId: id,
  }) as typeof rawElementContains;
  render.contains = rewriteContains({
    rawElementContains: rawElementContains.bind(render),
    wujieId: id,
  }) as typeof rawElementContains;
  render.body.appendChild = rewriteAppendOrInsertChild({
    rawDOMAppendOrInsertBefore: rawAppendChild,
    wujieId: id,
  }) as typeof rawAppendChild;
  render.body.insertBefore = rewriteAppendOrInsertChild({
    rawDOMAppendOrInsertBefore: rawBodyInsertBefore as any,
    wujieId: id,
  }) as typeof rawBodyInsertBefore;
}
