import { WUJIE_TIPS_NO_URL, WUJIE_DATA_ID } from "./constant";
import { plugin, cacheOptions } from "./index";

export function toArray<T>(array: T | T[]): T[] {
  return Array.isArray(array) ? array : [array];
}

export function isFunction(value: any): boolean {
  return typeof value === "function";
}

export function isHijackingTag(tagName?: string) {
  return (
    tagName?.toUpperCase() === "LINK" ||
    tagName?.toUpperCase() === "STYLE" ||
    tagName?.toUpperCase() === "SCRIPT" ||
    tagName?.toUpperCase() === "IFRAME"
  );
}

export const wujieSupport = window.Proxy && window.CustomElementRegistry;

/**
 * in safari
 * typeof document.all === 'undefined' // true
 * typeof document.all === 'function' // true
 * We need to discriminate safari for better performance
 */
const naughtySafari = typeof document.all === "function" && typeof document.all === "undefined";
const callableFnCacheMap = new WeakMap<CallableFunction, boolean>();
export const isCallable = (fn: any) => {
  if (callableFnCacheMap.has(fn)) {
    return true;
  }

  const callable = naughtySafari ? typeof fn === "function" && typeof fn !== "undefined" : typeof fn === "function";
  if (callable) {
    callableFnCacheMap.set(fn, callable);
  }
  return callable;
};

const boundedMap = new WeakMap<CallableFunction, boolean>();
export function isBoundedFunction(fn: CallableFunction) {
  if (boundedMap.has(fn)) {
    return boundedMap.get(fn);
  }
  const bounded = fn.name.indexOf("bound ") === 0 && !fn.hasOwnProperty("prototype");
  boundedMap.set(fn, bounded);
  return bounded;
}

const fnRegexCheckCacheMap = new WeakMap<any | FunctionConstructor, boolean>();
export function isConstructable(fn: () => any | FunctionConstructor) {
  const hasPrototypeMethods =
    fn.prototype && fn.prototype.constructor === fn && Object.getOwnPropertyNames(fn.prototype).length > 1;

  if (hasPrototypeMethods) return true;

  if (fnRegexCheckCacheMap.has(fn)) {
    return fnRegexCheckCacheMap.get(fn);
  }

  let constructable = hasPrototypeMethods;
  if (!constructable) {
    const fnString = fn.toString();
    const constructableFunctionRegex = /^function\b\s[A-Z].*/;
    const classRegex = /^class\b/;
    constructable = constructableFunctionRegex.test(fnString) || classRegex.test(fnString);
  }

  fnRegexCheckCacheMap.set(fn, constructable);
  return constructable;
}

const setFnCacheMap = new WeakMap<CallableFunction, CallableFunction>();
export function checkProxyFunction(value: any) {
  if (isCallable(value) && !isBoundedFunction(value) && !isConstructable(value)) {
    if (!setFnCacheMap.has(value)) {
      setFnCacheMap.set(value, value);
    }
  }
}

export function getTargetValue(target: any, p: any): any {
  const value = target[p];
  if (setFnCacheMap.has(value)) {
    return setFnCacheMap.get(value);
  }
  if (isCallable(value) && !isBoundedFunction(value) && !isConstructable(value)) {
    const boundValue = Function.prototype.bind.call(value, target);
    setFnCacheMap.set(value, boundValue);

    for (const key in value) {
      boundValue[key] = value[key];
    }
    if (value.hasOwnProperty("prototype") && !boundValue.hasOwnProperty("prototype")) {
      // https://github.com/kuitos/kuitos.github.io/issues/47
      Object.defineProperty(boundValue, "prototype", { value: value.prototype, enumerable: false, writable: true });
    }
    return boundValue;
  }
  return value;
}

export function getDegradeIframe(id: string): HTMLIFrameElement {
  return window.document.querySelector(`iframe[${WUJIE_DATA_ID}="${id}"]`);
}

export function appRouteParse(url: string): {
  urlElement: HTMLAnchorElement;
  appHostPath: string;
  appRoutePath: string;
} {
  if (!url) {
    error(WUJIE_TIPS_NO_URL);
    throw new Error();
  }
  const urlElement = anchorElementGenerator(url);
  const appHostPath = urlElement.protocol + "//" + urlElement.host;
  const appRoutePath = urlElement.pathname + urlElement.search + urlElement.hash;
  return { urlElement, appHostPath, appRoutePath };
}

export function anchorElementGenerator(url: string): HTMLAnchorElement {
  const element = window.document.createElement("a");
  element.href = url;
  return element;
}

export function getAnchorElementQueryMap(anchorElement: HTMLAnchorElement): { [key: string]: string } {
  const queryList = anchorElement.search.replace("?", "").split("&");
  const queryMap = {};
  queryList.forEach((query) => {
    const [key, value] = query.split("=");
    if (key && value) queryMap[key] = value;
  });
  return queryMap;
}

/**
 * 当前url的查询参数中是否有给定的id
 */
export function isMatchSyncQueryById(id: string): boolean {
  const queryMap = getAnchorElementQueryMap(anchorElementGenerator(window.location.href));
  return Object.keys(queryMap).includes(id);
}

/**
 * 劫持元素原型对相对地址的赋值转绝对地址
 * @param iframeWindow
 */
export function fixElementCtrSrcOrHref(
  iframeWindow: Window,
  elementCtr:
    | typeof HTMLImageElement
    | typeof HTMLAnchorElement
    | typeof HTMLSourceElement
    | typeof HTMLLinkElement
    | typeof HTMLScriptElement,
  attr
): void {
  // patch setAttribute
  const rawElementSetAttribute = iframeWindow.Element.prototype.setAttribute;
  elementCtr.prototype.setAttribute = function (name: string, value: string): void {
    let targetValue = value;
    if (name === attr) targetValue = getAbsolutePath(value, this.baseURI || "", true);
    rawElementSetAttribute.call(this, name, targetValue);
  };
  // patch href get and set
  const rawAnchorElementHrefDescriptor = Object.getOwnPropertyDescriptor(elementCtr.prototype, attr);
  const { enumerable, configurable, get, set } = rawAnchorElementHrefDescriptor;
  Object.defineProperty(elementCtr.prototype, attr, {
    enumerable,
    configurable,
    get: function () {
      return get.call(this);
    },
    set: function (href) {
      set.call(this, getAbsolutePath(href, this.baseURI, true));
    },
  });
  // TODO: innerHTML的处理
}

export function getCurUrl(proxyLocation: Object): string {
  const location = proxyLocation as Location;
  return location.protocol + "//" + location.host + location.pathname;
}

export function getAbsolutePath(url: string, base: string, hash?: boolean): string {
  try {
    // 为空值无需处理
    if (url) {
      // 需要处理hash的场景
      if (hash && url.startsWith("#")) return url;
      return new URL(url, base).href;
    } else return url;
  } catch {
    return url;
  }
}
/**
 * 获取需要同步的url
 */
export function getSyncUrl(id: string, prefix: { [key: string]: string }): string {
  let winUrlElement = anchorElementGenerator(window.location.href);
  const queryMap = getAnchorElementQueryMap(winUrlElement);
  winUrlElement = null;
  const syncUrl = window.decodeURIComponent(queryMap[id] || "");
  const validShortPath = syncUrl.match(/^{([^}]*)}/)?.[1];
  if (prefix && validShortPath) {
    return syncUrl.replace(`{${validShortPath}}`, prefix[validShortPath]);
  }
  return syncUrl;
}
// @ts-ignore
export const requestIdleCallback = window.requestIdleCallback || ((cb: Function) => setTimeout(cb, 1));

export function getContainer(container: string | HTMLElement): HTMLElement {
  return typeof container === "string" ? (document.querySelector(container) as HTMLElement) : container;
}

export function warn(msg: string, data?: any): void {
  console?.warn(`[wujie warn]: ${msg}`, data);
}

export function error(msg: string, data?: any): void {
  console?.error(`[wujie error]: ${msg}`, data);
}

export function getInlineCode(match) {
  const start = match.indexOf(">") + 1;
  const end = match.lastIndexOf("<");
  return match.substring(start, end);
}

export function defaultGetPublicPath(entry) {
  if (typeof entry === "object") {
    return "/";
  }
  try {
    const { origin, pathname } = new URL(entry, location.href);
    const paths = pathname.split("/");
    // 移除最后一个元素
    paths.pop();
    return `${origin}${paths.join("/")}/`;
  } catch (e) {
    console.warn(e);
    return "";
  }
}

/** [f1, f2, f3, f4] => f4(f3(f2(f1))) 函数柯里化 */
export function compose(fnList: Array<Function>): (...args: Array<string>) => string {
  return function (code: string, ...args: Array<any>) {
    return fnList.reduce((newCode, fn) => (isFunction(fn) ? fn(newCode, ...args) : newCode), code || "");
  };
}

// 微任务
export function nextTick(cb: () => any): void {
  Promise.resolve().then(cb);
}

//执行钩子函数
export function execHooks(plugins: Array<plugin>, hookName: string, ...args: Array<any>): void {
  try {
    plugins
      .map((plugin) => plugin[hookName])
      .filter((hook) => isFunction(hook))
      .forEach((hook) => hook(...args));
  } catch (e) {
    error(e);
  }
}

// 合并缓存
export function mergeOptions(options: cacheOptions, cacheOptions: cacheOptions) {
  return {
    name: options.name,
    el: options.el || cacheOptions?.el,
    url: options.url || cacheOptions?.url,
    exec: options.exec !== undefined ? options.exec : cacheOptions?.exec,
    replace: options.replace || cacheOptions?.replace,
    fetch: options.fetch || cacheOptions?.fetch,
    props: options.props || cacheOptions?.props,
    sync: options.sync !== undefined ? options.sync : cacheOptions?.sync,
    prefix: options.prefix || cacheOptions?.prefix,
    loading: options.loading || cacheOptions?.loading,
    // 默认 {}
    attrs: options.attrs !== undefined ? options.attrs : cacheOptions?.attrs || {},
    // 默认 true
    fiber: options.fiber !== undefined ? options.fiber : cacheOptions?.fiber !== undefined ? cacheOptions?.fiber : true,
    alive: options.alive !== undefined ? options.alive : cacheOptions?.alive,
    degrade: options.degrade !== undefined ? options.degrade : cacheOptions?.degrade,
    plugins: options.plugins || cacheOptions?.plugins,
    lifecycles: {
      beforeLoad: options.beforeLoad || cacheOptions?.beforeLoad,
      beforeMount: options.beforeMount || cacheOptions?.beforeMount,
      afterMount: options.afterMount || cacheOptions?.afterMount,
      beforeUnmount: options.beforeUnmount || cacheOptions?.beforeUnmount,
      afterUnmount: options.afterUnmount || cacheOptions?.afterUnmount,
      activated: options.activated || cacheOptions?.activated,
      deactivated: options.deactivated || cacheOptions?.deactivated,
      loadError: options.loadError || cacheOptions?.loadError,
    },
  };
}

/**
 * 事件触发器
 */
export function eventTrigger(el: HTMLElement | Window | Document, eventName: string, detail?: any) {
  let event;
  if (typeof window.CustomEvent === "function") {
    event = new CustomEvent(eventName, { detail });
  } else {
    event = document.createEvent("CustomEvent");
    event.initCustomEvent(eventName, true, false, detail);
  }
  el.dispatchEvent(event);
}
