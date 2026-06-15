import _objectWithoutProperties from "@babel/runtime/helpers/objectWithoutProperties";
import _defineProperty from "@babel/runtime/helpers/defineProperty";
import _typeof from "@babel/runtime/helpers/typeof";
var _excluded = ["src"];
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
import { renderElementToContainer } from "./shadow";
import { syncUrlToWindow } from "./sync";
import { fixElementCtrSrcOrHref, isConstructable, anchorElementGenerator, isMatchSyncQueryById, isFunction, warn, error, execHooks, getCurUrl, getAbsolutePath, setAttrsToElement, setTagToScript, getTagFromScript } from "./utils";
import { documentProxyProperties, rawAddEventListener, rawRemoveEventListener, rawDocumentQuerySelector, mainDocumentAddEventListenerEvents, mainAndAppAddEventListenerEvents, appDocumentAddEventListenerEvents, appDocumentOnEvents, appWindowAddEventListenerEvents, appWindowOnEvent, windowProxyProperties, windowRegWhiteList, rawWindowAddEventListener, rawWindowRemoveEventListener } from "./common";
import { getJsLoader } from "./plugin";
import { WUJIE_TIPS_SCRIPT_ERROR_REQUESTED, WUJIE_DATA_FLAG } from "./constant";
var extraInstanceofConstructorNames = new Set(["ClipboardEvent", "CSSStyleDeclaration", "DataTransfer", "DOMImplementation", "DOMMatrix", "DOMMatrixReadOnly", "DOMParser", "DOMPoint", "DOMPointReadOnly", "DOMQuad", "DOMRect", "DOMRectList", "DOMRectReadOnly", "DOMStringList", "DOMStringMap", "DOMTokenList", "HTMLCollection", "MediaList", "NamedNodeMap", "Range", "Selection", "StyleSheet", "StyleSheetList", "TextDecoder", "TextEncoder", "TimeRanges"]);
/**
 * 修改window对象的事件监听，只有路由事件采用iframe的事件
 */
function patchIframeEvents(iframeWindow) {
  iframeWindow.__WUJIE_EVENTLISTENER__ = iframeWindow.__WUJIE_EVENTLISTENER__ || new Set();
  iframeWindow.addEventListener = function addEventListener(type, listener, options) {
    // 运行插件钩子函数
    execHooks(iframeWindow.__WUJIE.plugins, "windowAddEventListenerHook", iframeWindow, type, listener, options);
    // 相同参数多次调用 addEventListener 不会导致重复注册，所以用set。
    iframeWindow.__WUJIE_EVENTLISTENER__.add({
      type: type,
      listener: listener,
      options: options
    });
    if (appWindowAddEventListenerEvents.concat(iframeWindow.__WUJIE.iframeAddEventListeners).includes(type) || _typeof(options) === "object" && options.targetWindow) {
      var targetWindow = _typeof(options) === "object" && options.targetWindow ? options === null || options === void 0 ? void 0 : options.targetWindow : iframeWindow;
      return rawWindowAddEventListener.call(targetWindow, type, listener, options);
    }
    // 在子应用嵌套场景使用window.window获取真实window
    rawWindowAddEventListener.call(window.__WUJIE_RAW_WINDOW__ || window, type, listener, options);
  };
  iframeWindow.removeEventListener = function removeEventListener(type, listener, options) {
    // 运行插件钩子函数
    execHooks(iframeWindow.__WUJIE.plugins, "windowRemoveEventListenerHook", iframeWindow, type, listener, options);
    iframeWindow.__WUJIE_EVENTLISTENER__.forEach(function (o) {
      // 这里严格一点，确保子应用销毁的时候都能销毁
      if (o.listener === listener && o.type === type && options == o.options) {
        iframeWindow.__WUJIE_EVENTLISTENER__["delete"](o);
      }
    });
    if (appWindowAddEventListenerEvents.concat(iframeWindow.__WUJIE.iframeAddEventListeners).includes(type) || _typeof(options) === "object" && options.targetWindow) {
      var targetWindow = _typeof(options) === "object" && options.targetWindow ? options === null || options === void 0 ? void 0 : options.targetWindow : iframeWindow;
      return rawWindowRemoveEventListener.call(targetWindow, type, listener, options);
    }
    rawWindowRemoveEventListener.call(window.__WUJIE_RAW_WINDOW__ || window, type, listener, options);
  };
}
function patchIframeVariable(iframeWindow, wujie, appHostPath) {
  iframeWindow.__WUJIE = wujie;
  iframeWindow.__WUJIE_PUBLIC_PATH__ = appHostPath + "/";
  iframeWindow.$wujie = wujie.provide;
  iframeWindow.__WUJIE_RAW_WINDOW__ = iframeWindow;
}

/**
 * 对iframe的history的pushState和replaceState进行修改
 * 将从location劫持后的数据修改回来，防止跨域错误
 * 同步路由到主应用
 * @param iframeWindow
 * @param appHostPath 子应用的 host path
 * @param mainHostPath 主应用的 host path
 */
function patchIframeHistory(iframeWindow, appHostPath, mainHostPath) {
  var history = iframeWindow.history;
  var rawHistoryPushState = history.pushState;
  var rawHistoryReplaceState = history.replaceState;
  history.pushState = function (data, title, url) {
    var baseUrl = mainHostPath + iframeWindow.location.pathname + iframeWindow.location.search + iframeWindow.location.hash;
    var mainUrl = getAbsolutePath(url === null || url === void 0 ? void 0 : url.replace(appHostPath, ""), baseUrl);
    var ignoreFlag = url === undefined;
    rawHistoryPushState.call(history, data, title, ignoreFlag ? undefined : mainUrl);
    if (ignoreFlag) return;
    updateBase(iframeWindow, appHostPath, mainHostPath);
    syncUrlToWindow(iframeWindow);
  };
  history.replaceState = function (data, title, url) {
    var baseUrl = mainHostPath + iframeWindow.location.pathname + iframeWindow.location.search + iframeWindow.location.hash;
    var mainUrl = getAbsolutePath(url === null || url === void 0 ? void 0 : url.replace(appHostPath, ""), baseUrl);
    var ignoreFlag = url === undefined;
    rawHistoryReplaceState.call(history, data, title, ignoreFlag ? undefined : mainUrl);
    if (ignoreFlag) return;
    updateBase(iframeWindow, appHostPath, mainHostPath);
    syncUrlToWindow(iframeWindow);
  };
}

/**
 * 动态的修改iframe的base地址
 * @param iframeWindow
 * @param appHostPath
 * @param mainHostPath
 */
function updateBase(iframeWindow, appHostPath, mainHostPath) {
  var _iframeWindow$locatio;
  var baseUrl = new URL((_iframeWindow$locatio = iframeWindow.location.href) === null || _iframeWindow$locatio === void 0 ? void 0 : _iframeWindow$locatio.replace(mainHostPath, ""), appHostPath);
  var baseElement = rawDocumentQuerySelector.call(iframeWindow.document, "base");
  if (baseElement) baseElement.setAttribute("href", appHostPath + baseUrl.pathname);
}

/**
 * patch iframe window effect
 * @param iframeWindow
 */
// TODO 继续改进
export function patchWindowEffect(iframeWindow) {
  // 属性处理函数
  function processWindowProperty(key) {
    var value = iframeWindow[key];
    try {
      if (typeof value === "function" && !isConstructable(value)) {
        iframeWindow[key] = window[key].bind(window);
      } else {
        iframeWindow[key] = window[key];
      }
      return true;
    } catch (e) {
      warn(e.message);
      return false;
    }
  }
  Object.getOwnPropertyNames(iframeWindow).forEach(function (key) {
    // 特殊处理
    if (key === "getSelection") {
      Object.defineProperty(iframeWindow, key, {
        get: function get() {
          var sandbox = iframeWindow.__WUJIE;
          // 降级模式：可见 DOM 在渲染 iframe，getSelection 需读 sandbox.document
          if (sandbox !== null && sandbox !== void 0 && sandbox.degrade && sandbox.document) {
            return sandbox.document.getSelection.bind(sandbox.document);
          }
          return iframeWindow.document[key];
        }
      });
      return;
    }
    // 单独属性
    if (windowProxyProperties.includes(key)) {
      processWindowProperty(key);
      return;
    }
    // 正则匹配，可以一次处理多个
    windowRegWhiteList.some(function (reg) {
      if (reg.test(key) && key in iframeWindow.parent) {
        return processWindowProperty(key);
      }
      return false;
    });
  });
  // onEvent set
  var windowOnEvents = Object.getOwnPropertyNames(window).filter(function (p) {
    return /^on/.test(p);
  }).filter(function (e) {
    return !appWindowOnEvent.concat(iframeWindow.__WUJIE.iframeOnEvents).includes(e);
  });

  // 走主应用window
  windowOnEvents.forEach(function (e) {
    var descriptor = Object.getOwnPropertyDescriptor(iframeWindow, e) || {
      enumerable: true,
      writable: true
    };
    try {
      Object.defineProperty(iframeWindow, e, {
        enumerable: descriptor.enumerable,
        configurable: true,
        get: function get() {
          return window[e];
        },
        set: descriptor.writable || descriptor.set ? function (handler) {
          var _iframeWindow$__WUJIE;
          // 首次写入时记录主 window 上 onXXX 的原始值；destroy 时通过 setter
          // 还原（accessor 不能用 defineProperty descriptor 直接还原内部 handler），
          // 防止主应用 window 被 dangling handler 长期污染。
          var tracker = (_iframeWindow$__WUJIE = iframeWindow.__WUJIE) === null || _iframeWindow$__WUJIE === void 0 ? void 0 : _iframeWindow$__WUJIE.eventCleanupTracker;
          tracker === null || tracker === void 0 || tracker.trackWindowOnEvent(e, window[e], Object.prototype.hasOwnProperty.call(window, e));
          window[e] = typeof handler === "function" ? handler.bind(iframeWindow) : handler;
        } : undefined
      });
    } catch (e) {
      warn(e.message);
    }
  });
  // 降级模式 DOM 在渲染 iframe，instanceof 需在 document 就绪后由 patchDegradeInstanceofAcrossRealms 处理
  if (!iframeWindow.__WUJIE.degrade) {
    patchInstanceofAcrossRealms(iframeWindow);
  } else {
    execHooks(iframeWindow.__WUJIE.plugins, "windowPropertyOverride", iframeWindow);
  }
}
function isDomConstructor(name, ctor, peerWindow) {
  var prototype = ctor.prototype;
  if (!prototype) return false;
  if (ctor === peerWindow.EventTarget || ctor === peerWindow.Event) return true;
  if (prototype instanceof peerWindow.EventTarget || prototype instanceof peerWindow.Event) return true;
  if (/^(HTML|SVG|MathML).+Element$/.test(name)) return true;
  return extraInstanceofConstructorNames.has(name);
}

/**
 * 让 targetWindow 上的 DOM 构造函数 instanceof 同时认可 peerWindow realm 的对象。
 * 非降级：targetWindow=子应用 JS iframe，peerWindow=主应用 window（DOM 在 shadowRoot）。
 * 降级：在 patchDegradeInstanceofAcrossRealms 中对渲染 iframe 与执行 iframe 双向调用。
 */
export function patchInstanceofAcrossRealms(targetWindow) {
  var peerWindow = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window;
  // DOM 构造函数之间存在继承链（HTMLIFrameElement -> HTMLElement -> Element -> Node ...），
  // 对构造函数的属性读取会沿这条链向上查找。因此 _hasPatch / Symbol.hasInstance 必须用 own
  // 语义判断，否则会读到已被 patch 的祖先构造函数的值，导致 patch 被跳过或判断串味到祖先 realm。
  var nativeHasInstance = Function.prototype[Symbol.hasInstance];
  Object.getOwnPropertyNames(targetWindow).forEach(function (name) {
    var targetConstructor;
    var peerConstructor;
    try {
      targetConstructor = targetWindow[name];
      peerConstructor = peerWindow[name];
    } catch (error) {
      return;
    }
    if (typeof targetConstructor !== "function" || typeof peerConstructor !== "function") return;
    if (targetConstructor === peerConstructor || Object.prototype.hasOwnProperty.call(targetConstructor, "_hasPatch")) return;
    if (!isDomConstructor(name, peerConstructor, peerWindow)) return;
    try {
      Object.defineProperties(targetConstructor, _defineProperty(_defineProperty({}, Symbol.hasInstance, {
        configurable: true,
        value: function value(element) {
          // 用 this 而非闭包变量，确保命中的始终是当前构造函数自己的判断。
          // 对端也用原生 hasInstance，避免双向 patch 时 element instanceof peerConstructor 递归栈溢出。
          if (nativeHasInstance.call(this, element)) return true;
          return nativeHasInstance.call(peerConstructor, element);
        }
      }), "_hasPatch", {
        value: true
      }));
    } catch (error) {
      console.warn(error);
    }
  });
  var wujie = targetWindow.__WUJIE;
  if (wujie) {
    execHooks(wujie.plugins, "windowPropertyOverride", targetWindow);
  }
}

/**
 * 降级模式：DOM 在渲染 iframe、JS 在执行 iframe，对两侧 window 双向 patch instanceof。
 * 需在 sandbox.document（渲染 document）就绪后调用，勿在 patchWindowEffect 阶段调用。
 */
export function patchDegradeInstanceofAcrossRealms(appWindow, renderWindow) {
  if (!renderWindow || appWindow === renderWindow) return;
  patchInstanceofAcrossRealms(renderWindow, appWindow);
  patchInstanceofAcrossRealms(appWindow, renderWindow);
}

/**
 * 记录节点的监听事件
 */
function recordEventListeners(iframeWindow) {
  var sandbox = iframeWindow.__WUJIE;
  iframeWindow.Node.prototype.addEventListener = function (type, handler, options) {
    // 添加事件缓存
    var elementListenerList = sandbox.elementEventCacheMap.get(this);
    if (elementListenerList) {
      if (!elementListenerList.find(function (listener) {
        return listener.type === type && listener.handler === handler;
      })) {
        elementListenerList.push({
          type: type,
          handler: handler,
          options: options
        });
      }
    } else sandbox.elementEventCacheMap.set(this, [{
      type: type,
      handler: handler,
      options: options
    }]);
    return rawAddEventListener.call(this, type, handler, options);
  };
  iframeWindow.Node.prototype.removeEventListener = function (type, handler, options) {
    // 清除缓存
    var elementListenerList = sandbox.elementEventCacheMap.get(this);
    if (elementListenerList) {
      var index = elementListenerList === null || elementListenerList === void 0 ? void 0 : elementListenerList.findIndex(function (ele) {
        return ele.type === type && ele.handler === handler;
      });
      elementListenerList.splice(index, 1);
    }
    if (!(elementListenerList !== null && elementListenerList !== void 0 && elementListenerList.length)) {
      sandbox.elementEventCacheMap["delete"](this);
    }
    return rawRemoveEventListener.call(this, type, handler, options);
  };
}

/**
 * 恢复节点的监听事件
 */
export function recoverEventListeners(rootElement, iframeWindow) {
  var sandbox = iframeWindow.__WUJIE;
  var elementEventCacheMap = new WeakMap();
  var ElementIterator = document.createTreeWalker(rootElement, NodeFilter.SHOW_ELEMENT, null, false);
  var nextElement = ElementIterator.currentNode;
  while (nextElement) {
    var elementListenerList = sandbox.elementEventCacheMap.get(nextElement);
    if (elementListenerList !== null && elementListenerList !== void 0 && elementListenerList.length) {
      elementEventCacheMap.set(nextElement, elementListenerList);
      elementListenerList.forEach(function (listener) {
        nextElement.addEventListener(listener.type, listener.handler, listener.options);
      });
    }
    nextElement = ElementIterator.nextNode();
  }
  sandbox.elementEventCacheMap = elementEventCacheMap;
}

/**
 * 恢复根节点的监听事件
 */
export function recoverDocumentListeners(oldRootElement, newRootElement, iframeWindow) {
  var sandbox = iframeWindow.__WUJIE;
  var elementEventCacheMap = new WeakMap();
  var elementListenerList = sandbox.elementEventCacheMap.get(oldRootElement);
  if (elementListenerList !== null && elementListenerList !== void 0 && elementListenerList.length) {
    elementEventCacheMap.set(newRootElement, elementListenerList);
    elementListenerList.forEach(function (listener) {
      newRootElement.addEventListener(listener.type, listener.handler, listener.options);
    });
  }
  sandbox.elementEventCacheMap = elementEventCacheMap;
}

/**
 * 修复vue绑定事件e.timeStamp < attachedTimestamp 的情况
 */
export function patchEventTimeStamp(targetWindow, iframeWindow) {
  Object.defineProperty(targetWindow.Event.prototype, "timeStamp", {
    get: function get() {
      return iframeWindow.document.createEvent("Event").timeStamp;
    }
  });
}

/**
 * patch document effect
 * @param iframeWindow
 */
// TODO 继续改进
export function patchDocumentEffect(iframeWindow) {
  var sandbox = iframeWindow.__WUJIE;

  /**
   * 处理 addEventListener和removeEventListener
   * 由于这个劫持导致 handler 的this发生改变，所以需要handler.bind(document)
   * 但是这样会导致removeEventListener无法正常工作，因为handler => handler.bind(document)
   * 这个地方保存callback = handler.bind(document) 方便removeEventListener
   */
  var handlerCallbackMap = new WeakMap();
  var handlerTypeMap = new WeakMap();
  iframeWindow.Document.prototype.addEventListener = function (type, handler, options) {
    if (!handler) return;
    var callback = handlerCallbackMap.get(handler);
    var typeList = handlerTypeMap.get(handler);
    // 设置 handlerCallbackMap
    if (!callback) {
      callback = typeof handler === "function" ? handler.bind(this) : handler;
      handlerCallbackMap.set(handler, callback);
    }
    // 设置 handlerTypeMap
    if (typeList) {
      if (!typeList.includes(type)) typeList.push(type);
    } else {
      handlerTypeMap.set(handler, [type]);
    }

    // 运行插件钩子函数
    execHooks(iframeWindow.__WUJIE.plugins, "documentAddEventListenerHook", iframeWindow, type, callback, options);
    if (appDocumentAddEventListenerEvents.includes(type)) {
      return rawAddEventListener.call(this, type, callback, options);
    }
    // 降级统一走 sandbox.document
    if (sandbox.degrade) return sandbox.document.addEventListener(type, callback, options);
    if (mainDocumentAddEventListenerEvents.includes(type)) {
      var _sandbox$eventCleanup;
      // 登记到清理跟踪器，destroy 时反向解绑，避免 handler 闭包永久钉住 iframeWindow
      (_sandbox$eventCleanup = sandbox.eventCleanupTracker) === null || _sandbox$eventCleanup === void 0 || _sandbox$eventCleanup.trackMainDocumentListener({
        type: type,
        callback: callback,
        options: options
      });
      return window.document.addEventListener(type, callback, options);
    }
    if (mainAndAppAddEventListenerEvents.includes(type)) {
      var _sandbox$eventCleanup2;
      (_sandbox$eventCleanup2 = sandbox.eventCleanupTracker) === null || _sandbox$eventCleanup2 === void 0 || _sandbox$eventCleanup2.trackMainDocumentListener({
        type: type,
        callback: callback,
        options: options
      });
      window.document.addEventListener(type, callback, options);
      sandbox.shadowRoot.addEventListener(type, callback, options);
      return;
    }
    sandbox.shadowRoot.addEventListener(type, callback, options);
  };
  iframeWindow.Document.prototype.removeEventListener = function (type, handler, options) {
    var callback = handlerCallbackMap.get(handler);
    var typeList = handlerTypeMap.get(handler);
    if (callback) {
      if (typeList !== null && typeList !== void 0 && typeList.includes(type)) {
        typeList.splice(typeList.indexOf(type), 1);
        if (!typeList.length) {
          handlerCallbackMap["delete"](handler);
          handlerTypeMap["delete"](handler);
        }
      }

      // 运行插件钩子函数
      execHooks(iframeWindow.__WUJIE.plugins, "documentRemoveEventListenerHook", iframeWindow, type, callback, options);
      if (appDocumentAddEventListenerEvents.includes(type)) {
        return rawRemoveEventListener.call(this, type, callback, options);
      }
      if (sandbox.degrade) return sandbox.document.removeEventListener(type, callback, options);
      if (mainDocumentAddEventListenerEvents.includes(type)) {
        var _sandbox$eventCleanup3;
        (_sandbox$eventCleanup3 = sandbox.eventCleanupTracker) === null || _sandbox$eventCleanup3 === void 0 || _sandbox$eventCleanup3.untrackMainDocumentListener({
          type: type,
          callback: callback,
          options: options
        });
        return window.document.removeEventListener(type, callback, options);
      }
      if (mainAndAppAddEventListenerEvents.includes(type)) {
        var _sandbox$eventCleanup4;
        (_sandbox$eventCleanup4 = sandbox.eventCleanupTracker) === null || _sandbox$eventCleanup4 === void 0 || _sandbox$eventCleanup4.untrackMainDocumentListener({
          type: type,
          callback: callback,
          options: options
        });
        window.document.removeEventListener(type, callback, options);
        sandbox.shadowRoot.removeEventListener(type, callback, options);
        return;
      }
      sandbox.shadowRoot.removeEventListener(type, callback, options);
    }
  };
  // 处理onEvent
  var elementOnEvents = Object.keys(iframeWindow.HTMLElement.prototype).filter(function (ele) {
    return /^on/.test(ele);
  });
  var documentOnEvent = Object.keys(iframeWindow.Document.prototype).filter(function (ele) {
    return /^on/.test(ele);
  }).filter(function (ele) {
    return !appDocumentOnEvents.includes(ele);
  });
  elementOnEvents.filter(function (e) {
    return documentOnEvent.includes(e);
  }).forEach(function (e) {
    var descriptor = Object.getOwnPropertyDescriptor(iframeWindow.Document.prototype, e) || {
      enumerable: true,
      writable: true
    };
    try {
      Object.defineProperty(iframeWindow.Document.prototype, e, {
        enumerable: descriptor.enumerable,
        configurable: true,
        get: function get() {
          return sandbox.degrade ? sandbox.document[e] : sandbox.shadowRoot.firstElementChild[e];
        },
        set: descriptor.writable || descriptor.set ? function (handler) {
          var val = typeof handler === "function" ? handler.bind(iframeWindow.document) : handler;
          sandbox.degrade ? sandbox.document[e] = val : sandbox.shadowRoot.firstElementChild[e] = val;
        } : undefined
      });
    } catch (e) {
      warn(e.message);
    }
  });
  // 处理属性get
  var ownerProperties = documentProxyProperties.ownerProperties,
    modifyProperties = documentProxyProperties.modifyProperties,
    shadowProperties = documentProxyProperties.shadowProperties,
    shadowMethods = documentProxyProperties.shadowMethods,
    documentProperties = documentProxyProperties.documentProperties,
    documentMethods = documentProxyProperties.documentMethods,
    documentEvents = documentProxyProperties.documentEvents;
  modifyProperties.concat(shadowProperties, shadowMethods, documentProperties, documentMethods).forEach(function (propKey) {
    var descriptor = Object.getOwnPropertyDescriptor(iframeWindow.Document.prototype, propKey) || {
      enumerable: true,
      writable: true
    };
    try {
      Object.defineProperty(iframeWindow.Document.prototype, propKey, {
        enumerable: descriptor.enumerable,
        configurable: true,
        get: function get() {
          return sandbox.proxyDocument[propKey];
        },
        set: undefined
      });
    } catch (e) {
      warn(e.message);
    }
  });
  // 处理 document 专属事件（onfullscreenchange / onpointerlockchange 等）。
  //
  // 这类事件浏览器只 dispatch 到主 document 上，子应用形如
  // `document.onfullscreenchange = handler` 的写法需要被转发到主 window.document。
  // 实现要点：
  //   1) 每个 propKey 只允许一个 active listener；setter 内部用同一份 bound 引用
  //      做 add / remove / track，避免出现 "存进 map 的 bound 与实际注册的 bound
  //      不是同一个" 而无法 remove；
  //   2) 接入 eventCleanupTracker，sandbox.destroy() 时反向解绑，否则 bound 闭包
  //      会持有 iframeWindow.document 永远挂在主 document 上；
  //   3) handler = null/非函数：仅解绑不重绑，与原生 onXXX = null 语义一致。
  var documentEventActiveListeners = new Map();
  documentEvents.forEach(function (propKey) {
    var descriptor = Object.getOwnPropertyDescriptor(iframeWindow.Document.prototype, propKey) || {
      enumerable: true,
      writable: true
    };
    if (!(descriptor.writable || descriptor.set)) return;
    // documentEvents 形如 "onfullscreenchange"，对应事件名去掉前缀 "on"
    var eventType = propKey.slice(2);
    try {
      Object.defineProperty(iframeWindow.Document.prototype, propKey, {
        enumerable: descriptor.enumerable,
        configurable: true,
        get: function get() {
          return (sandbox.degrade ? sandbox : window).document[propKey];
        },
        set: function set(handler) {
          var targetDoc = (sandbox.degrade ? sandbox : window).document;
          var previous = documentEventActiveListeners.get(propKey);
          if (previous) {
            var _sandbox$eventCleanup5;
            targetDoc.removeEventListener(eventType, previous);
            (_sandbox$eventCleanup5 = sandbox.eventCleanupTracker) === null || _sandbox$eventCleanup5 === void 0 || _sandbox$eventCleanup5.untrackMainDocumentListener({
              type: eventType,
              callback: previous
            });
            documentEventActiveListeners["delete"](propKey);
          }
          if (typeof handler === "function") {
            var _sandbox$eventCleanup6;
            var bound = handler.bind(iframeWindow.document);
            documentEventActiveListeners.set(propKey, bound);
            targetDoc.addEventListener(eventType, bound);
            (_sandbox$eventCleanup6 = sandbox.eventCleanupTracker) === null || _sandbox$eventCleanup6 === void 0 || _sandbox$eventCleanup6.trackMainDocumentListener({
              type: eventType,
              callback: bound
            });
          }
          // handler 为 null/undefined/非函数：只解绑不重绑（与原生 onXXX = null 语义一致）
        }
      });
    } catch (e) {
      warn(e.message);
    }
  });
  // process owner property
  ownerProperties.forEach(function (propKey) {
    Object.defineProperty(iframeWindow.document, propKey, {
      enumerable: true,
      configurable: true,
      get: function get() {
        return sandbox.proxyDocument[propKey];
      },
      set: undefined
    });
  });
  // 运行插件钩子函数
  execHooks(iframeWindow.__WUJIE.plugins, "documentPropertyOverride", iframeWindow);
}

/**
 * patch Node effect
 * 1、处理 getRootNode
 * 2、处理 appendChild、insertBefore，当插入的节点为 svg 时，createElement 的 patch 会被去除，需要重新 patch
 * @param iframeWindow
 */
function patchNodeEffect(iframeWindow) {
  var rawGetRootNode = iframeWindow.Node.prototype.getRootNode;
  var rawAppendChild = iframeWindow.Node.prototype.appendChild;
  var rawInsertRule = iframeWindow.Node.prototype.insertBefore;
  var rawRemoveChild = iframeWindow.Node.prototype.removeChild;
  iframeWindow.Node.prototype.getRootNode = function (options) {
    var rootNode = rawGetRootNode.call(this, options);
    if (rootNode === iframeWindow.__WUJIE.shadowRoot) return iframeWindow.document;else return rootNode;
  };
  iframeWindow.Node.prototype.appendChild = function (node) {
    var res = rawAppendChild.call(this, node);
    patchElementEffect(node, iframeWindow);
    return res;
  };
  iframeWindow.Node.prototype.insertBefore = function (node, child) {
    var res = rawInsertRule.call(this, node, child);
    patchElementEffect(node, iframeWindow);
    return res;
  };
  iframeWindow.Node.prototype.removeChild = function (node) {
    var res;
    try {
      res = rawRemoveChild.call(this, node);
    } catch (e) {
      var _node$parentNode;
      console.warn("Failed to removeChild: ".concat(node.nodeName.toLowerCase(), " is not a child of ").concat(this.nodeName.toLowerCase(), ", try again with parentNode attribute. "));
      if (node.isConnected && isFunction((_node$parentNode = node.parentNode) === null || _node$parentNode === void 0 ? void 0 : _node$parentNode.removeChild)) {
        node.parentNode.removeChild(node);
      }
    }
    patchElementEffect(node, iframeWindow);
    return res;
  };
}

/**
 * 修复资源元素的相对路径问题
 * @param iframeWindow
 */
function patchRelativeUrlEffect(iframeWindow) {
  fixElementCtrSrcOrHref(iframeWindow, iframeWindow.HTMLImageElement, "src");
  fixElementCtrSrcOrHref(iframeWindow, iframeWindow.HTMLAnchorElement, "href");
  fixElementCtrSrcOrHref(iframeWindow, iframeWindow.HTMLSourceElement, "src");
  fixElementCtrSrcOrHref(iframeWindow, iframeWindow.HTMLLinkElement, "href");
  fixElementCtrSrcOrHref(iframeWindow, iframeWindow.HTMLScriptElement, "src");
  fixElementCtrSrcOrHref(iframeWindow, iframeWindow.HTMLMediaElement, "src");
}

/**
 * 初始化 base 标签，供 document 内相对路径资源解析使用。
 * @param pathname 可选；降级渲染 iframe 的 location 为 about:blank，需传入 proxyLocation.pathname
 */
export function initBase(iframeWindow, url, pathname) {
  var iframeDocument = iframeWindow.document;
  if (!iframeDocument.head || iframeDocument.head.querySelector("base")) return;
  var baseElement = iframeDocument.createElement("base");
  var iframeUrlElement = anchorElementGenerator(iframeWindow.location.href);
  var appUrlElement = anchorElementGenerator(url);
  var resolvedPathname = pathname !== null && pathname !== void 0 ? pathname : iframeUrlElement.pathname;
  baseElement.setAttribute("href", appUrlElement.protocol + "//" + appUrlElement.host + resolvedPathname);
  iframeDocument.head.insertBefore(baseElement, iframeDocument.head.firstChild);
}

/**
 * 初始化iframe的dom结构
 * @param iframeWindow
 * @param wujie
 * @param mainHostPath
 * @param appHostPath
 */
function initIframeDom(iframeWindow, wujie, mainHostPath, appHostPath) {
  var iframeDocument = iframeWindow.document;
  var newDoc = window.document.implementation.createHTMLDocument("");
  var newDocumentElement = iframeDocument.importNode(newDoc.documentElement, true);
  iframeDocument.documentElement ? iframeDocument.replaceChild(newDocumentElement, iframeDocument.documentElement) : iframeDocument.appendChild(newDocumentElement);
  iframeWindow.__WUJIE_RAW_DOCUMENT_HEAD__ = iframeDocument.head;
  iframeWindow.__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__ = iframeWindow.Document.prototype.querySelector;
  iframeWindow.__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR_ALL__ = iframeWindow.Document.prototype.querySelectorAll;
  iframeWindow.__WUJIE_RAW_DOCUMENT_CREATE_ELEMENT__ = iframeWindow.Document.prototype.createElement;
  iframeWindow.__WUJIE_RAW_DOCUMENT_CREATE_TEXT_NODE__ = iframeWindow.Document.prototype.createTextNode;
  initBase(iframeWindow, wujie.url);
  patchIframeHistory(iframeWindow, appHostPath, mainHostPath);
  patchIframeEvents(iframeWindow);
  if (wujie.degrade) recordEventListeners(iframeWindow);
  syncIframeUrlToWindow(iframeWindow);
  patchWindowEffect(iframeWindow);
  patchDocumentEffect(iframeWindow);
  patchNodeEffect(iframeWindow);
  patchRelativeUrlEffect(iframeWindow);
  patchSetAttribute(iframeWindow);
}

/**
 * 防止运行主应用的js代码，给子应用带来很多副作用
 *
 * options.fallbackSrc 表示 iframe 是用 srcdoc 启动的（不发请求加载主应用 host）
 * 此时需要通过 document.open()/close() 在主应用上下文里把 iframe 的 URL
 * 由 about:srcdoc 改写成主应用 URL，否则 location.origin 不是主应用同源，
 * 子应用的 router/fetch 等都会出问题。
 *
 * 关键时序：srcdoc 是异步 navigation，appendChild 之后 iframe.contentWindow.document
 * 还是初始 about:blank，立刻 open() 会被随后到来的 srcdoc 文档替换掉。
 * 因此 srcdoc 分支必须等 iframe 的 load 事件触发（srcdoc 文档已就位）再做 trick。
 *
 * 如果 trick 在当前浏览器上失败（极少见），会兜底到 fallbackSrc 真实加载，
 * 此时由于不再走 srcdoc，需要切换到 stopIframeLoading 的"立即 stop"分支。
 */
function stopIframeLoading(iframe, options) {
  var iframeWindow = iframe.contentWindow;
  return new Promise(function (resolve) {
    // srcdoc 路径：等 srcdoc 文档就位（load 事件），然后做一次 document.open() trick
    if (options) {
      var done = false;
      var runTrick = function runTrick() {
        if (done) return;
        done = true;
        var newDoc = iframeWindow.document;
        var previousHref = iframeWindow.location.href;
        newDoc.open();
        newDoc.close();
        // 按 HTML spec，document.open() 同步改写当前 document 的 URL，无需轮询
        if (iframeWindow.location.href !== previousHref) {
          resolve();
          return;
        }
        // 极少数浏览器未按 spec 同步改 URL，兜底走 fallbackSrc 真实加载
        warn("wujie: srcdoc + document.open() trick failed, fallback to load ".concat(options.fallbackSrc, " this time."));
        // HTML spec 规定 srcdoc 优先级高于 src，必须先移除 srcdoc 才能让 src 生效
        iframe.removeAttribute("srcdoc");
        iframe.src = options.fallbackSrc;
        stopIframeLoading(iframe, false).then(resolve);
      };
      iframe.addEventListener("load", runTrick, {
        once: true
      });
      // 5s 安全网：load 理论上必定触发，加一层保险避免诡异挂死
      setTimeout(runTrick, 5e3);
      return;
    }

    // fallback 真实加载路径：仍需轮询，赶在页面真正加载完成前 stop()
    var oldDoc = iframeWindow.document;
    var loopDeadline = Date.now() + 5e3;
    function loop() {
      setTimeout(function () {
        var newDoc;
        try {
          newDoc = iframeWindow.document;
        } catch (err) {
          newDoc = null;
        }
        if ((!newDoc || newDoc == oldDoc) && Date.now() < loopDeadline) {
          loop();
          return;
        }
        iframeWindow.stop ? iframeWindow.stop() : newDoc.execCommand("Stop");
        resolve();
      }, 1);
    }
    loop();
  });
}

/**
 * 给子应用元素打上 baseURI / ownerDocument 补丁，让它在主应用 DOM 中也保留子应用
 * 的 location / document 语义。
 *
 * 闭包持有策略：用 WeakRef<Window> 间接持有 iframeWindow，proxyLocation / plugins
 * 都通过 `iframeWindow.__WUJIE` 动态访问。这样一来，当子应用 element 被业务移到
 * 主应用 DOM 下（portal / 弹窗 / 拖拽等），sandbox.destroy() 把
 * `iframeWindow.__WUJIE = null` 后，getter 会自动降级到主 document，element 不会
 * 把整个子应用上下文钉在内存中。
 *
 * WeakRef 是 ES2021 标准（Chrome 84+ / Node 14.6+）；旧环境降级为强引用以保兼容。
 */
export function patchElementEffect(element, iframeWindow) {
  if (element._hasPatch) return;
  var HasWeakRef = typeof globalThis.WeakRef === "function";
  var iframeWindowRef = HasWeakRef ? new globalThis.WeakRef(iframeWindow) : {
    deref: function deref() {
      return iframeWindow;
    }
  };
  try {
    Object.defineProperties(element, {
      baseURI: {
        configurable: true,
        get: function get() {
          var _win$__WUJIE;
          var win = iframeWindowRef.deref();
          var proxyLocation = win === null || win === void 0 || (_win$__WUJIE = win.__WUJIE) === null || _win$__WUJIE === void 0 ? void 0 : _win$__WUJIE.proxyLocation;
          if (!proxyLocation) return window.document.baseURI;
          return proxyLocation.protocol + "//" + proxyLocation.host + proxyLocation.pathname;
        },
        set: undefined
      },
      ownerDocument: {
        configurable: true,
        get: function get() {
          var win = iframeWindowRef.deref();
          // win.__WUJIE 被置 null（destroy 后）或 win 本身已 GC 时降级到主 document，
          // 防止 element 永久把 iframeWindow 钉在内存中。
          if (!win || !win.__WUJIE) return window.document;
          // 降级模式：节点已挂到渲染 iframe，ownerDocument 需与可见 DOM 一致，
          // 否则 wangEditor LO/RO（node.ownerDocument.defaultView instanceof）会失败。
          if (win.__WUJIE.degrade && win.__WUJIE.document) {
            return win.__WUJIE.document;
          }
          return win.document;
        }
      },
      _hasPatch: {
        get: function get() {
          return true;
        }
      }
    });
  } catch (error) {
    console.warn(error);
  }
  execHooks(iframeWindow.__WUJIE.plugins, "patchElementHook", element, iframeWindow);
  // 编译内联事件处理器
  compileInlineEvents(element, iframeWindow);
}

/**
 * 子应用前进后退，同步路由到主应用
 * @param iframeWindow
 */
export function syncIframeUrlToWindow(iframeWindow) {
  iframeWindow.addEventListener("hashchange", function () {
    return syncUrlToWindow(iframeWindow);
  });
  iframeWindow.addEventListener("popstate", function () {
    syncUrlToWindow(iframeWindow);
  });
}

/**
 * iframe插入脚本
 * @param scriptResult script请求结果
 * @param iframeWindow
 * @param rawElement 原始的脚本
 */
export function insertScriptToIframe(scriptResult, iframeWindow, rawElement) {
  var _ref = scriptResult,
    src = _ref.src,
    module = _ref.module,
    content = _ref.content,
    crossorigin = _ref.crossorigin,
    crossoriginType = _ref.crossoriginType,
    async = _ref.async,
    attrs = _ref.attrs,
    callback = _ref.callback,
    onload = _ref.onload;
  var scriptElement = iframeWindow.document.createElement("script");
  var nextScriptElement = iframeWindow.document.createElement("script");
  var _iframeWindow$__WUJIE2 = iframeWindow.__WUJIE,
    replace = _iframeWindow$__WUJIE2.replace,
    plugins = _iframeWindow$__WUJIE2.plugins,
    proxyLocation = _iframeWindow$__WUJIE2.proxyLocation;
  var jsLoader = getJsLoader({
    plugins: plugins,
    replace: replace
  });
  var code = jsLoader(content, src, getCurUrl(proxyLocation));
  // 添加属性
  attrs && Object.keys(attrs).filter(function (key) {
    return !Object.keys(scriptResult).includes(key);
  }).forEach(function (key) {
    return scriptElement.setAttribute(key, String(attrs[key]));
  });

  // 内联脚本
  if (content) {
    // patch location
    if (!iframeWindow.__WUJIE.degrade && !module && (attrs === null || attrs === void 0 ? void 0 : attrs.type) !== "importmap") {
      code = "(function(window, self, global, location) {\n      ".concat(code, "\n}).bind(window.__WUJIE.proxy)(\n  window.__WUJIE.proxy,\n  window.__WUJIE.proxy,\n  window.__WUJIE.proxy,\n  window.__WUJIE.proxyLocation,\n);");
    }
    var descriptor = Object.getOwnPropertyDescriptor(scriptElement, "src");
    // 部分浏览器 src 不可配置 取不到descriptor表示无该属性，可写
    if (descriptor !== null && descriptor !== void 0 && descriptor.configurable || !descriptor) {
      // 解决 webpack publicPath 为 auto 无法加载资源的问题
      try {
        Object.defineProperty(scriptElement, "src", {
          get: function get() {
            return src || "";
          }
        });
      } catch (error) {
        console.warn(error);
      }
    }
  } else {
    src && scriptElement.setAttribute("src", src);
    crossorigin && scriptElement.setAttribute("crossorigin", crossoriginType);
  }
  module && scriptElement.setAttribute("type", "module");
  scriptElement.textContent = code || "";
  nextScriptElement.textContent = "if(window.__WUJIE.execQueue && window.__WUJIE.execQueue.length){ window.__WUJIE.execQueue.shift()()}";
  var container = rawDocumentQuerySelector.call(iframeWindow.document, "head");
  var execNextScript = function execNextScript() {
    return !async && container.appendChild(nextScriptElement);
  };
  var afterExecScript = function afterExecScript() {
    onload === null || onload === void 0 || onload();
    execNextScript();
  };

  // 错误情况处理
  if (/^<!DOCTYPE html/i.test(code)) {
    error(WUJIE_TIPS_SCRIPT_ERROR_REQUESTED, scriptResult);
    return execNextScript();
  }

  // 打标记
  if (rawElement) {
    setTagToScript(scriptElement, getTagFromScript(rawElement));
    // rawElement 不为空表示这是 effect.ts 转发的动态 <script>（webpack 异步 chunk 等）。
    // 登记到 sandbox.dynamicScriptElements，由 destroy() 统一清理，避免 iframe 残留 detach。
    var sandboxForCleanup = iframeWindow.__WUJIE;
    if (sandboxForCleanup && Array.isArray(sandboxForCleanup.dynamicScriptElements)) {
      sandboxForCleanup.dynamicScriptElements.push(scriptElement);
    }
  }
  // 外联脚本执行后的处理
  var isOutlineScript = !content && src;
  if (isOutlineScript) {
    scriptElement.onload = afterExecScript;
    scriptElement.onerror = afterExecScript;
  }
  container.appendChild(scriptElement);

  // 调用回调
  callback === null || callback === void 0 || callback(iframeWindow);
  // 执行 hooks
  execHooks(plugins, "appendOrInsertElementHook", scriptElement, iframeWindow, rawElement);
  // 内联脚本执行后的处理
  !isOutlineScript && afterExecScript();
}

/**
 * 加载iframe替换子应用
 * @param src 地址
 * @param element
 * @param degradeAttrs
 */
export function renderIframeReplaceApp(src, element) {
  var degradeAttrs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var iframe = window.document.createElement("iframe");
  var defaultStyle = "height:100%;width:100%";
  setAttrsToElement(iframe, _objectSpread(_objectSpread({}, degradeAttrs), {}, {
    src: src,
    style: [defaultStyle, degradeAttrs.style].join(";")
  }));
  renderElementToContainer(iframe, element);
}

// 沙箱 iframe 启动时的空白文档内容
// srcdoc 文档的 origin 由 spec 保证继承自 embedder（即主应用），
// 这样既不发网络请求，也保证主应用能访问 contentDocument。
var SANDBOX_EMPTY_SRCDOC = "<!DOCTYPE html><html><head></head><body></body></html>";

/**
 * js沙箱
 * 创建和主应用同源的iframe，路径携带了子路由的路由信息
 * iframe必须禁止加载html，防止进入主应用的路由逻辑
 *
 * 统一使用 srcdoc 加载空白文档：
 *   - 不发任何请求加载主应用 host 资源（解决 issue #54）
 *   - origin 继承自 embedder，主应用可以正常 patch contentDocument
 *   - 之后通过 document.open() 把 iframe 的 location 改写到主应用 URL，
 *     使 location.origin、history、router 等行为与主应用同源一致
 *
 * attrs.src 不再作为 iframe 的初始 src（HTML spec 规定 srcdoc 优先级高于 src，
 * 即便保留 src 浏览器也会忽略它）。它被重新解释为「srcdoc trick 失败时的兜底空白页 URL」，
 * 用户可指向自己提供的 `/empty` 静态文件或 Service Worker 端点；不传则兜底 mainHostPath。
 */
export function iframeGenerator(sandbox, attrs, mainHostPath, appHostPath, appRoutePath) {
  // 把用户传入的 src 拆出来作为 fallback 用，不再作为 iframe 的初始 src 直接挂载
  var _ref2 = attrs || {},
    userFallbackSrc = _ref2.src,
    restAttrs = _objectWithoutProperties(_ref2, _excluded);
  var fallbackSrc = userFallbackSrc || mainHostPath;
  var iframe = window.document.createElement("iframe");
  var attrsMerge = _objectSpread(_objectSpread({
    style: "display: none"
  }, restAttrs), {}, _defineProperty(_defineProperty({
    name: sandbox.id
  }, WUJIE_DATA_FLAG, ""), "srcdoc", SANDBOX_EMPTY_SRCDOC));
  setAttrsToElement(iframe, attrsMerge);
  window.document.body.appendChild(iframe);
  var iframeWindow = iframe.contentWindow;
  // 变量需要提前注入，在入口函数通过变量防止死循环
  patchIframeVariable(iframeWindow, sandbox, appHostPath);
  sandbox.iframeReady = stopIframeLoading(iframe, {
    fallbackSrc: fallbackSrc
  }).then(function () {
    if (!iframeWindow.__WUJIE) {
      patchIframeVariable(iframeWindow, sandbox, appHostPath);
    }
    initIframeDom(iframeWindow, sandbox, mainHostPath, appHostPath);
    /**
     * 如果有同步优先同步，非同步从url读取
     */
    if (!isMatchSyncQueryById(iframeWindow.__WUJIE.id)) {
      iframeWindow.history.replaceState(null, "", mainHostPath + appRoutePath);
    }
  });
  return iframe;
}

// 内联事件编译后的统一前缀，用于幂等判断，避免重复包裹
var WUJIE_INLINE_EVENT_PREFIX = "with(window.__getWujieWindow__(";

/**
 * 将内联事件处理器包裹为子应用作用域执行的形式
 * onclick="greet()" -> onclick='with(window.__getWujieWindow__("appId")){ greet() }'
 * 已包裹过则原样返回，保证幂等
 */
function wrapInlineEventHandler(handler, appId) {
  if (handler.startsWith(WUJIE_INLINE_EVENT_PREFIX)) return handler;
  return "".concat(WUJIE_INLINE_EVENT_PREFIX, "\"").concat(appId, "\")){ ").concat(handler, " }");
}

/**
 * 编译元素的内联事件处理器
 * 将 onclick="..." 编译为 onclick='with(window.__getWujieWindow__("appId")){ ... }'
 * 通过把 appId 烤进字符串字面量，避免运行时依赖被劫持的 getRootNode
 */
function compileInlineEvents(element, iframeWindow) {
  var _iframeWindow$__WUJIE3;
  // 只处理元素节点
  if (element.nodeType !== Node.ELEMENT_NODE) return;
  // 降级模式同样需要编译：函数定义在沙箱 iframe 全局，DOM 渲染在另一个渲染 iframe，
  // 原生 onclick 跨 realm 取不到函数，必须经 with(__getWujieWindow__) 桥接
  var appId = (_iframeWindow$__WUJIE3 = iframeWindow.__WUJIE) === null || _iframeWindow$__WUJIE3 === void 0 ? void 0 : _iframeWindow$__WUJIE3.id;
  if (!appId) return;

  // 遍历所有属性，查找内联事件
  var attributes = Array.from(element.attributes);
  attributes.forEach(function (attr) {
    if (attr.name.startsWith("on") && typeof attr.value === "string") {
      var compiledHandler = wrapInlineEventHandler(attr.value, appId);
      if (compiledHandler !== attr.value) {
        element.setAttribute(attr.name, compiledHandler);
      }
    }
  });

  // 递归处理子元素
  if (element.children && element.children.length > 0) {
    Array.from(element.children).forEach(function (child) {
      compileInlineEvents(child, iframeWindow);
    });
  }
}

/**
 * 拦截 Element.prototype.setAttribute，编译内联事件属性
 * 用于捕获子应用运行期间（如 Vue 模板渲染）动态设置的内联事件
 */
function patchSetAttribute(iframeWindow) {
  var rawSetAttribute = iframeWindow.Element.prototype.setAttribute;
  iframeWindow.Element.prototype.setAttribute = function (name, value) {
    // 内联事件属性进行编译，幂等避免重复包裹（降级模式同样需要，见 compileInlineEvents 说明）
    if (name.startsWith("on") && typeof value === "string") {
      var _iframeWindow$__WUJIE4;
      var appId = (_iframeWindow$__WUJIE4 = iframeWindow.__WUJIE) === null || _iframeWindow$__WUJIE4 === void 0 ? void 0 : _iframeWindow$__WUJIE4.id;
      rawSetAttribute.call(this, name, appId ? wrapInlineEventHandler(value, appId) : value);
    } else {
      rawSetAttribute.call(this, name, value);
    }
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJyZW5kZXJFbGVtZW50VG9Db250YWluZXIiLCJzeW5jVXJsVG9XaW5kb3ciLCJmaXhFbGVtZW50Q3RyU3JjT3JIcmVmIiwiaXNDb25zdHJ1Y3RhYmxlIiwiYW5jaG9yRWxlbWVudEdlbmVyYXRvciIsImlzTWF0Y2hTeW5jUXVlcnlCeUlkIiwiaXNGdW5jdGlvbiIsIndhcm4iLCJlcnJvciIsImV4ZWNIb29rcyIsImdldEN1clVybCIsImdldEFic29sdXRlUGF0aCIsInNldEF0dHJzVG9FbGVtZW50Iiwic2V0VGFnVG9TY3JpcHQiLCJnZXRUYWdGcm9tU2NyaXB0IiwiZG9jdW1lbnRQcm94eVByb3BlcnRpZXMiLCJyYXdBZGRFdmVudExpc3RlbmVyIiwicmF3UmVtb3ZlRXZlbnRMaXN0ZW5lciIsInJhd0RvY3VtZW50UXVlcnlTZWxlY3RvciIsIm1haW5Eb2N1bWVudEFkZEV2ZW50TGlzdGVuZXJFdmVudHMiLCJtYWluQW5kQXBwQWRkRXZlbnRMaXN0ZW5lckV2ZW50cyIsImFwcERvY3VtZW50QWRkRXZlbnRMaXN0ZW5lckV2ZW50cyIsImFwcERvY3VtZW50T25FdmVudHMiLCJhcHBXaW5kb3dBZGRFdmVudExpc3RlbmVyRXZlbnRzIiwiYXBwV2luZG93T25FdmVudCIsIndpbmRvd1Byb3h5UHJvcGVydGllcyIsIndpbmRvd1JlZ1doaXRlTGlzdCIsInJhd1dpbmRvd0FkZEV2ZW50TGlzdGVuZXIiLCJyYXdXaW5kb3dSZW1vdmVFdmVudExpc3RlbmVyIiwiZ2V0SnNMb2FkZXIiLCJXVUpJRV9USVBTX1NDUklQVF9FUlJPUl9SRVFVRVNURUQiLCJXVUpJRV9EQVRBX0ZMQUciLCJleHRyYUluc3RhbmNlb2ZDb25zdHJ1Y3Rvck5hbWVzIiwiU2V0IiwicGF0Y2hJZnJhbWVFdmVudHMiLCJpZnJhbWVXaW5kb3ciLCJfX1dVSklFX0VWRU5UTElTVEVORVJfXyIsImFkZEV2ZW50TGlzdGVuZXIiLCJ0eXBlIiwibGlzdGVuZXIiLCJvcHRpb25zIiwiX19XVUpJRSIsInBsdWdpbnMiLCJhZGQiLCJjb25jYXQiLCJpZnJhbWVBZGRFdmVudExpc3RlbmVycyIsImluY2x1ZGVzIiwiX3R5cGVvZiIsInRhcmdldFdpbmRvdyIsImNhbGwiLCJ3aW5kb3ciLCJfX1dVSklFX1JBV19XSU5ET1dfXyIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJmb3JFYWNoIiwibyIsInBhdGNoSWZyYW1lVmFyaWFibGUiLCJ3dWppZSIsImFwcEhvc3RQYXRoIiwiX19XVUpJRV9QVUJMSUNfUEFUSF9fIiwiJHd1amllIiwicHJvdmlkZSIsInBhdGNoSWZyYW1lSGlzdG9yeSIsIm1haW5Ib3N0UGF0aCIsImhpc3RvcnkiLCJyYXdIaXN0b3J5UHVzaFN0YXRlIiwicHVzaFN0YXRlIiwicmF3SGlzdG9yeVJlcGxhY2VTdGF0ZSIsInJlcGxhY2VTdGF0ZSIsImRhdGEiLCJ0aXRsZSIsInVybCIsImJhc2VVcmwiLCJsb2NhdGlvbiIsInBhdGhuYW1lIiwic2VhcmNoIiwiaGFzaCIsIm1haW5VcmwiLCJyZXBsYWNlIiwiaWdub3JlRmxhZyIsInVuZGVmaW5lZCIsInVwZGF0ZUJhc2UiLCJfaWZyYW1lV2luZG93JGxvY2F0aW8iLCJVUkwiLCJocmVmIiwiYmFzZUVsZW1lbnQiLCJkb2N1bWVudCIsInNldEF0dHJpYnV0ZSIsInBhdGNoV2luZG93RWZmZWN0IiwicHJvY2Vzc1dpbmRvd1Byb3BlcnR5Iiwia2V5IiwidmFsdWUiLCJiaW5kIiwiZSIsIm1lc3NhZ2UiLCJPYmplY3QiLCJnZXRPd25Qcm9wZXJ0eU5hbWVzIiwiZGVmaW5lUHJvcGVydHkiLCJnZXQiLCJzYW5kYm94IiwiZGVncmFkZSIsImdldFNlbGVjdGlvbiIsInNvbWUiLCJyZWciLCJ0ZXN0IiwicGFyZW50Iiwid2luZG93T25FdmVudHMiLCJmaWx0ZXIiLCJwIiwiaWZyYW1lT25FdmVudHMiLCJkZXNjcmlwdG9yIiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIiwiZW51bWVyYWJsZSIsIndyaXRhYmxlIiwiY29uZmlndXJhYmxlIiwic2V0IiwiaGFuZGxlciIsIl9pZnJhbWVXaW5kb3ckX19XVUpJRSIsInRyYWNrZXIiLCJldmVudENsZWFudXBUcmFja2VyIiwidHJhY2tXaW5kb3dPbkV2ZW50IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJwYXRjaEluc3RhbmNlb2ZBY3Jvc3NSZWFsbXMiLCJpc0RvbUNvbnN0cnVjdG9yIiwibmFtZSIsImN0b3IiLCJwZWVyV2luZG93IiwiRXZlbnRUYXJnZXQiLCJFdmVudCIsImhhcyIsImFyZ3VtZW50cyIsImxlbmd0aCIsIm5hdGl2ZUhhc0luc3RhbmNlIiwiRnVuY3Rpb24iLCJTeW1ib2wiLCJoYXNJbnN0YW5jZSIsInRhcmdldENvbnN0cnVjdG9yIiwicGVlckNvbnN0cnVjdG9yIiwiZGVmaW5lUHJvcGVydGllcyIsIl9kZWZpbmVQcm9wZXJ0eSIsImVsZW1lbnQiLCJjb25zb2xlIiwicGF0Y2hEZWdyYWRlSW5zdGFuY2VvZkFjcm9zc1JlYWxtcyIsImFwcFdpbmRvdyIsInJlbmRlcldpbmRvdyIsInJlY29yZEV2ZW50TGlzdGVuZXJzIiwiTm9kZSIsImVsZW1lbnRMaXN0ZW5lckxpc3QiLCJlbGVtZW50RXZlbnRDYWNoZU1hcCIsImZpbmQiLCJwdXNoIiwiaW5kZXgiLCJmaW5kSW5kZXgiLCJlbGUiLCJzcGxpY2UiLCJyZWNvdmVyRXZlbnRMaXN0ZW5lcnMiLCJyb290RWxlbWVudCIsIldlYWtNYXAiLCJFbGVtZW50SXRlcmF0b3IiLCJjcmVhdGVUcmVlV2Fsa2VyIiwiTm9kZUZpbHRlciIsIlNIT1dfRUxFTUVOVCIsIm5leHRFbGVtZW50IiwiY3VycmVudE5vZGUiLCJuZXh0Tm9kZSIsInJlY292ZXJEb2N1bWVudExpc3RlbmVycyIsIm9sZFJvb3RFbGVtZW50IiwibmV3Um9vdEVsZW1lbnQiLCJwYXRjaEV2ZW50VGltZVN0YW1wIiwiY3JlYXRlRXZlbnQiLCJ0aW1lU3RhbXAiLCJwYXRjaERvY3VtZW50RWZmZWN0IiwiaGFuZGxlckNhbGxiYWNrTWFwIiwiaGFuZGxlclR5cGVNYXAiLCJEb2N1bWVudCIsImNhbGxiYWNrIiwidHlwZUxpc3QiLCJfc2FuZGJveCRldmVudENsZWFudXAiLCJ0cmFja01haW5Eb2N1bWVudExpc3RlbmVyIiwiX3NhbmRib3gkZXZlbnRDbGVhbnVwMiIsInNoYWRvd1Jvb3QiLCJpbmRleE9mIiwiX3NhbmRib3gkZXZlbnRDbGVhbnVwMyIsInVudHJhY2tNYWluRG9jdW1lbnRMaXN0ZW5lciIsIl9zYW5kYm94JGV2ZW50Q2xlYW51cDQiLCJlbGVtZW50T25FdmVudHMiLCJrZXlzIiwiSFRNTEVsZW1lbnQiLCJkb2N1bWVudE9uRXZlbnQiLCJmaXJzdEVsZW1lbnRDaGlsZCIsInZhbCIsIm93bmVyUHJvcGVydGllcyIsIm1vZGlmeVByb3BlcnRpZXMiLCJzaGFkb3dQcm9wZXJ0aWVzIiwic2hhZG93TWV0aG9kcyIsImRvY3VtZW50UHJvcGVydGllcyIsImRvY3VtZW50TWV0aG9kcyIsImRvY3VtZW50RXZlbnRzIiwicHJvcEtleSIsInByb3h5RG9jdW1lbnQiLCJkb2N1bWVudEV2ZW50QWN0aXZlTGlzdGVuZXJzIiwiTWFwIiwiZXZlbnRUeXBlIiwic2xpY2UiLCJ0YXJnZXREb2MiLCJwcmV2aW91cyIsIl9zYW5kYm94JGV2ZW50Q2xlYW51cDUiLCJfc2FuZGJveCRldmVudENsZWFudXA2IiwiYm91bmQiLCJwYXRjaE5vZGVFZmZlY3QiLCJyYXdHZXRSb290Tm9kZSIsImdldFJvb3ROb2RlIiwicmF3QXBwZW5kQ2hpbGQiLCJhcHBlbmRDaGlsZCIsInJhd0luc2VydFJ1bGUiLCJpbnNlcnRCZWZvcmUiLCJyYXdSZW1vdmVDaGlsZCIsInJlbW92ZUNoaWxkIiwicm9vdE5vZGUiLCJub2RlIiwicmVzIiwicGF0Y2hFbGVtZW50RWZmZWN0IiwiY2hpbGQiLCJfbm9kZSRwYXJlbnROb2RlIiwibm9kZU5hbWUiLCJ0b0xvd2VyQ2FzZSIsImlzQ29ubmVjdGVkIiwicGFyZW50Tm9kZSIsInBhdGNoUmVsYXRpdmVVcmxFZmZlY3QiLCJIVE1MSW1hZ2VFbGVtZW50IiwiSFRNTEFuY2hvckVsZW1lbnQiLCJIVE1MU291cmNlRWxlbWVudCIsIkhUTUxMaW5rRWxlbWVudCIsIkhUTUxTY3JpcHRFbGVtZW50IiwiSFRNTE1lZGlhRWxlbWVudCIsImluaXRCYXNlIiwiaWZyYW1lRG9jdW1lbnQiLCJoZWFkIiwicXVlcnlTZWxlY3RvciIsImNyZWF0ZUVsZW1lbnQiLCJpZnJhbWVVcmxFbGVtZW50IiwiYXBwVXJsRWxlbWVudCIsInJlc29sdmVkUGF0aG5hbWUiLCJwcm90b2NvbCIsImhvc3QiLCJmaXJzdENoaWxkIiwiaW5pdElmcmFtZURvbSIsIm5ld0RvYyIsImltcGxlbWVudGF0aW9uIiwiY3JlYXRlSFRNTERvY3VtZW50IiwibmV3RG9jdW1lbnRFbGVtZW50IiwiaW1wb3J0Tm9kZSIsImRvY3VtZW50RWxlbWVudCIsInJlcGxhY2VDaGlsZCIsIl9fV1VKSUVfUkFXX0RPQ1VNRU5UX0hFQURfXyIsIl9fV1VKSUVfUkFXX0RPQ1VNRU5UX1FVRVJZX1NFTEVDVE9SX18iLCJfX1dVSklFX1JBV19ET0NVTUVOVF9RVUVSWV9TRUxFQ1RPUl9BTExfXyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJfX1dVSklFX1JBV19ET0NVTUVOVF9DUkVBVEVfRUxFTUVOVF9fIiwiX19XVUpJRV9SQVdfRE9DVU1FTlRfQ1JFQVRFX1RFWFRfTk9ERV9fIiwiY3JlYXRlVGV4dE5vZGUiLCJzeW5jSWZyYW1lVXJsVG9XaW5kb3ciLCJwYXRjaFNldEF0dHJpYnV0ZSIsInN0b3BJZnJhbWVMb2FkaW5nIiwiaWZyYW1lIiwiY29udGVudFdpbmRvdyIsIlByb21pc2UiLCJyZXNvbHZlIiwiZG9uZSIsInJ1blRyaWNrIiwicHJldmlvdXNIcmVmIiwib3BlbiIsImNsb3NlIiwiZmFsbGJhY2tTcmMiLCJyZW1vdmVBdHRyaWJ1dGUiLCJzcmMiLCJ0aGVuIiwib25jZSIsInNldFRpbWVvdXQiLCJvbGREb2MiLCJsb29wRGVhZGxpbmUiLCJEYXRlIiwibm93IiwibG9vcCIsImVyciIsInN0b3AiLCJleGVjQ29tbWFuZCIsIl9oYXNQYXRjaCIsIkhhc1dlYWtSZWYiLCJnbG9iYWxUaGlzIiwiV2Vha1JlZiIsImlmcmFtZVdpbmRvd1JlZiIsImRlcmVmIiwiYmFzZVVSSSIsIl93aW4kX19XVUpJRSIsIndpbiIsInByb3h5TG9jYXRpb24iLCJvd25lckRvY3VtZW50IiwiY29tcGlsZUlubGluZUV2ZW50cyIsImluc2VydFNjcmlwdFRvSWZyYW1lIiwic2NyaXB0UmVzdWx0IiwicmF3RWxlbWVudCIsIl9yZWYiLCJtb2R1bGUiLCJjb250ZW50IiwiY3Jvc3NvcmlnaW4iLCJjcm9zc29yaWdpblR5cGUiLCJhc3luYyIsImF0dHJzIiwib25sb2FkIiwic2NyaXB0RWxlbWVudCIsIm5leHRTY3JpcHRFbGVtZW50IiwiX2lmcmFtZVdpbmRvdyRfX1dVSklFMiIsImpzTG9hZGVyIiwiY29kZSIsIlN0cmluZyIsInRleHRDb250ZW50IiwiY29udGFpbmVyIiwiZXhlY05leHRTY3JpcHQiLCJhZnRlckV4ZWNTY3JpcHQiLCJzYW5kYm94Rm9yQ2xlYW51cCIsIkFycmF5IiwiaXNBcnJheSIsImR5bmFtaWNTY3JpcHRFbGVtZW50cyIsImlzT3V0bGluZVNjcmlwdCIsIm9uZXJyb3IiLCJyZW5kZXJJZnJhbWVSZXBsYWNlQXBwIiwiZGVncmFkZUF0dHJzIiwiZGVmYXVsdFN0eWxlIiwiX29iamVjdFNwcmVhZCIsInN0eWxlIiwiam9pbiIsIlNBTkRCT1hfRU1QVFlfU1JDRE9DIiwiaWZyYW1lR2VuZXJhdG9yIiwiYXBwUm91dGVQYXRoIiwiX3JlZjIiLCJ1c2VyRmFsbGJhY2tTcmMiLCJyZXN0QXR0cnMiLCJfb2JqZWN0V2l0aG91dFByb3BlcnRpZXMiLCJfZXhjbHVkZWQiLCJhdHRyc01lcmdlIiwiaWQiLCJib2R5IiwiaWZyYW1lUmVhZHkiLCJXVUpJRV9JTkxJTkVfRVZFTlRfUFJFRklYIiwid3JhcElubGluZUV2ZW50SGFuZGxlciIsImFwcElkIiwic3RhcnRzV2l0aCIsIl9pZnJhbWVXaW5kb3ckX19XVUpJRTMiLCJub2RlVHlwZSIsIkVMRU1FTlRfTk9ERSIsImF0dHJpYnV0ZXMiLCJmcm9tIiwiYXR0ciIsImNvbXBpbGVkSGFuZGxlciIsImNoaWxkcmVuIiwicmF3U2V0QXR0cmlidXRlIiwiRWxlbWVudCIsIl9pZnJhbWVXaW5kb3ckX19XVUpJRTQiXSwic291cmNlcyI6WyIuLi9zcmMvaWZyYW1lLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBXdUppZSBmcm9tIFwiLi9zYW5kYm94XCI7XG5pbXBvcnQgeyBTY3JpcHRPYmplY3QgfSBmcm9tIFwiLi90ZW1wbGF0ZVwiO1xuaW1wb3J0IHsgcmVuZGVyRWxlbWVudFRvQ29udGFpbmVyIH0gZnJvbSBcIi4vc2hhZG93XCI7XG5pbXBvcnQgeyBzeW5jVXJsVG9XaW5kb3cgfSBmcm9tIFwiLi9zeW5jXCI7XG5pbXBvcnQge1xuICBmaXhFbGVtZW50Q3RyU3JjT3JIcmVmLFxuICBpc0NvbnN0cnVjdGFibGUsXG4gIGFuY2hvckVsZW1lbnRHZW5lcmF0b3IsXG4gIGlzTWF0Y2hTeW5jUXVlcnlCeUlkLFxuICBpc0Z1bmN0aW9uLFxuICB3YXJuLFxuICBlcnJvcixcbiAgZXhlY0hvb2tzLFxuICBnZXRDdXJVcmwsXG4gIGdldEFic29sdXRlUGF0aCxcbiAgc2V0QXR0cnNUb0VsZW1lbnQsXG4gIHNldFRhZ1RvU2NyaXB0LFxuICBnZXRUYWdGcm9tU2NyaXB0LFxufSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IHtcbiAgZG9jdW1lbnRQcm94eVByb3BlcnRpZXMsXG4gIHJhd0FkZEV2ZW50TGlzdGVuZXIsXG4gIHJhd1JlbW92ZUV2ZW50TGlzdGVuZXIsXG4gIHJhd0RvY3VtZW50UXVlcnlTZWxlY3RvcixcbiAgbWFpbkRvY3VtZW50QWRkRXZlbnRMaXN0ZW5lckV2ZW50cyxcbiAgbWFpbkFuZEFwcEFkZEV2ZW50TGlzdGVuZXJFdmVudHMsXG4gIGFwcERvY3VtZW50QWRkRXZlbnRMaXN0ZW5lckV2ZW50cyxcbiAgYXBwRG9jdW1lbnRPbkV2ZW50cyxcbiAgYXBwV2luZG93QWRkRXZlbnRMaXN0ZW5lckV2ZW50cyxcbiAgYXBwV2luZG93T25FdmVudCxcbiAgd2luZG93UHJveHlQcm9wZXJ0aWVzLFxuICB3aW5kb3dSZWdXaGl0ZUxpc3QsXG4gIHJhd1dpbmRvd0FkZEV2ZW50TGlzdGVuZXIsXG4gIHJhd1dpbmRvd1JlbW92ZUV2ZW50TGlzdGVuZXIsXG59IGZyb20gXCIuL2NvbW1vblwiO1xuaW1wb3J0IHR5cGUgeyBhcHBBZGRFdmVudExpc3RlbmVyT3B0aW9ucyB9IGZyb20gXCIuL2NvbW1vblwiO1xuaW1wb3J0IHsgZ2V0SnNMb2FkZXIgfSBmcm9tIFwiLi9wbHVnaW5cIjtcbmltcG9ydCB7IFdVSklFX1RJUFNfU0NSSVBUX0VSUk9SX1JFUVVFU1RFRCwgV1VKSUVfREFUQV9GTEFHIH0gZnJvbSBcIi4vY29uc3RhbnRcIjtcbmltcG9ydCB7IFNjcmlwdE9iamVjdExvYWRlciB9IGZyb20gXCIuL2luZGV4XCI7XG5cbmNvbnN0IGV4dHJhSW5zdGFuY2VvZkNvbnN0cnVjdG9yTmFtZXMgPSBuZXcgU2V0KFtcbiAgXCJDbGlwYm9hcmRFdmVudFwiLFxuICBcIkNTU1N0eWxlRGVjbGFyYXRpb25cIixcbiAgXCJEYXRhVHJhbnNmZXJcIixcbiAgXCJET01JbXBsZW1lbnRhdGlvblwiLFxuICBcIkRPTU1hdHJpeFwiLFxuICBcIkRPTU1hdHJpeFJlYWRPbmx5XCIsXG4gIFwiRE9NUGFyc2VyXCIsXG4gIFwiRE9NUG9pbnRcIixcbiAgXCJET01Qb2ludFJlYWRPbmx5XCIsXG4gIFwiRE9NUXVhZFwiLFxuICBcIkRPTVJlY3RcIixcbiAgXCJET01SZWN0TGlzdFwiLFxuICBcIkRPTVJlY3RSZWFkT25seVwiLFxuICBcIkRPTVN0cmluZ0xpc3RcIixcbiAgXCJET01TdHJpbmdNYXBcIixcbiAgXCJET01Ub2tlbkxpc3RcIixcbiAgXCJIVE1MQ29sbGVjdGlvblwiLFxuICBcIk1lZGlhTGlzdFwiLFxuICBcIk5hbWVkTm9kZU1hcFwiLFxuICBcIlJhbmdlXCIsXG4gIFwiU2VsZWN0aW9uXCIsXG4gIFwiU3R5bGVTaGVldFwiLFxuICBcIlN0eWxlU2hlZXRMaXN0XCIsXG4gIFwiVGV4dERlY29kZXJcIixcbiAgXCJUZXh0RW5jb2RlclwiLFxuICBcIlRpbWVSYW5nZXNcIixcbl0pO1xuXG5kZWNsYXJlIGdsb2JhbCB7XG4gIGludGVyZmFjZSBXaW5kb3cge1xuICAgIC8vIOaYr+WQpuWtmOWcqOaXoOeVjFxuICAgIF9fUE9XRVJFRF9CWV9XVUpJRV9fPzogYm9vbGVhbjtcbiAgICAvLyDlrZDlupTnlKjlhazlhbHliqDovb3ot6/lvoRcbiAgICBfX1dVSklFX1BVQkxJQ19QQVRIX186IHN0cmluZztcbiAgICAvLyDljp/nlJ/nmoRxdWVyeVNlbGVjdG9yXG4gICAgX19XVUpJRV9SQVdfRE9DVU1FTlRfUVVFUllfU0VMRUNUT1JfXzogdHlwZW9mIERvY3VtZW50LnByb3RvdHlwZS5xdWVyeVNlbGVjdG9yO1xuXG4gICAgLy8gaWZyYW1l5YaF5Y6f55Sf55qEY3JlYXRlRWxlbWVudFxuICAgIF9fV1VKSUVfUkFXX0RPQ1VNRU5UX0NSRUFURV9FTEVNRU5UX186IHR5cGVvZiBEb2N1bWVudC5wcm90b3R5cGUuY3JlYXRlRWxlbWVudDtcblxuICAgIC8vIGlmcmFtZeWGheWOn+eUn+eahGNyZWF0ZVRleHROb2RlXG4gICAgX19XVUpJRV9SQVdfRE9DVU1FTlRfQ1JFQVRFX1RFWFRfTk9ERV9fOiB0eXBlb2YgRG9jdW1lbnQucHJvdG90eXBlLmNyZWF0ZVRleHROb2RlO1xuXG4gICAgLy8gaWZyYW1l5YaF5Y6f55Sf55qEaGVhZFxuICAgIF9fV1VKSUVfUkFXX0RPQ1VNRU5UX0hFQURfXzogdHlwZW9mIERvY3VtZW50LnByb3RvdHlwZS5oZWFkO1xuXG4gICAgLy8g5Y6f55Sf55qEcXVlcnlTZWxlY3RvclxuICAgIF9fV1VKSUVfUkFXX0RPQ1VNRU5UX1FVRVJZX1NFTEVDVE9SX0FMTF9fOiB0eXBlb2YgRG9jdW1lbnQucHJvdG90eXBlLnF1ZXJ5U2VsZWN0b3JBbGw7XG4gICAgLy8g5Y6f55Sf55qEd2luZG935a+56LGhXG4gICAgX19XVUpJRV9SQVdfV0lORE9XX186IFdpbmRvdztcbiAgICAvLyDlrZDlupTnlKjmspnnm5Llrp7kvotcbiAgICBfX1dVSklFOiBXdUppZTtcbiAgICAvLyDlrZDlupTnlKjlhbHkuqvkuIrkuIvmlodcbiAgICBfX1dVSklFX0lOSkVDVDogV3VKaWVbXCJpbmplY3RcIl07XG4gICAgLy8g6K6w5b2V5rOo5YaM5Zyo5Li75bqU55So5Lit55qE5LqL5Lu2XG4gICAgX19XVUpJRV9FVkVOVExJU1RFTkVSX186IFNldDx7IGxpc3RlbmVyOiBFdmVudExpc3RlbmVyT3JFdmVudExpc3RlbmVyT2JqZWN0OyB0eXBlOiBzdHJpbmc7IG9wdGlvbnM6IGFueSB9PjtcbiAgICAvLyDlrZDlupTnlKhtb3VudOWHveaVsFxuICAgIF9fV1VKSUVfTU9VTlQ6ICgpID0+IHZvaWQ7XG4gICAgLy8g5a2Q5bqU55SodW5tb3VudOWHveaVsFxuICAgIF9fV1VKSUVfVU5NT1VOVDogKCkgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG4gICAgLy8g6I635Y+W5a2Q5bqU55SoIHdpbmRvdyDnmoTovoXliqnlh73mlbDvvIjnlKjkuo7lhoXogZTkuovku7blpITnkIblmajvvInvvIzlhaXlj4LkuLrlrZDlupTnlKggYXBwSWRcbiAgICBfX2dldFd1amllV2luZG93X186IChhcHBJZDogc3RyaW5nKSA9PiBXaW5kb3dQcm94eTtcbiAgICAvLyBkb2N1bWVudCB0eXBlXG4gICAgRG9jdW1lbnQ6IHR5cGVvZiBEb2N1bWVudDtcbiAgICAvLyBpbWcgdHlwZVxuICAgIEhUTUxJbWFnZUVsZW1lbnQ6IHR5cGVvZiBIVE1MSW1hZ2VFbGVtZW50O1xuICAgIC8vIG5vZGUgdHlwZVxuICAgIE5vZGU6IHR5cGVvZiBOb2RlO1xuICAgIC8vIGVsZW1lbnQgdHlwZVxuICAgIEVsZW1lbnQ6IHR5cGVvZiBFbGVtZW50O1xuICAgIC8vIGh0bWxFbGVtZW50IHR5cGVvZlxuICAgIEhUTUxFbGVtZW50OiB0eXBlb2YgSFRNTEVsZW1lbnQ7XG4gICAgLy8gYW5jaG9yIHR5cGVcbiAgICBIVE1MQW5jaG9yRWxlbWVudDogdHlwZW9mIEhUTUxBbmNob3JFbGVtZW50O1xuICAgIC8vIHNvdXJjZSB0eXBlXG4gICAgSFRNTFNvdXJjZUVsZW1lbnQ6IHR5cGVvZiBIVE1MU291cmNlRWxlbWVudDtcbiAgICAvLyBsaW5rIHR5cGVcbiAgICBIVE1MTGlua0VsZW1lbnQ6IHR5cGVvZiBIVE1MTGlua0VsZW1lbnQ7XG4gICAgLy8gc2NyaXB0IHR5cGVcbiAgICBIVE1MU2NyaXB0RWxlbWVudDogdHlwZW9mIEhUTUxTY3JpcHRFbGVtZW50O1xuICAgIC8vIG1lZGlhIHR5cGVcbiAgICBIVE1MTWVkaWFFbGVtZW50OiB0eXBlb2YgSFRNTE1lZGlhRWxlbWVudDtcbiAgICBFdmVudFRhcmdldDogdHlwZW9mIEV2ZW50VGFyZ2V0O1xuICAgIEV2ZW50OiB0eXBlb2YgRXZlbnQ7XG4gICAgU2hhZG93Um9vdDogdHlwZW9mIFNoYWRvd1Jvb3Q7XG4gICAgLy8g5rOo5YWl5a+56LGhXG4gICAgJHd1amllOiB7IFtrZXk6IHN0cmluZ106IGFueSB9O1xuICB9XG4gIGludGVyZmFjZSBIVE1MSGVhZEVsZW1lbnQge1xuICAgIF9jYWNoZUxpc3RlbmVyczogTWFwPHN0cmluZywgRXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdFtdPjtcbiAgfVxuICBpbnRlcmZhY2UgSFRNTEJvZHlFbGVtZW50IHtcbiAgICBfY2FjaGVMaXN0ZW5lcnM6IE1hcDxzdHJpbmcsIEV2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3RbXT47XG4gIH1cbiAgaW50ZXJmYWNlIERvY3VtZW50IHtcbiAgICBjcmVhdGVUcmVlV2Fsa2VyKFxuICAgICAgcm9vdDogTm9kZSxcbiAgICAgIHdoYXRUb1Nob3c/OiBudW1iZXIsXG4gICAgICBmaWx0ZXI/OiBOb2RlRmlsdGVyIHwgbnVsbCxcbiAgICAgIGVudGl0eVJlZmVyZW5jZUV4cGFuc2lvbj86IGJvb2xlYW5cbiAgICApOiBUcmVlV2Fsa2VyO1xuICB9XG59XG5cbi8qKlxuICog5L+u5pS5d2luZG935a+56LGh55qE5LqL5Lu255uR5ZCs77yM5Y+q5pyJ6Lev55Sx5LqL5Lu26YeH55SoaWZyYW1l55qE5LqL5Lu2XG4gKi9cbmZ1bmN0aW9uIHBhdGNoSWZyYW1lRXZlbnRzKGlmcmFtZVdpbmRvdzogV2luZG93KSB7XG4gIGlmcmFtZVdpbmRvdy5fX1dVSklFX0VWRU5UTElTVEVORVJfXyA9IGlmcmFtZVdpbmRvdy5fX1dVSklFX0VWRU5UTElTVEVORVJfXyB8fCBuZXcgU2V0KCk7XG4gIGlmcmFtZVdpbmRvdy5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gYWRkRXZlbnRMaXN0ZW5lcjxLIGV4dGVuZHMga2V5b2YgV2luZG93RXZlbnRNYXA+KFxuICAgIHR5cGU6IEssXG4gICAgbGlzdGVuZXI6ICh0aGlzOiBXaW5kb3csIGV2OiBXaW5kb3dFdmVudE1hcFtLXSkgPT4gYW55LFxuICAgIG9wdGlvbnM/OiBib29sZWFuIHwgYXBwQWRkRXZlbnRMaXN0ZW5lck9wdGlvbnNcbiAgKSB7XG4gICAgLy8g6L+Q6KGM5o+S5Lu26ZKp5a2Q5Ye95pWwXG4gICAgZXhlY0hvb2tzKGlmcmFtZVdpbmRvdy5fX1dVSklFLnBsdWdpbnMsIFwid2luZG93QWRkRXZlbnRMaXN0ZW5lckhvb2tcIiwgaWZyYW1lV2luZG93LCB0eXBlLCBsaXN0ZW5lciwgb3B0aW9ucyk7XG4gICAgLy8g55u45ZCM5Y+C5pWw5aSa5qyh6LCD55SoIGFkZEV2ZW50TGlzdGVuZXIg5LiN5Lya5a+86Ie06YeN5aSN5rOo5YaM77yM5omA5Lul55Soc2V044CCXG4gICAgaWZyYW1lV2luZG93Ll9fV1VKSUVfRVZFTlRMSVNURU5FUl9fLmFkZCh7IHR5cGUsIGxpc3RlbmVyLCBvcHRpb25zIH0pO1xuICAgIGlmIChcbiAgICAgIGFwcFdpbmRvd0FkZEV2ZW50TGlzdGVuZXJFdmVudHMuY29uY2F0KGlmcmFtZVdpbmRvdy5fX1dVSklFLmlmcmFtZUFkZEV2ZW50TGlzdGVuZXJzKS5pbmNsdWRlcyh0eXBlKSB8fFxuICAgICAgKHR5cGVvZiBvcHRpb25zID09PSBcIm9iamVjdFwiICYmIG9wdGlvbnMudGFyZ2V0V2luZG93KVxuICAgICkge1xuICAgICAgY29uc3QgdGFyZ2V0V2luZG93ID0gdHlwZW9mIG9wdGlvbnMgPT09IFwib2JqZWN0XCIgJiYgb3B0aW9ucy50YXJnZXRXaW5kb3cgPyBvcHRpb25zPy50YXJnZXRXaW5kb3cgOiBpZnJhbWVXaW5kb3c7XG4gICAgICByZXR1cm4gcmF3V2luZG93QWRkRXZlbnRMaXN0ZW5lci5jYWxsKHRhcmdldFdpbmRvdywgdHlwZSwgbGlzdGVuZXIsIG9wdGlvbnMpO1xuICAgIH1cbiAgICAvLyDlnKjlrZDlupTnlKjltYzlpZflnLrmma/kvb/nlKh3aW5kb3cud2luZG936I635Y+W55yf5a6ed2luZG93XG4gICAgcmF3V2luZG93QWRkRXZlbnRMaXN0ZW5lci5jYWxsKHdpbmRvdy5fX1dVSklFX1JBV19XSU5ET1dfXyB8fCB3aW5kb3csIHR5cGUsIGxpc3RlbmVyLCBvcHRpb25zKTtcbiAgfTtcblxuICBpZnJhbWVXaW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUV2ZW50TGlzdGVuZXI8SyBleHRlbmRzIGtleW9mIFdpbmRvd0V2ZW50TWFwPihcbiAgICB0eXBlOiBLLFxuICAgIGxpc3RlbmVyOiAodGhpczogV2luZG93LCBldjogV2luZG93RXZlbnRNYXBbS10pID0+IGFueSxcbiAgICBvcHRpb25zPzogYm9vbGVhbiB8IGFwcEFkZEV2ZW50TGlzdGVuZXJPcHRpb25zXG4gICkge1xuICAgIC8vIOi/kOihjOaPkuS7tumSqeWtkOWHveaVsFxuICAgIGV4ZWNIb29rcyhpZnJhbWVXaW5kb3cuX19XVUpJRS5wbHVnaW5zLCBcIndpbmRvd1JlbW92ZUV2ZW50TGlzdGVuZXJIb29rXCIsIGlmcmFtZVdpbmRvdywgdHlwZSwgbGlzdGVuZXIsIG9wdGlvbnMpO1xuICAgIGlmcmFtZVdpbmRvdy5fX1dVSklFX0VWRU5UTElTVEVORVJfXy5mb3JFYWNoKChvKSA9PiB7XG4gICAgICAvLyDov5nph4zkuKXmoLzkuIDngrnvvIznoa7kv53lrZDlupTnlKjplIDmr4HnmoTml7blgJnpg73og73plIDmr4FcbiAgICAgIGlmIChvLmxpc3RlbmVyID09PSBsaXN0ZW5lciAmJiBvLnR5cGUgPT09IHR5cGUgJiYgb3B0aW9ucyA9PSBvLm9wdGlvbnMpIHtcbiAgICAgICAgaWZyYW1lV2luZG93Ll9fV1VKSUVfRVZFTlRMSVNURU5FUl9fLmRlbGV0ZShvKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoXG4gICAgICBhcHBXaW5kb3dBZGRFdmVudExpc3RlbmVyRXZlbnRzLmNvbmNhdChpZnJhbWVXaW5kb3cuX19XVUpJRS5pZnJhbWVBZGRFdmVudExpc3RlbmVycykuaW5jbHVkZXModHlwZSkgfHxcbiAgICAgICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJvYmplY3RcIiAmJiBvcHRpb25zLnRhcmdldFdpbmRvdylcbiAgICApIHtcbiAgICAgIGNvbnN0IHRhcmdldFdpbmRvdyA9IHR5cGVvZiBvcHRpb25zID09PSBcIm9iamVjdFwiICYmIG9wdGlvbnMudGFyZ2V0V2luZG93ID8gb3B0aW9ucz8udGFyZ2V0V2luZG93IDogaWZyYW1lV2luZG93O1xuICAgICAgcmV0dXJuIHJhd1dpbmRvd1JlbW92ZUV2ZW50TGlzdGVuZXIuY2FsbCh0YXJnZXRXaW5kb3csIHR5cGUsIGxpc3RlbmVyLCBvcHRpb25zKTtcbiAgICB9XG4gICAgcmF3V2luZG93UmVtb3ZlRXZlbnRMaXN0ZW5lci5jYWxsKHdpbmRvdy5fX1dVSklFX1JBV19XSU5ET1dfXyB8fCB3aW5kb3csIHR5cGUsIGxpc3RlbmVyLCBvcHRpb25zKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcGF0Y2hJZnJhbWVWYXJpYWJsZShpZnJhbWVXaW5kb3c6IFdpbmRvdywgd3VqaWU6IFd1SmllLCBhcHBIb3N0UGF0aDogc3RyaW5nKTogdm9pZCB7XG4gIGlmcmFtZVdpbmRvdy5fX1dVSklFID0gd3VqaWU7XG4gIGlmcmFtZVdpbmRvdy5fX1dVSklFX1BVQkxJQ19QQVRIX18gPSBhcHBIb3N0UGF0aCArIFwiL1wiO1xuICBpZnJhbWVXaW5kb3cuJHd1amllID0gd3VqaWUucHJvdmlkZTtcbiAgaWZyYW1lV2luZG93Ll9fV1VKSUVfUkFXX1dJTkRPV19fID0gaWZyYW1lV2luZG93O1xufVxuXG4vKipcbiAqIOWvuWlmcmFtZeeahGhpc3RvcnnnmoRwdXNoU3RhdGXlkoxyZXBsYWNlU3RhdGXov5vooYzkv67mlLlcbiAqIOWwhuS7jmxvY2F0aW9u5Yqr5oyB5ZCO55qE5pWw5o2u5L+u5pS55Zue5p2l77yM6Ziy5q2i6Leo5Z+f6ZSZ6K+vXG4gKiDlkIzmraXot6/nlLHliLDkuLvlupTnlKhcbiAqIEBwYXJhbSBpZnJhbWVXaW5kb3dcbiAqIEBwYXJhbSBhcHBIb3N0UGF0aCDlrZDlupTnlKjnmoQgaG9zdCBwYXRoXG4gKiBAcGFyYW0gbWFpbkhvc3RQYXRoIOS4u+W6lOeUqOeahCBob3N0IHBhdGhcbiAqL1xuZnVuY3Rpb24gcGF0Y2hJZnJhbWVIaXN0b3J5KGlmcmFtZVdpbmRvdzogV2luZG93LCBhcHBIb3N0UGF0aDogc3RyaW5nLCBtYWluSG9zdFBhdGg6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBoaXN0b3J5ID0gaWZyYW1lV2luZG93Lmhpc3Rvcnk7XG4gIGNvbnN0IHJhd0hpc3RvcnlQdXNoU3RhdGUgPSBoaXN0b3J5LnB1c2hTdGF0ZTtcbiAgY29uc3QgcmF3SGlzdG9yeVJlcGxhY2VTdGF0ZSA9IGhpc3RvcnkucmVwbGFjZVN0YXRlO1xuICBoaXN0b3J5LnB1c2hTdGF0ZSA9IGZ1bmN0aW9uIChkYXRhOiBhbnksIHRpdGxlOiBzdHJpbmcsIHVybD86IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGJhc2VVcmwgPVxuICAgICAgbWFpbkhvc3RQYXRoICsgaWZyYW1lV2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgaWZyYW1lV2luZG93LmxvY2F0aW9uLnNlYXJjaCArIGlmcmFtZVdpbmRvdy5sb2NhdGlvbi5oYXNoO1xuICAgIGNvbnN0IG1haW5VcmwgPSBnZXRBYnNvbHV0ZVBhdGgodXJsPy5yZXBsYWNlKGFwcEhvc3RQYXRoLCBcIlwiKSwgYmFzZVVybCk7XG4gICAgY29uc3QgaWdub3JlRmxhZyA9IHVybCA9PT0gdW5kZWZpbmVkO1xuXG4gICAgcmF3SGlzdG9yeVB1c2hTdGF0ZS5jYWxsKGhpc3RvcnksIGRhdGEsIHRpdGxlLCBpZ25vcmVGbGFnID8gdW5kZWZpbmVkIDogbWFpblVybCk7XG4gICAgaWYgKGlnbm9yZUZsYWcpIHJldHVybjtcbiAgICB1cGRhdGVCYXNlKGlmcmFtZVdpbmRvdywgYXBwSG9zdFBhdGgsIG1haW5Ib3N0UGF0aCk7XG4gICAgc3luY1VybFRvV2luZG93KGlmcmFtZVdpbmRvdyk7XG4gIH07XG4gIGhpc3RvcnkucmVwbGFjZVN0YXRlID0gZnVuY3Rpb24gKGRhdGE6IGFueSwgdGl0bGU6IHN0cmluZywgdXJsPzogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgYmFzZVVybCA9XG4gICAgICBtYWluSG9zdFBhdGggKyBpZnJhbWVXaW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyBpZnJhbWVXaW5kb3cubG9jYXRpb24uc2VhcmNoICsgaWZyYW1lV2luZG93LmxvY2F0aW9uLmhhc2g7XG4gICAgY29uc3QgbWFpblVybCA9IGdldEFic29sdXRlUGF0aCh1cmw/LnJlcGxhY2UoYXBwSG9zdFBhdGgsIFwiXCIpLCBiYXNlVXJsKTtcbiAgICBjb25zdCBpZ25vcmVGbGFnID0gdXJsID09PSB1bmRlZmluZWQ7XG5cbiAgICByYXdIaXN0b3J5UmVwbGFjZVN0YXRlLmNhbGwoaGlzdG9yeSwgZGF0YSwgdGl0bGUsIGlnbm9yZUZsYWcgPyB1bmRlZmluZWQgOiBtYWluVXJsKTtcbiAgICBpZiAoaWdub3JlRmxhZykgcmV0dXJuO1xuICAgIHVwZGF0ZUJhc2UoaWZyYW1lV2luZG93LCBhcHBIb3N0UGF0aCwgbWFpbkhvc3RQYXRoKTtcbiAgICBzeW5jVXJsVG9XaW5kb3coaWZyYW1lV2luZG93KTtcbiAgfTtcbn1cblxuLyoqXG4gKiDliqjmgIHnmoTkv67mlLlpZnJhbWXnmoRiYXNl5Zyw5Z2AXG4gKiBAcGFyYW0gaWZyYW1lV2luZG93XG4gKiBAcGFyYW0gYXBwSG9zdFBhdGhcbiAqIEBwYXJhbSBtYWluSG9zdFBhdGhcbiAqL1xuZnVuY3Rpb24gdXBkYXRlQmFzZShpZnJhbWVXaW5kb3c6IFdpbmRvdywgYXBwSG9zdFBhdGg6IHN0cmluZywgbWFpbkhvc3RQYXRoOiBzdHJpbmcpIHtcbiAgY29uc3QgYmFzZVVybCA9IG5ldyBVUkwoaWZyYW1lV2luZG93LmxvY2F0aW9uLmhyZWY/LnJlcGxhY2UobWFpbkhvc3RQYXRoLCBcIlwiKSwgYXBwSG9zdFBhdGgpO1xuICBjb25zdCBiYXNlRWxlbWVudCA9IHJhd0RvY3VtZW50UXVlcnlTZWxlY3Rvci5jYWxsKGlmcmFtZVdpbmRvdy5kb2N1bWVudCwgXCJiYXNlXCIpO1xuICBpZiAoYmFzZUVsZW1lbnQpIGJhc2VFbGVtZW50LnNldEF0dHJpYnV0ZShcImhyZWZcIiwgYXBwSG9zdFBhdGggKyBiYXNlVXJsLnBhdGhuYW1lKTtcbn1cblxuLyoqXG4gKiBwYXRjaCBpZnJhbWUgd2luZG93IGVmZmVjdFxuICogQHBhcmFtIGlmcmFtZVdpbmRvd1xuICovXG4vLyBUT0RPIOe7p+e7reaUuei/m1xuZXhwb3J0IGZ1bmN0aW9uIHBhdGNoV2luZG93RWZmZWN0KGlmcmFtZVdpbmRvdzogV2luZG93KTogdm9pZCB7XG4gIC8vIOWxnuaAp+WkhOeQhuWHveaVsFxuICBmdW5jdGlvbiBwcm9jZXNzV2luZG93UHJvcGVydHkoa2V5OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCB2YWx1ZSA9IGlmcmFtZVdpbmRvd1trZXldO1xuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCIgJiYgIWlzQ29uc3RydWN0YWJsZSh2YWx1ZSkpIHtcbiAgICAgICAgaWZyYW1lV2luZG93W2tleV0gPSB3aW5kb3dba2V5XS5iaW5kKHdpbmRvdyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZnJhbWVXaW5kb3dba2V5XSA9IHdpbmRvd1trZXldO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgd2FybihlLm1lc3NhZ2UpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhpZnJhbWVXaW5kb3cpLmZvckVhY2goKGtleSkgPT4ge1xuICAgIC8vIOeJueauiuWkhOeQhlxuICAgIGlmIChrZXkgPT09IFwiZ2V0U2VsZWN0aW9uXCIpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShpZnJhbWVXaW5kb3csIGtleSwge1xuICAgICAgICBnZXQ6ICgpID0+IHtcbiAgICAgICAgICBjb25zdCBzYW5kYm94ID0gaWZyYW1lV2luZG93Ll9fV1VKSUU7XG4gICAgICAgICAgLy8g6ZmN57qn5qih5byP77ya5Y+v6KeBIERPTSDlnKjmuLLmn5MgaWZyYW1l77yMZ2V0U2VsZWN0aW9uIOmcgOivuyBzYW5kYm94LmRvY3VtZW50XG4gICAgICAgICAgaWYgKHNhbmRib3g/LmRlZ3JhZGUgJiYgc2FuZGJveC5kb2N1bWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHNhbmRib3guZG9jdW1lbnQuZ2V0U2VsZWN0aW9uLmJpbmQoc2FuZGJveC5kb2N1bWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBpZnJhbWVXaW5kb3cuZG9jdW1lbnRba2V5XTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyDljZXni6zlsZ7mgKdcbiAgICBpZiAod2luZG93UHJveHlQcm9wZXJ0aWVzLmluY2x1ZGVzKGtleSkpIHtcbiAgICAgIHByb2Nlc3NXaW5kb3dQcm9wZXJ0eShrZXkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyDmraPliJnljLnphY3vvIzlj6/ku6XkuIDmrKHlpITnkIblpJrkuKpcbiAgICB3aW5kb3dSZWdXaGl0ZUxpc3Quc29tZSgocmVnKSA9PiB7XG4gICAgICBpZiAocmVnLnRlc3Qoa2V5KSAmJiBrZXkgaW4gaWZyYW1lV2luZG93LnBhcmVudCkge1xuICAgICAgICByZXR1cm4gcHJvY2Vzc1dpbmRvd1Byb3BlcnR5KGtleSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG4gIH0pO1xuICAvLyBvbkV2ZW50IHNldFxuICBjb25zdCB3aW5kb3dPbkV2ZW50cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHdpbmRvdylcbiAgICAuZmlsdGVyKChwKSA9PiAvXm9uLy50ZXN0KHApKVxuICAgIC5maWx0ZXIoKGUpID0+ICFhcHBXaW5kb3dPbkV2ZW50LmNvbmNhdChpZnJhbWVXaW5kb3cuX19XVUpJRS5pZnJhbWVPbkV2ZW50cykuaW5jbHVkZXMoZSkpO1xuXG4gIC8vIOi1sOS4u+W6lOeUqHdpbmRvd1xuICB3aW5kb3dPbkV2ZW50cy5mb3JFYWNoKChlKSA9PiB7XG4gICAgY29uc3QgZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoaWZyYW1lV2luZG93LCBlKSB8fCB7XG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgfTtcbiAgICB0cnkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGlmcmFtZVdpbmRvdywgZSwge1xuICAgICAgICBlbnVtZXJhYmxlOiBkZXNjcmlwdG9yLmVudW1lcmFibGUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZ2V0OiAoKSA9PiB3aW5kb3dbZV0sXG4gICAgICAgIHNldDpcbiAgICAgICAgICBkZXNjcmlwdG9yLndyaXRhYmxlIHx8IGRlc2NyaXB0b3Iuc2V0XG4gICAgICAgICAgICA/IChoYW5kbGVyKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8g6aaW5qyh5YaZ5YWl5pe26K6w5b2V5Li7IHdpbmRvdyDkuIogb25YWFgg55qE5Y6f5aeL5YC877ybZGVzdHJveSDml7bpgJrov4cgc2V0dGVyXG4gICAgICAgICAgICAgICAgLy8g6L+Y5Y6f77yIYWNjZXNzb3Ig5LiN6IO955SoIGRlZmluZVByb3BlcnR5IGRlc2NyaXB0b3Ig55u05o6l6L+Y5Y6f5YaF6YOoIGhhbmRsZXLvvInvvIxcbiAgICAgICAgICAgICAgICAvLyDpmLLmraLkuLvlupTnlKggd2luZG93IOiiqyBkYW5nbGluZyBoYW5kbGVyIOmVv+acn+axoeafk+OAglxuICAgICAgICAgICAgICAgIGNvbnN0IHRyYWNrZXIgPSBpZnJhbWVXaW5kb3cuX19XVUpJRT8uZXZlbnRDbGVhbnVwVHJhY2tlcjtcbiAgICAgICAgICAgICAgICB0cmFja2VyPy50cmFja1dpbmRvd09uRXZlbnQoZSwgd2luZG93W2VdLCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwod2luZG93LCBlKSk7XG4gICAgICAgICAgICAgICAgd2luZG93W2VdID0gdHlwZW9mIGhhbmRsZXIgPT09IFwiZnVuY3Rpb25cIiA/IGhhbmRsZXIuYmluZChpZnJhbWVXaW5kb3cpIDogaGFuZGxlcjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB3YXJuKGUubWVzc2FnZSk7XG4gICAgfVxuICB9KTtcbiAgLy8g6ZmN57qn5qih5byPIERPTSDlnKjmuLLmn5MgaWZyYW1l77yMaW5zdGFuY2VvZiDpnIDlnKggZG9jdW1lbnQg5bCx57uq5ZCO55SxIHBhdGNoRGVncmFkZUluc3RhbmNlb2ZBY3Jvc3NSZWFsbXMg5aSE55CGXG4gIGlmICghaWZyYW1lV2luZG93Ll9fV1VKSUUuZGVncmFkZSkge1xuICAgIHBhdGNoSW5zdGFuY2VvZkFjcm9zc1JlYWxtcyhpZnJhbWVXaW5kb3cpO1xuICB9IGVsc2Uge1xuICAgIGV4ZWNIb29rcyhpZnJhbWVXaW5kb3cuX19XVUpJRS5wbHVnaW5zLCBcIndpbmRvd1Byb3BlcnR5T3ZlcnJpZGVcIiwgaWZyYW1lV2luZG93KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0RvbUNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgY3RvcjogRnVuY3Rpb24sIHBlZXJXaW5kb3c6IFdpbmRvdyk6IGJvb2xlYW4ge1xuICBjb25zdCBwcm90b3R5cGUgPSBjdG9yLnByb3RvdHlwZTtcbiAgaWYgKCFwcm90b3R5cGUpIHJldHVybiBmYWxzZTtcbiAgaWYgKGN0b3IgPT09IHBlZXJXaW5kb3cuRXZlbnRUYXJnZXQgfHwgY3RvciA9PT0gcGVlcldpbmRvdy5FdmVudCkgcmV0dXJuIHRydWU7XG4gIGlmIChwcm90b3R5cGUgaW5zdGFuY2VvZiBwZWVyV2luZG93LkV2ZW50VGFyZ2V0IHx8IHByb3RvdHlwZSBpbnN0YW5jZW9mIHBlZXJXaW5kb3cuRXZlbnQpIHJldHVybiB0cnVlO1xuICBpZiAoL14oSFRNTHxTVkd8TWF0aE1MKS4rRWxlbWVudCQvLnRlc3QobmFtZSkpIHJldHVybiB0cnVlO1xuICByZXR1cm4gZXh0cmFJbnN0YW5jZW9mQ29uc3RydWN0b3JOYW1lcy5oYXMobmFtZSk7XG59XG5cbi8qKlxuICog6K6pIHRhcmdldFdpbmRvdyDkuIrnmoQgRE9NIOaehOmAoOWHveaVsCBpbnN0YW5jZW9mIOWQjOaXtuiupOWPryBwZWVyV2luZG93IHJlYWxtIOeahOWvueixoeOAglxuICog6Z2e6ZmN57qn77yadGFyZ2V0V2luZG93PeWtkOW6lOeUqCBKUyBpZnJhbWXvvIxwZWVyV2luZG93PeS4u+W6lOeUqCB3aW5kb3fvvIhET00g5ZyoIHNoYWRvd1Jvb3TvvInjgIJcbiAqIOmZjee6p++8muWcqCBwYXRjaERlZ3JhZGVJbnN0YW5jZW9mQWNyb3NzUmVhbG1zIOS4reWvuea4suafkyBpZnJhbWUg5LiO5omn6KGMIGlmcmFtZSDlj4zlkJHosIPnlKjjgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhdGNoSW5zdGFuY2VvZkFjcm9zc1JlYWxtcyh0YXJnZXRXaW5kb3c6IFdpbmRvdywgcGVlcldpbmRvdzogV2luZG93ID0gd2luZG93KTogdm9pZCB7XG4gIC8vIERPTSDmnoTpgKDlh73mlbDkuYvpl7TlrZjlnKjnu6fmib/pk77vvIhIVE1MSUZyYW1lRWxlbWVudCAtPiBIVE1MRWxlbWVudCAtPiBFbGVtZW50IC0+IE5vZGUgLi4u77yJ77yMXG4gIC8vIOWvueaehOmAoOWHveaVsOeahOWxnuaAp+ivu+WPluS8muayv+i/meadoemTvuWQkeS4iuafpeaJvuOAguWboOatpCBfaGFzUGF0Y2ggLyBTeW1ib2wuaGFzSW5zdGFuY2Ug5b+F6aG755SoIG93blxuICAvLyDor63kuYnliKTmlq3vvIzlkKbliJnkvJror7vliLDlt7LooqsgcGF0Y2gg55qE56WW5YWI5p6E6YCg5Ye95pWw55qE5YC877yM5a+86Ie0IHBhdGNoIOiiq+i3s+i/h+aIluWIpOaWreS4suWRs+WIsOelluWFiCByZWFsbeOAglxuICBjb25zdCBuYXRpdmVIYXNJbnN0YW5jZSA9IEZ1bmN0aW9uLnByb3RvdHlwZVtTeW1ib2wuaGFzSW5zdGFuY2VdO1xuICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0YXJnZXRXaW5kb3cpLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICBsZXQgdGFyZ2V0Q29uc3RydWN0b3I6IEZ1bmN0aW9uICYgeyBfaGFzUGF0Y2g/OiBib29sZWFuIH07XG4gICAgbGV0IHBlZXJDb25zdHJ1Y3RvcjogRnVuY3Rpb247XG5cbiAgICB0cnkge1xuICAgICAgdGFyZ2V0Q29uc3RydWN0b3IgPSB0YXJnZXRXaW5kb3dbbmFtZV07XG4gICAgICBwZWVyQ29uc3RydWN0b3IgPSBwZWVyV2luZG93W25hbWVdO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB0YXJnZXRDb25zdHJ1Y3RvciAhPT0gXCJmdW5jdGlvblwiIHx8IHR5cGVvZiBwZWVyQ29uc3RydWN0b3IgIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuO1xuICAgIGlmICh0YXJnZXRDb25zdHJ1Y3RvciA9PT0gcGVlckNvbnN0cnVjdG9yIHx8IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0YXJnZXRDb25zdHJ1Y3RvciwgXCJfaGFzUGF0Y2hcIikpXG4gICAgICByZXR1cm47XG4gICAgaWYgKCFpc0RvbUNvbnN0cnVjdG9yKG5hbWUsIHBlZXJDb25zdHJ1Y3RvciwgcGVlcldpbmRvdykpIHJldHVybjtcblxuICAgIHRyeSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0YXJnZXRDb25zdHJ1Y3Rvciwge1xuICAgICAgICBbU3ltYm9sLmhhc0luc3RhbmNlXToge1xuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICB2YWx1ZShlbGVtZW50OiB1bmtub3duKSB7XG4gICAgICAgICAgICAvLyDnlKggdGhpcyDogIzpnZ7pl63ljIXlj5jph4/vvIznoa7kv53lkb3kuK3nmoTlp4vnu4jmmK/lvZPliY3mnoTpgKDlh73mlbDoh6rlt7HnmoTliKTmlq3jgIJcbiAgICAgICAgICAgIC8vIOWvueerr+S5n+eUqOWOn+eUnyBoYXNJbnN0YW5jZe+8jOmBv+WFjeWPjOWQkSBwYXRjaCDml7YgZWxlbWVudCBpbnN0YW5jZW9mIHBlZXJDb25zdHJ1Y3RvciDpgJLlvZLmoIjmuqLlh7rjgIJcbiAgICAgICAgICAgIGlmIChuYXRpdmVIYXNJbnN0YW5jZS5jYWxsKHRoaXMsIGVsZW1lbnQpKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiBuYXRpdmVIYXNJbnN0YW5jZS5jYWxsKHBlZXJDb25zdHJ1Y3RvciwgZWxlbWVudCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgX2hhc1BhdGNoOiB7IHZhbHVlOiB0cnVlIH0sXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcbiAgICB9XG4gIH0pO1xuICBjb25zdCB3dWppZSA9ICh0YXJnZXRXaW5kb3cgYXMgV2luZG93ICYgeyBfX1dVSklFPzogV3VKaWUgfSkuX19XVUpJRTtcbiAgaWYgKHd1amllKSB7XG4gICAgZXhlY0hvb2tzKHd1amllLnBsdWdpbnMsIFwid2luZG93UHJvcGVydHlPdmVycmlkZVwiLCB0YXJnZXRXaW5kb3cpO1xuICB9XG59XG5cbi8qKlxuICog6ZmN57qn5qih5byP77yaRE9NIOWcqOa4suafkyBpZnJhbWXjgIFKUyDlnKjmiafooYwgaWZyYW1l77yM5a+55Lik5L6nIHdpbmRvdyDlj4zlkJEgcGF0Y2ggaW5zdGFuY2VvZuOAglxuICog6ZyA5ZyoIHNhbmRib3guZG9jdW1lbnTvvIjmuLLmn5MgZG9jdW1lbnTvvInlsLHnu6rlkI7osIPnlKjvvIzli7/lnKggcGF0Y2hXaW5kb3dFZmZlY3Qg6Zi25q616LCD55So44CCXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXRjaERlZ3JhZGVJbnN0YW5jZW9mQWNyb3NzUmVhbG1zKGFwcFdpbmRvdzogV2luZG93LCByZW5kZXJXaW5kb3c6IFdpbmRvdyk6IHZvaWQge1xuICBpZiAoIXJlbmRlcldpbmRvdyB8fCBhcHBXaW5kb3cgPT09IHJlbmRlcldpbmRvdykgcmV0dXJuO1xuICBwYXRjaEluc3RhbmNlb2ZBY3Jvc3NSZWFsbXMocmVuZGVyV2luZG93LCBhcHBXaW5kb3cpO1xuICBwYXRjaEluc3RhbmNlb2ZBY3Jvc3NSZWFsbXMoYXBwV2luZG93LCByZW5kZXJXaW5kb3cpO1xufVxuXG4vKipcbiAqIOiusOW9leiKgueCueeahOebkeWQrOS6i+S7tlxuICovXG5mdW5jdGlvbiByZWNvcmRFdmVudExpc3RlbmVycyhpZnJhbWVXaW5kb3c6IFdpbmRvdykge1xuICBjb25zdCBzYW5kYm94ID0gaWZyYW1lV2luZG93Ll9fV1VKSUU7XG4gIGlmcmFtZVdpbmRvdy5Ob2RlLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKFxuICAgIHR5cGU6IHN0cmluZyxcbiAgICBoYW5kbGVyOiBFdmVudExpc3RlbmVyT3JFdmVudExpc3RlbmVyT2JqZWN0LFxuICAgIG9wdGlvbnM/OiBib29sZWFuIHwgQWRkRXZlbnRMaXN0ZW5lck9wdGlvbnNcbiAgKTogdm9pZCB7XG4gICAgLy8g5re75Yqg5LqL5Lu257yT5a2YXG4gICAgY29uc3QgZWxlbWVudExpc3RlbmVyTGlzdCA9IHNhbmRib3guZWxlbWVudEV2ZW50Q2FjaGVNYXAuZ2V0KHRoaXMpO1xuICAgIGlmIChlbGVtZW50TGlzdGVuZXJMaXN0KSB7XG4gICAgICBpZiAoIWVsZW1lbnRMaXN0ZW5lckxpc3QuZmluZCgobGlzdGVuZXIpID0+IGxpc3RlbmVyLnR5cGUgPT09IHR5cGUgJiYgbGlzdGVuZXIuaGFuZGxlciA9PT0gaGFuZGxlcikpIHtcbiAgICAgICAgZWxlbWVudExpc3RlbmVyTGlzdC5wdXNoKHsgdHlwZSwgaGFuZGxlciwgb3B0aW9ucyB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Ugc2FuZGJveC5lbGVtZW50RXZlbnRDYWNoZU1hcC5zZXQodGhpcywgW3sgdHlwZSwgaGFuZGxlciwgb3B0aW9ucyB9XSk7XG4gICAgcmV0dXJuIHJhd0FkZEV2ZW50TGlzdGVuZXIuY2FsbCh0aGlzLCB0eXBlLCBoYW5kbGVyLCBvcHRpb25zKTtcbiAgfTtcblxuICBpZnJhbWVXaW5kb3cuTm9kZS5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIChcbiAgICB0eXBlOiBzdHJpbmcsXG4gICAgaGFuZGxlcjogRXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdCxcbiAgICBvcHRpb25zPzogYm9vbGVhbiB8IEV2ZW50TGlzdGVuZXJPcHRpb25zXG4gICk6IHZvaWQge1xuICAgIC8vIOa4hemZpOe8k+WtmFxuICAgIGNvbnN0IGVsZW1lbnRMaXN0ZW5lckxpc3QgPSBzYW5kYm94LmVsZW1lbnRFdmVudENhY2hlTWFwLmdldCh0aGlzKTtcbiAgICBpZiAoZWxlbWVudExpc3RlbmVyTGlzdCkge1xuICAgICAgY29uc3QgaW5kZXggPSBlbGVtZW50TGlzdGVuZXJMaXN0Py5maW5kSW5kZXgoKGVsZSkgPT4gZWxlLnR5cGUgPT09IHR5cGUgJiYgZWxlLmhhbmRsZXIgPT09IGhhbmRsZXIpO1xuICAgICAgZWxlbWVudExpc3RlbmVyTGlzdC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgICBpZiAoIWVsZW1lbnRMaXN0ZW5lckxpc3Q/Lmxlbmd0aCkge1xuICAgICAgc2FuZGJveC5lbGVtZW50RXZlbnRDYWNoZU1hcC5kZWxldGUodGhpcyk7XG4gICAgfVxuICAgIHJldHVybiByYXdSZW1vdmVFdmVudExpc3RlbmVyLmNhbGwodGhpcywgdHlwZSwgaGFuZGxlciwgb3B0aW9ucyk7XG4gIH07XG59XG5cbi8qKlxuICog5oGi5aSN6IqC54K555qE55uR5ZCs5LqL5Lu2XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWNvdmVyRXZlbnRMaXN0ZW5lcnMocm9vdEVsZW1lbnQ6IEVsZW1lbnQgfCBDaGlsZE5vZGUsIGlmcmFtZVdpbmRvdzogV2luZG93KSB7XG4gIGNvbnN0IHNhbmRib3ggPSBpZnJhbWVXaW5kb3cuX19XVUpJRTtcbiAgY29uc3QgZWxlbWVudEV2ZW50Q2FjaGVNYXA6IFdlYWtNYXA8XG4gICAgTm9kZSxcbiAgICBBcnJheTx7IHR5cGU6IHN0cmluZzsgaGFuZGxlcjogRXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdDsgb3B0aW9uczogYW55IH0+XG4gID4gPSBuZXcgV2Vha01hcCgpO1xuICBjb25zdCBFbGVtZW50SXRlcmF0b3IgPSBkb2N1bWVudC5jcmVhdGVUcmVlV2Fsa2VyKHJvb3RFbGVtZW50LCBOb2RlRmlsdGVyLlNIT1dfRUxFTUVOVCwgbnVsbCwgZmFsc2UpO1xuICBsZXQgbmV4dEVsZW1lbnQgPSBFbGVtZW50SXRlcmF0b3IuY3VycmVudE5vZGU7XG4gIHdoaWxlIChuZXh0RWxlbWVudCkge1xuICAgIGNvbnN0IGVsZW1lbnRMaXN0ZW5lckxpc3QgPSBzYW5kYm94LmVsZW1lbnRFdmVudENhY2hlTWFwLmdldChuZXh0RWxlbWVudCk7XG4gICAgaWYgKGVsZW1lbnRMaXN0ZW5lckxpc3Q/Lmxlbmd0aCkge1xuICAgICAgZWxlbWVudEV2ZW50Q2FjaGVNYXAuc2V0KG5leHRFbGVtZW50LCBlbGVtZW50TGlzdGVuZXJMaXN0KTtcbiAgICAgIGVsZW1lbnRMaXN0ZW5lckxpc3QuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgICAgbmV4dEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihsaXN0ZW5lci50eXBlLCBsaXN0ZW5lci5oYW5kbGVyLCBsaXN0ZW5lci5vcHRpb25zKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBuZXh0RWxlbWVudCA9IEVsZW1lbnRJdGVyYXRvci5uZXh0Tm9kZSgpIGFzIEhUTUxFbGVtZW50O1xuICB9XG4gIHNhbmRib3guZWxlbWVudEV2ZW50Q2FjaGVNYXAgPSBlbGVtZW50RXZlbnRDYWNoZU1hcDtcbn1cblxuLyoqXG4gKiDmgaLlpI3moLnoioLngrnnmoTnm5HlkKzkuovku7ZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlY292ZXJEb2N1bWVudExpc3RlbmVycyhcbiAgb2xkUm9vdEVsZW1lbnQ6IEVsZW1lbnQgfCBDaGlsZE5vZGUsXG4gIG5ld1Jvb3RFbGVtZW50OiBFbGVtZW50IHwgQ2hpbGROb2RlLFxuICBpZnJhbWVXaW5kb3c6IFdpbmRvd1xuKSB7XG4gIGNvbnN0IHNhbmRib3ggPSBpZnJhbWVXaW5kb3cuX19XVUpJRTtcbiAgY29uc3QgZWxlbWVudEV2ZW50Q2FjaGVNYXA6IFdlYWtNYXA8XG4gICAgTm9kZSxcbiAgICBBcnJheTx7IHR5cGU6IHN0cmluZzsgaGFuZGxlcjogRXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdDsgb3B0aW9uczogYW55IH0+XG4gID4gPSBuZXcgV2Vha01hcCgpO1xuICBjb25zdCBlbGVtZW50TGlzdGVuZXJMaXN0ID0gc2FuZGJveC5lbGVtZW50RXZlbnRDYWNoZU1hcC5nZXQob2xkUm9vdEVsZW1lbnQpO1xuICBpZiAoZWxlbWVudExpc3RlbmVyTGlzdD8ubGVuZ3RoKSB7XG4gICAgZWxlbWVudEV2ZW50Q2FjaGVNYXAuc2V0KG5ld1Jvb3RFbGVtZW50LCBlbGVtZW50TGlzdGVuZXJMaXN0KTtcbiAgICBlbGVtZW50TGlzdGVuZXJMaXN0LmZvckVhY2goKGxpc3RlbmVyKSA9PiB7XG4gICAgICBuZXdSb290RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGxpc3RlbmVyLnR5cGUsIGxpc3RlbmVyLmhhbmRsZXIsIGxpc3RlbmVyLm9wdGlvbnMpO1xuICAgIH0pO1xuICB9XG4gIHNhbmRib3guZWxlbWVudEV2ZW50Q2FjaGVNYXAgPSBlbGVtZW50RXZlbnRDYWNoZU1hcDtcbn1cblxuLyoqXG4gKiDkv67lpI12dWXnu5Hlrprkuovku7ZlLnRpbWVTdGFtcCA8IGF0dGFjaGVkVGltZXN0YW1wIOeahOaDheWGtVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hFdmVudFRpbWVTdGFtcCh0YXJnZXRXaW5kb3c6IFdpbmRvdywgaWZyYW1lV2luZG93OiBXaW5kb3cpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldFdpbmRvdy5FdmVudC5wcm90b3R5cGUsIFwidGltZVN0YW1wXCIsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIHJldHVybiBpZnJhbWVXaW5kb3cuZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJFdmVudFwiKS50aW1lU3RhbXA7XG4gICAgfSxcbiAgfSk7XG59XG5cbi8qKlxuICogcGF0Y2ggZG9jdW1lbnQgZWZmZWN0XG4gKiBAcGFyYW0gaWZyYW1lV2luZG93XG4gKi9cbi8vIFRPRE8g57un57ut5pS56L+bXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hEb2N1bWVudEVmZmVjdChpZnJhbWVXaW5kb3c6IFdpbmRvdyk6IHZvaWQge1xuICBjb25zdCBzYW5kYm94ID0gaWZyYW1lV2luZG93Ll9fV1VKSUU7XG5cbiAgLyoqXG4gICAqIOWkhOeQhiBhZGRFdmVudExpc3RlbmVy5ZKMcmVtb3ZlRXZlbnRMaXN0ZW5lclxuICAgKiDnlLHkuo7ov5nkuKrliqvmjIHlr7zoh7QgaGFuZGxlciDnmoR0aGlz5Y+R55Sf5pS55Y+Y77yM5omA5Lul6ZyA6KaBaGFuZGxlci5iaW5kKGRvY3VtZW50KVxuICAgKiDkvYbmmK/ov5nmoLfkvJrlr7zoh7RyZW1vdmVFdmVudExpc3RlbmVy5peg5rOV5q2j5bi45bel5L2c77yM5Zug5Li6aGFuZGxlciA9PiBoYW5kbGVyLmJpbmQoZG9jdW1lbnQpXG4gICAqIOi/meS4quWcsOaWueS/neWtmGNhbGxiYWNrID0gaGFuZGxlci5iaW5kKGRvY3VtZW50KSDmlrnkvr9yZW1vdmVFdmVudExpc3RlbmVyXG4gICAqL1xuICBjb25zdCBoYW5kbGVyQ2FsbGJhY2tNYXA6IFdlYWtNYXA8RXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdCwgRXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdD4gPVxuICAgIG5ldyBXZWFrTWFwKCk7XG4gIGNvbnN0IGhhbmRsZXJUeXBlTWFwOiBXZWFrTWFwPEV2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3QsIEFycmF5PHN0cmluZz4+ID0gbmV3IFdlYWtNYXAoKTtcbiAgaWZyYW1lV2luZG93LkRvY3VtZW50LnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKFxuICAgIHR5cGU6IHN0cmluZyxcbiAgICBoYW5kbGVyOiBFdmVudExpc3RlbmVyT3JFdmVudExpc3RlbmVyT2JqZWN0LFxuICAgIG9wdGlvbnM/OiBib29sZWFuIHwgQWRkRXZlbnRMaXN0ZW5lck9wdGlvbnNcbiAgKTogdm9pZCB7XG4gICAgaWYgKCFoYW5kbGVyKSByZXR1cm47XG4gICAgbGV0IGNhbGxiYWNrID0gaGFuZGxlckNhbGxiYWNrTWFwLmdldChoYW5kbGVyKTtcbiAgICBjb25zdCB0eXBlTGlzdCA9IGhhbmRsZXJUeXBlTWFwLmdldChoYW5kbGVyKTtcbiAgICAvLyDorr7nva4gaGFuZGxlckNhbGxiYWNrTWFwXG4gICAgaWYgKCFjYWxsYmFjaykge1xuICAgICAgY2FsbGJhY2sgPSB0eXBlb2YgaGFuZGxlciA9PT0gXCJmdW5jdGlvblwiID8gaGFuZGxlci5iaW5kKHRoaXMpIDogaGFuZGxlcjtcbiAgICAgIGhhbmRsZXJDYWxsYmFja01hcC5zZXQoaGFuZGxlciwgY2FsbGJhY2spO1xuICAgIH1cbiAgICAvLyDorr7nva4gaGFuZGxlclR5cGVNYXBcbiAgICBpZiAodHlwZUxpc3QpIHtcbiAgICAgIGlmICghdHlwZUxpc3QuaW5jbHVkZXModHlwZSkpIHR5cGVMaXN0LnB1c2godHlwZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhhbmRsZXJUeXBlTWFwLnNldChoYW5kbGVyLCBbdHlwZV0pO1xuICAgIH1cblxuICAgIC8vIOi/kOihjOaPkuS7tumSqeWtkOWHveaVsFxuICAgIGV4ZWNIb29rcyhpZnJhbWVXaW5kb3cuX19XVUpJRS5wbHVnaW5zLCBcImRvY3VtZW50QWRkRXZlbnRMaXN0ZW5lckhvb2tcIiwgaWZyYW1lV2luZG93LCB0eXBlLCBjYWxsYmFjaywgb3B0aW9ucyk7XG4gICAgaWYgKGFwcERvY3VtZW50QWRkRXZlbnRMaXN0ZW5lckV2ZW50cy5pbmNsdWRlcyh0eXBlKSkge1xuICAgICAgcmV0dXJuIHJhd0FkZEV2ZW50TGlzdGVuZXIuY2FsbCh0aGlzLCB0eXBlLCBjYWxsYmFjaywgb3B0aW9ucyk7XG4gICAgfVxuICAgIC8vIOmZjee6p+e7n+S4gOi1sCBzYW5kYm94LmRvY3VtZW50XG4gICAgaWYgKHNhbmRib3guZGVncmFkZSkgcmV0dXJuIHNhbmRib3guZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBjYWxsYmFjaywgb3B0aW9ucyk7XG4gICAgaWYgKG1haW5Eb2N1bWVudEFkZEV2ZW50TGlzdGVuZXJFdmVudHMuaW5jbHVkZXModHlwZSkpIHtcbiAgICAgIC8vIOeZu+iusOWIsOa4heeQhui3n+i4quWZqO+8jGRlc3Ryb3kg5pe25Y+N5ZCR6Kej57uR77yM6YG/5YWNIGhhbmRsZXIg6Zet5YyF5rC45LmF6ZKJ5L2PIGlmcmFtZVdpbmRvd1xuICAgICAgc2FuZGJveC5ldmVudENsZWFudXBUcmFja2VyPy50cmFja01haW5Eb2N1bWVudExpc3RlbmVyKHsgdHlwZSwgY2FsbGJhY2ssIG9wdGlvbnMgfSk7XG4gICAgICByZXR1cm4gd2luZG93LmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgY2FsbGJhY2ssIG9wdGlvbnMpO1xuICAgIH1cbiAgICBpZiAobWFpbkFuZEFwcEFkZEV2ZW50TGlzdGVuZXJFdmVudHMuaW5jbHVkZXModHlwZSkpIHtcbiAgICAgIHNhbmRib3guZXZlbnRDbGVhbnVwVHJhY2tlcj8udHJhY2tNYWluRG9jdW1lbnRMaXN0ZW5lcih7IHR5cGUsIGNhbGxiYWNrLCBvcHRpb25zIH0pO1xuICAgICAgd2luZG93LmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgY2FsbGJhY2ssIG9wdGlvbnMpO1xuICAgICAgc2FuZGJveC5zaGFkb3dSb290LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgY2FsbGJhY2ssIG9wdGlvbnMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzYW5kYm94LnNoYWRvd1Jvb3QuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBjYWxsYmFjaywgb3B0aW9ucyk7XG4gIH07XG4gIGlmcmFtZVdpbmRvdy5Eb2N1bWVudC5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIChcbiAgICB0eXBlOiBzdHJpbmcsXG4gICAgaGFuZGxlcjogRXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdCxcbiAgICBvcHRpb25zPzogYm9vbGVhbiB8IEFkZEV2ZW50TGlzdGVuZXJPcHRpb25zXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IGNhbGxiYWNrOiBFdmVudExpc3RlbmVyT3JFdmVudExpc3RlbmVyT2JqZWN0ID0gaGFuZGxlckNhbGxiYWNrTWFwLmdldChoYW5kbGVyKTtcbiAgICBjb25zdCB0eXBlTGlzdCA9IGhhbmRsZXJUeXBlTWFwLmdldChoYW5kbGVyKTtcbiAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgIGlmICh0eXBlTGlzdD8uaW5jbHVkZXModHlwZSkpIHtcbiAgICAgICAgdHlwZUxpc3Quc3BsaWNlKHR5cGVMaXN0LmluZGV4T2YodHlwZSksIDEpO1xuICAgICAgICBpZiAoIXR5cGVMaXN0Lmxlbmd0aCkge1xuICAgICAgICAgIGhhbmRsZXJDYWxsYmFja01hcC5kZWxldGUoaGFuZGxlcik7XG4gICAgICAgICAgaGFuZGxlclR5cGVNYXAuZGVsZXRlKGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIOi/kOihjOaPkuS7tumSqeWtkOWHveaVsFxuICAgICAgZXhlY0hvb2tzKGlmcmFtZVdpbmRvdy5fX1dVSklFLnBsdWdpbnMsIFwiZG9jdW1lbnRSZW1vdmVFdmVudExpc3RlbmVySG9va1wiLCBpZnJhbWVXaW5kb3csIHR5cGUsIGNhbGxiYWNrLCBvcHRpb25zKTtcbiAgICAgIGlmIChhcHBEb2N1bWVudEFkZEV2ZW50TGlzdGVuZXJFdmVudHMuaW5jbHVkZXModHlwZSkpIHtcbiAgICAgICAgcmV0dXJuIHJhd1JlbW92ZUV2ZW50TGlzdGVuZXIuY2FsbCh0aGlzLCB0eXBlLCBjYWxsYmFjaywgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgICBpZiAoc2FuZGJveC5kZWdyYWRlKSByZXR1cm4gc2FuZGJveC5kb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGNhbGxiYWNrLCBvcHRpb25zKTtcbiAgICAgIGlmIChtYWluRG9jdW1lbnRBZGRFdmVudExpc3RlbmVyRXZlbnRzLmluY2x1ZGVzKHR5cGUpKSB7XG4gICAgICAgIHNhbmRib3guZXZlbnRDbGVhbnVwVHJhY2tlcj8udW50cmFja01haW5Eb2N1bWVudExpc3RlbmVyKHsgdHlwZSwgY2FsbGJhY2ssIG9wdGlvbnMgfSk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBjYWxsYmFjaywgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgICBpZiAobWFpbkFuZEFwcEFkZEV2ZW50TGlzdGVuZXJFdmVudHMuaW5jbHVkZXModHlwZSkpIHtcbiAgICAgICAgc2FuZGJveC5ldmVudENsZWFudXBUcmFja2VyPy51bnRyYWNrTWFpbkRvY3VtZW50TGlzdGVuZXIoeyB0eXBlLCBjYWxsYmFjaywgb3B0aW9ucyB9KTtcbiAgICAgICAgd2luZG93LmRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgY2FsbGJhY2ssIG9wdGlvbnMpO1xuICAgICAgICBzYW5kYm94LnNoYWRvd1Jvb3QucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBjYWxsYmFjaywgb3B0aW9ucyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNhbmRib3guc2hhZG93Um9vdC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGNhbGxiYWNrLCBvcHRpb25zKTtcbiAgICB9XG4gIH07XG4gIC8vIOWkhOeQhm9uRXZlbnRcbiAgY29uc3QgZWxlbWVudE9uRXZlbnRzID0gT2JqZWN0LmtleXMoaWZyYW1lV2luZG93LkhUTUxFbGVtZW50LnByb3RvdHlwZSkuZmlsdGVyKChlbGUpID0+IC9eb24vLnRlc3QoZWxlKSk7XG4gIGNvbnN0IGRvY3VtZW50T25FdmVudCA9IE9iamVjdC5rZXlzKGlmcmFtZVdpbmRvdy5Eb2N1bWVudC5wcm90b3R5cGUpXG4gICAgLmZpbHRlcigoZWxlKSA9PiAvXm9uLy50ZXN0KGVsZSkpXG4gICAgLmZpbHRlcigoZWxlKSA9PiAhYXBwRG9jdW1lbnRPbkV2ZW50cy5pbmNsdWRlcyhlbGUpKTtcbiAgZWxlbWVudE9uRXZlbnRzXG4gICAgLmZpbHRlcigoZSkgPT4gZG9jdW1lbnRPbkV2ZW50LmluY2x1ZGVzKGUpKVxuICAgIC5mb3JFYWNoKChlKSA9PiB7XG4gICAgICBjb25zdCBkZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihpZnJhbWVXaW5kb3cuRG9jdW1lbnQucHJvdG90eXBlLCBlKSB8fCB7XG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgfTtcbiAgICAgIHRyeSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShpZnJhbWVXaW5kb3cuRG9jdW1lbnQucHJvdG90eXBlLCBlLCB7XG4gICAgICAgICAgZW51bWVyYWJsZTogZGVzY3JpcHRvci5lbnVtZXJhYmxlLFxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICBnZXQ6ICgpID0+IChzYW5kYm94LmRlZ3JhZGUgPyBzYW5kYm94LmRvY3VtZW50W2VdIDogc2FuZGJveC5zaGFkb3dSb290LmZpcnN0RWxlbWVudENoaWxkW2VdKSxcbiAgICAgICAgICBzZXQ6XG4gICAgICAgICAgICBkZXNjcmlwdG9yLndyaXRhYmxlIHx8IGRlc2NyaXB0b3Iuc2V0XG4gICAgICAgICAgICAgID8gKGhhbmRsZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IHR5cGVvZiBoYW5kbGVyID09PSBcImZ1bmN0aW9uXCIgPyBoYW5kbGVyLmJpbmQoaWZyYW1lV2luZG93LmRvY3VtZW50KSA6IGhhbmRsZXI7XG4gICAgICAgICAgICAgICAgICBzYW5kYm94LmRlZ3JhZGUgPyAoc2FuZGJveC5kb2N1bWVudFtlXSA9IHZhbCkgOiAoc2FuZGJveC5zaGFkb3dSb290LmZpcnN0RWxlbWVudENoaWxkW2VdID0gdmFsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgd2FybihlLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0pO1xuICAvLyDlpITnkIblsZ7mgKdnZXRcbiAgY29uc3Qge1xuICAgIG93bmVyUHJvcGVydGllcyxcbiAgICBtb2RpZnlQcm9wZXJ0aWVzLFxuICAgIHNoYWRvd1Byb3BlcnRpZXMsXG4gICAgc2hhZG93TWV0aG9kcyxcbiAgICBkb2N1bWVudFByb3BlcnRpZXMsXG4gICAgZG9jdW1lbnRNZXRob2RzLFxuICAgIGRvY3VtZW50RXZlbnRzLFxuICB9ID0gZG9jdW1lbnRQcm94eVByb3BlcnRpZXM7XG4gIG1vZGlmeVByb3BlcnRpZXMuY29uY2F0KHNoYWRvd1Byb3BlcnRpZXMsIHNoYWRvd01ldGhvZHMsIGRvY3VtZW50UHJvcGVydGllcywgZG9jdW1lbnRNZXRob2RzKS5mb3JFYWNoKChwcm9wS2V5KSA9PiB7XG4gICAgY29uc3QgZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoaWZyYW1lV2luZG93LkRvY3VtZW50LnByb3RvdHlwZSwgcHJvcEtleSkgfHwge1xuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgIH07XG4gICAgdHJ5IHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShpZnJhbWVXaW5kb3cuRG9jdW1lbnQucHJvdG90eXBlLCBwcm9wS2V5LCB7XG4gICAgICAgIGVudW1lcmFibGU6IGRlc2NyaXB0b3IuZW51bWVyYWJsZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICBnZXQ6ICgpID0+IHNhbmRib3gucHJveHlEb2N1bWVudFtwcm9wS2V5XSxcbiAgICAgICAgc2V0OiB1bmRlZmluZWQsXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB3YXJuKGUubWVzc2FnZSk7XG4gICAgfVxuICB9KTtcbiAgLy8g5aSE55CGIGRvY3VtZW50IOS4k+WxnuS6i+S7tu+8iG9uZnVsbHNjcmVlbmNoYW5nZSAvIG9ucG9pbnRlcmxvY2tjaGFuZ2Ug562J77yJ44CCXG4gIC8vXG4gIC8vIOi/meexu+S6i+S7tua1j+iniOWZqOWPqiBkaXNwYXRjaCDliLDkuLsgZG9jdW1lbnQg5LiK77yM5a2Q5bqU55So5b2i5aaCXG4gIC8vIGBkb2N1bWVudC5vbmZ1bGxzY3JlZW5jaGFuZ2UgPSBoYW5kbGVyYCDnmoTlhpnms5XpnIDopoHooqvovazlj5HliLDkuLsgd2luZG93LmRvY3VtZW5044CCXG4gIC8vIOWunueOsOimgeeCue+8mlxuICAvLyAgIDEpIOavj+S4qiBwcm9wS2V5IOWPquWFgeiuuOS4gOS4qiBhY3RpdmUgbGlzdGVuZXLvvJtzZXR0ZXIg5YaF6YOo55So5ZCM5LiA5Lu9IGJvdW5kIOW8leeUqFxuICAvLyAgICAgIOWBmiBhZGQgLyByZW1vdmUgLyB0cmFja++8jOmBv+WFjeWHuueOsCBcIuWtmOi/myBtYXAg55qEIGJvdW5kIOS4juWunumZheazqOWGjOeahCBib3VuZFxuICAvLyAgICAgIOS4jeaYr+WQjOS4gOS4qlwiIOiAjOaXoOazlSByZW1vdmXvvJtcbiAgLy8gICAyKSDmjqXlhaUgZXZlbnRDbGVhbnVwVHJhY2tlcu+8jHNhbmRib3guZGVzdHJveSgpIOaXtuWPjeWQkeino+e7ke+8jOWQpuWImSBib3VuZCDpl63ljIVcbiAgLy8gICAgICDkvJrmjIHmnIkgaWZyYW1lV2luZG93LmRvY3VtZW50IOawuOi/nOaMguWcqOS4uyBkb2N1bWVudCDkuIrvvJtcbiAgLy8gICAzKSBoYW5kbGVyID0gbnVsbC/pnZ7lh73mlbDvvJrku4Xop6Pnu5HkuI3ph43nu5HvvIzkuI7ljp/nlJ8gb25YWFggPSBudWxsIOivreS5ieS4gOiHtOOAglxuICBjb25zdCBkb2N1bWVudEV2ZW50QWN0aXZlTGlzdGVuZXJzOiBNYXA8c3RyaW5nLCBFdmVudExpc3RlbmVyT3JFdmVudExpc3RlbmVyT2JqZWN0PiA9IG5ldyBNYXAoKTtcbiAgZG9jdW1lbnRFdmVudHMuZm9yRWFjaCgocHJvcEtleSkgPT4ge1xuICAgIGNvbnN0IGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGlmcmFtZVdpbmRvdy5Eb2N1bWVudC5wcm90b3R5cGUsIHByb3BLZXkpIHx8IHtcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICB9O1xuICAgIGlmICghKGRlc2NyaXB0b3Iud3JpdGFibGUgfHwgZGVzY3JpcHRvci5zZXQpKSByZXR1cm47XG4gICAgLy8gZG9jdW1lbnRFdmVudHMg5b2i5aaCIFwib25mdWxsc2NyZWVuY2hhbmdlXCLvvIzlr7nlupTkuovku7blkI3ljrvmjonliY3nvIAgXCJvblwiXG4gICAgY29uc3QgZXZlbnRUeXBlID0gcHJvcEtleS5zbGljZSgyKTtcbiAgICB0cnkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGlmcmFtZVdpbmRvdy5Eb2N1bWVudC5wcm90b3R5cGUsIHByb3BLZXksIHtcbiAgICAgICAgZW51bWVyYWJsZTogZGVzY3JpcHRvci5lbnVtZXJhYmxlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGdldDogKCkgPT4gKHNhbmRib3guZGVncmFkZSA/IHNhbmRib3ggOiB3aW5kb3cpLmRvY3VtZW50W3Byb3BLZXldLFxuICAgICAgICBzZXQ6IChoYW5kbGVyKSA9PiB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0RG9jID0gKHNhbmRib3guZGVncmFkZSA/IHNhbmRib3ggOiB3aW5kb3cpLmRvY3VtZW50O1xuICAgICAgICAgIGNvbnN0IHByZXZpb3VzID0gZG9jdW1lbnRFdmVudEFjdGl2ZUxpc3RlbmVycy5nZXQocHJvcEtleSk7XG4gICAgICAgICAgaWYgKHByZXZpb3VzKSB7XG4gICAgICAgICAgICB0YXJnZXREb2MucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHByZXZpb3VzKTtcbiAgICAgICAgICAgIHNhbmRib3guZXZlbnRDbGVhbnVwVHJhY2tlcj8udW50cmFja01haW5Eb2N1bWVudExpc3RlbmVyKHsgdHlwZTogZXZlbnRUeXBlLCBjYWxsYmFjazogcHJldmlvdXMgfSk7XG4gICAgICAgICAgICBkb2N1bWVudEV2ZW50QWN0aXZlTGlzdGVuZXJzLmRlbGV0ZShwcm9wS2V5KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IGJvdW5kID0gaGFuZGxlci5iaW5kKGlmcmFtZVdpbmRvdy5kb2N1bWVudCk7XG4gICAgICAgICAgICBkb2N1bWVudEV2ZW50QWN0aXZlTGlzdGVuZXJzLnNldChwcm9wS2V5LCBib3VuZCk7XG4gICAgICAgICAgICB0YXJnZXREb2MuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIGJvdW5kKTtcbiAgICAgICAgICAgIHNhbmRib3guZXZlbnRDbGVhbnVwVHJhY2tlcj8udHJhY2tNYWluRG9jdW1lbnRMaXN0ZW5lcih7IHR5cGU6IGV2ZW50VHlwZSwgY2FsbGJhY2s6IGJvdW5kIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBoYW5kbGVyIOS4uiBudWxsL3VuZGVmaW5lZC/pnZ7lh73mlbDvvJrlj6rop6Pnu5HkuI3ph43nu5HvvIjkuI7ljp/nlJ8gb25YWFggPSBudWxsIOivreS5ieS4gOiHtO+8iVxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgd2FybihlLm1lc3NhZ2UpO1xuICAgIH1cbiAgfSk7XG4gIC8vIHByb2Nlc3Mgb3duZXIgcHJvcGVydHlcbiAgb3duZXJQcm9wZXJ0aWVzLmZvckVhY2goKHByb3BLZXkpID0+IHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoaWZyYW1lV2luZG93LmRvY3VtZW50LCBwcm9wS2V5LCB7XG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZ2V0OiAoKSA9PiBzYW5kYm94LnByb3h5RG9jdW1lbnRbcHJvcEtleV0sXG4gICAgICBzZXQ6IHVuZGVmaW5lZCxcbiAgICB9KTtcbiAgfSk7XG4gIC8vIOi/kOihjOaPkuS7tumSqeWtkOWHveaVsFxuICBleGVjSG9va3MoaWZyYW1lV2luZG93Ll9fV1VKSUUucGx1Z2lucywgXCJkb2N1bWVudFByb3BlcnR5T3ZlcnJpZGVcIiwgaWZyYW1lV2luZG93KTtcbn1cblxuLyoqXG4gKiBwYXRjaCBOb2RlIGVmZmVjdFxuICogMeOAgeWkhOeQhiBnZXRSb290Tm9kZVxuICogMuOAgeWkhOeQhiBhcHBlbmRDaGlsZOOAgWluc2VydEJlZm9yZe+8jOW9k+aPkuWFpeeahOiKgueCueS4uiBzdmcg5pe277yMY3JlYXRlRWxlbWVudCDnmoQgcGF0Y2gg5Lya6KKr5Y676Zmk77yM6ZyA6KaB6YeN5pawIHBhdGNoXG4gKiBAcGFyYW0gaWZyYW1lV2luZG93XG4gKi9cbmZ1bmN0aW9uIHBhdGNoTm9kZUVmZmVjdChpZnJhbWVXaW5kb3c6IFdpbmRvdyk6IHZvaWQge1xuICBjb25zdCByYXdHZXRSb290Tm9kZSA9IGlmcmFtZVdpbmRvdy5Ob2RlLnByb3RvdHlwZS5nZXRSb290Tm9kZTtcbiAgY29uc3QgcmF3QXBwZW5kQ2hpbGQgPSBpZnJhbWVXaW5kb3cuTm9kZS5wcm90b3R5cGUuYXBwZW5kQ2hpbGQ7XG4gIGNvbnN0IHJhd0luc2VydFJ1bGUgPSBpZnJhbWVXaW5kb3cuTm9kZS5wcm90b3R5cGUuaW5zZXJ0QmVmb3JlO1xuICBjb25zdCByYXdSZW1vdmVDaGlsZCA9IGlmcmFtZVdpbmRvdy5Ob2RlLnByb3RvdHlwZS5yZW1vdmVDaGlsZDtcbiAgaWZyYW1lV2luZG93Lk5vZGUucHJvdG90eXBlLmdldFJvb3ROb2RlID0gZnVuY3Rpb24gKG9wdGlvbnM/OiBHZXRSb290Tm9kZU9wdGlvbnMpOiBOb2RlIHtcbiAgICBjb25zdCByb290Tm9kZSA9IHJhd0dldFJvb3ROb2RlLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgaWYgKHJvb3ROb2RlID09PSBpZnJhbWVXaW5kb3cuX19XVUpJRS5zaGFkb3dSb290KSByZXR1cm4gaWZyYW1lV2luZG93LmRvY3VtZW50O1xuICAgIGVsc2UgcmV0dXJuIHJvb3ROb2RlO1xuICB9O1xuICBpZnJhbWVXaW5kb3cuTm9kZS5wcm90b3R5cGUuYXBwZW5kQ2hpbGQgPSBmdW5jdGlvbiA8VCBleHRlbmRzIE5vZGU+KG5vZGU6IFQpOiBUIHtcbiAgICBjb25zdCByZXMgPSByYXdBcHBlbmRDaGlsZC5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIHBhdGNoRWxlbWVudEVmZmVjdChub2RlLCBpZnJhbWVXaW5kb3cpO1xuICAgIHJldHVybiByZXM7XG4gIH07XG4gIGlmcmFtZVdpbmRvdy5Ob2RlLnByb3RvdHlwZS5pbnNlcnRCZWZvcmUgPSBmdW5jdGlvbiA8VCBleHRlbmRzIE5vZGU+KG5vZGU6IFQsIGNoaWxkOiBOb2RlIHwgbnVsbCk6IFQge1xuICAgIGNvbnN0IHJlcyA9IHJhd0luc2VydFJ1bGUuY2FsbCh0aGlzLCBub2RlLCBjaGlsZCk7XG4gICAgcGF0Y2hFbGVtZW50RWZmZWN0KG5vZGUsIGlmcmFtZVdpbmRvdyk7XG4gICAgcmV0dXJuIHJlcztcbiAgfTtcbiAgaWZyYW1lV2luZG93Lk5vZGUucHJvdG90eXBlLnJlbW92ZUNoaWxkID0gZnVuY3Rpb24gPFQgZXh0ZW5kcyBOb2RlPihub2RlOiBUKTogVCB7XG4gICAgbGV0IHJlcztcbiAgICB0cnkge1xuICAgICAgcmVzID0gcmF3UmVtb3ZlQ2hpbGQuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIGBGYWlsZWQgdG8gcmVtb3ZlQ2hpbGQ6ICR7bm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpfSBpcyBub3QgYSBjaGlsZCBvZiAke3RoaXMubm9kZU5hbWUudG9Mb3dlckNhc2UoKX0sIHRyeSBhZ2FpbiB3aXRoIHBhcmVudE5vZGUgYXR0cmlidXRlLiBgXG4gICAgICApO1xuICAgICAgaWYgKG5vZGUuaXNDb25uZWN0ZWQgJiYgaXNGdW5jdGlvbihub2RlLnBhcmVudE5vZGU/LnJlbW92ZUNoaWxkKSkge1xuICAgICAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHBhdGNoRWxlbWVudEVmZmVjdChub2RlLCBpZnJhbWVXaW5kb3cpO1xuICAgIHJldHVybiByZXM7XG4gIH07XG59XG5cbi8qKlxuICog5L+u5aSN6LWE5rqQ5YWD57Sg55qE55u45a+56Lev5b6E6Zeu6aKYXG4gKiBAcGFyYW0gaWZyYW1lV2luZG93XG4gKi9cbmZ1bmN0aW9uIHBhdGNoUmVsYXRpdmVVcmxFZmZlY3QoaWZyYW1lV2luZG93OiBXaW5kb3cpOiB2b2lkIHtcbiAgZml4RWxlbWVudEN0clNyY09ySHJlZihpZnJhbWVXaW5kb3csIGlmcmFtZVdpbmRvdy5IVE1MSW1hZ2VFbGVtZW50LCBcInNyY1wiKTtcbiAgZml4RWxlbWVudEN0clNyY09ySHJlZihpZnJhbWVXaW5kb3csIGlmcmFtZVdpbmRvdy5IVE1MQW5jaG9yRWxlbWVudCwgXCJocmVmXCIpO1xuICBmaXhFbGVtZW50Q3RyU3JjT3JIcmVmKGlmcmFtZVdpbmRvdywgaWZyYW1lV2luZG93LkhUTUxTb3VyY2VFbGVtZW50LCBcInNyY1wiKTtcbiAgZml4RWxlbWVudEN0clNyY09ySHJlZihpZnJhbWVXaW5kb3csIGlmcmFtZVdpbmRvdy5IVE1MTGlua0VsZW1lbnQsIFwiaHJlZlwiKTtcbiAgZml4RWxlbWVudEN0clNyY09ySHJlZihpZnJhbWVXaW5kb3csIGlmcmFtZVdpbmRvdy5IVE1MU2NyaXB0RWxlbWVudCwgXCJzcmNcIik7XG4gIGZpeEVsZW1lbnRDdHJTcmNPckhyZWYoaWZyYW1lV2luZG93LCBpZnJhbWVXaW5kb3cuSFRNTE1lZGlhRWxlbWVudCwgXCJzcmNcIik7XG59XG5cbi8qKlxuICog5Yid5aeL5YyWIGJhc2Ug5qCH562+77yM5L6bIGRvY3VtZW50IOWGheebuOWvuei3r+W+hOi1hOa6kOino+aekOS9v+eUqOOAglxuICogQHBhcmFtIHBhdGhuYW1lIOWPr+mAie+8m+mZjee6p+a4suafkyBpZnJhbWUg55qEIGxvY2F0aW9uIOS4uiBhYm91dDpibGFua++8jOmcgOS8oOWFpSBwcm94eUxvY2F0aW9uLnBhdGhuYW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0QmFzZShpZnJhbWVXaW5kb3c6IFdpbmRvdywgdXJsOiBzdHJpbmcsIHBhdGhuYW1lPzogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IGlmcmFtZURvY3VtZW50ID0gaWZyYW1lV2luZG93LmRvY3VtZW50O1xuICBpZiAoIWlmcmFtZURvY3VtZW50LmhlYWQgfHwgaWZyYW1lRG9jdW1lbnQuaGVhZC5xdWVyeVNlbGVjdG9yKFwiYmFzZVwiKSkgcmV0dXJuO1xuICBjb25zdCBiYXNlRWxlbWVudCA9IGlmcmFtZURvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJiYXNlXCIpO1xuICBjb25zdCBpZnJhbWVVcmxFbGVtZW50ID0gYW5jaG9yRWxlbWVudEdlbmVyYXRvcihpZnJhbWVXaW5kb3cubG9jYXRpb24uaHJlZik7XG4gIGNvbnN0IGFwcFVybEVsZW1lbnQgPSBhbmNob3JFbGVtZW50R2VuZXJhdG9yKHVybCk7XG4gIGNvbnN0IHJlc29sdmVkUGF0aG5hbWUgPSBwYXRobmFtZSA/PyBpZnJhbWVVcmxFbGVtZW50LnBhdGhuYW1lO1xuICBiYXNlRWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIGFwcFVybEVsZW1lbnQucHJvdG9jb2wgKyBcIi8vXCIgKyBhcHBVcmxFbGVtZW50Lmhvc3QgKyByZXNvbHZlZFBhdGhuYW1lKTtcbiAgaWZyYW1lRG9jdW1lbnQuaGVhZC5pbnNlcnRCZWZvcmUoYmFzZUVsZW1lbnQsIGlmcmFtZURvY3VtZW50LmhlYWQuZmlyc3RDaGlsZCk7XG59XG5cbi8qKlxuICog5Yid5aeL5YyWaWZyYW1l55qEZG9t57uT5p6EXG4gKiBAcGFyYW0gaWZyYW1lV2luZG93XG4gKiBAcGFyYW0gd3VqaWVcbiAqIEBwYXJhbSBtYWluSG9zdFBhdGhcbiAqIEBwYXJhbSBhcHBIb3N0UGF0aFxuICovXG5mdW5jdGlvbiBpbml0SWZyYW1lRG9tKGlmcmFtZVdpbmRvdzogV2luZG93LCB3dWppZTogV3VKaWUsIG1haW5Ib3N0UGF0aDogc3RyaW5nLCBhcHBIb3N0UGF0aDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IGlmcmFtZURvY3VtZW50ID0gaWZyYW1lV2luZG93LmRvY3VtZW50O1xuICBjb25zdCBuZXdEb2MgPSB3aW5kb3cuZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50KFwiXCIpO1xuICBjb25zdCBuZXdEb2N1bWVudEVsZW1lbnQgPSBpZnJhbWVEb2N1bWVudC5pbXBvcnROb2RlKG5ld0RvYy5kb2N1bWVudEVsZW1lbnQsIHRydWUpO1xuICBpZnJhbWVEb2N1bWVudC5kb2N1bWVudEVsZW1lbnRcbiAgICA/IGlmcmFtZURvY3VtZW50LnJlcGxhY2VDaGlsZChuZXdEb2N1bWVudEVsZW1lbnQsIGlmcmFtZURvY3VtZW50LmRvY3VtZW50RWxlbWVudClcbiAgICA6IGlmcmFtZURvY3VtZW50LmFwcGVuZENoaWxkKG5ld0RvY3VtZW50RWxlbWVudCk7XG4gIGlmcmFtZVdpbmRvdy5fX1dVSklFX1JBV19ET0NVTUVOVF9IRUFEX18gPSBpZnJhbWVEb2N1bWVudC5oZWFkO1xuICBpZnJhbWVXaW5kb3cuX19XVUpJRV9SQVdfRE9DVU1FTlRfUVVFUllfU0VMRUNUT1JfXyA9IGlmcmFtZVdpbmRvdy5Eb2N1bWVudC5wcm90b3R5cGUucXVlcnlTZWxlY3RvcjtcbiAgaWZyYW1lV2luZG93Ll9fV1VKSUVfUkFXX0RPQ1VNRU5UX1FVRVJZX1NFTEVDVE9SX0FMTF9fID0gaWZyYW1lV2luZG93LkRvY3VtZW50LnByb3RvdHlwZS5xdWVyeVNlbGVjdG9yQWxsO1xuICBpZnJhbWVXaW5kb3cuX19XVUpJRV9SQVdfRE9DVU1FTlRfQ1JFQVRFX0VMRU1FTlRfXyA9IGlmcmFtZVdpbmRvdy5Eb2N1bWVudC5wcm90b3R5cGUuY3JlYXRlRWxlbWVudDtcbiAgaWZyYW1lV2luZG93Ll9fV1VKSUVfUkFXX0RPQ1VNRU5UX0NSRUFURV9URVhUX05PREVfXyA9IGlmcmFtZVdpbmRvdy5Eb2N1bWVudC5wcm90b3R5cGUuY3JlYXRlVGV4dE5vZGU7XG4gIGluaXRCYXNlKGlmcmFtZVdpbmRvdywgd3VqaWUudXJsKTtcbiAgcGF0Y2hJZnJhbWVIaXN0b3J5KGlmcmFtZVdpbmRvdywgYXBwSG9zdFBhdGgsIG1haW5Ib3N0UGF0aCk7XG4gIHBhdGNoSWZyYW1lRXZlbnRzKGlmcmFtZVdpbmRvdyk7XG4gIGlmICh3dWppZS5kZWdyYWRlKSByZWNvcmRFdmVudExpc3RlbmVycyhpZnJhbWVXaW5kb3cpO1xuICBzeW5jSWZyYW1lVXJsVG9XaW5kb3coaWZyYW1lV2luZG93KTtcblxuICBwYXRjaFdpbmRvd0VmZmVjdChpZnJhbWVXaW5kb3cpO1xuICBwYXRjaERvY3VtZW50RWZmZWN0KGlmcmFtZVdpbmRvdyk7XG4gIHBhdGNoTm9kZUVmZmVjdChpZnJhbWVXaW5kb3cpO1xuICBwYXRjaFJlbGF0aXZlVXJsRWZmZWN0KGlmcmFtZVdpbmRvdyk7XG4gIHBhdGNoU2V0QXR0cmlidXRlKGlmcmFtZVdpbmRvdyk7XG59XG5cbi8qKlxuICog6Ziy5q2i6L+Q6KGM5Li75bqU55So55qEanPku6PnoIHvvIznu5nlrZDlupTnlKjluKbmnaXlvojlpJrlia/kvZznlKhcbiAqXG4gKiBvcHRpb25zLmZhbGxiYWNrU3JjIOihqOekuiBpZnJhbWUg5piv55SoIHNyY2RvYyDlkK/liqjnmoTvvIjkuI3lj5Hor7fmsYLliqDovb3kuLvlupTnlKggaG9zdO+8iVxuICog5q2k5pe26ZyA6KaB6YCa6L+HIGRvY3VtZW50Lm9wZW4oKS9jbG9zZSgpIOWcqOS4u+W6lOeUqOS4iuS4i+aWh+mHjOaKiiBpZnJhbWUg55qEIFVSTFxuICog55SxIGFib3V0OnNyY2RvYyDmlLnlhpnmiJDkuLvlupTnlKggVVJM77yM5ZCm5YiZIGxvY2F0aW9uLm9yaWdpbiDkuI3mmK/kuLvlupTnlKjlkIzmupDvvIxcbiAqIOWtkOW6lOeUqOeahCByb3V0ZXIvZmV0Y2gg562J6YO95Lya5Ye66Zeu6aKY44CCXG4gKlxuICog5YWz6ZSu5pe25bqP77yac3JjZG9jIOaYr+W8guatpSBuYXZpZ2F0aW9u77yMYXBwZW5kQ2hpbGQg5LmL5ZCOIGlmcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50XG4gKiDov5jmmK/liJ3lp4sgYWJvdXQ6YmxhbmvvvIznq4vliLsgb3BlbigpIOS8muiiq+maj+WQjuWIsOadpeeahCBzcmNkb2Mg5paH5qGj5pu/5o2i5o6J44CCXG4gKiDlm6DmraQgc3JjZG9jIOWIhuaUr+W/hemhu+etiSBpZnJhbWUg55qEIGxvYWQg5LqL5Lu26Kem5Y+R77yIc3JjZG9jIOaWh+aho+W3suWwseS9je+8ieWGjeWBmiB0cmlja+OAglxuICpcbiAqIOWmguaenCB0cmljayDlnKjlvZPliY3mtY/op4jlmajkuIrlpLHotKXvvIjmnoHlsJHop4HvvInvvIzkvJrlhZzlupXliLAgZmFsbGJhY2tTcmMg55yf5a6e5Yqg6L2977yMXG4gKiDmraTml7bnlLHkuo7kuI3lho3otbAgc3JjZG9j77yM6ZyA6KaB5YiH5o2i5YiwIHN0b3BJZnJhbWVMb2FkaW5nIOeahFwi56uL5Y2zIHN0b3BcIuWIhuaUr+OAglxuICovXG5mdW5jdGlvbiBzdG9wSWZyYW1lTG9hZGluZyhpZnJhbWU6IEhUTUxJRnJhbWVFbGVtZW50LCBvcHRpb25zOiB7IGZhbGxiYWNrU3JjOiBzdHJpbmcgfSB8IGZhbHNlKSB7XG4gIGNvbnN0IGlmcmFtZVdpbmRvdyA9IGlmcmFtZS5jb250ZW50V2luZG93O1xuICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUpID0+IHtcbiAgICAvLyBzcmNkb2Mg6Lev5b6E77ya562JIHNyY2RvYyDmlofmoaPlsLHkvY3vvIhsb2FkIOS6i+S7tu+8ie+8jOeEtuWQjuWBmuS4gOasoSBkb2N1bWVudC5vcGVuKCkgdHJpY2tcbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgbGV0IGRvbmUgPSBmYWxzZTtcbiAgICAgIGNvbnN0IHJ1blRyaWNrID0gKCkgPT4ge1xuICAgICAgICBpZiAoZG9uZSkgcmV0dXJuO1xuICAgICAgICBkb25lID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgbmV3RG9jID0gaWZyYW1lV2luZG93LmRvY3VtZW50O1xuICAgICAgICBjb25zdCBwcmV2aW91c0hyZWYgPSBpZnJhbWVXaW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICAgICAgbmV3RG9jLm9wZW4oKTtcbiAgICAgICAgbmV3RG9jLmNsb3NlKCk7XG4gICAgICAgIC8vIOaMiSBIVE1MIHNwZWPvvIxkb2N1bWVudC5vcGVuKCkg5ZCM5q2l5pS55YaZ5b2T5YmNIGRvY3VtZW50IOeahCBVUkzvvIzml6DpnIDova7or6JcbiAgICAgICAgaWYgKGlmcmFtZVdpbmRvdy5sb2NhdGlvbi5ocmVmICE9PSBwcmV2aW91c0hyZWYpIHtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIOaegeWwkeaVsOa1j+iniOWZqOacquaMiSBzcGVjIOWQjOatpeaUuSBVUkzvvIzlhZzlupXotbAgZmFsbGJhY2tTcmMg55yf5a6e5Yqg6L29XG4gICAgICAgIHdhcm4oYHd1amllOiBzcmNkb2MgKyBkb2N1bWVudC5vcGVuKCkgdHJpY2sgZmFpbGVkLCBmYWxsYmFjayB0byBsb2FkICR7b3B0aW9ucy5mYWxsYmFja1NyY30gdGhpcyB0aW1lLmApO1xuICAgICAgICAvLyBIVE1MIHNwZWMg6KeE5a6aIHNyY2RvYyDkvJjlhYjnuqfpq5jkuo4gc3Jj77yM5b+F6aG75YWI56e76ZmkIHNyY2RvYyDmiY3og73orqkgc3JjIOeUn+aViFxuICAgICAgICBpZnJhbWUucmVtb3ZlQXR0cmlidXRlKFwic3JjZG9jXCIpO1xuICAgICAgICBpZnJhbWUuc3JjID0gb3B0aW9ucy5mYWxsYmFja1NyYztcbiAgICAgICAgc3RvcElmcmFtZUxvYWRpbmcoaWZyYW1lLCBmYWxzZSkudGhlbihyZXNvbHZlKTtcbiAgICAgIH07XG4gICAgICBpZnJhbWUuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgcnVuVHJpY2ssIHsgb25jZTogdHJ1ZSB9KTtcbiAgICAgIC8vIDVzIOWuieWFqOe9ke+8mmxvYWQg55CG6K665LiK5b+F5a6a6Kem5Y+R77yM5Yqg5LiA5bGC5L+d6Zmp6YG/5YWN6K+h5byC5oyC5q27XG4gICAgICBzZXRUaW1lb3V0KHJ1blRyaWNrLCA1ZTMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGZhbGxiYWNrIOecn+WunuWKoOi9vei3r+W+hO+8muS7jemcgOi9ruivou+8jOi1tuWcqOmhtemdouecn+ato+WKoOi9veWujOaIkOWJjSBzdG9wKClcbiAgICBjb25zdCBvbGREb2MgPSBpZnJhbWVXaW5kb3cuZG9jdW1lbnQ7XG4gICAgY29uc3QgbG9vcERlYWRsaW5lID0gRGF0ZS5ub3coKSArIDVlMztcbiAgICBmdW5jdGlvbiBsb29wKCkge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGxldCBuZXdEb2M6IERvY3VtZW50O1xuICAgICAgICB0cnkge1xuICAgICAgICAgIG5ld0RvYyA9IGlmcmFtZVdpbmRvdy5kb2N1bWVudDtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgbmV3RG9jID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKCFuZXdEb2MgfHwgbmV3RG9jID09IG9sZERvYykgJiYgRGF0ZS5ub3coKSA8IGxvb3BEZWFkbGluZSkge1xuICAgICAgICAgIGxvb3AoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWZyYW1lV2luZG93LnN0b3AgPyBpZnJhbWVXaW5kb3cuc3RvcCgpIDogbmV3RG9jLmV4ZWNDb21tYW5kKFwiU3RvcFwiKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSwgMSk7XG4gICAgfVxuICAgIGxvb3AoKTtcbiAgfSk7XG59XG5cbi8qKlxuICog57uZ5a2Q5bqU55So5YWD57Sg5omT5LiKIGJhc2VVUkkgLyBvd25lckRvY3VtZW50IOihpeS4ge+8jOiuqeWug+WcqOS4u+W6lOeUqCBET00g5Lit5Lmf5L+d55WZ5a2Q5bqU55SoXG4gKiDnmoQgbG9jYXRpb24gLyBkb2N1bWVudCDor63kuYnjgIJcbiAqXG4gKiDpl63ljIXmjIHmnInnrZbnlaXvvJrnlKggV2Vha1JlZjxXaW5kb3c+IOmXtOaOpeaMgeaciSBpZnJhbWVXaW5kb3fvvIxwcm94eUxvY2F0aW9uIC8gcGx1Z2luc1xuICog6YO96YCa6L+HIGBpZnJhbWVXaW5kb3cuX19XVUpJRWAg5Yqo5oCB6K6/6Zeu44CC6L+Z5qC35LiA5p2l77yM5b2T5a2Q5bqU55SoIGVsZW1lbnQg6KKr5Lia5Yqh56e75YiwXG4gKiDkuLvlupTnlKggRE9NIOS4i++8iHBvcnRhbCAvIOW8ueeqlyAvIOaLluaLveetie+8ie+8jHNhbmRib3guZGVzdHJveSgpIOaKilxuICogYGlmcmFtZVdpbmRvdy5fX1dVSklFID0gbnVsbGAg5ZCO77yMZ2V0dGVyIOS8muiHquWKqOmZjee6p+WIsOS4uyBkb2N1bWVudO+8jGVsZW1lbnQg5LiN5LyaXG4gKiDmiormlbTkuKrlrZDlupTnlKjkuIrkuIvmlofpkonlnKjlhoXlrZjkuK3jgIJcbiAqXG4gKiBXZWFrUmVmIOaYryBFUzIwMjEg5qCH5YeG77yIQ2hyb21lIDg0KyAvIE5vZGUgMTQuNivvvInvvJvml6fnjq/looPpmY3nuqfkuLrlvLrlvJXnlKjku6Xkv53lhbzlrrnjgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhdGNoRWxlbWVudEVmZmVjdChcbiAgZWxlbWVudDogKEhUTUxFbGVtZW50IHwgTm9kZSB8IFNoYWRvd1Jvb3QpICYgeyBfaGFzUGF0Y2g/OiBib29sZWFuIH0sXG4gIGlmcmFtZVdpbmRvdzogV2luZG93XG4pOiB2b2lkIHtcbiAgaWYgKGVsZW1lbnQuX2hhc1BhdGNoKSByZXR1cm47XG4gIGNvbnN0IEhhc1dlYWtSZWYgPSB0eXBlb2YgKGdsb2JhbFRoaXMgYXMgYW55KS5XZWFrUmVmID09PSBcImZ1bmN0aW9uXCI7XG4gIGNvbnN0IGlmcmFtZVdpbmRvd1JlZjogeyBkZXJlZigpOiBXaW5kb3cgfCB1bmRlZmluZWQgfSA9IEhhc1dlYWtSZWZcbiAgICA/IG5ldyAoZ2xvYmFsVGhpcyBhcyBhbnkpLldlYWtSZWYoaWZyYW1lV2luZG93KVxuICAgIDogeyBkZXJlZjogKCkgPT4gaWZyYW1lV2luZG93IH07XG4gIHRyeSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoZWxlbWVudCwge1xuICAgICAgYmFzZVVSSToge1xuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGdldDogKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHdpbiA9IGlmcmFtZVdpbmRvd1JlZi5kZXJlZigpO1xuICAgICAgICAgIGNvbnN0IHByb3h5TG9jYXRpb24gPSB3aW4/Ll9fV1VKSUU/LnByb3h5TG9jYXRpb24gYXMgTG9jYXRpb24gfCB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKCFwcm94eUxvY2F0aW9uKSByZXR1cm4gd2luZG93LmRvY3VtZW50LmJhc2VVUkk7XG4gICAgICAgICAgcmV0dXJuIHByb3h5TG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vXCIgKyBwcm94eUxvY2F0aW9uLmhvc3QgKyBwcm94eUxvY2F0aW9uLnBhdGhuYW1lO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IHVuZGVmaW5lZCxcbiAgICAgIH0sXG4gICAgICBvd25lckRvY3VtZW50OiB7XG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZ2V0OiAoKSA9PiB7XG4gICAgICAgICAgY29uc3Qgd2luID0gaWZyYW1lV2luZG93UmVmLmRlcmVmKCk7XG4gICAgICAgICAgLy8gd2luLl9fV1VKSUUg6KKr572uIG51bGzvvIhkZXN0cm95IOWQju+8ieaIliB3aW4g5pys6Lqr5beyIEdDIOaXtumZjee6p+WIsOS4uyBkb2N1bWVudO+8jFxuICAgICAgICAgIC8vIOmYsuatoiBlbGVtZW50IOawuOS5heaKiiBpZnJhbWVXaW5kb3cg6ZKJ5Zyo5YaF5a2Y5Lit44CCXG4gICAgICAgICAgaWYgKCF3aW4gfHwgIXdpbi5fX1dVSklFKSByZXR1cm4gd2luZG93LmRvY3VtZW50O1xuICAgICAgICAgIC8vIOmZjee6p+aooeW8j++8muiKgueCueW3suaMguWIsOa4suafkyBpZnJhbWXvvIxvd25lckRvY3VtZW50IOmcgOS4juWPr+ingSBET00g5LiA6Ie077yMXG4gICAgICAgICAgLy8g5ZCm5YiZIHdhbmdFZGl0b3IgTE8vUk/vvIhub2RlLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXcgaW5zdGFuY2VvZu+8ieS8muWksei0peOAglxuICAgICAgICAgIGlmICh3aW4uX19XVUpJRS5kZWdyYWRlICYmIHdpbi5fX1dVSklFLmRvY3VtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gd2luLl9fV1VKSUUuZG9jdW1lbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB3aW4uZG9jdW1lbnQ7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgX2hhc1BhdGNoOiB7IGdldDogKCkgPT4gdHJ1ZSB9LFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUud2FybihlcnJvcik7XG4gIH1cbiAgZXhlY0hvb2tzKGlmcmFtZVdpbmRvdy5fX1dVSklFLnBsdWdpbnMsIFwicGF0Y2hFbGVtZW50SG9va1wiLCBlbGVtZW50LCBpZnJhbWVXaW5kb3cpO1xuICAvLyDnvJbor5HlhoXogZTkuovku7blpITnkIblmahcbiAgY29tcGlsZUlubGluZUV2ZW50cyhlbGVtZW50IGFzIEVsZW1lbnQsIGlmcmFtZVdpbmRvdyk7XG59XG5cbi8qKlxuICog5a2Q5bqU55So5YmN6L+b5ZCO6YCA77yM5ZCM5q2l6Lev55Sx5Yiw5Li75bqU55SoXG4gKiBAcGFyYW0gaWZyYW1lV2luZG93XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzeW5jSWZyYW1lVXJsVG9XaW5kb3coaWZyYW1lV2luZG93OiBXaW5kb3cpOiB2b2lkIHtcbiAgaWZyYW1lV2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJoYXNoY2hhbmdlXCIsICgpID0+IHN5bmNVcmxUb1dpbmRvdyhpZnJhbWVXaW5kb3cpKTtcbiAgaWZyYW1lV2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJwb3BzdGF0ZVwiLCAoKSA9PiB7XG4gICAgc3luY1VybFRvV2luZG93KGlmcmFtZVdpbmRvdyk7XG4gIH0pO1xufVxuXG4vKipcbiAqIGlmcmFtZeaPkuWFpeiEmuacrFxuICogQHBhcmFtIHNjcmlwdFJlc3VsdCBzY3JpcHTor7fmsYLnu5PmnpxcbiAqIEBwYXJhbSBpZnJhbWVXaW5kb3dcbiAqIEBwYXJhbSByYXdFbGVtZW50IOWOn+Wni+eahOiEmuacrFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0U2NyaXB0VG9JZnJhbWUoXG4gIHNjcmlwdFJlc3VsdDogU2NyaXB0T2JqZWN0IHwgU2NyaXB0T2JqZWN0TG9hZGVyLFxuICBpZnJhbWVXaW5kb3c6IFdpbmRvdyxcbiAgcmF3RWxlbWVudD86IEhUTUxTY3JpcHRFbGVtZW50XG4pIHtcbiAgY29uc3QgeyBzcmMsIG1vZHVsZSwgY29udGVudCwgY3Jvc3NvcmlnaW4sIGNyb3Nzb3JpZ2luVHlwZSwgYXN5bmMsIGF0dHJzLCBjYWxsYmFjaywgb25sb2FkIH0gPVxuICAgIHNjcmlwdFJlc3VsdCBhcyBTY3JpcHRPYmplY3RMb2FkZXI7XG4gIGNvbnN0IHNjcmlwdEVsZW1lbnQgPSBpZnJhbWVXaW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcbiAgY29uc3QgbmV4dFNjcmlwdEVsZW1lbnQgPSBpZnJhbWVXaW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcbiAgY29uc3QgeyByZXBsYWNlLCBwbHVnaW5zLCBwcm94eUxvY2F0aW9uIH0gPSBpZnJhbWVXaW5kb3cuX19XVUpJRTtcbiAgY29uc3QganNMb2FkZXIgPSBnZXRKc0xvYWRlcih7IHBsdWdpbnMsIHJlcGxhY2UgfSk7XG4gIGxldCBjb2RlID0ganNMb2FkZXIoY29udGVudCwgc3JjLCBnZXRDdXJVcmwocHJveHlMb2NhdGlvbikpO1xuICAvLyDmt7vliqDlsZ7mgKdcbiAgYXR0cnMgJiZcbiAgICBPYmplY3Qua2V5cyhhdHRycylcbiAgICAgIC5maWx0ZXIoKGtleSkgPT4gIU9iamVjdC5rZXlzKHNjcmlwdFJlc3VsdCkuaW5jbHVkZXMoa2V5KSlcbiAgICAgIC5mb3JFYWNoKChrZXkpID0+IHNjcmlwdEVsZW1lbnQuc2V0QXR0cmlidXRlKGtleSwgU3RyaW5nKGF0dHJzW2tleV0pKSk7XG5cbiAgLy8g5YaF6IGU6ISa5pysXG4gIGlmIChjb250ZW50KSB7XG4gICAgLy8gcGF0Y2ggbG9jYXRpb25cbiAgICBpZiAoIWlmcmFtZVdpbmRvdy5fX1dVSklFLmRlZ3JhZGUgJiYgIW1vZHVsZSAmJiBhdHRycz8udHlwZSAhPT0gXCJpbXBvcnRtYXBcIikge1xuICAgICAgY29kZSA9IGAoZnVuY3Rpb24od2luZG93LCBzZWxmLCBnbG9iYWwsIGxvY2F0aW9uKSB7XG4gICAgICAke2NvZGV9XG59KS5iaW5kKHdpbmRvdy5fX1dVSklFLnByb3h5KShcbiAgd2luZG93Ll9fV1VKSUUucHJveHksXG4gIHdpbmRvdy5fX1dVSklFLnByb3h5LFxuICB3aW5kb3cuX19XVUpJRS5wcm94eSxcbiAgd2luZG93Ll9fV1VKSUUucHJveHlMb2NhdGlvbixcbik7YDtcbiAgICB9XG4gICAgY29uc3QgZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Ioc2NyaXB0RWxlbWVudCwgXCJzcmNcIik7XG4gICAgLy8g6YOo5YiG5rWP6KeI5ZmoIHNyYyDkuI3lj6/phY3nva4g5Y+W5LiN5YiwZGVzY3JpcHRvcuihqOekuuaXoOivpeWxnuaAp++8jOWPr+WGmVxuICAgIGlmIChkZXNjcmlwdG9yPy5jb25maWd1cmFibGUgfHwgIWRlc2NyaXB0b3IpIHtcbiAgICAgIC8vIOino+WGsyB3ZWJwYWNrIHB1YmxpY1BhdGgg5Li6IGF1dG8g5peg5rOV5Yqg6L296LWE5rqQ55qE6Zeu6aKYXG4gICAgICB0cnkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc2NyaXB0RWxlbWVudCwgXCJzcmNcIiwgeyBnZXQ6ICgpID0+IHNyYyB8fCBcIlwiIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgc3JjICYmIHNjcmlwdEVsZW1lbnQuc2V0QXR0cmlidXRlKFwic3JjXCIsIHNyYyk7XG4gICAgY3Jvc3NvcmlnaW4gJiYgc2NyaXB0RWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJjcm9zc29yaWdpblwiLCBjcm9zc29yaWdpblR5cGUpO1xuICB9XG4gIG1vZHVsZSAmJiBzY3JpcHRFbGVtZW50LnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJtb2R1bGVcIik7XG4gIHNjcmlwdEVsZW1lbnQudGV4dENvbnRlbnQgPSBjb2RlIHx8IFwiXCI7XG4gIG5leHRTY3JpcHRFbGVtZW50LnRleHRDb250ZW50ID1cbiAgICBcImlmKHdpbmRvdy5fX1dVSklFLmV4ZWNRdWV1ZSAmJiB3aW5kb3cuX19XVUpJRS5leGVjUXVldWUubGVuZ3RoKXsgd2luZG93Ll9fV1VKSUUuZXhlY1F1ZXVlLnNoaWZ0KCkoKX1cIjtcblxuICBjb25zdCBjb250YWluZXIgPSByYXdEb2N1bWVudFF1ZXJ5U2VsZWN0b3IuY2FsbChpZnJhbWVXaW5kb3cuZG9jdW1lbnQsIFwiaGVhZFwiKTtcbiAgY29uc3QgZXhlY05leHRTY3JpcHQgPSAoKSA9PiAhYXN5bmMgJiYgY29udGFpbmVyLmFwcGVuZENoaWxkKG5leHRTY3JpcHRFbGVtZW50KTtcbiAgY29uc3QgYWZ0ZXJFeGVjU2NyaXB0ID0gKCkgPT4ge1xuICAgIG9ubG9hZD8uKCk7XG4gICAgZXhlY05leHRTY3JpcHQoKTtcbiAgfTtcblxuICAvLyDplJnor6/mg4XlhrXlpITnkIZcbiAgaWYgKC9ePCFET0NUWVBFIGh0bWwvaS50ZXN0KGNvZGUpKSB7XG4gICAgZXJyb3IoV1VKSUVfVElQU19TQ1JJUFRfRVJST1JfUkVRVUVTVEVELCBzY3JpcHRSZXN1bHQpO1xuICAgIHJldHVybiBleGVjTmV4dFNjcmlwdCgpO1xuICB9XG5cbiAgLy8g5omT5qCH6K6wXG4gIGlmIChyYXdFbGVtZW50KSB7XG4gICAgc2V0VGFnVG9TY3JpcHQoc2NyaXB0RWxlbWVudCwgZ2V0VGFnRnJvbVNjcmlwdChyYXdFbGVtZW50KSk7XG4gICAgLy8gcmF3RWxlbWVudCDkuI3kuLrnqbrooajnpLrov5nmmK8gZWZmZWN0LnRzIOi9rOWPkeeahOWKqOaAgSA8c2NyaXB0Pu+8iHdlYnBhY2sg5byC5q2lIGNodW5rIOetie+8ieOAglxuICAgIC8vIOeZu+iusOWIsCBzYW5kYm94LmR5bmFtaWNTY3JpcHRFbGVtZW50c++8jOeUsSBkZXN0cm95KCkg57uf5LiA5riF55CG77yM6YG/5YWNIGlmcmFtZSDmrovnlZkgZGV0YWNo44CCXG4gICAgY29uc3Qgc2FuZGJveEZvckNsZWFudXAgPSBpZnJhbWVXaW5kb3cuX19XVUpJRTtcbiAgICBpZiAoc2FuZGJveEZvckNsZWFudXAgJiYgQXJyYXkuaXNBcnJheShzYW5kYm94Rm9yQ2xlYW51cC5keW5hbWljU2NyaXB0RWxlbWVudHMpKSB7XG4gICAgICBzYW5kYm94Rm9yQ2xlYW51cC5keW5hbWljU2NyaXB0RWxlbWVudHMucHVzaChzY3JpcHRFbGVtZW50KTtcbiAgICB9XG4gIH1cbiAgLy8g5aSW6IGU6ISa5pys5omn6KGM5ZCO55qE5aSE55CGXG4gIGNvbnN0IGlzT3V0bGluZVNjcmlwdCA9ICFjb250ZW50ICYmIHNyYztcbiAgaWYgKGlzT3V0bGluZVNjcmlwdCkge1xuICAgIHNjcmlwdEVsZW1lbnQub25sb2FkID0gYWZ0ZXJFeGVjU2NyaXB0O1xuICAgIHNjcmlwdEVsZW1lbnQub25lcnJvciA9IGFmdGVyRXhlY1NjcmlwdDtcbiAgfVxuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoc2NyaXB0RWxlbWVudCk7XG5cbiAgLy8g6LCD55So5Zue6LCDXG4gIGNhbGxiYWNrPy4oaWZyYW1lV2luZG93KTtcbiAgLy8g5omn6KGMIGhvb2tzXG4gIGV4ZWNIb29rcyhwbHVnaW5zLCBcImFwcGVuZE9ySW5zZXJ0RWxlbWVudEhvb2tcIiwgc2NyaXB0RWxlbWVudCwgaWZyYW1lV2luZG93LCByYXdFbGVtZW50KTtcbiAgLy8g5YaF6IGU6ISa5pys5omn6KGM5ZCO55qE5aSE55CGXG4gICFpc091dGxpbmVTY3JpcHQgJiYgYWZ0ZXJFeGVjU2NyaXB0KCk7XG59XG5cbi8qKlxuICog5Yqg6L29aWZyYW1l5pu/5o2i5a2Q5bqU55SoXG4gKiBAcGFyYW0gc3JjIOWcsOWdgFxuICogQHBhcmFtIGVsZW1lbnRcbiAqIEBwYXJhbSBkZWdyYWRlQXR0cnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlcklmcmFtZVJlcGxhY2VBcHAoXG4gIHNyYzogc3RyaW5nLFxuICBlbGVtZW50OiBIVE1MRWxlbWVudCxcbiAgZGVncmFkZUF0dHJzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge31cbik6IHZvaWQge1xuICBjb25zdCBpZnJhbWUgPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlmcmFtZVwiKTtcbiAgY29uc3QgZGVmYXVsdFN0eWxlID0gXCJoZWlnaHQ6MTAwJTt3aWR0aDoxMDAlXCI7XG4gIHNldEF0dHJzVG9FbGVtZW50KGlmcmFtZSwgeyAuLi5kZWdyYWRlQXR0cnMsIHNyYywgc3R5bGU6IFtkZWZhdWx0U3R5bGUsIGRlZ3JhZGVBdHRycy5zdHlsZV0uam9pbihcIjtcIikgfSk7XG4gIHJlbmRlckVsZW1lbnRUb0NvbnRhaW5lcihpZnJhbWUsIGVsZW1lbnQpO1xufVxuXG4vLyDmspnnrrEgaWZyYW1lIOWQr+WKqOaXtueahOepuueZveaWh+aho+WGheWuuVxuLy8gc3JjZG9jIOaWh+aho+eahCBvcmlnaW4g55SxIHNwZWMg5L+d6K+B57un5om/6IeqIGVtYmVkZGVy77yI5Y2z5Li75bqU55So77yJ77yMXG4vLyDov5nmoLfml6LkuI3lj5HnvZHnu5zor7fmsYLvvIzkuZ/kv53or4HkuLvlupTnlKjog73orr/pl64gY29udGVudERvY3VtZW5044CCXG5jb25zdCBTQU5EQk9YX0VNUFRZX1NSQ0RPQyA9IFwiPCFET0NUWVBFIGh0bWw+PGh0bWw+PGhlYWQ+PC9oZWFkPjxib2R5PjwvYm9keT48L2h0bWw+XCI7XG5cbi8qKlxuICoganPmspnnrrFcbiAqIOWIm+W7uuWSjOS4u+W6lOeUqOWQjOa6kOeahGlmcmFtZe+8jOi3r+W+hOaQuuW4puS6huWtkOi3r+eUseeahOi3r+eUseS/oeaBr1xuICogaWZyYW1l5b+F6aG756aB5q2i5Yqg6L29aHRtbO+8jOmYsuatoui/m+WFpeS4u+W6lOeUqOeahOi3r+eUsemAu+i+kVxuICpcbiAqIOe7n+S4gOS9v+eUqCBzcmNkb2Mg5Yqg6L2956m655m95paH5qGj77yaXG4gKiAgIC0g5LiN5Y+R5Lu75L2V6K+35rGC5Yqg6L295Li75bqU55SoIGhvc3Qg6LWE5rqQ77yI6Kej5YazIGlzc3VlICM1NO+8iVxuICogICAtIG9yaWdpbiDnu6fmib/oh6ogZW1iZWRkZXLvvIzkuLvlupTnlKjlj6/ku6XmraPluLggcGF0Y2ggY29udGVudERvY3VtZW50XG4gKiAgIC0g5LmL5ZCO6YCa6L+HIGRvY3VtZW50Lm9wZW4oKSDmioogaWZyYW1lIOeahCBsb2NhdGlvbiDmlLnlhpnliLDkuLvlupTnlKggVVJM77yMXG4gKiAgICAg5L2/IGxvY2F0aW9uLm9yaWdpbuOAgWhpc3RvcnnjgIFyb3V0ZXIg562J6KGM5Li65LiO5Li75bqU55So5ZCM5rqQ5LiA6Ie0XG4gKlxuICogYXR0cnMuc3JjIOS4jeWGjeS9nOS4uiBpZnJhbWUg55qE5Yid5aeLIHNyY++8iEhUTUwgc3BlYyDop4Tlrpogc3JjZG9jIOS8mOWFiOe6p+mrmOS6jiBzcmPvvIxcbiAqIOWNs+S+v+S/neeVmSBzcmMg5rWP6KeI5Zmo5Lmf5Lya5b+955Wl5a6D77yJ44CC5a6D6KKr6YeN5paw6Kej6YeK5Li644CMc3JjZG9jIHRyaWNrIOWksei0peaXtueahOWFnOW6leepuueZvemhtSBVUkzjgI3vvIxcbiAqIOeUqOaIt+WPr+aMh+WQkeiHquW3seaPkOS+m+eahCBgL2VtcHR5YCDpnZnmgIHmlofku7bmiJYgU2VydmljZSBXb3JrZXIg56uv54K577yb5LiN5Lyg5YiZ5YWc5bqVIG1haW5Ib3N0UGF0aOOAglxuICovXG5leHBvcnQgZnVuY3Rpb24gaWZyYW1lR2VuZXJhdG9yKFxuICBzYW5kYm94OiBXdUppZSxcbiAgYXR0cnM6IHsgW2tleTogc3RyaW5nXTogYW55IH0sXG4gIG1haW5Ib3N0UGF0aDogc3RyaW5nLFxuICBhcHBIb3N0UGF0aDogc3RyaW5nLFxuICBhcHBSb3V0ZVBhdGg6IHN0cmluZ1xuKTogSFRNTElGcmFtZUVsZW1lbnQge1xuICAvLyDmiornlKjmiLfkvKDlhaXnmoQgc3JjIOaLhuWHuuadpeS9nOS4uiBmYWxsYmFjayDnlKjvvIzkuI3lho3kvZzkuLogaWZyYW1lIOeahOWIneWniyBzcmMg55u05o6l5oyC6L29XG4gIGNvbnN0IHsgc3JjOiB1c2VyRmFsbGJhY2tTcmMsIC4uLnJlc3RBdHRycyB9ID0gYXR0cnMgfHwge307XG4gIGNvbnN0IGZhbGxiYWNrU3JjID0gdXNlckZhbGxiYWNrU3JjIHx8IG1haW5Ib3N0UGF0aDtcblxuICBjb25zdCBpZnJhbWUgPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlmcmFtZVwiKTtcbiAgY29uc3QgYXR0cnNNZXJnZSA9IHtcbiAgICBzdHlsZTogXCJkaXNwbGF5OiBub25lXCIsXG4gICAgLi4ucmVzdEF0dHJzLFxuICAgIG5hbWU6IHNhbmRib3guaWQsXG4gICAgW1dVSklFX0RBVEFfRkxBR106IFwiXCIsXG4gICAgc3JjZG9jOiBTQU5EQk9YX0VNUFRZX1NSQ0RPQyxcbiAgfTtcbiAgc2V0QXR0cnNUb0VsZW1lbnQoaWZyYW1lLCBhdHRyc01lcmdlKTtcbiAgd2luZG93LmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcblxuICBjb25zdCBpZnJhbWVXaW5kb3cgPSBpZnJhbWUuY29udGVudFdpbmRvdztcbiAgLy8g5Y+Y6YeP6ZyA6KaB5o+Q5YmN5rOo5YWl77yM5Zyo5YWl5Y+j5Ye95pWw6YCa6L+H5Y+Y6YeP6Ziy5q2i5q275b6q546vXG4gIHBhdGNoSWZyYW1lVmFyaWFibGUoaWZyYW1lV2luZG93LCBzYW5kYm94LCBhcHBIb3N0UGF0aCk7XG4gIHNhbmRib3guaWZyYW1lUmVhZHkgPSBzdG9wSWZyYW1lTG9hZGluZyhpZnJhbWUsIHsgZmFsbGJhY2tTcmMgfSkudGhlbigoKSA9PiB7XG4gICAgaWYgKCFpZnJhbWVXaW5kb3cuX19XVUpJRSkge1xuICAgICAgcGF0Y2hJZnJhbWVWYXJpYWJsZShpZnJhbWVXaW5kb3csIHNhbmRib3gsIGFwcEhvc3RQYXRoKTtcbiAgICB9XG4gICAgaW5pdElmcmFtZURvbShpZnJhbWVXaW5kb3csIHNhbmRib3gsIG1haW5Ib3N0UGF0aCwgYXBwSG9zdFBhdGgpO1xuICAgIC8qKlxuICAgICAqIOWmguaenOacieWQjOatpeS8mOWFiOWQjOatpe+8jOmdnuWQjOatpeS7jnVybOivu+WPllxuICAgICAqL1xuICAgIGlmICghaXNNYXRjaFN5bmNRdWVyeUJ5SWQoaWZyYW1lV2luZG93Ll9fV1VKSUUuaWQpKSB7XG4gICAgICBpZnJhbWVXaW5kb3cuaGlzdG9yeS5yZXBsYWNlU3RhdGUobnVsbCwgXCJcIiwgbWFpbkhvc3RQYXRoICsgYXBwUm91dGVQYXRoKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gaWZyYW1lO1xufVxuXG4vLyDlhoXogZTkuovku7bnvJbor5HlkI7nmoTnu5/kuIDliY3nvIDvvIznlKjkuo7luYLnrYnliKTmlq3vvIzpgb/lhY3ph43lpI3ljIXoo7lcbmNvbnN0IFdVSklFX0lOTElORV9FVkVOVF9QUkVGSVggPSBcIndpdGgod2luZG93Ll9fZ2V0V3VqaWVXaW5kb3dfXyhcIjtcblxuLyoqXG4gKiDlsIblhoXogZTkuovku7blpITnkIblmajljIXoo7nkuLrlrZDlupTnlKjkvZznlKjln5/miafooYznmoTlvaLlvI9cbiAqIG9uY2xpY2s9XCJncmVldCgpXCIgLT4gb25jbGljaz0nd2l0aCh3aW5kb3cuX19nZXRXdWppZVdpbmRvd19fKFwiYXBwSWRcIikpeyBncmVldCgpIH0nXG4gKiDlt7LljIXoo7nov4fliJnljp/moLfov5Tlm57vvIzkv53or4HluYLnrYlcbiAqL1xuZnVuY3Rpb24gd3JhcElubGluZUV2ZW50SGFuZGxlcihoYW5kbGVyOiBzdHJpbmcsIGFwcElkOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoaGFuZGxlci5zdGFydHNXaXRoKFdVSklFX0lOTElORV9FVkVOVF9QUkVGSVgpKSByZXR1cm4gaGFuZGxlcjtcbiAgcmV0dXJuIGAke1dVSklFX0lOTElORV9FVkVOVF9QUkVGSVh9XCIke2FwcElkfVwiKSl7ICR7aGFuZGxlcn0gfWA7XG59XG5cbi8qKlxuICog57yW6K+R5YWD57Sg55qE5YaF6IGU5LqL5Lu25aSE55CG5ZmoXG4gKiDlsIYgb25jbGljaz1cIi4uLlwiIOe8luivkeS4uiBvbmNsaWNrPSd3aXRoKHdpbmRvdy5fX2dldFd1amllV2luZG93X18oXCJhcHBJZFwiKSl7IC4uLiB9J1xuICog6YCa6L+H5oqKIGFwcElkIOeDpOi/m+Wtl+espuS4suWtl+mdoumHj++8jOmBv+WFjei/kOihjOaXtuS+nei1luiiq+WKq+aMgeeahCBnZXRSb290Tm9kZVxuICovXG5mdW5jdGlvbiBjb21waWxlSW5saW5lRXZlbnRzKGVsZW1lbnQ6IEVsZW1lbnQsIGlmcmFtZVdpbmRvdzogV2luZG93KTogdm9pZCB7XG4gIC8vIOWPquWkhOeQhuWFg+e0oOiKgueCuVxuICBpZiAoZWxlbWVudC5ub2RlVHlwZSAhPT0gTm9kZS5FTEVNRU5UX05PREUpIHJldHVybjtcbiAgLy8g6ZmN57qn5qih5byP5ZCM5qC36ZyA6KaB57yW6K+R77ya5Ye95pWw5a6a5LmJ5Zyo5rKZ566xIGlmcmFtZSDlhajlsYDvvIxET00g5riy5p+T5Zyo5Y+m5LiA5Liq5riy5p+TIGlmcmFtZe+8jFxuICAvLyDljp/nlJ8gb25jbGljayDot6ggcmVhbG0g5Y+W5LiN5Yiw5Ye95pWw77yM5b+F6aG757uPIHdpdGgoX19nZXRXdWppZVdpbmRvd19fKSDmoaXmjqVcbiAgY29uc3QgYXBwSWQgPSBpZnJhbWVXaW5kb3cuX19XVUpJRT8uaWQ7XG4gIGlmICghYXBwSWQpIHJldHVybjtcblxuICAvLyDpgY3ljobmiYDmnInlsZ7mgKfvvIzmn6Xmib7lhoXogZTkuovku7ZcbiAgY29uc3QgYXR0cmlidXRlcyA9IEFycmF5LmZyb20oZWxlbWVudC5hdHRyaWJ1dGVzKTtcbiAgYXR0cmlidXRlcy5mb3JFYWNoKChhdHRyKSA9PiB7XG4gICAgaWYgKGF0dHIubmFtZS5zdGFydHNXaXRoKFwib25cIikgJiYgdHlwZW9mIGF0dHIudmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGNvbnN0IGNvbXBpbGVkSGFuZGxlciA9IHdyYXBJbmxpbmVFdmVudEhhbmRsZXIoYXR0ci52YWx1ZSwgYXBwSWQpO1xuICAgICAgaWYgKGNvbXBpbGVkSGFuZGxlciAhPT0gYXR0ci52YWx1ZSkge1xuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShhdHRyLm5hbWUsIGNvbXBpbGVkSGFuZGxlcik7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICAvLyDpgJLlvZLlpITnkIblrZDlhYPntKBcbiAgaWYgKGVsZW1lbnQuY2hpbGRyZW4gJiYgZWxlbWVudC5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgQXJyYXkuZnJvbShlbGVtZW50LmNoaWxkcmVuKS5mb3JFYWNoKChjaGlsZCkgPT4ge1xuICAgICAgY29tcGlsZUlubGluZUV2ZW50cyhjaGlsZCwgaWZyYW1lV2luZG93KTtcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIOaLpuaIqiBFbGVtZW50LnByb3RvdHlwZS5zZXRBdHRyaWJ1dGXvvIznvJbor5HlhoXogZTkuovku7blsZ7mgKdcbiAqIOeUqOS6juaNleiOt+WtkOW6lOeUqOi/kOihjOacn+mXtO+8iOWmgiBWdWUg5qih5p2/5riy5p+T77yJ5Yqo5oCB6K6+572u55qE5YaF6IGU5LqL5Lu2XG4gKi9cbmZ1bmN0aW9uIHBhdGNoU2V0QXR0cmlidXRlKGlmcmFtZVdpbmRvdzogV2luZG93KTogdm9pZCB7XG4gIGNvbnN0IHJhd1NldEF0dHJpYnV0ZSA9IGlmcmFtZVdpbmRvdy5FbGVtZW50LnByb3RvdHlwZS5zZXRBdHRyaWJ1dGU7XG5cbiAgaWZyYW1lV2luZG93LkVsZW1lbnQucHJvdG90eXBlLnNldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uIChuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAvLyDlhoXogZTkuovku7blsZ7mgKfov5vooYznvJbor5HvvIzluYLnrYnpgb/lhY3ph43lpI3ljIXoo7nvvIjpmY3nuqfmqKHlvI/lkIzmoLfpnIDopoHvvIzop4EgY29tcGlsZUlubGluZUV2ZW50cyDor7TmmI7vvIlcbiAgICBpZiAobmFtZS5zdGFydHNXaXRoKFwib25cIikgJiYgdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBjb25zdCBhcHBJZCA9IGlmcmFtZVdpbmRvdy5fX1dVSklFPy5pZDtcbiAgICAgIHJhd1NldEF0dHJpYnV0ZS5jYWxsKHRoaXMsIG5hbWUsIGFwcElkID8gd3JhcElubGluZUV2ZW50SGFuZGxlcih2YWx1ZSwgYXBwSWQpIDogdmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICByYXdTZXRBdHRyaWJ1dGUuY2FsbCh0aGlzLCBuYW1lLCB2YWx1ZSk7XG4gICAgfVxuICB9O1xufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFFQSxTQUFTQSx3QkFBd0IsUUFBUSxVQUFVO0FBQ25ELFNBQVNDLGVBQWUsUUFBUSxRQUFRO0FBQ3hDLFNBQ0VDLHNCQUFzQixFQUN0QkMsZUFBZSxFQUNmQyxzQkFBc0IsRUFDdEJDLG9CQUFvQixFQUNwQkMsVUFBVSxFQUNWQyxJQUFJLEVBQ0pDLEtBQUssRUFDTEMsU0FBUyxFQUNUQyxTQUFTLEVBQ1RDLGVBQWUsRUFDZkMsaUJBQWlCLEVBQ2pCQyxjQUFjLEVBQ2RDLGdCQUFnQixR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