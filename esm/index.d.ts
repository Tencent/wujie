export { clearAssetsCache } from "./entry";
import { StyleObject, ScriptAttributes } from "./template";
import { lifecycle } from "./sandbox";
import { EventBus } from "./event";
export declare const bus: EventBus;
export interface ScriptObjectLoader {
    /** 脚本地址，内联为空 */
    src?: string;
    /** 脚本是否为module模块 */
    module?: boolean;
    /** 脚本是否为async执行 */
    async?: boolean;
    /** 脚本是否设置crossorigin */
    crossorigin?: boolean;
    /** 脚本crossorigin的类型 */
    crossoriginType?: "anonymous" | "use-credentials" | "";
    /** 脚本原始属性 */
    attrs?: ScriptAttributes;
    /** 内联script的代码 */
    content?: string;
    /** 执行回调钩子 */
    callback?: (appWindow: Window) => any;
    /** 子应用加载完毕事件 */
    onload?: Function;
}
export interface plugin {
    /** 处理html的loader */
    htmlLoader?: (code: string) => string;
    /** js排除列表 */
    jsExcludes?: Array<string | RegExp>;
    /** js忽略列表 */
    jsIgnores?: Array<string | RegExp>;
    /** 处理js加载前的loader */
    jsBeforeLoaders?: Array<ScriptObjectLoader>;
    /** 处理js的loader */
    jsLoader?: (code: string, url: string, base: string) => string;
    /** 处理js加载后的loader */
    jsAfterLoaders?: Array<ScriptObjectLoader>;
    /** css排除列表 */
    cssExcludes?: Array<string | RegExp>;
    /** css忽略列表 */
    cssIgnores?: Array<string | RegExp>;
    /** 处理css加载前的loader */
    cssBeforeLoaders?: Array<StyleObject>;
    /** 处理css的loader */
    cssLoader?: (code: string, url: string, base: string) => string;
    /** 处理css加载后的loader */
    cssAfterLoaders?: Array<StyleObject>;
    /** 子应用 window addEventListener 钩子回调 */
    windowAddEventListenerHook?: eventListenerHook;
    /** 子应用 window removeEventListener 钩子回调 */
    windowRemoveEventListenerHook?: eventListenerHook;
    /** 子应用 document addEventListener 钩子回调 */
    documentAddEventListenerHook?: eventListenerHook;
    /** 子应用 document removeEventListener 钩子回调 */
    documentRemoveEventListenerHook?: eventListenerHook;
    /** 子应用 向body、head插入元素后执行的钩子回调 */
    appendOrInsertElementHook?: <T extends Node>(element: T, iframeWindow: Window) => void;
    /** 子应用劫持元素的钩子回调 */
    patchElementHook?: <T extends Node>(element: T, iframeWindow: Window) => void;
    /** 用户自定义覆盖子应用 window 属性 */
    windowPropertyOverride?: (iframeWindow: Window) => void;
    /** 用户自定义覆盖子应用 document 属性 */
    documentPropertyOverride?: (iframeWindow: Window) => void;
}
type eventListenerHook = (iframeWindow: Window, type: string, handler: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => void;
export type loadErrorHandler = (url: string, e: Error) => any;
type baseOptions = {
    /** 唯一性用户必须保证 */
    name: string;
    /** 需要渲染的url */
    url: string;
    /** 需要渲染的html, 如果已有则无需从url请求 */
    html?: string;
    /** 代码替换钩子 */
    replace?: (code: string) => string;
    /** 自定义fetch */
    fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
    /** 注入给子应用的属性 */
    props?: {
        [key: string]: any;
    };
    /** 自定义运行iframe的属性 */
    attrs?: {
        [key: string]: any;
    };
    /** 自定义降级渲染iframe的属性 */
    degradeAttrs?: {
        [key: string]: any;
    };
    /** 子应用采用fiber模式执行 */
    fiber?: boolean;
    /** 子应用保活，state不会丢失 */
    alive?: boolean;
    /** 子应用采用降级iframe方案 */
    degrade?: boolean;
    /** 子应用插件 */
    plugins?: Array<plugin>;
    /** 子应用window监听事件 */
    iframeAddEventListeners?: Array<string>;
    /** 子应用iframe on事件 */
    iframeOnEvents?: Array<string>;
    /** 子应用生命周期 */
    beforeLoad?: lifecycle;
    beforeMount?: lifecycle;
    afterMount?: lifecycle;
    beforeUnmount?: lifecycle;
    afterUnmount?: lifecycle;
    activated?: lifecycle;
    deactivated?: lifecycle;
    loadError?: loadErrorHandler;
};
export type preOptions = Omit<baseOptions, "url"> & {
    /** 预执行 */
    exec?: boolean;
    url?: string;
};
export type startOptions = baseOptions & {
    /** 渲染的容器 */
    el: HTMLElement | string;
    /**
     * 路由同步开关
     * 如果false，子应用跳转主应用路由无变化，但是主应用的history还是会增加
     * https://html.spec.whatwg.org/multipage/history.html#the-history-interface
     */
    sync?: boolean;
    /** 子应用短路径替换，路由同步时生效 */
    prefix?: {
        [key: string]: string;
    };
    /** 子应用加载时loading元素 */
    loading?: HTMLElement;
};
type optionProperty = "url" | "el";
/**
 * 合并 preOptions 和 startOptions，并且将 url 和 el 变成可选
 */
export type cacheOptions = Omit<preOptions & startOptions, optionProperty> & Partial<Pick<startOptions, optionProperty>>;
/**
 * 缓存子应用配置
 */
export declare function setupApp(options: cacheOptions): void;
/**
 * 运行无界app
 */
export declare function startApp(startOptions: startOptions): Promise<Function | void>;
/**
 * 预加载无界APP
 */
export declare function preloadApp(preOptions: preOptions): void;
/**
 * 销毁无界APP
 */
export declare function destroyApp(id: string): void;
