import { plugin, cacheOptions } from "./index";
export declare function toArray<T>(array: T | T[]): T[];
export declare function isFunction(value: any): boolean;
export declare function isHijackingTag(tagName?: string): boolean;
export declare const wujieSupport: {
    new (): CustomElementRegistry;
    prototype: CustomElementRegistry;
};
export declare const isCallable: (fn: any) => boolean;
export declare function isBoundedFunction(fn: CallableFunction): boolean;
export declare function isConstructable(fn: () => any | FunctionConstructor): boolean;
export declare function checkProxyFunction(target: Window | Document | ShadowRoot | Location, value: any): void;
export declare function getTargetValue(target: any, p: any): any;
export declare function getDegradeIframe(id: string): HTMLIFrameElement;
export declare function setAttrsToElement(element: HTMLElement, attrs: {
    [key: string]: any;
}): void;
export declare function appRouteParse(url: string): {
    urlElement: HTMLAnchorElement;
    appHostPath: string;
    appRoutePath: string;
};
export declare function anchorElementGenerator(url: string): HTMLAnchorElement;
export declare function getAnchorElementQueryMap(anchorElement: HTMLAnchorElement): {
    [key: string]: string;
};
/**
 * 当前url的查询参数中是否有给定的id
 */
export declare function isMatchSyncQueryById(id: string): boolean;
/**
 * 劫持元素原型对相对地址的赋值转绝对地址
 * @param iframeWindow
 */
export declare function fixElementCtrSrcOrHref(iframeWindow: Window, elementCtr: typeof HTMLImageElement | typeof HTMLAnchorElement | typeof HTMLSourceElement | typeof HTMLLinkElement | typeof HTMLScriptElement | typeof HTMLMediaElement, attr: any): void;
export declare function getCurUrl(proxyLocation: Object): string;
export declare function getAbsolutePath(url: string, base: string, hash?: boolean): string;
/**
 * 获取需要同步的url
 */
export declare function getSyncUrl(id: string, prefix: {
    [key: string]: string;
}): string;
export declare const requestIdleCallback: ((callback: IdleRequestCallback, options?: IdleRequestOptions) => number) & typeof globalThis.requestIdleCallback;
export declare function getContainer(container: string | HTMLElement): HTMLElement;
export declare function warn(msg: string, data?: any): void;
export declare function error(msg: string, data?: any): void;
export declare function getInlineCode(match: any): any;
export declare function defaultGetPublicPath(entry: any): string;
/** [f1, f2, f3, f4] => f4(f3(f2(f1))) 函数柯里化 */
export declare function compose(fnList: Array<Function>): (...args: Array<string>) => string;
export declare function nextTick(cb: () => any): void;
export declare function execHooks(plugins: Array<plugin>, hookName: string, ...args: Array<any>): void;
export declare function isScriptElement(element: HTMLElement): boolean;
export declare function setTagToScript(element: HTMLScriptElement, tag?: string): void;
export declare function getTagFromScript(element: HTMLScriptElement): string | null;
export declare function mergeOptions(options: cacheOptions, cacheOptions: cacheOptions): {
    name: string;
    el: string | HTMLElement;
    url: string;
    html: string;
    exec: boolean;
    replace: (code: string) => string;
    fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
    props: {
        [key: string]: any;
    };
    sync: boolean;
    prefix: {
        [key: string]: string;
    };
    loading: HTMLElement;
    attrs: {
        [key: string]: any;
    };
    degradeAttrs: {
        [key: string]: any;
    };
    fiber: boolean;
    alive: boolean;
    degrade: boolean;
    plugins: plugin[];
    iframeAddEventListeners: string[];
    iframeOnEvents: string[];
    lifecycles: {
        beforeLoad: import("./sandbox").lifecycle;
        beforeMount: import("./sandbox").lifecycle;
        afterMount: import("./sandbox").lifecycle;
        beforeUnmount: import("./sandbox").lifecycle;
        afterUnmount: import("./sandbox").lifecycle;
        activated: import("./sandbox").lifecycle;
        deactivated: import("./sandbox").lifecycle;
        loadError: import("./index").loadErrorHandler;
    };
};
/**
 * 事件触发器
 */
export declare function eventTrigger(el: HTMLElement | Window | Document, eventName: string, detail?: any): void;
export declare function stopMainAppRun(): void;
