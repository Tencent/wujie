import {
  WUJIE_SCRIPT_ID,
  WUJIE_TIPS_NO_URL,
  WUJIE_APP_ID,
  WUJIE_TIPS_STOP_APP,
  WUJIE_TIPS_STOP_APP_DETAIL,
} from "./constant";
import { plugin, cacheOptions } from "./index";
import { relativeUrlAttrMap } from "./common";
import type { RelativeUrlKind } from "./common";

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

// 修复多个子应用启动，拿到的全局对象都是第一个子应用全局对象的bug：https://github.com/Tencent/wujie/issues/770
const setFnCacheMap = new WeakMap<
  Window | Document | ShadowRoot | Location,
  WeakMap<CallableFunction, CallableFunction>
>();

export function checkProxyFunction(target: Window | Document | ShadowRoot | Location, value: any) {
  if (isCallable(value) && !isBoundedFunction(value) && !isConstructable(value)) {
    if (!setFnCacheMap.has(target)) {
      setFnCacheMap.set(target, new WeakMap());
      setFnCacheMap.get(target).set(value, value);
    } else if (!setFnCacheMap.get(target).has(value)) {
      setFnCacheMap.get(target).set(value, value);
    }
  }
}

export function getTargetValue(target: any, p: any): any {
  const value = target[p];
  if (setFnCacheMap.has(target) && setFnCacheMap.get(target).has(value)) {
    return setFnCacheMap.get(target).get(value);
  }
  if (isCallable(value) && !isBoundedFunction(value) && !isConstructable(value)) {
    const boundValue = Function.prototype.bind.call(value, target);
    if (setFnCacheMap.has(target)) {
      setFnCacheMap.get(target).set(value, boundValue);
    } else {
      setFnCacheMap.set(target, new WeakMap());
      setFnCacheMap.get(target).set(value, boundValue);
    }
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
  return window.document.querySelector(`iframe[${WUJIE_APP_ID}="${id}"]`);
}

export function setAttrsToElement(element: HTMLElement, attrs: { [key: string]: any }) {
  Object.keys(attrs).forEach((name) => {
    element.setAttribute(name, attrs[name]);
  });
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
  let appRoutePath = urlElement.pathname + urlElement.search + urlElement.hash;
  if (!appRoutePath.startsWith("/")) appRoutePath = "/" + appRoutePath; // hack ie
  return { urlElement, appHostPath, appRoutePath };
}

export function anchorElementGenerator(url: string): HTMLAnchorElement {
  const element = window.document.createElement("a");
  element.href = url;
  element.href = element.href; // hack ie
  return element;
}

export function getAnchorElementQueryMap(anchorElement: HTMLAnchorElement): { [key: string]: string } {
  const queryString = anchorElement.search || "";
  return [...new URLSearchParams(queryString).entries()].reduce((p, c) => {
    p[c[0]] = c[1];
    return p;
  }, {} as Record<string, string>);
}

/**
 * 当前url的查询参数中是否有给定的id
 */
export function isMatchSyncQueryById(id: string): boolean {
  const queryMap = getAnchorElementQueryMap(anchorElementGenerator(window.location.href));
  return Object.keys(queryMap).includes(id);
}

const hasOwn = (target: object, key: string): boolean => Object.prototype.hasOwnProperty.call(target, key);

/**
 * 子应用相对地址的补全基准，与沙箱节点 baseURI 的修正保持一致
 */
export function getAppBaseURI(iframeWindow: Window): string {
  const proxyLocation = iframeWindow.__WUJIE?.proxyLocation;
  return proxyLocation ? getCurUrl(proxyLocation) : iframeWindow.document?.baseURI || "";
}

/**
 * 查询元素属性在 relativeUrlAttrMap 中的解析方式，不需要补全时返回 undefined
 */
export function getRelativeUrlKind(element: Element, attr: string): RelativeUrlKind | undefined {
  const localName = element.localName;
  if (!localName || !hasOwn(relativeUrlAttrMap, localName)) return undefined;
  const attrMap = relativeUrlAttrMap[localName];
  const name = String(attr).toLowerCase();
  return hasOwn(attrMap, name) ? attrMap[name] : undefined;
}

// srcset 只以 ASCII 空白分隔，全角空格等属于地址本身
const isSrcsetWhitespace = (char: string): boolean => /[\t\n\f\r ]/.test(char);

/**
 * 逐个补全 srcset 中的候选地址，描述符与原有分隔格式保持不变
 */
export function getAbsoluteSrcset(srcset: string, base: string): string {
  let result = "";
  let index = 0;
  const length = srcset.length;
  while (index < length) {
    let start = index;
    while (index < length && (srcset[index] === "," || isSrcsetWhitespace(srcset[index]))) index++;
    result += srcset.slice(start, index);
    if (index >= length) break;
    // 候选地址为连续的非空白字符，末尾的逗号属于分隔符
    start = index;
    while (index < length && !isSrcsetWhitespace(srcset[index])) index++;
    const token = srcset.slice(start, index);
    const trailingCommas = /,*$/.exec(token)[0];
    result += getAbsolutePath(token.slice(0, token.length - trailingCommas.length), base, true) + trailingCommas;
    if (trailingCommas) continue;
    start = index;
    while (index < length && srcset[index] !== ",") index++;
    result += srcset.slice(start, index);
  }
  return result;
}

export function resolveRelativeUrl(value: string, kind: RelativeUrlKind, base: string): string {
  return kind === "srcset" ? getAbsoluteSrcset(value, base) : getAbsolutePath(value, base, true);
}

/**
 * 按 relativeUrlAttrMap 补全单个元素上的相对地址，值不变时不回写，避免重复触发资源加载
 */
function fixElementRelativeUrl(element: Element, base: string): void {
  const localName = element.localName;
  if (!localName || !hasOwn(relativeUrlAttrMap, localName)) return;
  const attrMap = relativeUrlAttrMap[localName];
  Object.keys(attrMap).forEach((attr) => {
    const value = element.getAttribute(attr);
    if (!value) return;
    const absoluteValue = resolveRelativeUrl(value, attrMap[attr], base);
    if (absoluteValue !== value) element.setAttribute(attr, absoluteValue);
  });
}

let relativeUrlSelector = "";

/**
 * 按 relativeUrlAttrMap 补全子树中所有元素的相对地址，用于 innerHTML 这类由原生 parser 构建节点的场景
 */
export function fixRelativeUrlInTree(root: ParentNode, base: string): void {
  relativeUrlSelector = relativeUrlSelector || Object.keys(relativeUrlAttrMap).join(",");
  root.querySelectorAll(relativeUrlSelector).forEach((element) => {
    fixElementRelativeUrl(element, base);
  });
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
  const syncUrl = queryMap[id] || "";
  const validShortPath = syncUrl.match(/^{([^}]*)}/)?.[1];
  if (prefix && validShortPath) {
    const longPath = prefix[validShortPath];
    // 占位符没有对应的 prefix 时还原不出真实路径：返回空串让调用方回退到 url，
    // 否则 replace 会把 undefined 当成字符串拼进路径
    return longPath ? syncUrl.replace(`{${validShortPath}}`, longPath) : "";
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
    if (plugins && plugins.length > 0) {
      plugins
        .map((plugin) => plugin[hookName])
        .filter((hook) => isFunction(hook))
        .forEach((hook) => hook(...args));
    }
  } catch (e) {
    error(e);
  }
}

export function isScriptElement(element: HTMLElement): boolean {
  return element.tagName?.toUpperCase() === "SCRIPT";
}

let count = 1;
export function setTagToScript(element: HTMLScriptElement, tag?: string): void {
  if (isScriptElement(element)) {
    const scriptTag = tag || String(count++);
    element.setAttribute(WUJIE_SCRIPT_ID, scriptTag);
  }
}

export function getTagFromScript(element: HTMLScriptElement): string | null {
  if (isScriptElement(element)) {
    return element.getAttribute(WUJIE_SCRIPT_ID);
  }
  return null;
}

// 合并缓存
export function mergeOptions(options: cacheOptions, cacheOptions: cacheOptions) {
  return {
    name: options.name,
    el: options.el || cacheOptions?.el,
    url: options.url || cacheOptions?.url,
    html: options.html || cacheOptions?.html,
    exec: options.exec !== undefined ? options.exec : cacheOptions?.exec,
    replace: options.replace || cacheOptions?.replace,
    fetch: options.fetch || cacheOptions?.fetch,
    props: options.props || cacheOptions?.props,
    sync: options.sync !== undefined ? options.sync : cacheOptions?.sync,
    prefix: options.prefix || cacheOptions?.prefix,
    loading: options.loading || cacheOptions?.loading,
    // 默认 {}
    attrs: options.attrs !== undefined ? options.attrs : cacheOptions?.attrs || {},
    degradeAttrs: options.degradeAttrs !== undefined ? options.degradeAttrs : cacheOptions?.degradeAttrs || {},
    // 默认 true
    fiber: options.fiber !== undefined ? options.fiber : cacheOptions?.fiber !== undefined ? cacheOptions?.fiber : true,
    alive: options.alive !== undefined ? options.alive : cacheOptions?.alive,
    degrade: options.degrade !== undefined ? options.degrade : cacheOptions?.degrade,
    plugins: options.plugins || cacheOptions?.plugins,
    iframeAddEventListeners: options.iframeAddEventListeners || cacheOptions?.iframeAddEventListeners || [],
    iframeOnEvents: options.iframeOnEvents || cacheOptions?.iframeOnEvents || [],
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

export function stopMainAppRun() {
  warn(WUJIE_TIPS_STOP_APP_DETAIL);
  throw new Error(WUJIE_TIPS_STOP_APP);
}
