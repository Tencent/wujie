import WuJie from "./sandbox";
import { ScriptObject } from "./template";
import { renderElementToContainer } from "./shadow";
import { syncUrlToWindow } from "./sync";
import {
  fixElementCtrSrcOrHref,
  isConstructable,
  anchorElementGenerator,
  isMatchSyncQueryById,
  isFunction,
  warn,
  error,
  execHooks,
  getCurUrl,
  getAbsolutePath,
  setAttrsToElement,
  setTagToScript,
  getTagFromScript,
} from "./utils";
import {
  documentProxyProperties,
  rawAddEventListener,
  rawRemoveEventListener,
  rawDocumentQuerySelector,
  mainDocumentAddEventListenerEvents,
  mainAndAppAddEventListenerEvents,
  appDocumentAddEventListenerEvents,
  appDocumentOnEvents,
  appWindowAddEventListenerEvents,
  appWindowOnEvent,
  windowProxyProperties,
  windowRegWhiteList,
  rawWindowAddEventListener,
  rawWindowRemoveEventListener,
} from "./common";
import type { appAddEventListenerOptions } from "./common";
import { getJsLoader } from "./plugin";
import { WUJIE_TIPS_SCRIPT_ERROR_REQUESTED, WUJIE_DATA_FLAG } from "./constant";
import { ScriptObjectLoader } from "./index";

const extraInstanceofConstructorNames = new Set([
  "ClipboardEvent",
  "CSSStyleDeclaration",
  "DataTransfer",
  "DOMImplementation",
  "DOMMatrix",
  "DOMMatrixReadOnly",
  "DOMParser",
  "DOMPoint",
  "DOMPointReadOnly",
  "DOMQuad",
  "DOMRect",
  "DOMRectList",
  "DOMRectReadOnly",
  "DOMStringList",
  "DOMStringMap",
  "DOMTokenList",
  "HTMLCollection",
  "MediaList",
  "NamedNodeMap",
  "Range",
  "Selection",
  "StyleSheet",
  "StyleSheetList",
  "TextDecoder",
  "TextEncoder",
  "TimeRanges",
]);

declare global {
  interface Window {
    // 是否存在无界
    __POWERED_BY_WUJIE__?: boolean;
    // 子应用公共加载路径
    __WUJIE_PUBLIC_PATH__: string;
    // 原生的querySelector
    __WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__: typeof Document.prototype.querySelector;

    // iframe内原生的createElement
    __WUJIE_RAW_DOCUMENT_CREATE_ELEMENT__: typeof Document.prototype.createElement;

    // iframe内原生的createTextNode
    __WUJIE_RAW_DOCUMENT_CREATE_TEXT_NODE__: typeof Document.prototype.createTextNode;

    // iframe内原生的head
    __WUJIE_RAW_DOCUMENT_HEAD__: typeof Document.prototype.head;

    // 原生的querySelector
    __WUJIE_RAW_DOCUMENT_QUERY_SELECTOR_ALL__: typeof Document.prototype.querySelectorAll;
    // 原生的window对象
    __WUJIE_RAW_WINDOW__: Window;
    // 子应用沙盒实例
    __WUJIE: WuJie;
    // 子应用共享上下文
    __WUJIE_INJECT: WuJie["inject"];
    // 记录注册在主应用中的事件
    __WUJIE_EVENTLISTENER__: Set<{ listener: EventListenerOrEventListenerObject; type: string; options: any }>;
    // 子应用mount函数
    __WUJIE_MOUNT: () => void;
    // 子应用unmount函数
    __WUJIE_UNMOUNT: () => void | Promise<void>;
    // 获取子应用 window 的辅助函数（用于内联事件处理器），入参为子应用 appId
    __getWujieWindow__: (appId: string) => WindowProxy;
    // document type
    Document: typeof Document;
    // img type
    HTMLImageElement: typeof HTMLImageElement;
    // node type
    Node: typeof Node;
    // element type
    Element: typeof Element;
    // htmlElement typeof
    HTMLElement: typeof HTMLElement;
    // anchor type
    HTMLAnchorElement: typeof HTMLAnchorElement;
    // source type
    HTMLSourceElement: typeof HTMLSourceElement;
    // link type
    HTMLLinkElement: typeof HTMLLinkElement;
    // script type
    HTMLScriptElement: typeof HTMLScriptElement;
    // media type
    HTMLMediaElement: typeof HTMLMediaElement;
    EventTarget: typeof EventTarget;
    Event: typeof Event;
    ShadowRoot: typeof ShadowRoot;
    // 注入对象
    $wujie: { [key: string]: any };
  }
  interface HTMLHeadElement {
    _cacheListeners: Map<string, EventListenerOrEventListenerObject[]>;
  }
  interface HTMLBodyElement {
    _cacheListeners: Map<string, EventListenerOrEventListenerObject[]>;
  }
  interface Document {
    createTreeWalker(
      root: Node,
      whatToShow?: number,
      filter?: NodeFilter | null,
      entityReferenceExpansion?: boolean
    ): TreeWalker;
  }
}

/**
 * 修改window对象的事件监听，只有路由事件采用iframe的事件
 */
function patchIframeEvents(iframeWindow: Window) {
  iframeWindow.__WUJIE_EVENTLISTENER__ = iframeWindow.__WUJIE_EVENTLISTENER__ || new Set();
  iframeWindow.addEventListener = function addEventListener<K extends keyof WindowEventMap>(
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | appAddEventListenerOptions
  ) {
    // 运行插件钩子函数
    execHooks(iframeWindow.__WUJIE.plugins, "windowAddEventListenerHook", iframeWindow, type, listener, options);
    // 相同参数多次调用 addEventListener 不会导致重复注册，所以用set。
    iframeWindow.__WUJIE_EVENTLISTENER__.add({ type, listener, options });
    if (
      appWindowAddEventListenerEvents.concat(iframeWindow.__WUJIE.iframeAddEventListeners).includes(type) ||
      (typeof options === "object" && options.targetWindow)
    ) {
      const targetWindow = typeof options === "object" && options.targetWindow ? options?.targetWindow : iframeWindow;
      return rawWindowAddEventListener.call(targetWindow, type, listener, options);
    }
    // 在子应用嵌套场景使用window.window获取真实window
    rawWindowAddEventListener.call(window.__WUJIE_RAW_WINDOW__ || window, type, listener, options);
  };

  iframeWindow.removeEventListener = function removeEventListener<K extends keyof WindowEventMap>(
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | appAddEventListenerOptions
  ) {
    // 运行插件钩子函数
    execHooks(iframeWindow.__WUJIE.plugins, "windowRemoveEventListenerHook", iframeWindow, type, listener, options);
    iframeWindow.__WUJIE_EVENTLISTENER__.forEach((o) => {
      // 这里严格一点，确保子应用销毁的时候都能销毁
      if (o.listener === listener && o.type === type && options == o.options) {
        iframeWindow.__WUJIE_EVENTLISTENER__.delete(o);
      }
    });
    if (
      appWindowAddEventListenerEvents.concat(iframeWindow.__WUJIE.iframeAddEventListeners).includes(type) ||
      (typeof options === "object" && options.targetWindow)
    ) {
      const targetWindow = typeof options === "object" && options.targetWindow ? options?.targetWindow : iframeWindow;
      return rawWindowRemoveEventListener.call(targetWindow, type, listener, options);
    }
    rawWindowRemoveEventListener.call(window.__WUJIE_RAW_WINDOW__ || window, type, listener, options);
  };
}

function patchIframeVariable(iframeWindow: Window, wujie: WuJie, appHostPath: string): void {
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
function patchIframeHistory(iframeWindow: Window, appHostPath: string, mainHostPath: string): void {
  const history = iframeWindow.history;
  const rawHistoryPushState = history.pushState;
  const rawHistoryReplaceState = history.replaceState;
  history.pushState = function (data: any, title: string, url?: string): void {
    const baseUrl =
      mainHostPath + iframeWindow.location.pathname + iframeWindow.location.search + iframeWindow.location.hash;
    const mainUrl = getAbsolutePath(url?.replace(appHostPath, ""), baseUrl);
    const ignoreFlag = url === undefined;

    rawHistoryPushState.call(history, data, title, ignoreFlag ? undefined : mainUrl);
    if (ignoreFlag) return;
    updateBase(iframeWindow, appHostPath, mainHostPath);
    syncUrlToWindow(iframeWindow);
  };
  history.replaceState = function (data: any, title: string, url?: string): void {
    const baseUrl =
      mainHostPath + iframeWindow.location.pathname + iframeWindow.location.search + iframeWindow.location.hash;
    const mainUrl = getAbsolutePath(url?.replace(appHostPath, ""), baseUrl);
    const ignoreFlag = url === undefined;

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
function updateBase(iframeWindow: Window, appHostPath: string, mainHostPath: string) {
  const baseUrl = new URL(iframeWindow.location.href?.replace(mainHostPath, ""), appHostPath);
  const baseElement = rawDocumentQuerySelector.call(iframeWindow.document, "base");
  if (baseElement) baseElement.setAttribute("href", appHostPath + baseUrl.pathname);
}

/**
 * patch iframe window effect
 * @param iframeWindow
 */
// TODO 继续改进
export function patchWindowEffect(iframeWindow: Window): void {
  // 属性处理函数
  function processWindowProperty(key: string): boolean {
    const value = iframeWindow[key];
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
  Object.getOwnPropertyNames(iframeWindow).forEach((key) => {
    // 特殊处理
    if (key === "getSelection") {
      Object.defineProperty(iframeWindow, key, {
        get: () => {
          const sandbox = iframeWindow.__WUJIE;
          // 降级模式：可见 DOM 在渲染 iframe，getSelection 需读 sandbox.document
          if (sandbox?.degrade && sandbox.document) {
            return sandbox.document.getSelection.bind(sandbox.document);
          }
          return iframeWindow.document[key];
        },
      });
      return;
    }
    // 单独属性
    if (windowProxyProperties.includes(key)) {
      processWindowProperty(key);
      return;
    }
    // 正则匹配，可以一次处理多个
    windowRegWhiteList.some((reg) => {
      if (reg.test(key) && key in iframeWindow.parent) {
        return processWindowProperty(key);
      }
      return false;
    });
  });
  // onEvent set
  const windowOnEvents = Object.getOwnPropertyNames(window)
    .filter((p) => /^on/.test(p))
    .filter((e) => !appWindowOnEvent.concat(iframeWindow.__WUJIE.iframeOnEvents).includes(e));

  // 走主应用window
  windowOnEvents.forEach((e) => {
    const descriptor = Object.getOwnPropertyDescriptor(iframeWindow, e) || {
      enumerable: true,
      writable: true,
    };
    try {
      Object.defineProperty(iframeWindow, e, {
        enumerable: descriptor.enumerable,
        configurable: true,
        get: () => window[e],
        set:
          descriptor.writable || descriptor.set
            ? (handler) => {
                // 首次写入时记录主 window 上 onXXX 的原始值；destroy 时通过 setter
                // 还原（accessor 不能用 defineProperty descriptor 直接还原内部 handler），
                // 防止主应用 window 被 dangling handler 长期污染。
                const tracker = iframeWindow.__WUJIE?.eventCleanupTracker;
                tracker?.trackWindowOnEvent(e, window[e], Object.prototype.hasOwnProperty.call(window, e));
                window[e] = typeof handler === "function" ? handler.bind(iframeWindow) : handler;
              }
            : undefined,
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

function isDomConstructor(name: string, ctor: Function, peerWindow: Window): boolean {
  const prototype = ctor.prototype;
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
export function patchInstanceofAcrossRealms(targetWindow: Window, peerWindow: Window = window): void {
  // DOM 构造函数之间存在继承链（HTMLIFrameElement -> HTMLElement -> Element -> Node ...），
  // 对构造函数的属性读取会沿这条链向上查找。因此 _hasPatch / Symbol.hasInstance 必须用 own
  // 语义判断，否则会读到已被 patch 的祖先构造函数的值，导致 patch 被跳过或判断串味到祖先 realm。
  const nativeHasInstance = Function.prototype[Symbol.hasInstance];
  Object.getOwnPropertyNames(targetWindow).forEach((name) => {
    let targetConstructor: Function & { _hasPatch?: boolean };
    let peerConstructor: Function;

    try {
      targetConstructor = targetWindow[name];
      peerConstructor = peerWindow[name];
    } catch (error) {
      return;
    }

    if (typeof targetConstructor !== "function" || typeof peerConstructor !== "function") return;
    if (targetConstructor === peerConstructor || Object.prototype.hasOwnProperty.call(targetConstructor, "_hasPatch"))
      return;
    if (!isDomConstructor(name, peerConstructor, peerWindow)) return;

    try {
      Object.defineProperties(targetConstructor, {
        [Symbol.hasInstance]: {
          configurable: true,
          value(element: unknown) {
            // 用 this 而非闭包变量，确保命中的始终是当前构造函数自己的判断。
            // 对端也用原生 hasInstance，避免双向 patch 时 element instanceof peerConstructor 递归栈溢出。
            if (nativeHasInstance.call(this, element)) return true;
            return nativeHasInstance.call(peerConstructor, element);
          },
        },
        _hasPatch: { value: true },
      });
    } catch (error) {
      console.warn(error);
    }
  });
  const wujie = (targetWindow as Window & { __WUJIE?: WuJie }).__WUJIE;
  if (wujie) {
    execHooks(wujie.plugins, "windowPropertyOverride", targetWindow);
  }
}

/**
 * 降级模式：DOM 在渲染 iframe、JS 在执行 iframe，对两侧 window 双向 patch instanceof。
 * 需在 sandbox.document（渲染 document）就绪后调用，勿在 patchWindowEffect 阶段调用。
 */
export function patchDegradeInstanceofAcrossRealms(appWindow: Window, renderWindow: Window): void {
  if (!renderWindow || appWindow === renderWindow) return;
  patchInstanceofAcrossRealms(renderWindow, appWindow);
  patchInstanceofAcrossRealms(appWindow, renderWindow);
}

/**
 * 记录节点的监听事件
 */
function recordEventListeners(iframeWindow: Window) {
  const sandbox = iframeWindow.__WUJIE;
  iframeWindow.Node.prototype.addEventListener = function (
    type: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    // 添加事件缓存
    const elementListenerList = sandbox.elementEventCacheMap.get(this);
    if (elementListenerList) {
      if (!elementListenerList.find((listener) => listener.type === type && listener.handler === handler)) {
        elementListenerList.push({ type, handler, options });
      }
    } else sandbox.elementEventCacheMap.set(this, [{ type, handler, options }]);
    return rawAddEventListener.call(this, type, handler, options);
  };

  iframeWindow.Node.prototype.removeEventListener = function (
    type: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void {
    // 清除缓存
    const elementListenerList = sandbox.elementEventCacheMap.get(this);
    if (elementListenerList) {
      const index = elementListenerList?.findIndex((ele) => ele.type === type && ele.handler === handler);
      elementListenerList.splice(index, 1);
    }
    if (!elementListenerList?.length) {
      sandbox.elementEventCacheMap.delete(this);
    }
    return rawRemoveEventListener.call(this, type, handler, options);
  };
}

/**
 * 恢复节点的监听事件
 */
export function recoverEventListeners(rootElement: Element | ChildNode, iframeWindow: Window) {
  const sandbox = iframeWindow.__WUJIE;
  const elementEventCacheMap: WeakMap<
    Node,
    Array<{ type: string; handler: EventListenerOrEventListenerObject; options: any }>
  > = new WeakMap();
  const ElementIterator = document.createTreeWalker(rootElement, NodeFilter.SHOW_ELEMENT, null, false);
  let nextElement = ElementIterator.currentNode;
  while (nextElement) {
    const elementListenerList = sandbox.elementEventCacheMap.get(nextElement);
    if (elementListenerList?.length) {
      elementEventCacheMap.set(nextElement, elementListenerList);
      elementListenerList.forEach((listener) => {
        nextElement.addEventListener(listener.type, listener.handler, listener.options);
      });
    }
    nextElement = ElementIterator.nextNode() as HTMLElement;
  }
  sandbox.elementEventCacheMap = elementEventCacheMap;
}

/**
 * 恢复根节点的监听事件
 */
export function recoverDocumentListeners(
  oldRootElement: Element | ChildNode,
  newRootElement: Element | ChildNode,
  iframeWindow: Window
) {
  const sandbox = iframeWindow.__WUJIE;
  const elementEventCacheMap: WeakMap<
    Node,
    Array<{ type: string; handler: EventListenerOrEventListenerObject; options: any }>
  > = new WeakMap();
  const elementListenerList = sandbox.elementEventCacheMap.get(oldRootElement);
  if (elementListenerList?.length) {
    elementEventCacheMap.set(newRootElement, elementListenerList);
    elementListenerList.forEach((listener) => {
      newRootElement.addEventListener(listener.type, listener.handler, listener.options);
    });
  }
  sandbox.elementEventCacheMap = elementEventCacheMap;
}

/**
 * 修复vue绑定事件e.timeStamp < attachedTimestamp 的情况
 */
export function patchEventTimeStamp(targetWindow: Window, iframeWindow: Window) {
  Object.defineProperty(targetWindow.Event.prototype, "timeStamp", {
    get: () => {
      return iframeWindow.document.createEvent("Event").timeStamp;
    },
  });
}

/**
 * patch document effect
 * @param iframeWindow
 */
// TODO 继续改进
export function patchDocumentEffect(iframeWindow: Window): void {
  const sandbox = iframeWindow.__WUJIE;

  /**
   * 处理 addEventListener和removeEventListener
   * 由于这个劫持导致 handler 的this发生改变，所以需要handler.bind(document)
   * 但是这样会导致removeEventListener无法正常工作，因为handler => handler.bind(document)
   * 这个地方保存callback = handler.bind(document) 方便removeEventListener
   */
  const handlerCallbackMap: WeakMap<EventListenerOrEventListenerObject, EventListenerOrEventListenerObject> =
    new WeakMap();
  const handlerTypeMap: WeakMap<EventListenerOrEventListenerObject, Array<string>> = new WeakMap();
  iframeWindow.Document.prototype.addEventListener = function (
    type: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    if (!handler) return;
    let callback = handlerCallbackMap.get(handler);
    const typeList = handlerTypeMap.get(handler);
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
      // 登记到清理跟踪器，destroy 时反向解绑，避免 handler 闭包永久钉住 iframeWindow
      sandbox.eventCleanupTracker?.trackMainDocumentListener({ type, callback, options });
      return window.document.addEventListener(type, callback, options);
    }
    if (mainAndAppAddEventListenerEvents.includes(type)) {
      sandbox.eventCleanupTracker?.trackMainDocumentListener({ type, callback, options });
      window.document.addEventListener(type, callback, options);
      sandbox.shadowRoot.addEventListener(type, callback, options);
      return;
    }
    sandbox.shadowRoot.addEventListener(type, callback, options);
  };
  iframeWindow.Document.prototype.removeEventListener = function (
    type: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    const callback: EventListenerOrEventListenerObject = handlerCallbackMap.get(handler);
    const typeList = handlerTypeMap.get(handler);
    if (callback) {
      if (typeList?.includes(type)) {
        typeList.splice(typeList.indexOf(type), 1);
        if (!typeList.length) {
          handlerCallbackMap.delete(handler);
          handlerTypeMap.delete(handler);
        }
      }

      // 运行插件钩子函数
      execHooks(iframeWindow.__WUJIE.plugins, "documentRemoveEventListenerHook", iframeWindow, type, callback, options);
      if (appDocumentAddEventListenerEvents.includes(type)) {
        return rawRemoveEventListener.call(this, type, callback, options);
      }
      if (sandbox.degrade) return sandbox.document.removeEventListener(type, callback, options);
      if (mainDocumentAddEventListenerEvents.includes(type)) {
        sandbox.eventCleanupTracker?.untrackMainDocumentListener({ type, callback, options });
        return window.document.removeEventListener(type, callback, options);
      }
      if (mainAndAppAddEventListenerEvents.includes(type)) {
        sandbox.eventCleanupTracker?.untrackMainDocumentListener({ type, callback, options });
        window.document.removeEventListener(type, callback, options);
        sandbox.shadowRoot.removeEventListener(type, callback, options);
        return;
      }
      sandbox.shadowRoot.removeEventListener(type, callback, options);
    }
  };
  // 处理onEvent
  const elementOnEvents = Object.keys(iframeWindow.HTMLElement.prototype).filter((ele) => /^on/.test(ele));
  const documentOnEvent = Object.keys(iframeWindow.Document.prototype)
    .filter((ele) => /^on/.test(ele))
    .filter((ele) => !appDocumentOnEvents.includes(ele));
  elementOnEvents
    .filter((e) => documentOnEvent.includes(e))
    .forEach((e) => {
      const descriptor = Object.getOwnPropertyDescriptor(iframeWindow.Document.prototype, e) || {
        enumerable: true,
        writable: true,
      };
      try {
        Object.defineProperty(iframeWindow.Document.prototype, e, {
          enumerable: descriptor.enumerable,
          configurable: true,
          get: () => (sandbox.degrade ? sandbox.document[e] : sandbox.shadowRoot.firstElementChild[e]),
          set:
            descriptor.writable || descriptor.set
              ? (handler) => {
                  const val = typeof handler === "function" ? handler.bind(iframeWindow.document) : handler;
                  sandbox.degrade ? (sandbox.document[e] = val) : (sandbox.shadowRoot.firstElementChild[e] = val);
                }
              : undefined,
        });
      } catch (e) {
        warn(e.message);
      }
    });
  // 处理属性get
  const {
    ownerProperties,
    modifyProperties,
    shadowProperties,
    shadowMethods,
    documentProperties,
    documentMethods,
    documentEvents,
  } = documentProxyProperties;
  modifyProperties.concat(shadowProperties, shadowMethods, documentProperties, documentMethods).forEach((propKey) => {
    const descriptor = Object.getOwnPropertyDescriptor(iframeWindow.Document.prototype, propKey) || {
      enumerable: true,
      writable: true,
    };
    try {
      Object.defineProperty(iframeWindow.Document.prototype, propKey, {
        enumerable: descriptor.enumerable,
        configurable: true,
        get: () => sandbox.proxyDocument[propKey],
        set: undefined,
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
  const documentEventActiveListeners: Map<string, EventListenerOrEventListenerObject> = new Map();
  documentEvents.forEach((propKey) => {
    const descriptor = Object.getOwnPropertyDescriptor(iframeWindow.Document.prototype, propKey) || {
      enumerable: true,
      writable: true,
    };
    if (!(descriptor.writable || descriptor.set)) return;
    // documentEvents 形如 "onfullscreenchange"，对应事件名去掉前缀 "on"
    const eventType = propKey.slice(2);
    try {
      Object.defineProperty(iframeWindow.Document.prototype, propKey, {
        enumerable: descriptor.enumerable,
        configurable: true,
        get: () => (sandbox.degrade ? sandbox : window).document[propKey],
        set: (handler) => {
          const targetDoc = (sandbox.degrade ? sandbox : window).document;
          const previous = documentEventActiveListeners.get(propKey);
          if (previous) {
            targetDoc.removeEventListener(eventType, previous);
            sandbox.eventCleanupTracker?.untrackMainDocumentListener({ type: eventType, callback: previous });
            documentEventActiveListeners.delete(propKey);
          }
          if (typeof handler === "function") {
            const bound = handler.bind(iframeWindow.document);
            documentEventActiveListeners.set(propKey, bound);
            targetDoc.addEventListener(eventType, bound);
            sandbox.eventCleanupTracker?.trackMainDocumentListener({ type: eventType, callback: bound });
          }
          // handler 为 null/undefined/非函数：只解绑不重绑（与原生 onXXX = null 语义一致）
        },
      });
    } catch (e) {
      warn(e.message);
    }
  });
  // process owner property
  ownerProperties.forEach((propKey) => {
    Object.defineProperty(iframeWindow.document, propKey, {
      enumerable: true,
      configurable: true,
      get: () => sandbox.proxyDocument[propKey],
      set: undefined,
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
function patchNodeEffect(iframeWindow: Window): void {
  const rawGetRootNode = iframeWindow.Node.prototype.getRootNode;
  const rawAppendChild = iframeWindow.Node.prototype.appendChild;
  const rawInsertRule = iframeWindow.Node.prototype.insertBefore;
  const rawRemoveChild = iframeWindow.Node.prototype.removeChild;
  iframeWindow.Node.prototype.getRootNode = function (options?: GetRootNodeOptions): Node {
    const rootNode = rawGetRootNode.call(this, options);
    if (rootNode === iframeWindow.__WUJIE.shadowRoot) return iframeWindow.document;
    else return rootNode;
  };
  iframeWindow.Node.prototype.appendChild = function <T extends Node>(node: T): T {
    const res = rawAppendChild.call(this, node);
    patchElementEffect(node, iframeWindow);
    return res;
  };
  iframeWindow.Node.prototype.insertBefore = function <T extends Node>(node: T, child: Node | null): T {
    const res = rawInsertRule.call(this, node, child);
    patchElementEffect(node, iframeWindow);
    return res;
  };
  iframeWindow.Node.prototype.removeChild = function <T extends Node>(node: T): T {
    let res;
    try {
      res = rawRemoveChild.call(this, node);
    } catch (e) {
      console.warn(
        `Failed to removeChild: ${node.nodeName.toLowerCase()} is not a child of ${this.nodeName.toLowerCase()}, try again with parentNode attribute. `
      );
      if (node.isConnected && isFunction(node.parentNode?.removeChild)) {
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
function patchRelativeUrlEffect(iframeWindow: Window): void {
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
export function initBase(iframeWindow: Window, url: string, pathname?: string): void {
  const iframeDocument = iframeWindow.document;
  if (!iframeDocument.head || iframeDocument.head.querySelector("base")) return;
  const baseElement = iframeDocument.createElement("base");
  const iframeUrlElement = anchorElementGenerator(iframeWindow.location.href);
  const appUrlElement = anchorElementGenerator(url);
  const resolvedPathname = pathname ?? iframeUrlElement.pathname;
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
function initIframeDom(iframeWindow: Window, wujie: WuJie, mainHostPath: string, appHostPath: string): void {
  const iframeDocument = iframeWindow.document;
  const newDoc = window.document.implementation.createHTMLDocument("");
  const newDocumentElement = iframeDocument.importNode(newDoc.documentElement, true);
  iframeDocument.documentElement
    ? iframeDocument.replaceChild(newDocumentElement, iframeDocument.documentElement)
    : iframeDocument.appendChild(newDocumentElement);
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
function stopIframeLoading(iframe: HTMLIFrameElement, options: { fallbackSrc: string } | false) {
  const iframeWindow = iframe.contentWindow;
  return new Promise<void>((resolve) => {
    // srcdoc 路径：等 srcdoc 文档就位（load 事件），然后做一次 document.open() trick
    if (options) {
      let done = false;
      const runTrick = () => {
        if (done) return;
        done = true;
        const newDoc = iframeWindow.document;
        const previousHref = iframeWindow.location.href;
        newDoc.open();
        newDoc.close();
        // 按 HTML spec，document.open() 同步改写当前 document 的 URL，无需轮询
        if (iframeWindow.location.href !== previousHref) {
          resolve();
          return;
        }
        // 极少数浏览器未按 spec 同步改 URL，兜底走 fallbackSrc 真实加载
        warn(`wujie: srcdoc + document.open() trick failed, fallback to load ${options.fallbackSrc} this time.`);
        // HTML spec 规定 srcdoc 优先级高于 src，必须先移除 srcdoc 才能让 src 生效
        iframe.removeAttribute("srcdoc");
        iframe.src = options.fallbackSrc;
        stopIframeLoading(iframe, false).then(resolve);
      };
      iframe.addEventListener("load", runTrick, { once: true });
      // 5s 安全网：load 理论上必定触发，加一层保险避免诡异挂死
      setTimeout(runTrick, 5e3);
      return;
    }

    // fallback 真实加载路径：仍需轮询，赶在页面真正加载完成前 stop()
    const oldDoc = iframeWindow.document;
    const loopDeadline = Date.now() + 5e3;
    function loop() {
      setTimeout(() => {
        let newDoc: Document;
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
export function patchElementEffect(
  element: (HTMLElement | Node | ShadowRoot) & { _hasPatch?: boolean },
  iframeWindow: Window
): void {
  if (element._hasPatch) return;
  const HasWeakRef = typeof (globalThis as any).WeakRef === "function";
  const iframeWindowRef: { deref(): Window | undefined } = HasWeakRef
    ? new (globalThis as any).WeakRef(iframeWindow)
    : { deref: () => iframeWindow };
  try {
    Object.defineProperties(element, {
      baseURI: {
        configurable: true,
        get: () => {
          const win = iframeWindowRef.deref();
          const proxyLocation = win?.__WUJIE?.proxyLocation as Location | undefined;
          if (!proxyLocation) return window.document.baseURI;
          return proxyLocation.protocol + "//" + proxyLocation.host + proxyLocation.pathname;
        },
        set: undefined,
      },
      ownerDocument: {
        configurable: true,
        get: () => {
          const win = iframeWindowRef.deref();
          // win.__WUJIE 被置 null（destroy 后）或 win 本身已 GC 时降级到主 document，
          // 防止 element 永久把 iframeWindow 钉在内存中。
          if (!win || !win.__WUJIE) return window.document;
          // 降级模式：节点已挂到渲染 iframe，ownerDocument 需与可见 DOM 一致，
          // 否则 wangEditor LO/RO（node.ownerDocument.defaultView instanceof）会失败。
          if (win.__WUJIE.degrade && win.__WUJIE.document) {
            return win.__WUJIE.document;
          }
          return win.document;
        },
      },
      _hasPatch: { get: () => true },
    });
  } catch (error) {
    console.warn(error);
  }
  execHooks(iframeWindow.__WUJIE.plugins, "patchElementHook", element, iframeWindow);
  // 编译内联事件处理器
  compileInlineEvents(element as Element, iframeWindow);
}

/**
 * 子应用前进后退，同步路由到主应用
 * @param iframeWindow
 */
export function syncIframeUrlToWindow(iframeWindow: Window): void {
  iframeWindow.addEventListener("hashchange", () => syncUrlToWindow(iframeWindow));
  iframeWindow.addEventListener("popstate", () => {
    syncUrlToWindow(iframeWindow);
  });
}

/**
 * iframe插入脚本
 * @param scriptResult script请求结果
 * @param iframeWindow
 * @param rawElement 原始的脚本
 */
export function insertScriptToIframe(
  scriptResult: ScriptObject | ScriptObjectLoader,
  iframeWindow: Window,
  rawElement?: HTMLScriptElement
) {
  const { src, module, content, crossorigin, crossoriginType, async, attrs, callback, onload } =
    scriptResult as ScriptObjectLoader;
  const scriptElement = iframeWindow.document.createElement("script");
  const nextScriptElement = iframeWindow.document.createElement("script");
  const { replace, plugins, proxyLocation } = iframeWindow.__WUJIE;
  const jsLoader = getJsLoader({ plugins, replace });
  let code = jsLoader(content, src, getCurUrl(proxyLocation));
  // 添加属性
  attrs &&
    Object.keys(attrs)
      .filter((key) => !Object.keys(scriptResult).includes(key))
      .forEach((key) => scriptElement.setAttribute(key, String(attrs[key])));

  // 内联脚本
  if (content) {
    // patch location
    if (!iframeWindow.__WUJIE.degrade && !module && attrs?.type !== "importmap") {
      code = `(function(window, self, global, location) {
      ${code}
}).bind(window.__WUJIE.proxy)(
  window.__WUJIE.proxy,
  window.__WUJIE.proxy,
  window.__WUJIE.proxy,
  window.__WUJIE.proxyLocation,
);`;
    }
    const descriptor = Object.getOwnPropertyDescriptor(scriptElement, "src");
    // 部分浏览器 src 不可配置 取不到descriptor表示无该属性，可写
    if (descriptor?.configurable || !descriptor) {
      // 解决 webpack publicPath 为 auto 无法加载资源的问题
      try {
        Object.defineProperty(scriptElement, "src", { get: () => src || "" });
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
  nextScriptElement.textContent =
    "if(window.__WUJIE.execQueue && window.__WUJIE.execQueue.length){ window.__WUJIE.execQueue.shift()()}";

  const container = rawDocumentQuerySelector.call(iframeWindow.document, "head");
  const execNextScript = () => !async && container.appendChild(nextScriptElement);
  const afterExecScript = () => {
    onload?.();
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
    const sandboxForCleanup = iframeWindow.__WUJIE;
    if (sandboxForCleanup && Array.isArray(sandboxForCleanup.dynamicScriptElements)) {
      sandboxForCleanup.dynamicScriptElements.push(scriptElement);
    }
  }
  // 外联脚本执行后的处理
  const isOutlineScript = !content && src;
  if (isOutlineScript) {
    scriptElement.onload = afterExecScript;
    scriptElement.onerror = afterExecScript;
  }
  container.appendChild(scriptElement);

  // 调用回调
  callback?.(iframeWindow);
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
export function renderIframeReplaceApp(
  src: string,
  element: HTMLElement,
  degradeAttrs: { [key: string]: any } = {}
): void {
  const iframe = window.document.createElement("iframe");
  const defaultStyle = "height:100%;width:100%";
  setAttrsToElement(iframe, { ...degradeAttrs, src, style: [defaultStyle, degradeAttrs.style].join(";") });
  renderElementToContainer(iframe, element);
}

// 沙箱 iframe 启动时的空白文档内容
// srcdoc 文档的 origin 由 spec 保证继承自 embedder（即主应用），
// 这样既不发网络请求，也保证主应用能访问 contentDocument。
const SANDBOX_EMPTY_SRCDOC = "<!DOCTYPE html><html><head></head><body></body></html>";

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
export function iframeGenerator(
  sandbox: WuJie,
  attrs: { [key: string]: any },
  mainHostPath: string,
  appHostPath: string,
  appRoutePath: string
): HTMLIFrameElement {
  // 把用户传入的 src 拆出来作为 fallback 用，不再作为 iframe 的初始 src 直接挂载
  const { src: userFallbackSrc, ...restAttrs } = attrs || {};
  const fallbackSrc = userFallbackSrc || mainHostPath;

  const iframe = window.document.createElement("iframe");
  const attrsMerge = {
    style: "display: none",
    ...restAttrs,
    name: sandbox.id,
    [WUJIE_DATA_FLAG]: "",
    srcdoc: SANDBOX_EMPTY_SRCDOC,
  };
  setAttrsToElement(iframe, attrsMerge);
  window.document.body.appendChild(iframe);

  const iframeWindow = iframe.contentWindow;
  // 变量需要提前注入，在入口函数通过变量防止死循环
  patchIframeVariable(iframeWindow, sandbox, appHostPath);
  sandbox.iframeReady = stopIframeLoading(iframe, { fallbackSrc }).then(() => {
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
const WUJIE_INLINE_EVENT_PREFIX = "with(window.__getWujieWindow__(";

/**
 * 将内联事件处理器包裹为子应用作用域执行的形式
 * onclick="greet()" -> onclick='with(window.__getWujieWindow__("appId")){ greet() }'
 * 已包裹过则原样返回，保证幂等
 */
function wrapInlineEventHandler(handler: string, appId: string): string {
  if (handler.startsWith(WUJIE_INLINE_EVENT_PREFIX)) return handler;
  return `${WUJIE_INLINE_EVENT_PREFIX}"${appId}")){ ${handler} }`;
}

/**
 * 编译元素的内联事件处理器
 * 将 onclick="..." 编译为 onclick='with(window.__getWujieWindow__("appId")){ ... }'
 * 通过把 appId 烤进字符串字面量，避免运行时依赖被劫持的 getRootNode
 */
function compileInlineEvents(element: Element, iframeWindow: Window): void {
  // 只处理元素节点
  if (element.nodeType !== Node.ELEMENT_NODE) return;
  // 降级模式同样需要编译：函数定义在沙箱 iframe 全局，DOM 渲染在另一个渲染 iframe，
  // 原生 onclick 跨 realm 取不到函数，必须经 with(__getWujieWindow__) 桥接
  const appId = iframeWindow.__WUJIE?.id;
  if (!appId) return;

  // 遍历所有属性，查找内联事件
  const attributes = Array.from(element.attributes);
  attributes.forEach((attr) => {
    if (attr.name.startsWith("on") && typeof attr.value === "string") {
      const compiledHandler = wrapInlineEventHandler(attr.value, appId);
      if (compiledHandler !== attr.value) {
        element.setAttribute(attr.name, compiledHandler);
      }
    }
  });

  // 递归处理子元素
  if (element.children && element.children.length > 0) {
    Array.from(element.children).forEach((child) => {
      compileInlineEvents(child, iframeWindow);
    });
  }
}

/**
 * 拦截 Element.prototype.setAttribute，编译内联事件属性
 * 用于捕获子应用运行期间（如 Vue 模板渲染）动态设置的内联事件
 */
function patchSetAttribute(iframeWindow: Window): void {
  const rawSetAttribute = iframeWindow.Element.prototype.setAttribute;

  iframeWindow.Element.prototype.setAttribute = function (name: string, value: string): void {
    // 内联事件属性进行编译，幂等避免重复包裹（降级模式同样需要，见 compileInlineEvents 说明）
    if (name.startsWith("on") && typeof value === "string") {
      const appId = iframeWindow.__WUJIE?.id;
      rawSetAttribute.call(this, name, appId ? wrapInlineEventHandler(value, appId) : value);
    } else {
      rawSetAttribute.call(this, name, value);
    }
  };
}
