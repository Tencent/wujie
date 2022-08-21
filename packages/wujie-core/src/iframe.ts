import WuJie from "./sandbox";
import { ScriptObject } from "./template";
import { renderElementToContainer, clearChild } from "./shadow";
import { syncUrlToWindow } from "./sync";
import {
  fixElementCtrSrcOrHref,
  isConstructable,
  anchorElementGenerator,
  isMatchSyncQueryById,
  warn,
  error,
  execHooks,
  getCurUrl,
  getAbsolutePath,
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
} from "./common";
import { getJsLoader } from "./plugin";
import { WUJIE_TIPS_EMPTY_CALLBACK, WUJIE_TIPS_SCRIPT_ERROR_REQUESTED, WUJIE_DATA_FLAG } from "./constant";
import { ScriptObjectLoader } from "./index";

declare global {
  interface Window {
    // 是否存在无界
    __POWERED_BY_WUJIE__?: boolean;
    // 子应用公共加载路径
    __WUJIE_PUBLIC_PATH__: string;
    // 原生的querySelector
    __WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__: typeof Document.prototype.querySelector;
    // 原生的querySelector
    __WUJIE_RAW_DOCUMENT_QUERY_SELECTOR_ALL__: typeof Document.prototype.querySelectorAll;
    // 原生的window对象
    __WUJIE_RAW_WINDOW__: Window;
    // 子应用沙盒实例
    __WUJIE: WuJie;
    // 子应用mount函数
    __WUJIE_MOUNT: () => void;
    // 子应用unmount函数
    __WUJIE_UNMOUNT: () => void;
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
    EventTarget: typeof EventTarget;
    Event: typeof Event;
    ShadowRoot: typeof ShadowRoot;
    // 注入对象
    $wujie: { [key: string]: any };
  }
  interface HTMLHeadElement {
    __cacheListeners: Map<string, EventListenerOrEventListenerObject[]>;
  }
  interface HTMLBodyElement {
    __cacheListeners: Map<string, EventListenerOrEventListenerObject[]>;
  }
}

/**
 * 修改window对象的事件监听，只有路由事件采用iframe的事件
 */
function patchIframeEvents(iframeWindow: Window) {
  iframeWindow.addEventListener = function addEventListener<K extends keyof WindowEventMap>(
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ) {
    // 运行插件钩子函数
    execHooks(iframeWindow.__WUJIE.plugins, "windowAddEventListenerHook", iframeWindow, type, listener, options);

    if (appWindowAddEventListenerEvents.includes(type)) {
      return rawAddEventListener.call(iframeWindow, type, listener, options);
    }
    // 在子应用嵌套场景使用window.window获取真实window
    rawAddEventListener.call(window.__WUJIE_RAW_WINDOW__ || window, type, listener, options);
  };

  iframeWindow.removeEventListener = function removeEventListener<K extends keyof WindowEventMap>(
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ) {
    // 运行插件钩子函数
    execHooks(iframeWindow.__WUJIE.plugins, "windowRemoveEventListenerHook", iframeWindow, type, listener, options);

    if (appWindowAddEventListenerEvents.includes(type)) {
      return rawRemoveEventListener.call(iframeWindow, type, listener, options);
    }
    rawRemoveEventListener.call(window.__WUJIE_RAW_WINDOW__ || window, type, listener, options);
  };
}

function patchIframeVariable(iframeWindow: Window, appHostPath: string): void {
  iframeWindow.__WUJIE_PUBLIC_PATH__ = appHostPath + "/";
  iframeWindow.$wujie = iframeWindow.__WUJIE.provide;
  iframeWindow.__WUJIE_RAW_WINDOW__ = iframeWindow;
  iframeWindow.__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__ = iframeWindow.Document.prototype.querySelector;
  iframeWindow.__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR_ALL__ = iframeWindow.Document.prototype.querySelectorAll;
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
 * @param url
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
function patchWindowEffect(iframeWindow: Window): void {
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
        get: () => iframeWindow.document[key],
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
    .filter((e) => !appWindowOnEvent.includes(e));

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
                window[e] = typeof handler === "function" ? handler.bind(iframeWindow) : handler;
              }
            : undefined,
      });
    } catch (e) {
      warn(e.message);
    }
  });
  // 运行插件钩子函数
  execHooks(iframeWindow.__WUJIE.plugins, "windowPropertyOverride", iframeWindow);
}

/**
 * 记录节点的监听事件
 */
function recordEventListeners(iframeWindow: Window) {
  const sandbox = iframeWindow.__WUJIE;
  iframeWindow.EventTarget.prototype.addEventListener = function (
    type: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    // 添加事件缓存
    const elementListenerList = sandbox.elementEventCacheMap.get(this);
    if (elementListenerList) {
      if (!elementListenerList.find((listener) => listener.handler === handler)) {
        elementListenerList.push({ type, handler, options });
      }
    } else sandbox.elementEventCacheMap.set(this, [{ type, handler, options }]);
    return rawAddEventListener.call(this, type, handler, options);
  };

  iframeWindow.EventTarget.prototype.removeEventListener = function (
    type: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void {
    // 清除缓存
    const elementListenerList = sandbox.elementEventCacheMap.get(this);
    if (elementListenerList) {
      const index = elementListenerList?.findIndex((ele) => ele.handler === handler);
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
export function recoverEventListeners(rootElement: Element, iframeWindow: Window) {
  const sandbox = iframeWindow.__WUJIE;
  const elementEventCacheMap: WeakMap<
    Node,
    Array<{ type: string; handler: EventListenerOrEventListenerObject; options: any }>
  > = new WeakMap();
  const ElementIterator = document.createTreeWalker(rootElement);
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
export function recoverDocumentListeners(oldRootElement: Element, newRootElement: Element, iframeWindow: Window) {
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
function patchDocumentEffect(iframeWindow: Window): void {
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
    // 降级统一走document.firstElementChild
    if (sandbox.degrade) return sandbox.document.firstElementChild.addEventListener(type, callback, options);
    if (mainDocumentAddEventListenerEvents.includes(type))
      return window.document.addEventListener(type, callback, options);
    if (mainAndAppAddEventListenerEvents.includes(type)) {
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
      if (sandbox.degrade) return sandbox.document.firstElementChild.removeEventListener(type, callback, options);
      if (mainDocumentAddEventListenerEvents.includes(type)) {
        return window.document.removeEventListener(type, callback, options);
      }
      if (mainAndAppAddEventListenerEvents.includes(type)) {
        window.document.removeEventListener(type, callback, options);
        sandbox.shadowRoot.removeEventListener(type, callback, options);
        return;
      }
      sandbox.shadowRoot.removeEventListener(type, callback, options);
    } else {
      warn(WUJIE_TIPS_EMPTY_CALLBACK);
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
          get: () => (sandbox.degrade ? sandbox.document : sandbox.shadowRoot).firstElementChild[e],
          set:
            descriptor.writable || descriptor.set
              ? (handler) => {
                  const val = typeof handler === "function" ? handler.bind(iframeWindow.document) : handler;
                  sandbox.degrade
                    ? (sandbox.document.firstElementChild[e] = val)
                    : (sandbox.shadowRoot.firstElementChild[e] = val);
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
  // 处理document专属事件
  // TODO 内存泄露
  documentEvents.forEach((propKey) => {
    const descriptor = Object.getOwnPropertyDescriptor(iframeWindow.Document.prototype, propKey) || {
      enumerable: true,
      writable: true,
    };
    try {
      Object.defineProperty(iframeWindow.Document.prototype, propKey, {
        enumerable: descriptor.enumerable,
        configurable: true,
        get: () => (sandbox.degrade ? sandbox : window).document[propKey],
        set:
          descriptor.writable || descriptor.set
            ? (handler) => {
                (sandbox.degrade ? sandbox : window).document[propKey] =
                  typeof handler === "function" ? handler.bind(iframeWindow.document) : handler;
              }
            : undefined,
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
 * @param iframeWindow
 */
function patchNodeEffect(iframeWindow: Window): void {
  const rawGetRootNode = iframeWindow.Node.prototype.getRootNode;
  iframeWindow.Node.prototype.getRootNode = function (options?: GetRootNodeOptions): Node {
    const rootNode = rawGetRootNode.call(this, options);
    if (rootNode === iframeWindow.__WUJIE.shadowRoot) return iframeWindow.document;
    else return rootNode;
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
}

/**
 * 初始化base标签
 */
export function initBase(iframeWindow: Window, url: string): void {
  const iframeDocument = iframeWindow.document;
  const baseElement = iframeDocument.createElement("base");
  const iframeUrlElement = anchorElementGenerator(iframeWindow.location.href);
  const appUrlElement = anchorElementGenerator(url);
  baseElement.setAttribute("href", appUrlElement.protocol + "//" + appUrlElement.host + iframeUrlElement.pathname);
  iframeDocument.head.appendChild(baseElement);
}

/**
 * 初始化iframe的dom结构
 * @param iframeWindow
 */
function initIframeDom(iframeWindow: Window): void {
  const iframeDocument = iframeWindow.document;
  clearChild(iframeDocument);
  const html = iframeDocument.createElement("html");
  html.innerHTML = "<head></head><body></body>";
  iframeDocument.appendChild(html);

  initBase(iframeWindow, iframeWindow.__WUJIE.url);
  patchWindowEffect(iframeWindow);
  patchDocumentEffect(iframeWindow);
  patchNodeEffect(iframeWindow);
  patchRelativeUrlEffect(iframeWindow);
}

/**
 * 防止运行主应用的js代码，给子应用带来很多副作用
 */
// TODO 更加准确抓取停止时机
function stopIframeLoading(iframeWindow: Window, url: string) {
  iframeWindow.__WUJIE.iframeReady = new Promise<void>((resolve) => {
    function loop() {
      setTimeout(() => {
        // location ready
        if (iframeWindow.location.href === "about:blank") {
          loop();
        } else {
          iframeWindow.stop();
          initIframeDom(iframeWindow);
          /**
           * 如果有同步优先同步，非同步从url读取
           */
          if (!isMatchSyncQueryById(iframeWindow.__WUJIE.id)) {
            iframeWindow.history.replaceState(null, "", url);
          }
          resolve();
        }
      }, 0);
    }
    loop();
  });
}

export function patchElementEffect(element: HTMLElement | ShadowRoot, iframeWindow: Window): void {
  const proxyLocation = iframeWindow.__WUJIE.proxyLocation as Location;
  Object.defineProperty(element, "baseURI", {
    configurable: true,
    get: () => proxyLocation.protocol + "//" + proxyLocation.host + proxyLocation.pathname,
    set: undefined,
  });
  Object.defineProperty(element, "ownerDocument", {
    configurable: true,
    get: () => iframeWindow.document,
  });
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
 */
export function insertScriptToIframe(scriptResult: ScriptObject | ScriptObjectLoader, iframeWindow: Window) {
  const { src, module, content, crossorigin, crossoriginType, callback } = scriptResult as ScriptObjectLoader;
  const scriptElement = iframeWindow.document.createElement("script");
  const nextScriptElement = iframeWindow.document.createElement("script");
  const { replace, plugins, proxyLocation } = iframeWindow.__WUJIE;
  const jsLoader = getJsLoader({ plugins, replace });
  let code = jsLoader(content, src, getCurUrl(proxyLocation));

  // 内联脚本
  if (content) {
    // patch location
    if (!iframeWindow.__WUJIE.degrade && !module) {
      code = `(function(window, self, global, location) {
      ${code}
}).bind(window.__WUJIE.proxy)(
  window.__WUJIE.proxy,
  window.__WUJIE.proxy,
  window.__WUJIE.proxy,
  window.__WUJIE.proxyLocation,
);`;
    }
    // 解决 webpack publicPath 为 auto 无法加载资源的问题
    Object.defineProperty(scriptElement, "src", { get: () => src });
    // 非内联脚本
  } else {
    src && scriptElement.setAttribute("src", src);
    crossorigin && scriptElement.setAttribute("crossorigin", crossoriginType);
  }
  module && scriptElement.setAttribute("type", "module");
  scriptElement.textContent = code || "";
  nextScriptElement.textContent =
    "if(window.__WUJIE.execQueue && window.__WUJIE.execQueue.length){ window.__WUJIE.execQueue.shift()()}";

  const container = rawDocumentQuerySelector.call(iframeWindow.document, "head");

  if (/^<!DOCTYPE html/i.test(code)) {
    error(WUJIE_TIPS_SCRIPT_ERROR_REQUESTED, scriptResult);
    return container.appendChild(nextScriptElement);
  }
  container.appendChild(scriptElement);

  // 调用回调
  callback?.(iframeWindow);

  container.appendChild(nextScriptElement);
}

/**
 * 加载iframe替换子应用
 * @param src 地址
 * @param shadowRoot
 */
export function renderIframeReplaceApp(src: string, element: HTMLElement): void {
  const iframe = window.document.createElement("iframe");
  iframe.setAttribute("src", src);
  iframe.setAttribute("style", "height:100%;width:100%");
  renderElementToContainer(iframe, element);
}

/**
 * js沙箱
 * 创建和主应用同源的iframe，路径携带了子路由的路由信息
 * iframe必须禁止加载html，防止进入主应用的路由逻辑
 */
export function iframeGenerator(
  sandbox: WuJie,
  attrs: { [key: string]: any },
  mainHostPath: string,
  appHostPath: string,
  appRoutePath: string
): HTMLIFrameElement {
  const iframe = window.document.createElement("iframe");
  const url = mainHostPath + appRoutePath;
  const attrsMerge = { src: mainHostPath, ...attrs, style: "display: none", name: sandbox.id, [WUJIE_DATA_FLAG]: "" };
  Object.keys(attrsMerge).forEach((key) => iframe.setAttribute(key, attrsMerge[key]));
  window.document.body.appendChild(iframe);
  const iframeWindow = iframe.contentWindow;
  iframeWindow.__WUJIE = sandbox;
  patchIframeVariable(iframeWindow, appHostPath);
  stopIframeLoading(iframeWindow, url);
  patchIframeHistory(iframeWindow, appHostPath, mainHostPath);
  patchIframeEvents(iframeWindow);
  if (iframeWindow.__WUJIE.degrade) recordEventListeners(iframeWindow);
  syncIframeUrlToWindow(iframeWindow);
  return iframe;
}
