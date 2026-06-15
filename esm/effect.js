import _toConsumableArray from "@babel/runtime/helpers/toConsumableArray";
import _defineProperty from "@babel/runtime/helpers/defineProperty";
import _slicedToArray from "@babel/runtime/helpers/slicedToArray";
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
import { getExternalStyleSheets, getExternalScripts } from "./entry";
import { getWujieById, rawAppendChild, rawElementContains, rawElementRemoveChild, rawHeadInsertBefore, rawBodyInsertBefore, rawInsertAdjacentElement, rawDocumentQuerySelector, rawAddEventListener, rawRemoveEventListener } from "./common";
import { isFunction, isHijackingTag, warn, nextTick, getCurUrl, getAbsolutePath, execHooks, isScriptElement, setTagToScript, getTagFromScript, setAttrsToElement } from "./utils";
import { insertScriptToIframe, patchElementEffect } from "./iframe";
import { getPatchStyleElements } from "./shadow";
import { getCssLoader, getEffectLoaders, isMatchUrl } from "./plugin";
import { WUJIE_SCRIPT_ID, WUJIE_DATA_FLAG, WUJIE_TIPS_REPEAT_RENDER, WUJIE_TIPS_NO_SCRIPT, WUJIE_APP_ID } from "./constant";
import { parseTagAttributes } from "./template";
function patchCustomEvent(e, elementGetter) {
  Object.defineProperties(e, {
    srcElement: {
      get: elementGetter
    },
    target: {
      get: elementGetter
    }
  });
  return e;
}

/**
 * 手动触发事件回调
 */
function manualInvokeElementEvent(element, event) {
  var customEvent = new CustomEvent(event);
  var patchedEvent = patchCustomEvent(customEvent, function () {
    return element;
  });
  if (isFunction(element["on".concat(event)])) {
    element["on".concat(event)](patchedEvent);
  } else {
    element.dispatchEvent(patchedEvent);
  }
}

/**
 * 样式元素的css变量处理，每个stylesheetElement单独节流
 */
function handleStylesheetElementPatch(stylesheetElement, sandbox) {
  if (!stylesheetElement.innerHTML || sandbox.degrade) return;
  var patcher = function patcher() {
    var _getPatchStyleElement = getPatchStyleElements([stylesheetElement.sheet]),
      _getPatchStyleElement2 = _slicedToArray(_getPatchStyleElement, 2),
      hostStyleSheetElement = _getPatchStyleElement2[0],
      fontStyleSheetElement = _getPatchStyleElement2[1];
    if (hostStyleSheetElement) {
      sandbox.shadowRoot.head.appendChild(hostStyleSheetElement);
    }
    if (fontStyleSheetElement) {
      var _sandbox$inject$fontS;
      (_sandbox$inject$fontS = sandbox.inject.fontStyleSheetContainer) === null || _sandbox$inject$fontS === void 0 || _sandbox$inject$fontS.appendChild(fontStyleSheetElement);
      fontStyleSheetElement.setAttribute(WUJIE_APP_ID, sandbox.id);
      sandbox.fontStyleSheetElements.push(fontStyleSheetElement);
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
export function patchStylesheetElement(stylesheetElement, cssLoader, sandbox, curUrl) {
  var _stylesheetElement$sh;
  if (stylesheetElement._hasPatchStyle) return;
  var innerHTMLDesc = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
  var innerTextDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerText");
  var textContentDesc = Object.getOwnPropertyDescriptor(Node.prototype, "textContent");
  var RawInsertRule = (_stylesheetElement$sh = stylesheetElement.sheet) === null || _stylesheetElement$sh === void 0 ? void 0 : _stylesheetElement$sh.insertRule;
  // 这个地方将cssRule加到innerHTML中去，防止子应用切换之后丢失
  function patchSheetInsertRule() {
    if (!RawInsertRule) return;
    stylesheetElement.sheet.insertRule = function (rule, index) {
      innerHTMLDesc ? stylesheetElement.innerHTML += rule : stylesheetElement.innerText += rule;
      return RawInsertRule.call(stylesheetElement.sheet, rule, index);
    };
  }
  patchSheetInsertRule();
  if (innerHTMLDesc) {
    Object.defineProperties(stylesheetElement, {
      innerHTML: {
        get: function get() {
          return innerHTMLDesc.get.call(stylesheetElement);
        },
        set: function set(code) {
          var _this = this;
          innerHTMLDesc.set.call(stylesheetElement, cssLoader(code, "", curUrl));
          nextTick(function () {
            return handleStylesheetElementPatch(_this, sandbox);
          });
        }
      }
    });
  }
  Object.defineProperties(stylesheetElement, {
    innerText: {
      get: function get() {
        return innerTextDesc.get.call(stylesheetElement);
      },
      set: function set(code) {
        var _this2 = this;
        innerTextDesc.set.call(stylesheetElement, cssLoader(code, "", curUrl));
        nextTick(function () {
          return handleStylesheetElementPatch(_this2, sandbox);
        });
      }
    },
    textContent: {
      get: function get() {
        return textContentDesc.get.call(stylesheetElement);
      },
      set: function set(code) {
        var _this3 = this;
        textContentDesc.set.call(stylesheetElement, cssLoader(code, "", curUrl));
        nextTick(function () {
          return handleStylesheetElementPatch(_this3, sandbox);
        });
      }
    },
    appendChild: {
      value: function value(node) {
        var _this4 = this;
        nextTick(function () {
          return handleStylesheetElementPatch(_this4, sandbox);
        });
        if (node.nodeType === Node.TEXT_NODE) {
          var res = rawAppendChild.call(stylesheetElement, stylesheetElement.ownerDocument.createTextNode(cssLoader(node.textContent, "", curUrl)));
          // 当appendChild之后，样式元素的sheet对象发生改变，要重新patch
          patchSheetInsertRule();
          return res;
        } else return rawAppendChild(node);
      }
    },
    insertAdjacentElement: {
      value: function value(position, element) {
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
          var _stylesheetElement = element;
          var content = _stylesheetElement.innerHTML;
          if (content) _stylesheetElement.innerHTML = cssLoader(content, "", curUrl);
          var res = rawInsertAdjacentElement.call(this, position, element);
          sandbox.styleSheetElements.push(_stylesheetElement);
          patchStylesheetElement(_stylesheetElement, cssLoader, sandbox, curUrl);
          handleStylesheetElementPatch(_stylesheetElement, sandbox);
          return res;
        } else return rawInsertAdjacentElement.call(this, position, element);
      }
    },
    _hasPatchStyle: {
      get: function get() {
        return true;
      }
    }
  });
}

// href 延迟赋值的兜底超时（毫秒）：超过该时间仍未拿到 href，则放弃监听并触发 error，
// 防止「href 永不到达」时 observer 闭包长期钉住子应用上下文。沿用 tinymce maxLoadTime 量级。
var DEFER_STYLE_HREF_TIMEOUT = 5000;

/**
 * 处理「先 appendChild(link) 后 setAttribute('href')」的延迟 href 场景。
 *
 * 通过 MutationObserver 监听 href 属性赋值，命中后走传入的 loadStyleSheet 完成加载。
 * 生命周期管理（避免内存泄漏）：
 *   1. 命中 / 超时 / 子应用已销毁 时立即 disconnect 并从 sandbox 出队；
 *   2. observer 登记到 sandbox.deferredStyleObservers，destroy 阶段统一兜底 disconnect；
 *   3. 回调内通过 wujieId 动态获取 sandbox，不捕获 sandbox/iframe，子应用销毁后闭包不再 pin 上下文。
 */
export function deferStyleSheetByHref(opts) {
  var element = opts.element;
  var wujieId = opts.wujieId,
    iframeWindow = opts.iframeWindow,
    loadStyleSheet = opts.loadStyleSheet;
  // 部分环境（jsdom / 老浏览器）可能不支持 MutationObserver，直接放弃延迟处理
  var MutationObserverCtor = iframeWindow.MutationObserver;
  if (typeof MutationObserverCtor !== "function") return;
  var settled = false;
  var timer = null;
  var observer = new MutationObserverCtor(function () {
    var _element;
    if (settled) return;
    var attrHref = (_element = element) === null || _element === void 0 ? void 0 : _element.getAttribute("href");
    if (!attrHref) return;
    var realHref = element.href || attrHref;
    var target = element;
    finalize(function () {
      return target && loadStyleSheet(realHref, target);
    });
  });

  // 统一收尾：disconnect + 出队 + 清理定时器，再执行收尾动作
  function finalize(action) {
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
    var sandbox = getWujieById(wujieId);
    var observers = sandbox === null || sandbox === void 0 ? void 0 : sandbox.deferredStyleObservers;
    if (Array.isArray(observers)) {
      var index = observers.indexOf(observer);
      if (index !== -1) observers.splice(index, 1);
    }
    if (sandbox) action === null || action === void 0 || action();
    element = null;
  }
  var sandbox = getWujieById(wujieId);
  // 子应用已不存在则无需监听
  if (!sandbox || !Array.isArray(sandbox.deferredStyleObservers)) return;
  sandbox.deferredStyleObservers.push(observer);
  observer.observe(element, {
    attributes: true,
    attributeFilter: ["href"]
  });
  // 超时兜底：长时间没等到 href，放弃监听并触发 error，让上游（如 tinymce）的失败回调收尾
  timer = setTimeout(function () {
    var target = element;
    finalize();
    if (target) manualInvokeElementEvent(target, "error");
  }, DEFER_STYLE_HREF_TIMEOUT);
}
var dynamicScriptExecStack = Promise.resolve();
function rewriteAppendOrInsertChild(opts) {
  return function appendChildOrInsertBefore(newChild, refChild) {
    var _this5 = this;
    var element = newChild;
    var rawDOMAppendOrInsertBefore = opts.rawDOMAppendOrInsertBefore,
      wujieId = opts.wujieId;
    var sandbox = getWujieById(wujieId);
    var styleSheetElements = sandbox.styleSheetElements,
      replace = sandbox.replace,
      fetch = sandbox.fetch,
      plugins = sandbox.plugins,
      iframe = sandbox.iframe,
      lifecycles = sandbox.lifecycles,
      proxyLocation = sandbox.proxyLocation,
      fiber = sandbox.fiber;
    if (!isHijackingTag(element.tagName) || !wujieId) {
      var res = rawDOMAppendOrInsertBefore.call(this, element, refChild);
      patchElementEffect(element, iframe.contentWindow);
      execHooks(plugins, "appendOrInsertElementHook", element, iframe.contentWindow);
      return res;
    }
    var iframeDocument = iframe.contentDocument;
    var curUrl = getCurUrl(proxyLocation);

    // TODO 过滤可以开放
    if (element.tagName) {
      var _element$tagName;
      switch ((_element$tagName = element.tagName) === null || _element$tagName === void 0 ? void 0 : _element$tagName.toUpperCase()) {
        case "LINK":
          {
            var _ref = element,
              href = _ref.href,
              rel = _ref.rel,
              type = _ref.type;
            var styleFlag = rel === "stylesheet" || type === "text/css" || href.endsWith(".css");
            // 非 stylesheet 不做处理
            if (!styleFlag) {
              var _res = rawDOMAppendOrInsertBefore.call(this, element, refChild);
              execHooks(plugins, "appendOrInsertElementHook", element, iframe.contentWindow);
              return _res;
            }

            // 拉取 css 内容并以 <style> 注入子应用、回调 link 的 load/error 事件。
            // 抽成闭包以便「append 时已有 href」与「append 后才 setAttribute('href')」两条路径复用。
            var loadStyleSheet = function loadStyleSheet(realHref, linkElement) {
              var attrHref = linkElement.getAttribute("href");
              var styleHref = attrHref ? getAbsolutePath(attrHref, proxyLocation.href) : realHref;
              var exclude = isMatchUrl(styleHref, getEffectLoaders("cssExcludes", plugins));
              if (!styleHref || exclude) return;

              // 立即创建占位 <style> 元素，避免异步加载期间重复插入
              // 保留原始 link 的属性（如 class），以便 checkLinkAndLoad 等去重逻辑能找到
              var rawAttrs = parseTagAttributes(linkElement.outerHTML);
              var placeholderElement = iframeDocument.createElement("style");
              setAttrsToElement(placeholderElement, rawAttrs);
              placeholderElement.setAttribute("data-wujie-css-href", styleHref);
              rawDOMAppendOrInsertBefore.call(_this5, placeholderElement, refChild);
              getExternalStyleSheets([{
                src: styleHref,
                ignore: isMatchUrl(styleHref, getEffectLoaders("cssIgnores", plugins))
              }], fetch, lifecycles.loadError).forEach(function (_ref2) {
                var src = _ref2.src,
                  ignore = _ref2.ignore,
                  contentPromise = _ref2.contentPromise;
                return contentPromise.then(function (content) {
                  if (ignore && src) {
                    var _placeholderElement$p;
                    // 忽略的元素应该直接把对应元素插入，而不是用新的 link 标签进行替代插入，保证 element 的上下文正常
                    // 移除占位元素，插入原始 link
                    (_placeholderElement$p = placeholderElement.parentNode) === null || _placeholderElement$p === void 0 || _placeholderElement$p.removeChild(placeholderElement);
                    rawDOMAppendOrInsertBefore.call(_this5, linkElement, refChild);
                  } else {
                    // 填充 CSS 内容到占位元素
                    // 处理css-loader插件
                    var cssLoader = getCssLoader({
                      plugins: plugins,
                      replace: replace
                    });
                    placeholderElement.innerHTML = cssLoader(content, src, curUrl);
                    styleSheetElements.push(placeholderElement);
                    // 处理样式补丁
                    handleStylesheetElementPatch(placeholderElement, sandbox);
                    manualInvokeElementEvent(linkElement, "load");
                  }
                  if (element === linkElement) element = null;
                }, function () {
                  manualInvokeElementEvent(linkElement, "error");
                  if (element === linkElement) element = null;
                });
              });
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
              deferStyleSheetByHref({
                element: element,
                wujieId: wujieId,
                iframeWindow: iframe.contentWindow,
                loadStyleSheet: loadStyleSheet
              });
            }
            var comment = iframeDocument.createComment("dynamic link ".concat(href, " replaced by wujie"));
            return rawDOMAppendOrInsertBefore.call(this, comment, refChild);
          }
        case "STYLE":
          {
            var stylesheetElement = newChild;
            styleSheetElements.push(stylesheetElement);
            var content = stylesheetElement.innerHTML;
            var cssLoader = getCssLoader({
              plugins: plugins,
              replace: replace
            });
            content && (stylesheetElement.innerHTML = cssLoader(content, "", curUrl));
            var _res2 = rawDOMAppendOrInsertBefore.call(this, element, refChild);
            // 处理样式补丁
            patchStylesheetElement(stylesheetElement, cssLoader, sandbox, curUrl);
            handleStylesheetElementPatch(stylesheetElement, sandbox);
            execHooks(plugins, "appendOrInsertElementHook", element, iframe.contentWindow);
            return _res2;
          }
        case "SCRIPT":
          {
            setTagToScript(element);
            var _ref3 = element,
              src = _ref3.src,
              text = _ref3.text,
              _type = _ref3.type,
              crossOrigin = _ref3.crossOrigin;
            // 排除js
            if (src && !isMatchUrl(src, getEffectLoaders("jsExcludes", plugins))) {
              var execScript = function execScript(scriptResult) {
                // 假如子应用被连续渲染两次，两次渲染会导致处理流程的交叉污染
                if (sandbox.iframe === null) return warn(WUJIE_TIPS_REPEAT_RENDER);
                var onload = function onload() {
                  manualInvokeElementEvent(element, "load");
                  element = null;
                };
                insertScriptToIframe(_objectSpread(_objectSpread({}, scriptResult), {}, {
                  onload: onload
                }), sandbox.iframe.contentWindow, element);
              };
              var scriptOptions = {
                src: src,
                module: _type === "module",
                crossorigin: crossOrigin !== null,
                crossoriginType: crossOrigin || "",
                ignore: isMatchUrl(src, getEffectLoaders("jsIgnores", plugins)),
                attrs: parseTagAttributes(element.outerHTML)
              };
              getExternalScripts([scriptOptions], fetch, lifecycles.loadError, fiber).forEach(function (scriptResult) {
                dynamicScriptExecStack = dynamicScriptExecStack.then(function () {
                  return scriptResult.contentPromise.then(function (content) {
                    var _sandbox$execQueue;
                    if (sandbox.execQueue === null) return warn(WUJIE_TIPS_REPEAT_RENDER);
                    var execQueueLength = (_sandbox$execQueue = sandbox.execQueue) === null || _sandbox$execQueue === void 0 ? void 0 : _sandbox$execQueue.length;
                    sandbox.execQueue.push(function () {
                      return fiber ? sandbox.requestIdleCallback(function () {
                        execScript(_objectSpread(_objectSpread({}, scriptResult), {}, {
                          content: content
                        }));
                      }) : execScript(_objectSpread(_objectSpread({}, scriptResult), {}, {
                        content: content
                      }));
                    });
                    // 同步脚本如果都执行完了，需要手动触发执行
                    if (!execQueueLength) sandbox.execQueue.shift()();
                  }, function () {
                    manualInvokeElementEvent(element, "error");
                    element = null;
                  });
                });
              });
            } else {
              var _sandbox$execQueue2;
              var execQueueLength = (_sandbox$execQueue2 = sandbox.execQueue) === null || _sandbox$execQueue2 === void 0 ? void 0 : _sandbox$execQueue2.length;
              sandbox.execQueue.push(function () {
                return fiber ? sandbox.requestIdleCallback(function () {
                  insertScriptToIframe({
                    src: null,
                    content: text,
                    attrs: parseTagAttributes(element.outerHTML)
                  }, sandbox.iframe.contentWindow, element);
                }) : insertScriptToIframe({
                  src: null,
                  content: text,
                  attrs: parseTagAttributes(element.outerHTML)
                }, sandbox.iframe.contentWindow, element);
              });
              if (!execQueueLength) sandbox.execQueue.shift()();
            }
            // inline script never trigger the onload and onerror event
            var _comment = iframeDocument.createComment("dynamic script ".concat(src, " replaced by wujie"));
            return rawDOMAppendOrInsertBefore.call(this, _comment, refChild);
          }
        // 修正子应用内部iframe的window.parent指向
        case "IFRAME":
          {
            // 嵌套的子应用的js-iframe需要插入子应用的js-iframe内部
            if (element.getAttribute(WUJIE_DATA_FLAG) === "") {
              return rawAppendChild.call(rawDocumentQuerySelector.call(this.ownerDocument, "html"), element);
            }
            var _res3 = rawDOMAppendOrInsertBefore.call(this, element, refChild);
            execHooks(plugins, "appendOrInsertElementHook", element, iframe.contentWindow);
            return _res3;
          }
        default:
      }
    }
  };
}
function findScriptElementFromIframe(rawElement, wujieId) {
  var wujieTag = getTagFromScript(rawElement);
  var sandbox = getWujieById(wujieId);
  var iframe = sandbox.iframe;
  var targetScript = iframe.contentWindow.__WUJIE_RAW_DOCUMENT_HEAD__.querySelector("script[".concat(WUJIE_SCRIPT_ID, "='").concat(wujieTag, "']"));
  if (targetScript === null) {
    warn(WUJIE_TIPS_NO_SCRIPT, "<script ".concat(WUJIE_SCRIPT_ID, "='").concat(wujieTag, "'/>"));
  }
  return {
    targetScript: targetScript,
    iframe: iframe
  };
}
function rewriteContains(opts) {
  return function contains(other) {
    var element = other;
    var rawElementContains = opts.rawElementContains,
      wujieId = opts.wujieId;
    if (element && isScriptElement(element)) {
      var _findScriptElementFro = findScriptElementFromIframe(element, wujieId),
        targetScript = _findScriptElementFro.targetScript;
      return targetScript !== null;
    }
    return rawElementContains(element);
  };
}
function rewriteRemoveChild(opts) {
  return function removeChild(child) {
    var element = child;
    var rawElementRemoveChild = opts.rawElementRemoveChild,
      wujieId = opts.wujieId;
    if (element && isScriptElement(element)) {
      var _findScriptElementFro2 = findScriptElementFromIframe(element, wujieId),
        targetScript = _findScriptElementFro2.targetScript,
        iframe = _findScriptElementFro2.iframe;
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
function patchEventListener(element) {
  var listenerMap = new Map();
  element._cacheListeners = listenerMap;
  element.addEventListener = function (type, listener, options) {
    var listeners = listenerMap.get(type) || [];
    listenerMap.set(type, [].concat(_toConsumableArray(listeners), [listener]));
    return rawAddEventListener.call(element, type, listener, options);
  };
  element.removeEventListener = function (type, listener, options) {
    var typeListeners = listenerMap.get(type);
    var index = typeListeners === null || typeListeners === void 0 ? void 0 : typeListeners.indexOf(listener);
    if (typeListeners !== null && typeListeners !== void 0 && typeListeners.length && index !== -1) {
      typeListeners.splice(index, 1);
    }
    return rawRemoveEventListener.call(element, type, listener, options);
  };
}

/**
 * 清空head和body的绑定的事件
 */
export function removeEventListener(element) {
  var listenerMap = element._cacheListeners;
  _toConsumableArray(listenerMap.entries()).forEach(function (_ref4) {
    var _ref5 = _slicedToArray(_ref4, 2),
      type = _ref5[0],
      listeners = _ref5[1];
    listeners.forEach(function (listener) {
      return rawRemoveEventListener.call(element, type, listener);
    });
  });
}

/**
 * patch head and body in render
 * intercept appendChild and insertBefore
 */
export function patchRenderEffect(render, id, degrade) {
  // 降级场景dom渲染在iframe中，iframe移动后事件自动销毁，不需要记录
  if (!degrade) {
    patchEventListener(render.head);
    patchEventListener(render.body);
  }
  render.head.appendChild = rewriteAppendOrInsertChild({
    rawDOMAppendOrInsertBefore: rawAppendChild,
    wujieId: id
  });
  render.head.insertBefore = rewriteAppendOrInsertChild({
    rawDOMAppendOrInsertBefore: rawHeadInsertBefore,
    wujieId: id
  });
  render.head.removeChild = rewriteRemoveChild({
    rawElementRemoveChild: rawElementRemoveChild.bind(render.head),
    wujieId: id
  });
  render.head.contains = rewriteContains({
    rawElementContains: rawElementContains.bind(render.head),
    wujieId: id
  });
  render.contains = rewriteContains({
    rawElementContains: rawElementContains.bind(render),
    wujieId: id
  });
  render.body.appendChild = rewriteAppendOrInsertChild({
    rawDOMAppendOrInsertBefore: rawAppendChild,
    wujieId: id
  });
  render.body.insertBefore = rewriteAppendOrInsertChild({
    rawDOMAppendOrInsertBefore: rawBodyInsertBefore,
    wujieId: id
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJnZXRFeHRlcm5hbFN0eWxlU2hlZXRzIiwiZ2V0RXh0ZXJuYWxTY3JpcHRzIiwiZ2V0V3VqaWVCeUlkIiwicmF3QXBwZW5kQ2hpbGQiLCJyYXdFbGVtZW50Q29udGFpbnMiLCJyYXdFbGVtZW50UmVtb3ZlQ2hpbGQiLCJyYXdIZWFkSW5zZXJ0QmVmb3JlIiwicmF3Qm9keUluc2VydEJlZm9yZSIsInJhd0luc2VydEFkamFjZW50RWxlbWVudCIsInJhd0RvY3VtZW50UXVlcnlTZWxlY3RvciIsInJhd0FkZEV2ZW50TGlzdGVuZXIiLCJyYXdSZW1vdmVFdmVudExpc3RlbmVyIiwiaXNGdW5jdGlvbiIsImlzSGlqYWNraW5nVGFnIiwid2FybiIsIm5leHRUaWNrIiwiZ2V0Q3VyVXJsIiwiZ2V0QWJzb2x1dGVQYXRoIiwiZXhlY0hvb2tzIiwiaXNTY3JpcHRFbGVtZW50Iiwic2V0VGFnVG9TY3JpcHQiLCJnZXRUYWdGcm9tU2NyaXB0Iiwic2V0QXR0cnNUb0VsZW1lbnQiLCJpbnNlcnRTY3JpcHRUb0lmcmFtZSIsInBhdGNoRWxlbWVudEVmZmVjdCIsImdldFBhdGNoU3R5bGVFbGVtZW50cyIsImdldENzc0xvYWRlciIsImdldEVmZmVjdExvYWRlcnMiLCJpc01hdGNoVXJsIiwiV1VKSUVfU0NSSVBUX0lEIiwiV1VKSUVfREFUQV9GTEFHIiwiV1VKSUVfVElQU19SRVBFQVRfUkVOREVSIiwiV1VKSUVfVElQU19OT19TQ1JJUFQiLCJXVUpJRV9BUFBfSUQiLCJwYXJzZVRhZ0F0dHJpYnV0ZXMiLCJwYXRjaEN1c3RvbUV2ZW50IiwiZSIsImVsZW1lbnRHZXR0ZXIiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0aWVzIiwic3JjRWxlbWVudCIsImdldCIsInRhcmdldCIsIm1hbnVhbEludm9rZUVsZW1lbnRFdmVudCIsImVsZW1lbnQiLCJldmVudCIsImN1c3RvbUV2ZW50IiwiQ3VzdG9tRXZlbnQiLCJwYXRjaGVkRXZlbnQiLCJjb25jYXQiLCJkaXNwYXRjaEV2ZW50IiwiaGFuZGxlU3R5bGVzaGVldEVsZW1lbnRQYXRjaCIsInN0eWxlc2hlZXRFbGVtZW50Iiwic2FuZGJveCIsImlubmVySFRNTCIsImRlZ3JhZGUiLCJwYXRjaGVyIiwiX2dldFBhdGNoU3R5bGVFbGVtZW50Iiwic2hlZXQiLCJfZ2V0UGF0Y2hTdHlsZUVsZW1lbnQyIiwiX3NsaWNlZFRvQXJyYXkiLCJob3N0U3R5bGVTaGVldEVsZW1lbnQiLCJmb250U3R5bGVTaGVldEVsZW1lbnQiLCJzaGFkb3dSb290IiwiaGVhZCIsImFwcGVuZENoaWxkIiwiX3NhbmRib3gkaW5qZWN0JGZvbnRTIiwiaW5qZWN0IiwiZm9udFN0eWxlU2hlZXRDb250YWluZXIiLCJzZXRBdHRyaWJ1dGUiLCJpZCIsImZvbnRTdHlsZVNoZWV0RWxlbWVudHMiLCJwdXNoIiwiX3BhdGNoZXIiLCJ1bmRlZmluZWQiLCJjbGVhclRpbWVvdXQiLCJzZXRUaW1lb3V0IiwicGF0Y2hTdHlsZXNoZWV0RWxlbWVudCIsImNzc0xvYWRlciIsImN1clVybCIsIl9zdHlsZXNoZWV0RWxlbWVudCRzaCIsIl9oYXNQYXRjaFN0eWxlIiwiaW5uZXJIVE1MRGVzYyIsImdldE93blByb3BlcnR5RGVzY3JpcHRvciIsIkVsZW1lbnQiLCJwcm90b3R5cGUiLCJpbm5lclRleHREZXNjIiwiSFRNTEVsZW1lbnQiLCJ0ZXh0Q29udGVudERlc2MiLCJOb2RlIiwiUmF3SW5zZXJ0UnVsZSIsImluc2VydFJ1bGUiLCJwYXRjaFNoZWV0SW5zZXJ0UnVsZSIsInJ1bGUiLCJpbmRleCIsImlubmVyVGV4dCIsImNhbGwiLCJzZXQiLCJjb2RlIiwiX3RoaXMiLCJfdGhpczIiLCJ0ZXh0Q29udGVudCIsIl90aGlzMyIsInZhbHVlIiwibm9kZSIsIl90aGlzNCIsIm5vZGVUeXBlIiwiVEVYVF9OT0RFIiwicmVzIiwib3duZXJEb2N1bWVudCIsImNyZWF0ZVRleHROb2RlIiwiaW5zZXJ0QWRqYWNlbnRFbGVtZW50IiwicG9zaXRpb24iLCJub2RlTmFtZSIsImNvbnRlbnQiLCJzdHlsZVNoZWV0RWxlbWVudHMiLCJERUZFUl9TVFlMRV9IUkVGX1RJTUVPVVQiLCJkZWZlclN0eWxlU2hlZXRCeUhyZWYiLCJvcHRzIiwid3VqaWVJZCIsImlmcmFtZVdpbmRvdyIsImxvYWRTdHlsZVNoZWV0IiwiTXV0YXRpb25PYnNlcnZlckN0b3IiLCJNdXRhdGlvbk9ic2VydmVyIiwic2V0dGxlZCIsInRpbWVyIiwib2JzZXJ2ZXIiLCJfZWxlbWVudCIsImF0dHJIcmVmIiwiZ2V0QXR0cmlidXRlIiwicmVhbEhyZWYiLCJocmVmIiwiZmluYWxpemUiLCJhY3Rpb24iLCJkaXNjb25uZWN0IiwiXyIsIm9ic2VydmVycyIsImRlZmVycmVkU3R5bGVPYnNlcnZlcnMiLCJBcnJheSIsImlzQXJyYXkiLCJpbmRleE9mIiwic3BsaWNlIiwib2JzZXJ2ZSIsImF0dHJpYnV0ZXMiLCJhdHRyaWJ1dGVGaWx0ZXIiLCJkeW5hbWljU2NyaXB0RXhlY1N0YWNrIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZXdyaXRlQXBwZW5kT3JJbnNlcnRDaGlsZCIsImFwcGVuZENoaWxkT3JJbnNlcnRCZWZvcmUiLCJuZXdDaGlsZCIsInJlZkNoaWxkIiwiX3RoaXM1IiwicmF3RE9NQXBwZW5kT3JJbnNlcnRCZWZvcmUiLCJyZXBsYWNlIiwiZmV0Y2giLCJwbHVnaW5zIiwiaWZyYW1lIiwibGlmZWN5Y2xlcyIsInByb3h5TG9jYXRpb24iLCJmaWJlciIsInRhZ05hbWUiLCJjb250ZW50V2luZG93IiwiaWZyYW1lRG9jdW1lbnQiLCJjb250ZW50RG9jdW1lbnQiLCJfZWxlbWVudCR0YWdOYW1lIiwidG9VcHBlckNhc2UiLCJfcmVmIiwicmVsIiwidHlwZSIsInN0eWxlRmxhZyIsImVuZHNXaXRoIiwibGlua0VsZW1lbnQiLCJzdHlsZUhyZWYiLCJleGNsdWRlIiwicmF3QXR0cnMiLCJvdXRlckhUTUwiLCJwbGFjZWhvbGRlckVsZW1lbnQiLCJjcmVhdGVFbGVtZW50Iiwic3JjIiwiaWdub3JlIiwibG9hZEVycm9yIiwiZm9yRWFjaCIsIl9yZWYyIiwiY29udGVudFByb21pc2UiLCJ0aGVuIiwiX3BsYWNlaG9sZGVyRWxlbWVudCRwIiwicGFyZW50Tm9kZSIsInJlbW92ZUNoaWxkIiwiY29tbWVudCIsImNyZWF0ZUNvbW1lbnQiLCJfcmVmMyIsInRleHQiLCJjcm9zc09yaWdpbiIsImV4ZWNTY3JpcHQiLCJzY3JpcHRSZXN1bHQiLCJvbmxvYWQiLCJfb2JqZWN0U3ByZWFkIiwic2NyaXB0T3B0aW9ucyIsIm1vZHVsZSIsImNyb3Nzb3JpZ2luIiwiY3Jvc3NvcmlnaW5UeXBlIiwiYXR0cnMiLCJfc2FuZGJveCRleGVjUXVldWUiLCJleGVjUXVldWUiLCJleGVjUXVldWVMZW5ndGgiLCJsZW5ndGgiLCJyZXF1ZXN0SWRsZUNhbGxiYWNrIiwic2hpZnQiLCJfc2FuZGJveCRleGVjUXVldWUyIiwiZmluZFNjcmlwdEVsZW1lbnRGcm9tSWZyYW1lIiwicmF3RWxlbWVudCIsInd1amllVGFnIiwidGFyZ2V0U2NyaXB0IiwiX19XVUpJRV9SQVdfRE9DVU1FTlRfSEVBRF9fIiwicXVlcnlTZWxlY3RvciIsInJld3JpdGVDb250YWlucyIsImNvbnRhaW5zIiwib3RoZXIiLCJfZmluZFNjcmlwdEVsZW1lbnRGcm8iLCJyZXdyaXRlUmVtb3ZlQ2hpbGQiLCJjaGlsZCIsIl9maW5kU2NyaXB0RWxlbWVudEZybzIiLCJwYXRjaEV2ZW50TGlzdGVuZXIiLCJsaXN0ZW5lck1hcCIsIk1hcCIsIl9jYWNoZUxpc3RlbmVycyIsImFkZEV2ZW50TGlzdGVuZXIiLCJsaXN0ZW5lciIsIm9wdGlvbnMiLCJsaXN0ZW5lcnMiLCJfdG9Db25zdW1hYmxlQXJyYXkiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwidHlwZUxpc3RlbmVycyIsImVudHJpZXMiLCJfcmVmNCIsIl9yZWY1IiwicGF0Y2hSZW5kZXJFZmZlY3QiLCJyZW5kZXIiLCJib2R5IiwiaW5zZXJ0QmVmb3JlIiwiYmluZCJdLCJzb3VyY2VzIjpbIi4uL3NyYy9lZmZlY3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZ2V0RXh0ZXJuYWxTdHlsZVNoZWV0cywgZ2V0RXh0ZXJuYWxTY3JpcHRzIH0gZnJvbSBcIi4vZW50cnlcIjtcbmltcG9ydCB7XG4gIGdldFd1amllQnlJZCxcbiAgcmF3QXBwZW5kQ2hpbGQsXG4gIHJhd0VsZW1lbnRDb250YWlucyxcbiAgcmF3RWxlbWVudFJlbW92ZUNoaWxkLFxuICByYXdIZWFkSW5zZXJ0QmVmb3JlLFxuICByYXdCb2R5SW5zZXJ0QmVmb3JlLFxuICByYXdJbnNlcnRBZGphY2VudEVsZW1lbnQsXG4gIHJhd0RvY3VtZW50UXVlcnlTZWxlY3RvcixcbiAgcmF3QWRkRXZlbnRMaXN0ZW5lcixcbiAgcmF3UmVtb3ZlRXZlbnRMaXN0ZW5lcixcbn0gZnJvbSBcIi4vY29tbW9uXCI7XG5pbXBvcnQge1xuICBpc0Z1bmN0aW9uLFxuICBpc0hpamFja2luZ1RhZyxcbiAgd2FybixcbiAgbmV4dFRpY2ssXG4gIGdldEN1clVybCxcbiAgZ2V0QWJzb2x1dGVQYXRoLFxuICBleGVjSG9va3MsXG4gIGlzU2NyaXB0RWxlbWVudCxcbiAgc2V0VGFnVG9TY3JpcHQsXG4gIGdldFRhZ0Zyb21TY3JpcHQsXG4gIHNldEF0dHJzVG9FbGVtZW50LFxufSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IHsgaW5zZXJ0U2NyaXB0VG9JZnJhbWUsIHBhdGNoRWxlbWVudEVmZmVjdCB9IGZyb20gXCIuL2lmcmFtZVwiO1xuaW1wb3J0IFd1amllIGZyb20gXCIuL3NhbmRib3hcIjtcbmltcG9ydCB7IGdldFBhdGNoU3R5bGVFbGVtZW50cyB9IGZyb20gXCIuL3NoYWRvd1wiO1xuaW1wb3J0IHsgZ2V0Q3NzTG9hZGVyLCBnZXRFZmZlY3RMb2FkZXJzLCBpc01hdGNoVXJsIH0gZnJvbSBcIi4vcGx1Z2luXCI7XG5pbXBvcnQge1xuICBXVUpJRV9TQ1JJUFRfSUQsXG4gIFdVSklFX0RBVEFfRkxBRyxcbiAgV1VKSUVfVElQU19SRVBFQVRfUkVOREVSLFxuICBXVUpJRV9USVBTX05PX1NDUklQVCxcbiAgV1VKSUVfQVBQX0lELFxufSBmcm9tIFwiLi9jb25zdGFudFwiO1xuaW1wb3J0IHsgU2NyaXB0T2JqZWN0LCBwYXJzZVRhZ0F0dHJpYnV0ZXMgfSBmcm9tIFwiLi90ZW1wbGF0ZVwiO1xuXG5mdW5jdGlvbiBwYXRjaEN1c3RvbUV2ZW50KFxuICBlOiBDdXN0b21FdmVudCxcbiAgZWxlbWVudEdldHRlcjogKCkgPT4gSFRNTFNjcmlwdEVsZW1lbnQgfCBIVE1MTGlua0VsZW1lbnQgfCBudWxsXG4pOiBDdXN0b21FdmVudCB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGUsIHtcbiAgICBzcmNFbGVtZW50OiB7XG4gICAgICBnZXQ6IGVsZW1lbnRHZXR0ZXIsXG4gICAgfSxcbiAgICB0YXJnZXQ6IHtcbiAgICAgIGdldDogZWxlbWVudEdldHRlcixcbiAgICB9LFxuICB9KTtcblxuICByZXR1cm4gZTtcbn1cblxuLyoqXG4gKiDmiYvliqjop6blj5Hkuovku7blm57osINcbiAqL1xuZnVuY3Rpb24gbWFudWFsSW52b2tlRWxlbWVudEV2ZW50KGVsZW1lbnQ6IEhUTUxMaW5rRWxlbWVudCB8IEhUTUxTY3JpcHRFbGVtZW50LCBldmVudDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IGN1c3RvbUV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KGV2ZW50KTtcbiAgY29uc3QgcGF0Y2hlZEV2ZW50ID0gcGF0Y2hDdXN0b21FdmVudChjdXN0b21FdmVudCwgKCkgPT4gZWxlbWVudCk7XG4gIGlmIChpc0Z1bmN0aW9uKGVsZW1lbnRbYG9uJHtldmVudH1gXSkpIHtcbiAgICBlbGVtZW50W2BvbiR7ZXZlbnR9YF0ocGF0Y2hlZEV2ZW50KTtcbiAgfSBlbHNlIHtcbiAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQocGF0Y2hlZEV2ZW50KTtcbiAgfVxufVxuXG4vKipcbiAqIOagt+W8j+WFg+e0oOeahGNzc+WPmOmHj+WkhOeQhu+8jOavj+S4qnN0eWxlc2hlZXRFbGVtZW505Y2V54us6IqC5rWBXG4gKi9cbmZ1bmN0aW9uIGhhbmRsZVN0eWxlc2hlZXRFbGVtZW50UGF0Y2goc3R5bGVzaGVldEVsZW1lbnQ6IEhUTUxTdHlsZUVsZW1lbnQgJiB7IF9wYXRjaGVyPzogYW55IH0sIHNhbmRib3g6IFd1amllKSB7XG4gIGlmICghc3R5bGVzaGVldEVsZW1lbnQuaW5uZXJIVE1MIHx8IHNhbmRib3guZGVncmFkZSkgcmV0dXJuO1xuICBjb25zdCBwYXRjaGVyID0gKCkgPT4ge1xuICAgIGNvbnN0IFtob3N0U3R5bGVTaGVldEVsZW1lbnQsIGZvbnRTdHlsZVNoZWV0RWxlbWVudF0gPSBnZXRQYXRjaFN0eWxlRWxlbWVudHMoW3N0eWxlc2hlZXRFbGVtZW50LnNoZWV0XSk7XG4gICAgaWYgKGhvc3RTdHlsZVNoZWV0RWxlbWVudCkge1xuICAgICAgc2FuZGJveC5zaGFkb3dSb290LmhlYWQuYXBwZW5kQ2hpbGQoaG9zdFN0eWxlU2hlZXRFbGVtZW50KTtcbiAgICB9XG4gICAgaWYgKGZvbnRTdHlsZVNoZWV0RWxlbWVudCkge1xuICAgICAgc2FuZGJveC5pbmplY3QuZm9udFN0eWxlU2hlZXRDb250YWluZXI/LmFwcGVuZENoaWxkKGZvbnRTdHlsZVNoZWV0RWxlbWVudCk7XG4gICAgICBmb250U3R5bGVTaGVldEVsZW1lbnQuc2V0QXR0cmlidXRlKFdVSklFX0FQUF9JRCwgc2FuZGJveC5pZCk7XG4gICAgICBzYW5kYm94LmZvbnRTdHlsZVNoZWV0RWxlbWVudHMucHVzaChmb250U3R5bGVTaGVldEVsZW1lbnQpO1xuICAgIH1cbiAgICBzdHlsZXNoZWV0RWxlbWVudC5fcGF0Y2hlciA9IHVuZGVmaW5lZDtcbiAgfTtcbiAgaWYgKHN0eWxlc2hlZXRFbGVtZW50Ll9wYXRjaGVyKSB7XG4gICAgY2xlYXJUaW1lb3V0KHN0eWxlc2hlZXRFbGVtZW50Ll9wYXRjaGVyKTtcbiAgfVxuICBzdHlsZXNoZWV0RWxlbWVudC5fcGF0Y2hlciA9IHNldFRpbWVvdXQocGF0Y2hlciwgNTApO1xufVxuXG4vKipcbiAqIOWKq+aMgeWkhOeQhuagt+W8j+WFg+e0oOeahOWxnuaAp1xuICogQGludGVybmFsIOS7heWHuuS6juWPr+a1i+aAp+WvvOWHuu+8jOWklumDqOS4jeW6lOebtOaOpeiwg+eUqFxuICovXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hTdHlsZXNoZWV0RWxlbWVudChcbiAgc3R5bGVzaGVldEVsZW1lbnQ6IEhUTUxTdHlsZUVsZW1lbnQgJiB7IF9oYXNQYXRjaFN0eWxlPzogYm9vbGVhbiB9LFxuICBjc3NMb2FkZXI6IChjb2RlOiBzdHJpbmcsIHVybDogc3RyaW5nLCBiYXNlOiBzdHJpbmcpID0+IHN0cmluZyxcbiAgc2FuZGJveDogV3VqaWUsXG4gIGN1clVybDogc3RyaW5nXG4pIHtcbiAgaWYgKHN0eWxlc2hlZXRFbGVtZW50Ll9oYXNQYXRjaFN0eWxlKSByZXR1cm47XG4gIGNvbnN0IGlubmVySFRNTERlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKEVsZW1lbnQucHJvdG90eXBlLCBcImlubmVySFRNTFwiKTtcbiAgY29uc3QgaW5uZXJUZXh0RGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoSFRNTEVsZW1lbnQucHJvdG90eXBlLCBcImlubmVyVGV4dFwiKTtcbiAgY29uc3QgdGV4dENvbnRlbnREZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihOb2RlLnByb3RvdHlwZSwgXCJ0ZXh0Q29udGVudFwiKTtcbiAgY29uc3QgUmF3SW5zZXJ0UnVsZSA9IHN0eWxlc2hlZXRFbGVtZW50LnNoZWV0Py5pbnNlcnRSdWxlO1xuICAvLyDov5nkuKrlnLDmlrnlsIZjc3NSdWxl5Yqg5YiwaW5uZXJIVE1M5Lit5Y6777yM6Ziy5q2i5a2Q5bqU55So5YiH5o2i5LmL5ZCO5Lii5aSxXG4gIGZ1bmN0aW9uIHBhdGNoU2hlZXRJbnNlcnRSdWxlKCkge1xuICAgIGlmICghUmF3SW5zZXJ0UnVsZSkgcmV0dXJuO1xuICAgIHN0eWxlc2hlZXRFbGVtZW50LnNoZWV0Lmluc2VydFJ1bGUgPSAocnVsZTogc3RyaW5nLCBpbmRleD86IG51bWJlcik6IG51bWJlciA9PiB7XG4gICAgICBpbm5lckhUTUxEZXNjID8gKHN0eWxlc2hlZXRFbGVtZW50LmlubmVySFRNTCArPSBydWxlKSA6IChzdHlsZXNoZWV0RWxlbWVudC5pbm5lclRleHQgKz0gcnVsZSk7XG4gICAgICByZXR1cm4gUmF3SW5zZXJ0UnVsZS5jYWxsKHN0eWxlc2hlZXRFbGVtZW50LnNoZWV0LCBydWxlLCBpbmRleCk7XG4gICAgfTtcbiAgfVxuICBwYXRjaFNoZWV0SW5zZXJ0UnVsZSgpO1xuXG4gIGlmIChpbm5lckhUTUxEZXNjKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoc3R5bGVzaGVldEVsZW1lbnQsIHtcbiAgICAgIGlubmVySFRNTDoge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gaW5uZXJIVE1MRGVzYy5nZXQuY2FsbChzdHlsZXNoZWV0RWxlbWVudCk7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGNvZGU6IHN0cmluZykge1xuICAgICAgICAgIGlubmVySFRNTERlc2Muc2V0LmNhbGwoc3R5bGVzaGVldEVsZW1lbnQsIGNzc0xvYWRlcihjb2RlLCBcIlwiLCBjdXJVcmwpKTtcbiAgICAgICAgICBuZXh0VGljaygoKSA9PiBoYW5kbGVTdHlsZXNoZWV0RWxlbWVudFBhdGNoKHRoaXMsIHNhbmRib3gpKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhzdHlsZXNoZWV0RWxlbWVudCwge1xuICAgIGlubmVyVGV4dDoge1xuICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBpbm5lclRleHREZXNjLmdldC5jYWxsKHN0eWxlc2hlZXRFbGVtZW50KTtcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uIChjb2RlOiBzdHJpbmcpIHtcbiAgICAgICAgaW5uZXJUZXh0RGVzYy5zZXQuY2FsbChzdHlsZXNoZWV0RWxlbWVudCwgY3NzTG9hZGVyKGNvZGUsIFwiXCIsIGN1clVybCkpO1xuICAgICAgICBuZXh0VGljaygoKSA9PiBoYW5kbGVTdHlsZXNoZWV0RWxlbWVudFBhdGNoKHRoaXMsIHNhbmRib3gpKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgICB0ZXh0Q29udGVudDoge1xuICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0ZXh0Q29udGVudERlc2MuZ2V0LmNhbGwoc3R5bGVzaGVldEVsZW1lbnQpO1xuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24gKGNvZGU6IHN0cmluZykge1xuICAgICAgICB0ZXh0Q29udGVudERlc2Muc2V0LmNhbGwoc3R5bGVzaGVldEVsZW1lbnQsIGNzc0xvYWRlcihjb2RlLCBcIlwiLCBjdXJVcmwpKTtcbiAgICAgICAgbmV4dFRpY2soKCkgPT4gaGFuZGxlU3R5bGVzaGVldEVsZW1lbnRQYXRjaCh0aGlzLCBzYW5kYm94KSk7XG4gICAgICB9LFxuICAgIH0sXG4gICAgYXBwZW5kQ2hpbGQ6IHtcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiAobm9kZTogTm9kZSk6IE5vZGUge1xuICAgICAgICBuZXh0VGljaygoKSA9PiBoYW5kbGVTdHlsZXNoZWV0RWxlbWVudFBhdGNoKHRoaXMsIHNhbmRib3gpKTtcbiAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFKSB7XG4gICAgICAgICAgY29uc3QgcmVzID0gcmF3QXBwZW5kQ2hpbGQuY2FsbChcbiAgICAgICAgICAgIHN0eWxlc2hlZXRFbGVtZW50LFxuICAgICAgICAgICAgc3R5bGVzaGVldEVsZW1lbnQub3duZXJEb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjc3NMb2FkZXIobm9kZS50ZXh0Q29udGVudCwgXCJcIiwgY3VyVXJsKSlcbiAgICAgICAgICApO1xuICAgICAgICAgIC8vIOW9k2FwcGVuZENoaWxk5LmL5ZCO77yM5qC35byP5YWD57Sg55qEc2hlZXTlr7nosaHlj5HnlJ/mlLnlj5jvvIzopoHph43mlrBwYXRjaFxuICAgICAgICAgIHBhdGNoU2hlZXRJbnNlcnRSdWxlKCk7XG4gICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSBlbHNlIHJldHVybiByYXdBcHBlbmRDaGlsZChub2RlKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgICBpbnNlcnRBZGphY2VudEVsZW1lbnQ6IHtcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiAodGhpczogSFRNTFN0eWxlRWxlbWVudCwgcG9zaXRpb246IEluc2VydFBvc2l0aW9uLCBlbGVtZW50OiBFbGVtZW50KSB7XG4gICAgICAgIGlmIChlbGVtZW50Lm5vZGVOYW1lID09PSBcIlNUWUxFXCIpIHtcbiAgICAgICAgICAvLyDlhbPogZQgaXNzdWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9UZW5jZW50L3d1amllL2lzc3Vlcy8xMDU5XG4gICAgICAgICAgLy9cbiAgICAgICAgICAvLyB2aXRlIGRldiBzZXJ2ZXIg56ys5LiA5LiqIGNzcyDpgJrov4cgaGVhZC5hcHBlbmRDaGlsZCDmj5LlhaXvvIzlkI7nu63mr4/kuKogY3NzIOmDvei1sFxuICAgICAgICAgIC8vIGxhc3RJbnNlcnRlZFN0eWxlLmluc2VydEFkamFjZW50RWxlbWVudChcImFmdGVyZW5kXCIsIHN0eWxlKe+8jGhvdCB1cGRhdGUg5pe2XG4gICAgICAgICAgLy8g55u05o6lIHN0eWxlLnRleHRDb250ZW50ID0gbmV3Q29udGVudOOAguiiqyBpbnNlcnRBZGphY2VudEVsZW1lbnQg5o+S5YWl55qEIHN0eWxlXG4gICAgICAgICAgLy8g5b+F6aG76I635b6X5LiOXCLnrKzkuIDkuKogc3R5bGVcIuWujOWFqOS4gOiHtOeahOWKq+aMgeiDveWKm++8jOWQpuWIme+8mlxuICAgICAgICAgIC8vICAgMSkg5b2T5YmN5YaF5a656YeM55qE6LWE5rqQ55u45a+56Lev5b6E5LiN5Lya6KKrIGNzc0xvYWRlciDmlLnlhpnvvIhAZm9udC1mYWNlIOWkseaViO+8ie+8m1xuICAgICAgICAgIC8vICAgMikg5ZCO57utIHRleHRDb250ZW50IC8gaW5uZXJIVE1MIC8gYXBwZW5kQ2hpbGQgLyBzaGVldC5pbnNlcnRSdWxlXG4gICAgICAgICAgLy8gICAgICDnu5Xov4cgd3VqaWXvvIxob3QgdXBkYXRlIOWFqOmDqOiEseeuoe+8m1xuICAgICAgICAgIC8vICAgMykg6ZO+5byPIGluc2VydEFkamFjZW50RWxlbWVudCDliJvlu7rnmoTkuIvmuLggc3R5bGUg55u05o6l6LWw5Y6f55Sf5a6e546w44CCXG4gICAgICAgICAgLy8g5Zug5q2k6L+Z6YeM5b+F6aG75aSN55So5LiOIGNhc2UgXCJTVFlMRVwiIOWujOWFqOS4gOiHtOeahOWkhOeQhua1geeoi++8muWFiOeUqCBjc3NMb2FkZXIg5pS55YaZXG4gICAgICAgICAgLy8g5b2T5YmN5YaF5a6577yM5YaNIHBhdGNoU3R5bGVzaGVldEVsZW1lbnQg5oqK5Yqr5oyB6YCS5b2S6KOF5Yiw5pawIHN0eWxlIOS4iuOAglxuICAgICAgICAgIGNvbnN0IHN0eWxlc2hlZXRFbGVtZW50ID0gZWxlbWVudCBhcyBIVE1MU3R5bGVFbGVtZW50O1xuICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBzdHlsZXNoZWV0RWxlbWVudC5pbm5lckhUTUw7XG4gICAgICAgICAgaWYgKGNvbnRlbnQpIHN0eWxlc2hlZXRFbGVtZW50LmlubmVySFRNTCA9IGNzc0xvYWRlcihjb250ZW50LCBcIlwiLCBjdXJVcmwpO1xuICAgICAgICAgIGNvbnN0IHJlcyA9IHJhd0luc2VydEFkamFjZW50RWxlbWVudC5jYWxsKHRoaXMsIHBvc2l0aW9uLCBlbGVtZW50KTtcbiAgICAgICAgICBzYW5kYm94LnN0eWxlU2hlZXRFbGVtZW50cy5wdXNoKHN0eWxlc2hlZXRFbGVtZW50KTtcbiAgICAgICAgICBwYXRjaFN0eWxlc2hlZXRFbGVtZW50KHN0eWxlc2hlZXRFbGVtZW50LCBjc3NMb2FkZXIsIHNhbmRib3gsIGN1clVybCk7XG4gICAgICAgICAgaGFuZGxlU3R5bGVzaGVldEVsZW1lbnRQYXRjaChzdHlsZXNoZWV0RWxlbWVudCwgc2FuZGJveCk7XG4gICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSBlbHNlIHJldHVybiByYXdJbnNlcnRBZGphY2VudEVsZW1lbnQuY2FsbCh0aGlzLCBwb3NpdGlvbiwgZWxlbWVudCk7XG4gICAgICB9LFxuICAgIH0sXG4gICAgX2hhc1BhdGNoU3R5bGU6IHsgZ2V0OiAoKSA9PiB0cnVlIH0sXG4gIH0pO1xufVxuXG4vLyBocmVmIOW7tui/n+i1i+WAvOeahOWFnOW6lei2heaXtu+8iOavq+enku+8ie+8mui2hei/h+ivpeaXtumXtOS7jeacquaLv+WIsCBocmVm77yM5YiZ5pS+5byD55uR5ZCs5bm26Kem5Y+RIGVycm9y77yMXG4vLyDpmLLmraLjgIxocmVmIOawuOS4jeWIsOi+vuOAjeaXtiBvYnNlcnZlciDpl63ljIXplb/mnJ/pkonkvY/lrZDlupTnlKjkuIrkuIvmlofjgILmsr/nlKggdGlueW1jZSBtYXhMb2FkVGltZSDph4/nuqfjgIJcbmNvbnN0IERFRkVSX1NUWUxFX0hSRUZfVElNRU9VVCA9IDUwMDA7XG5cbi8qKlxuICog5aSE55CG44CM5YWIIGFwcGVuZENoaWxkKGxpbmspIOWQjiBzZXRBdHRyaWJ1dGUoJ2hyZWYnKeOAjeeahOW7tui/nyBocmVmIOWcuuaZr+OAglxuICpcbiAqIOmAmui/hyBNdXRhdGlvbk9ic2VydmVyIOebkeWQrCBocmVmIOWxnuaAp+i1i+WAvO+8jOWRveS4reWQjui1sOS8oOWFpeeahCBsb2FkU3R5bGVTaGVldCDlrozmiJDliqDovb3jgIJcbiAqIOeUn+WRveWRqOacn+euoeeQhu+8iOmBv+WFjeWGheWtmOazhOa8j++8ie+8mlxuICogICAxLiDlkb3kuK0gLyDotoXml7YgLyDlrZDlupTnlKjlt7LplIDmr4Eg5pe256uL5Y2zIGRpc2Nvbm5lY3Qg5bm25LuOIHNhbmRib3gg5Ye66Zif77ybXG4gKiAgIDIuIG9ic2VydmVyIOeZu+iusOWIsCBzYW5kYm94LmRlZmVycmVkU3R5bGVPYnNlcnZlcnPvvIxkZXN0cm95IOmYtuautee7n+S4gOWFnOW6lSBkaXNjb25uZWN077ybXG4gKiAgIDMuIOWbnuiwg+WGhemAmui/hyB3dWppZUlkIOWKqOaAgeiOt+WPliBzYW5kYm9477yM5LiN5o2V6I63IHNhbmRib3gvaWZyYW1l77yM5a2Q5bqU55So6ZSA5q+B5ZCO6Zet5YyF5LiN5YaNIHBpbiDkuIrkuIvmlofjgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlZmVyU3R5bGVTaGVldEJ5SHJlZihvcHRzOiB7XG4gIGVsZW1lbnQ6IEhUTUxMaW5rRWxlbWVudDtcbiAgd3VqaWVJZDogc3RyaW5nO1xuICBpZnJhbWVXaW5kb3c6IFdpbmRvdztcbiAgbG9hZFN0eWxlU2hlZXQ6IChocmVmOiBzdHJpbmcsIGVsZW1lbnQ6IEhUTUxMaW5rRWxlbWVudCkgPT4gdm9pZDtcbn0pOiB2b2lkIHtcbiAgbGV0IHsgZWxlbWVudCB9ID0gb3B0cztcbiAgY29uc3QgeyB3dWppZUlkLCBpZnJhbWVXaW5kb3csIGxvYWRTdHlsZVNoZWV0IH0gPSBvcHRzO1xuICAvLyDpg6jliIbnjq/looPvvIhqc2RvbSAvIOiAgea1j+iniOWZqO+8ieWPr+iDveS4jeaUr+aMgSBNdXRhdGlvbk9ic2VydmVy77yM55u05o6l5pS+5byD5bu26L+f5aSE55CGXG4gIGNvbnN0IE11dGF0aW9uT2JzZXJ2ZXJDdG9yID0gKGlmcmFtZVdpbmRvdyBhcyBhbnkpLk11dGF0aW9uT2JzZXJ2ZXI7XG4gIGlmICh0eXBlb2YgTXV0YXRpb25PYnNlcnZlckN0b3IgIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuO1xuXG4gIGxldCBzZXR0bGVkID0gZmFsc2U7XG4gIGxldCB0aW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCBudWxsID0gbnVsbDtcbiAgY29uc3Qgb2JzZXJ2ZXI6IE11dGF0aW9uT2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlckN0b3IoKCkgPT4ge1xuICAgIGlmIChzZXR0bGVkKSByZXR1cm47XG4gICAgY29uc3QgYXR0ckhyZWYgPSBlbGVtZW50Py5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpO1xuICAgIGlmICghYXR0ckhyZWYpIHJldHVybjtcbiAgICBjb25zdCByZWFsSHJlZiA9IGVsZW1lbnQuaHJlZiB8fCBhdHRySHJlZjtcbiAgICBjb25zdCB0YXJnZXQgPSBlbGVtZW50O1xuICAgIGZpbmFsaXplKCgpID0+IHRhcmdldCAmJiBsb2FkU3R5bGVTaGVldChyZWFsSHJlZiwgdGFyZ2V0KSk7XG4gIH0pO1xuXG4gIC8vIOe7n+S4gOaUtuWwvu+8mmRpc2Nvbm5lY3QgKyDlh7rpmJ8gKyDmuIXnkIblrprml7blmajvvIzlho3miafooYzmlLblsL7liqjkvZxcbiAgZnVuY3Rpb24gZmluYWxpemUoYWN0aW9uPzogKCkgPT4gdm9pZCkge1xuICAgIGlmIChzZXR0bGVkKSByZXR1cm47XG4gICAgc2V0dGxlZCA9IHRydWU7XG4gICAgaWYgKHRpbWVyICE9PSBudWxsKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgdGltZXIgPSBudWxsO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgIC8qIG5vb3AgKi9cbiAgICB9XG4gICAgLy8g5Yqo5oCB6I635Y+WIHNhbmRib3jvvIzlrZDlupTnlKjplIDmr4HlkI7nm7TmjqXmlL7miYvvvIzpl63ljIXkuI3lho3pkonkvY/kuIrkuIvmlodcbiAgICBjb25zdCBzYW5kYm94ID0gZ2V0V3VqaWVCeUlkKHd1amllSWQpO1xuICAgIGNvbnN0IG9ic2VydmVycyA9IHNhbmRib3g/LmRlZmVycmVkU3R5bGVPYnNlcnZlcnM7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkob2JzZXJ2ZXJzKSkge1xuICAgICAgY29uc3QgaW5kZXggPSBvYnNlcnZlcnMuaW5kZXhPZihvYnNlcnZlcik7XG4gICAgICBpZiAoaW5kZXggIT09IC0xKSBvYnNlcnZlcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgaWYgKHNhbmRib3gpIGFjdGlvbj8uKCk7XG4gICAgZWxlbWVudCA9IG51bGw7XG4gIH1cblxuICBjb25zdCBzYW5kYm94ID0gZ2V0V3VqaWVCeUlkKHd1amllSWQpO1xuICAvLyDlrZDlupTnlKjlt7LkuI3lrZjlnKjliJnml6DpnIDnm5HlkKxcbiAgaWYgKCFzYW5kYm94IHx8ICFBcnJheS5pc0FycmF5KHNhbmRib3guZGVmZXJyZWRTdHlsZU9ic2VydmVycykpIHJldHVybjtcbiAgc2FuZGJveC5kZWZlcnJlZFN0eWxlT2JzZXJ2ZXJzLnB1c2gob2JzZXJ2ZXIpO1xuICBvYnNlcnZlci5vYnNlcnZlKGVsZW1lbnQsIHsgYXR0cmlidXRlczogdHJ1ZSwgYXR0cmlidXRlRmlsdGVyOiBbXCJocmVmXCJdIH0pO1xuICAvLyDotoXml7blhZzlupXvvJrplb/ml7bpl7TmsqHnrYnliLAgaHJlZu+8jOaUvuW8g+ebkeWQrOW5tuinpuWPkSBlcnJvcu+8jOiuqeS4iua4uO+8iOWmgiB0aW55bWNl77yJ55qE5aSx6LSl5Zue6LCD5pS25bC+XG4gIHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgY29uc3QgdGFyZ2V0ID0gZWxlbWVudDtcbiAgICBmaW5hbGl6ZSgpO1xuICAgIGlmICh0YXJnZXQpIG1hbnVhbEludm9rZUVsZW1lbnRFdmVudCh0YXJnZXQsIFwiZXJyb3JcIik7XG4gIH0sIERFRkVSX1NUWUxFX0hSRUZfVElNRU9VVCk7XG59XG5cbmxldCBkeW5hbWljU2NyaXB0RXhlY1N0YWNrID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5mdW5jdGlvbiByZXdyaXRlQXBwZW5kT3JJbnNlcnRDaGlsZChvcHRzOiB7XG4gIHJhd0RPTUFwcGVuZE9ySW5zZXJ0QmVmb3JlOiA8VCBleHRlbmRzIE5vZGU+KG5ld0NoaWxkOiBULCByZWZDaGlsZD86IE5vZGUgfCBudWxsKSA9PiBUO1xuICB3dWppZUlkOiBzdHJpbmc7XG59KSB7XG4gIHJldHVybiBmdW5jdGlvbiBhcHBlbmRDaGlsZE9ySW5zZXJ0QmVmb3JlPFQgZXh0ZW5kcyBOb2RlPihcbiAgICB0aGlzOiBIVE1MSGVhZEVsZW1lbnQgfCBIVE1MQm9keUVsZW1lbnQsXG4gICAgbmV3Q2hpbGQ6IFQsXG4gICAgcmVmQ2hpbGQ/OiBOb2RlIHwgbnVsbFxuICApIHtcbiAgICBsZXQgZWxlbWVudCA9IG5ld0NoaWxkIGFzIGFueTtcbiAgICBjb25zdCB7IHJhd0RPTUFwcGVuZE9ySW5zZXJ0QmVmb3JlLCB3dWppZUlkIH0gPSBvcHRzO1xuICAgIGNvbnN0IHNhbmRib3ggPSBnZXRXdWppZUJ5SWQod3VqaWVJZCk7XG5cbiAgICBjb25zdCB7IHN0eWxlU2hlZXRFbGVtZW50cywgcmVwbGFjZSwgZmV0Y2gsIHBsdWdpbnMsIGlmcmFtZSwgbGlmZWN5Y2xlcywgcHJveHlMb2NhdGlvbiwgZmliZXIgfSA9IHNhbmRib3g7XG5cbiAgICBpZiAoIWlzSGlqYWNraW5nVGFnKGVsZW1lbnQudGFnTmFtZSkgfHwgIXd1amllSWQpIHtcbiAgICAgIGNvbnN0IHJlcyA9IHJhd0RPTUFwcGVuZE9ySW5zZXJ0QmVmb3JlLmNhbGwodGhpcywgZWxlbWVudCwgcmVmQ2hpbGQpIGFzIFQ7XG4gICAgICBwYXRjaEVsZW1lbnRFZmZlY3QoZWxlbWVudCwgaWZyYW1lLmNvbnRlbnRXaW5kb3cpO1xuICAgICAgZXhlY0hvb2tzKHBsdWdpbnMsIFwiYXBwZW5kT3JJbnNlcnRFbGVtZW50SG9va1wiLCBlbGVtZW50LCBpZnJhbWUuY29udGVudFdpbmRvdyk7XG4gICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIGNvbnN0IGlmcmFtZURvY3VtZW50ID0gaWZyYW1lLmNvbnRlbnREb2N1bWVudDtcbiAgICBjb25zdCBjdXJVcmwgPSBnZXRDdXJVcmwocHJveHlMb2NhdGlvbik7XG5cbiAgICAvLyBUT0RPIOi/h+a7pOWPr+S7peW8gOaUvlxuICAgIGlmIChlbGVtZW50LnRhZ05hbWUpIHtcbiAgICAgIHN3aXRjaCAoZWxlbWVudC50YWdOYW1lPy50b1VwcGVyQ2FzZSgpKSB7XG4gICAgICAgIGNhc2UgXCJMSU5LXCI6IHtcbiAgICAgICAgICBjb25zdCB7IGhyZWYsIHJlbCwgdHlwZSB9ID0gZWxlbWVudCBhcyBIVE1MTGlua0VsZW1lbnQ7XG4gICAgICAgICAgY29uc3Qgc3R5bGVGbGFnID0gcmVsID09PSBcInN0eWxlc2hlZXRcIiB8fCB0eXBlID09PSBcInRleHQvY3NzXCIgfHwgaHJlZi5lbmRzV2l0aChcIi5jc3NcIik7XG4gICAgICAgICAgLy8g6Z2eIHN0eWxlc2hlZXQg5LiN5YGa5aSE55CGXG4gICAgICAgICAgaWYgKCFzdHlsZUZsYWcpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IHJhd0RPTUFwcGVuZE9ySW5zZXJ0QmVmb3JlLmNhbGwodGhpcywgZWxlbWVudCwgcmVmQ2hpbGQpO1xuICAgICAgICAgICAgZXhlY0hvb2tzKHBsdWdpbnMsIFwiYXBwZW5kT3JJbnNlcnRFbGVtZW50SG9va1wiLCBlbGVtZW50LCBpZnJhbWUuY29udGVudFdpbmRvdyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIOaLieWPliBjc3Mg5YaF5a655bm25LulIDxzdHlsZT4g5rOo5YWl5a2Q5bqU55So44CB5Zue6LCDIGxpbmsg55qEIGxvYWQvZXJyb3Ig5LqL5Lu244CCXG4gICAgICAgICAgLy8g5oq95oiQ6Zet5YyF5Lul5L6/44CMYXBwZW5kIOaXtuW3suaciSBocmVm44CN5LiO44CMYXBwZW5kIOWQjuaJjSBzZXRBdHRyaWJ1dGUoJ2hyZWYnKeOAjeS4pOadoei3r+W+hOWkjeeUqOOAglxuICAgICAgICAgIGNvbnN0IGxvYWRTdHlsZVNoZWV0ID0gKHJlYWxIcmVmOiBzdHJpbmcsIGxpbmtFbGVtZW50OiBIVE1MTGlua0VsZW1lbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dHJIcmVmID0gbGlua0VsZW1lbnQuZ2V0QXR0cmlidXRlKFwiaHJlZlwiKTtcbiAgICAgICAgICAgIGNvbnN0IHN0eWxlSHJlZiA9IGF0dHJIcmVmID8gZ2V0QWJzb2x1dGVQYXRoKGF0dHJIcmVmLCAocHJveHlMb2NhdGlvbiBhcyBMb2NhdGlvbikuaHJlZikgOiByZWFsSHJlZjtcbiAgICAgICAgICAgIGNvbnN0IGV4Y2x1ZGUgPSBpc01hdGNoVXJsKHN0eWxlSHJlZiwgZ2V0RWZmZWN0TG9hZGVycyhcImNzc0V4Y2x1ZGVzXCIsIHBsdWdpbnMpKTtcbiAgICAgICAgICAgIGlmICghc3R5bGVIcmVmIHx8IGV4Y2x1ZGUpIHJldHVybjtcblxuICAgICAgICAgICAgLy8g56uL5Y2z5Yib5bu65Y2g5L2NIDxzdHlsZT4g5YWD57Sg77yM6YG/5YWN5byC5q2l5Yqg6L295pyf6Ze06YeN5aSN5o+S5YWlXG4gICAgICAgICAgICAvLyDkv53nlZnljp/lp4sgbGluayDnmoTlsZ7mgKfvvIjlpoIgY2xhc3PvvInvvIzku6Xkvr8gY2hlY2tMaW5rQW5kTG9hZCDnrYnljrvph43pgLvovpHog73mib7liLBcbiAgICAgICAgICAgIGNvbnN0IHJhd0F0dHJzID0gcGFyc2VUYWdBdHRyaWJ1dGVzKGxpbmtFbGVtZW50Lm91dGVySFRNTCk7XG4gICAgICAgICAgICBjb25zdCBwbGFjZWhvbGRlckVsZW1lbnQgPSBpZnJhbWVEb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG4gICAgICAgICAgICBzZXRBdHRyc1RvRWxlbWVudChwbGFjZWhvbGRlckVsZW1lbnQsIHJhd0F0dHJzKTtcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyRWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJkYXRhLXd1amllLWNzcy1ocmVmXCIsIHN0eWxlSHJlZik7XG4gICAgICAgICAgICByYXdET01BcHBlbmRPckluc2VydEJlZm9yZS5jYWxsKHRoaXMsIHBsYWNlaG9sZGVyRWxlbWVudCwgcmVmQ2hpbGQpO1xuXG4gICAgICAgICAgICBnZXRFeHRlcm5hbFN0eWxlU2hlZXRzKFxuICAgICAgICAgICAgICBbeyBzcmM6IHN0eWxlSHJlZiwgaWdub3JlOiBpc01hdGNoVXJsKHN0eWxlSHJlZiwgZ2V0RWZmZWN0TG9hZGVycyhcImNzc0lnbm9yZXNcIiwgcGx1Z2lucykpIH1dLFxuICAgICAgICAgICAgICBmZXRjaCxcbiAgICAgICAgICAgICAgbGlmZWN5Y2xlcy5sb2FkRXJyb3JcbiAgICAgICAgICAgICkuZm9yRWFjaCgoeyBzcmMsIGlnbm9yZSwgY29udGVudFByb21pc2UgfSkgPT5cbiAgICAgICAgICAgICAgY29udGVudFByb21pc2UudGhlbihcbiAgICAgICAgICAgICAgICAoY29udGVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgaWYgKGlnbm9yZSAmJiBzcmMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5b+955Wl55qE5YWD57Sg5bqU6K+l55u05o6l5oqK5a+55bqU5YWD57Sg5o+S5YWl77yM6ICM5LiN5piv55So5paw55qEIGxpbmsg5qCH562+6L+b6KGM5pu/5Luj5o+S5YWl77yM5L+d6K+BIGVsZW1lbnQg55qE5LiK5LiL5paH5q2j5bi4XG4gICAgICAgICAgICAgICAgICAgIC8vIOenu+mZpOWNoOS9jeWFg+e0oO+8jOaPkuWFpeWOn+WniyBsaW5rXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyRWxlbWVudC5wYXJlbnROb2RlPy5yZW1vdmVDaGlsZChwbGFjZWhvbGRlckVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICByYXdET01BcHBlbmRPckluc2VydEJlZm9yZS5jYWxsKHRoaXMsIGxpbmtFbGVtZW50LCByZWZDaGlsZCk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyDloavlhYUgQ1NTIOWGheWuueWIsOWNoOS9jeWFg+e0oFxuICAgICAgICAgICAgICAgICAgICAvLyDlpITnkIZjc3MtbG9hZGVy5o+S5Lu2XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNzc0xvYWRlciA9IGdldENzc0xvYWRlcih7IHBsdWdpbnMsIHJlcGxhY2UgfSk7XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyRWxlbWVudC5pbm5lckhUTUwgPSBjc3NMb2FkZXIoY29udGVudCwgc3JjLCBjdXJVcmwpO1xuICAgICAgICAgICAgICAgICAgICBzdHlsZVNoZWV0RWxlbWVudHMucHVzaChwbGFjZWhvbGRlckVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICAvLyDlpITnkIbmoLflvI/ooaXkuIFcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlU3R5bGVzaGVldEVsZW1lbnRQYXRjaChwbGFjZWhvbGRlckVsZW1lbnQsIHNhbmRib3gpO1xuICAgICAgICAgICAgICAgICAgICBtYW51YWxJbnZva2VFbGVtZW50RXZlbnQobGlua0VsZW1lbnQsIFwibG9hZFwiKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGlmIChlbGVtZW50ID09PSBsaW5rRWxlbWVudCkgZWxlbWVudCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBtYW51YWxJbnZva2VFbGVtZW50RXZlbnQobGlua0VsZW1lbnQsIFwiZXJyb3JcIik7XG4gICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudCA9PT0gbGlua0VsZW1lbnQpIGVsZW1lbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgaWYgKGhyZWYpIHtcbiAgICAgICAgICAgIC8vIOaOkumZpGNzc1xuICAgICAgICAgICAgaWYgKCFpc01hdGNoVXJsKGhyZWYsIGdldEVmZmVjdExvYWRlcnMoXCJjc3NFeGNsdWRlc1wiLCBwbHVnaW5zKSkpIHtcbiAgICAgICAgICAgICAgbG9hZFN0eWxlU2hlZXQoaHJlZiwgZWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOWFs+iBlCBpc3N1ZTogaHR0cHM6Ly9naXRodWIuY29tL1RlbmNlbnQvd3VqaWUvaXNzdWVzLzIyNCBodHRwczovL2dpdGh1Yi5jb20vVGVuY2VudC93dWppZS9pc3N1ZXMvOTc0XG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8g6YOo5YiG5bqT77yI5aaCIHRpbnltY2Ug55qEIFN0eWxlU2hlZXRMb2FkZXLvvInlhYggYXBwZW5kQ2hpbGQobGluaykg5YaNXG4gICAgICAgICAgICAvLyBzZXRBdHRyaWJ1dGUoJ2hyZWYnLCB1cmwp44CC5q2k5pe2IGhyZWYg5Li656m677yM6Iul55u05o6l5Lii5byD5YiZ6K+l5qC35byP5rC46L+c5LiN5Lya6KKr5Yqg6L2977yMXG4gICAgICAgICAgICAvLyDlkI7nu63lnKjmuLjnprsgbGluayDkuIrorr7nva4gaHJlZiDkuZ/kuI3kvJrop6blj5HmtY/op4jlmajliqDovb3vvIxza2luLm1pbi5jc3Mg562J6LWE5rqQ57y65aSx44CCXG4gICAgICAgICAgICAvLyDov5nph4znm5HlkKwgaHJlZiDnmoTlkI7nu63otYvlgLzvvIzmi7/liLDnnJ/lrp4gaHJlZiDlkI7lho3otbDkuI7kuIrpnaLlrozlhajkuIDoh7TnmoTliqDovb3mtYHnqIvjgIJcbiAgICAgICAgICAgIGRlZmVyU3R5bGVTaGVldEJ5SHJlZih7IGVsZW1lbnQsIHd1amllSWQsIGlmcmFtZVdpbmRvdzogaWZyYW1lLmNvbnRlbnRXaW5kb3csIGxvYWRTdHlsZVNoZWV0IH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGNvbW1lbnQgPSBpZnJhbWVEb2N1bWVudC5jcmVhdGVDb21tZW50KGBkeW5hbWljIGxpbmsgJHtocmVmfSByZXBsYWNlZCBieSB3dWppZWApO1xuICAgICAgICAgIHJldHVybiByYXdET01BcHBlbmRPckluc2VydEJlZm9yZS5jYWxsKHRoaXMsIGNvbW1lbnQsIHJlZkNoaWxkKTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiU1RZTEVcIjoge1xuICAgICAgICAgIGNvbnN0IHN0eWxlc2hlZXRFbGVtZW50OiBIVE1MU3R5bGVFbGVtZW50ID0gbmV3Q2hpbGQgYXMgYW55O1xuICAgICAgICAgIHN0eWxlU2hlZXRFbGVtZW50cy5wdXNoKHN0eWxlc2hlZXRFbGVtZW50KTtcbiAgICAgICAgICBjb25zdCBjb250ZW50ID0gc3R5bGVzaGVldEVsZW1lbnQuaW5uZXJIVE1MO1xuICAgICAgICAgIGNvbnN0IGNzc0xvYWRlciA9IGdldENzc0xvYWRlcih7IHBsdWdpbnMsIHJlcGxhY2UgfSk7XG4gICAgICAgICAgY29udGVudCAmJiAoc3R5bGVzaGVldEVsZW1lbnQuaW5uZXJIVE1MID0gY3NzTG9hZGVyKGNvbnRlbnQsIFwiXCIsIGN1clVybCkpO1xuICAgICAgICAgIGNvbnN0IHJlcyA9IHJhd0RPTUFwcGVuZE9ySW5zZXJ0QmVmb3JlLmNhbGwodGhpcywgZWxlbWVudCwgcmVmQ2hpbGQpO1xuICAgICAgICAgIC8vIOWkhOeQhuagt+W8j+ihpeS4gVxuICAgICAgICAgIHBhdGNoU3R5bGVzaGVldEVsZW1lbnQoc3R5bGVzaGVldEVsZW1lbnQsIGNzc0xvYWRlciwgc2FuZGJveCwgY3VyVXJsKTtcbiAgICAgICAgICBoYW5kbGVTdHlsZXNoZWV0RWxlbWVudFBhdGNoKHN0eWxlc2hlZXRFbGVtZW50LCBzYW5kYm94KTtcbiAgICAgICAgICBleGVjSG9va3MocGx1Z2lucywgXCJhcHBlbmRPckluc2VydEVsZW1lbnRIb29rXCIsIGVsZW1lbnQsIGlmcmFtZS5jb250ZW50V2luZG93KTtcbiAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJTQ1JJUFRcIjoge1xuICAgICAgICAgIHNldFRhZ1RvU2NyaXB0KGVsZW1lbnQpO1xuICAgICAgICAgIGNvbnN0IHsgc3JjLCB0ZXh0LCB0eXBlLCBjcm9zc09yaWdpbiB9ID0gZWxlbWVudCBhcyBIVE1MU2NyaXB0RWxlbWVudDtcbiAgICAgICAgICAvLyDmjpLpmaRqc1xuICAgICAgICAgIGlmIChzcmMgJiYgIWlzTWF0Y2hVcmwoc3JjLCBnZXRFZmZlY3RMb2FkZXJzKFwianNFeGNsdWRlc1wiLCBwbHVnaW5zKSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGV4ZWNTY3JpcHQgPSAoc2NyaXB0UmVzdWx0OiBTY3JpcHRPYmplY3QpID0+IHtcbiAgICAgICAgICAgICAgLy8g5YGH5aaC5a2Q5bqU55So6KKr6L+e57ut5riy5p+T5Lik5qyh77yM5Lik5qyh5riy5p+T5Lya5a+86Ie05aSE55CG5rWB56iL55qE5Lqk5Y+J5rGh5p+TXG4gICAgICAgICAgICAgIGlmIChzYW5kYm94LmlmcmFtZSA9PT0gbnVsbCkgcmV0dXJuIHdhcm4oV1VKSUVfVElQU19SRVBFQVRfUkVOREVSKTtcbiAgICAgICAgICAgICAgY29uc3Qgb25sb2FkID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIG1hbnVhbEludm9rZUVsZW1lbnRFdmVudChlbGVtZW50LCBcImxvYWRcIik7XG4gICAgICAgICAgICAgICAgZWxlbWVudCA9IG51bGw7XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIGluc2VydFNjcmlwdFRvSWZyYW1lKHsgLi4uc2NyaXB0UmVzdWx0LCBvbmxvYWQgfSwgc2FuZGJveC5pZnJhbWUuY29udGVudFdpbmRvdywgZWxlbWVudCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3Qgc2NyaXB0T3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgc3JjLFxuICAgICAgICAgICAgICBtb2R1bGU6IHR5cGUgPT09IFwibW9kdWxlXCIsXG4gICAgICAgICAgICAgIGNyb3Nzb3JpZ2luOiBjcm9zc09yaWdpbiAhPT0gbnVsbCxcbiAgICAgICAgICAgICAgY3Jvc3NvcmlnaW5UeXBlOiBjcm9zc09yaWdpbiB8fCBcIlwiLFxuICAgICAgICAgICAgICBpZ25vcmU6IGlzTWF0Y2hVcmwoc3JjLCBnZXRFZmZlY3RMb2FkZXJzKFwianNJZ25vcmVzXCIsIHBsdWdpbnMpKSxcbiAgICAgICAgICAgICAgYXR0cnM6IHBhcnNlVGFnQXR0cmlidXRlcyhlbGVtZW50Lm91dGVySFRNTCksXG4gICAgICAgICAgICB9IGFzIFNjcmlwdE9iamVjdDtcbiAgICAgICAgICAgIGdldEV4dGVybmFsU2NyaXB0cyhbc2NyaXB0T3B0aW9uc10sIGZldGNoLCBsaWZlY3ljbGVzLmxvYWRFcnJvciwgZmliZXIpLmZvckVhY2goKHNjcmlwdFJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICBkeW5hbWljU2NyaXB0RXhlY1N0YWNrID0gZHluYW1pY1NjcmlwdEV4ZWNTdGFjay50aGVuKCgpID0+XG4gICAgICAgICAgICAgICAgc2NyaXB0UmVzdWx0LmNvbnRlbnRQcm9taXNlLnRoZW4oXG4gICAgICAgICAgICAgICAgICAoY29udGVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2FuZGJveC5leGVjUXVldWUgPT09IG51bGwpIHJldHVybiB3YXJuKFdVSklFX1RJUFNfUkVQRUFUX1JFTkRFUik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4ZWNRdWV1ZUxlbmd0aCA9IHNhbmRib3guZXhlY1F1ZXVlPy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIHNhbmRib3guZXhlY1F1ZXVlLnB1c2goKCkgPT5cbiAgICAgICAgICAgICAgICAgICAgICBmaWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgPyBzYW5kYm94LnJlcXVlc3RJZGxlQ2FsbGJhY2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWNTY3JpcHQoeyAuLi5zY3JpcHRSZXN1bHQsIGNvbnRlbnQgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGV4ZWNTY3JpcHQoeyAuLi5zY3JpcHRSZXN1bHQsIGNvbnRlbnQgfSlcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgLy8g5ZCM5q2l6ISa5pys5aaC5p6c6YO95omn6KGM5a6M5LqG77yM6ZyA6KaB5omL5Yqo6Kem5Y+R5omn6KGMXG4gICAgICAgICAgICAgICAgICAgIGlmICghZXhlY1F1ZXVlTGVuZ3RoKSBzYW5kYm94LmV4ZWNRdWV1ZS5zaGlmdCgpKCk7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBtYW51YWxJbnZva2VFbGVtZW50RXZlbnQoZWxlbWVudCwgXCJlcnJvclwiKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGV4ZWNRdWV1ZUxlbmd0aCA9IHNhbmRib3guZXhlY1F1ZXVlPy5sZW5ndGg7XG4gICAgICAgICAgICBzYW5kYm94LmV4ZWNRdWV1ZS5wdXNoKCgpID0+XG4gICAgICAgICAgICAgIGZpYmVyXG4gICAgICAgICAgICAgICAgPyBzYW5kYm94LnJlcXVlc3RJZGxlQ2FsbGJhY2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpbnNlcnRTY3JpcHRUb0lmcmFtZShcbiAgICAgICAgICAgICAgICAgICAgICB7IHNyYzogbnVsbCwgY29udGVudDogdGV4dCwgYXR0cnM6IHBhcnNlVGFnQXR0cmlidXRlcyhlbGVtZW50Lm91dGVySFRNTCkgfSxcbiAgICAgICAgICAgICAgICAgICAgICBzYW5kYm94LmlmcmFtZS5jb250ZW50V2luZG93LFxuICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgOiBpbnNlcnRTY3JpcHRUb0lmcmFtZShcbiAgICAgICAgICAgICAgICAgICAgeyBzcmM6IG51bGwsIGNvbnRlbnQ6IHRleHQsIGF0dHJzOiBwYXJzZVRhZ0F0dHJpYnV0ZXMoZWxlbWVudC5vdXRlckhUTUwpIH0sXG4gICAgICAgICAgICAgICAgICAgIHNhbmRib3guaWZyYW1lLmNvbnRlbnRXaW5kb3csXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAoIWV4ZWNRdWV1ZUxlbmd0aCkgc2FuZGJveC5leGVjUXVldWUuc2hpZnQoKSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBpbmxpbmUgc2NyaXB0IG5ldmVyIHRyaWdnZXIgdGhlIG9ubG9hZCBhbmQgb25lcnJvciBldmVudFxuICAgICAgICAgIGNvbnN0IGNvbW1lbnQgPSBpZnJhbWVEb2N1bWVudC5jcmVhdGVDb21tZW50KGBkeW5hbWljIHNjcmlwdCAke3NyY30gcmVwbGFjZWQgYnkgd3VqaWVgKTtcbiAgICAgICAgICByZXR1cm4gcmF3RE9NQXBwZW5kT3JJbnNlcnRCZWZvcmUuY2FsbCh0aGlzLCBjb21tZW50LCByZWZDaGlsZCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8g5L+u5q2j5a2Q5bqU55So5YaF6YOoaWZyYW1l55qEd2luZG93LnBhcmVudOaMh+WQkVxuICAgICAgICBjYXNlIFwiSUZSQU1FXCI6IHtcbiAgICAgICAgICAvLyDltYzlpZfnmoTlrZDlupTnlKjnmoRqcy1pZnJhbWXpnIDopoHmj5LlhaXlrZDlupTnlKjnmoRqcy1pZnJhbWXlhoXpg6hcbiAgICAgICAgICBpZiAoZWxlbWVudC5nZXRBdHRyaWJ1dGUoV1VKSUVfREFUQV9GTEFHKSA9PT0gXCJcIikge1xuICAgICAgICAgICAgcmV0dXJuIHJhd0FwcGVuZENoaWxkLmNhbGwocmF3RG9jdW1lbnRRdWVyeVNlbGVjdG9yLmNhbGwodGhpcy5vd25lckRvY3VtZW50LCBcImh0bWxcIiksIGVsZW1lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCByZXMgPSByYXdET01BcHBlbmRPckluc2VydEJlZm9yZS5jYWxsKHRoaXMsIGVsZW1lbnQsIHJlZkNoaWxkKTtcbiAgICAgICAgICBleGVjSG9va3MocGx1Z2lucywgXCJhcHBlbmRPckluc2VydEVsZW1lbnRIb29rXCIsIGVsZW1lbnQsIGlmcmFtZS5jb250ZW50V2luZG93KTtcbiAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBmaW5kU2NyaXB0RWxlbWVudEZyb21JZnJhbWUocmF3RWxlbWVudDogSFRNTFNjcmlwdEVsZW1lbnQsIHd1amllSWQ6IHN0cmluZykge1xuICBjb25zdCB3dWppZVRhZyA9IGdldFRhZ0Zyb21TY3JpcHQocmF3RWxlbWVudCk7XG4gIGNvbnN0IHNhbmRib3ggPSBnZXRXdWppZUJ5SWQod3VqaWVJZCk7XG4gIGNvbnN0IHsgaWZyYW1lIH0gPSBzYW5kYm94O1xuICBjb25zdCB0YXJnZXRTY3JpcHQgPSBpZnJhbWUuY29udGVudFdpbmRvdy5fX1dVSklFX1JBV19ET0NVTUVOVF9IRUFEX18ucXVlcnlTZWxlY3RvcihcbiAgICBgc2NyaXB0WyR7V1VKSUVfU0NSSVBUX0lEfT0nJHt3dWppZVRhZ30nXWBcbiAgKTtcbiAgaWYgKHRhcmdldFNjcmlwdCA9PT0gbnVsbCkge1xuICAgIHdhcm4oV1VKSUVfVElQU19OT19TQ1JJUFQsIGA8c2NyaXB0ICR7V1VKSUVfU0NSSVBUX0lEfT0nJHt3dWppZVRhZ30nLz5gKTtcbiAgfVxuICByZXR1cm4geyB0YXJnZXRTY3JpcHQsIGlmcmFtZSB9O1xufVxuXG5mdW5jdGlvbiByZXdyaXRlQ29udGFpbnMob3B0czogeyByYXdFbGVtZW50Q29udGFpbnM6IChvdGhlcjogTm9kZSB8IG51bGwpID0+IGJvb2xlYW47IHd1amllSWQ6IHN0cmluZyB9KSB7XG4gIHJldHVybiBmdW5jdGlvbiBjb250YWlucyhvdGhlcjogTm9kZSB8IG51bGwpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gb3RoZXIgYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3QgeyByYXdFbGVtZW50Q29udGFpbnMsIHd1amllSWQgfSA9IG9wdHM7XG4gICAgaWYgKGVsZW1lbnQgJiYgaXNTY3JpcHRFbGVtZW50KGVsZW1lbnQpKSB7XG4gICAgICBjb25zdCB7IHRhcmdldFNjcmlwdCB9ID0gZmluZFNjcmlwdEVsZW1lbnRGcm9tSWZyYW1lKGVsZW1lbnQgYXMgSFRNTFNjcmlwdEVsZW1lbnQsIHd1amllSWQpO1xuICAgICAgcmV0dXJuIHRhcmdldFNjcmlwdCAhPT0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHJhd0VsZW1lbnRDb250YWlucyhlbGVtZW50KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmV3cml0ZVJlbW92ZUNoaWxkKG9wdHM6IHsgcmF3RWxlbWVudFJlbW92ZUNoaWxkOiA8VCBleHRlbmRzIE5vZGU+KGNoaWxkOiBUKSA9PiBUOyB3dWppZUlkOiBzdHJpbmcgfSkge1xuICByZXR1cm4gZnVuY3Rpb24gcmVtb3ZlQ2hpbGQoY2hpbGQ6IE5vZGUpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gY2hpbGQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3QgeyByYXdFbGVtZW50UmVtb3ZlQ2hpbGQsIHd1amllSWQgfSA9IG9wdHM7XG4gICAgaWYgKGVsZW1lbnQgJiYgaXNTY3JpcHRFbGVtZW50KGVsZW1lbnQpKSB7XG4gICAgICBjb25zdCB7IHRhcmdldFNjcmlwdCwgaWZyYW1lIH0gPSBmaW5kU2NyaXB0RWxlbWVudEZyb21JZnJhbWUoZWxlbWVudCBhcyBIVE1MU2NyaXB0RWxlbWVudCwgd3VqaWVJZCk7XG4gICAgICBpZiAodGFyZ2V0U2NyaXB0ICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBpZnJhbWUuY29udGVudFdpbmRvdy5fX1dVSklFX1JBV19ET0NVTUVOVF9IRUFEX18ucmVtb3ZlQ2hpbGQodGFyZ2V0U2NyaXB0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gcmF3RWxlbWVudFJlbW92ZUNoaWxkKGVsZW1lbnQpO1xuICB9O1xufVxuXG4vKipcbiAqIOiusOW9lWhlYWTlkoxib2R555qE5LqL5Lu277yM562J6YeN5paw5riy5p+T5aSN55SoaGVhZOWSjGJvZHnml7bpnIDopoHmuIXnqbrkuovku7ZcbiAqL1xuZnVuY3Rpb24gcGF0Y2hFdmVudExpc3RlbmVyKGVsZW1lbnQ6IEhUTUxIZWFkRWxlbWVudCB8IEhUTUxCb2R5RWxlbWVudCkge1xuICBjb25zdCBsaXN0ZW5lck1hcCA9IG5ldyBNYXA8c3RyaW5nLCBFdmVudExpc3RlbmVyT3JFdmVudExpc3RlbmVyT2JqZWN0W10+KCk7XG4gIGVsZW1lbnQuX2NhY2hlTGlzdGVuZXJzID0gbGlzdGVuZXJNYXA7XG5cbiAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyID0gKFxuICAgIHR5cGU6IHN0cmluZyxcbiAgICBsaXN0ZW5lcjogRXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdCxcbiAgICBvcHRpb25zPzogYm9vbGVhbiB8IEFkZEV2ZW50TGlzdGVuZXJPcHRpb25zXG4gICkgPT4ge1xuICAgIGNvbnN0IGxpc3RlbmVycyA9IGxpc3RlbmVyTWFwLmdldCh0eXBlKSB8fCBbXTtcbiAgICBsaXN0ZW5lck1hcC5zZXQodHlwZSwgWy4uLmxpc3RlbmVycywgbGlzdGVuZXJdKTtcbiAgICByZXR1cm4gcmF3QWRkRXZlbnRMaXN0ZW5lci5jYWxsKGVsZW1lbnQsIHR5cGUsIGxpc3RlbmVyLCBvcHRpb25zKTtcbiAgfTtcblxuICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIgPSAoXG4gICAgdHlwZTogc3RyaW5nLFxuICAgIGxpc3RlbmVyOiBFdmVudExpc3RlbmVyT3JFdmVudExpc3RlbmVyT2JqZWN0LFxuICAgIG9wdGlvbnM/OiBib29sZWFuIHwgQWRkRXZlbnRMaXN0ZW5lck9wdGlvbnNcbiAgKSA9PiB7XG4gICAgY29uc3QgdHlwZUxpc3RlbmVycyA9IGxpc3RlbmVyTWFwLmdldCh0eXBlKTtcbiAgICBjb25zdCBpbmRleCA9IHR5cGVMaXN0ZW5lcnM/LmluZGV4T2YobGlzdGVuZXIpO1xuICAgIGlmICh0eXBlTGlzdGVuZXJzPy5sZW5ndGggJiYgaW5kZXggIT09IC0xKSB7XG4gICAgICB0eXBlTGlzdGVuZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICAgIHJldHVybiByYXdSZW1vdmVFdmVudExpc3RlbmVyLmNhbGwoZWxlbWVudCwgdHlwZSwgbGlzdGVuZXIsIG9wdGlvbnMpO1xuICB9O1xufVxuXG4vKipcbiAqIOa4heepumhlYWTlkoxib2R555qE57uR5a6a55qE5LqL5Lu2XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVyKGVsZW1lbnQ6IEhUTUxIZWFkRWxlbWVudCB8IEhUTUxCb2R5RWxlbWVudCkge1xuICBjb25zdCBsaXN0ZW5lck1hcCA9IGVsZW1lbnQuX2NhY2hlTGlzdGVuZXJzO1xuICBbLi4ubGlzdGVuZXJNYXAuZW50cmllcygpXS5mb3JFYWNoKChbdHlwZSwgbGlzdGVuZXJzXSkgPT4ge1xuICAgIGxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4gcmF3UmVtb3ZlRXZlbnRMaXN0ZW5lci5jYWxsKGVsZW1lbnQsIHR5cGUsIGxpc3RlbmVyKSk7XG4gIH0pO1xufVxuXG4vKipcbiAqIHBhdGNoIGhlYWQgYW5kIGJvZHkgaW4gcmVuZGVyXG4gKiBpbnRlcmNlcHQgYXBwZW5kQ2hpbGQgYW5kIGluc2VydEJlZm9yZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hSZW5kZXJFZmZlY3QocmVuZGVyOiBTaGFkb3dSb290IHwgRG9jdW1lbnQsIGlkOiBzdHJpbmcsIGRlZ3JhZGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgLy8g6ZmN57qn5Zy65pmvZG9t5riy5p+T5ZyoaWZyYW1l5Lit77yMaWZyYW1l56e75Yqo5ZCO5LqL5Lu26Ieq5Yqo6ZSA5q+B77yM5LiN6ZyA6KaB6K6w5b2VXG4gIGlmICghZGVncmFkZSkge1xuICAgIHBhdGNoRXZlbnRMaXN0ZW5lcihyZW5kZXIuaGVhZCk7XG4gICAgcGF0Y2hFdmVudExpc3RlbmVyKHJlbmRlci5ib2R5IGFzIEhUTUxCb2R5RWxlbWVudCk7XG4gIH1cblxuICByZW5kZXIuaGVhZC5hcHBlbmRDaGlsZCA9IHJld3JpdGVBcHBlbmRPckluc2VydENoaWxkKHtcbiAgICByYXdET01BcHBlbmRPckluc2VydEJlZm9yZTogcmF3QXBwZW5kQ2hpbGQsXG4gICAgd3VqaWVJZDogaWQsXG4gIH0pIGFzIHR5cGVvZiByYXdBcHBlbmRDaGlsZDtcbiAgcmVuZGVyLmhlYWQuaW5zZXJ0QmVmb3JlID0gcmV3cml0ZUFwcGVuZE9ySW5zZXJ0Q2hpbGQoe1xuICAgIHJhd0RPTUFwcGVuZE9ySW5zZXJ0QmVmb3JlOiByYXdIZWFkSW5zZXJ0QmVmb3JlIGFzIGFueSxcbiAgICB3dWppZUlkOiBpZCxcbiAgfSkgYXMgdHlwZW9mIHJhd0hlYWRJbnNlcnRCZWZvcmU7XG4gIHJlbmRlci5oZWFkLnJlbW92ZUNoaWxkID0gcmV3cml0ZVJlbW92ZUNoaWxkKHtcbiAgICByYXdFbGVtZW50UmVtb3ZlQ2hpbGQ6IHJhd0VsZW1lbnRSZW1vdmVDaGlsZC5iaW5kKHJlbmRlci5oZWFkKSxcbiAgICB3dWppZUlkOiBpZCxcbiAgfSkgYXMgdHlwZW9mIHJhd0VsZW1lbnRSZW1vdmVDaGlsZDtcbiAgcmVuZGVyLmhlYWQuY29udGFpbnMgPSByZXdyaXRlQ29udGFpbnMoe1xuICAgIHJhd0VsZW1lbnRDb250YWluczogcmF3RWxlbWVudENvbnRhaW5zLmJpbmQocmVuZGVyLmhlYWQpLFxuICAgIHd1amllSWQ6IGlkLFxuICB9KSBhcyB0eXBlb2YgcmF3RWxlbWVudENvbnRhaW5zO1xuICByZW5kZXIuY29udGFpbnMgPSByZXdyaXRlQ29udGFpbnMoe1xuICAgIHJhd0VsZW1lbnRDb250YWluczogcmF3RWxlbWVudENvbnRhaW5zLmJpbmQocmVuZGVyKSxcbiAgICB3dWppZUlkOiBpZCxcbiAgfSkgYXMgdHlwZW9mIHJhd0VsZW1lbnRDb250YWlucztcbiAgcmVuZGVyLmJvZHkuYXBwZW5kQ2hpbGQgPSByZXdyaXRlQXBwZW5kT3JJbnNlcnRDaGlsZCh7XG4gICAgcmF3RE9NQXBwZW5kT3JJbnNlcnRCZWZvcmU6IHJhd0FwcGVuZENoaWxkLFxuICAgIHd1amllSWQ6IGlkLFxuICB9KSBhcyB0eXBlb2YgcmF3QXBwZW5kQ2hpbGQ7XG4gIHJlbmRlci5ib2R5Lmluc2VydEJlZm9yZSA9IHJld3JpdGVBcHBlbmRPckluc2VydENoaWxkKHtcbiAgICByYXdET01BcHBlbmRPckluc2VydEJlZm9yZTogcmF3Qm9keUluc2VydEJlZm9yZSBhcyBhbnksXG4gICAgd3VqaWVJZDogaWQsXG4gIH0pIGFzIHR5cGVvZiByYXdCb2R5SW5zZXJ0QmVmb3JlO1xufVxuIl0sIm1hcHBpbmdzIjoiOzs7OztBQUFBLFNBQVNBLHNCQUFzQixFQUFFQyxrQkFBa0IsUUFBUSxTQUFTO0FBQ3BFLFNBQ0VDLFlBQVksRUFDWkMsY0FBYyxFQUNkQyxrQkFBa0IsRUFDbEJDLHFCQUFxQixFQUNyQkMsbUJBQW1CLEVBQ25CQyxtQkFBbUIsRUFDbkJDLHdCQUF3QixFQUN4QkMsd0JBQXdCLEVBQ3hCQyxtQkFBbUIsRUFDbkJDLHNCQUFzQixRQUNqQixVQUFVO0FBQ2pCLFNBQ0VDLFVBQVUsRUFDVkMsY0FBYyxFQUNkQyxJQUFJLEVBQ0pDLFFBQVEsRUFDUkMsU0FBUyxFQUNUQyxlQUFlLEVBQ2ZDLFNBQVMsRUFDVEMsZUFBZSxFQUNmQyxjQUFjLEVBQ2RDLGdCQUFnQixFQUNoQkMsaUJBQWlCLFFBQ1osU0FBUztBQUNoQixTQUFTQyxvQkFBb0IsRUFBRUMsa0JBQWtCLFFBQVEsVUFBVTtBQUVuRSxTQUFTQyxxQkFBcUIsUUFBUSxVQUFVO0FBQ2hELFNBQVNDLFlBQVksRUFBRUMsZ0JBQWdCLEVBQUVDLFVBQVUsUUFBUSxVQUFVO0FBQ3JFLFNBQ0VDLGVBQWUsRUFDZkMsZUFBZSxFQUNmQyx3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