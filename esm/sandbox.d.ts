import { ScriptResultList } from "./entry";
import { SandboxCache } from "./common";
import { EventBus, EventObj } from "./event";
import { EventCleanupTracker } from "./tracker";
import { plugin, loadErrorHandler } from "./index";
export type lifecycle = (appWindow: Window) => any;
type lifecycles = {
    beforeLoad: lifecycle;
    beforeMount: lifecycle;
    afterMount: lifecycle;
    beforeUnmount: lifecycle;
    afterUnmount: lifecycle;
    activated: lifecycle;
    deactivated: lifecycle;
    loadError: loadErrorHandler;
};
/**
 * 基于 Proxy和iframe 实现的沙箱
 */
export default class Wujie {
    id: string;
    /** 激活时路由地址 */
    url: string;
    /** 子应用保活 */
    alive: boolean;
    /** window代理 */
    proxy: WindowProxy;
    /** document代理 */
    proxyDocument: Object;
    /** location代理 */
    proxyLocation: Object;
    /**
     * 释放 window / document / location 代理。
     * 代理的 handler 闭包捕获了 iframe / urlElement 等 DOM 引用，destroy 时调用此函数
     * 解除代理与 handler 的关联，斩断「主应用 → 代理闭包 → iframe」的引用链。
     */
    proxyRevoke: () => void;
    /** 事件中心 */
    bus: EventBus;
    /** 容器 */
    el: HTMLElement;
    /** js沙箱 */
    iframe: HTMLIFrameElement;
    /** css沙箱 */
    shadowRoot: ShadowRoot;
    /** 子应用的template */
    template: string;
    /** 子应用代码替换钩子 */
    replace: (code: string) => string;
    /** 子应用自定义fetch */
    fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
    /** 子应用的生命周期 */
    lifecycles: lifecycles;
    /** 子应用的插件 */
    plugins: Array<plugin>;
    /** js沙箱ready态 */
    iframeReady: Promise<void>;
    /** 子应用预加载态 */
    preload: Promise<void>;
    /** 降级时渲染iframe的属性 */
    degradeAttrs: {
        [key: string]: any;
    };
    /** 子应用js执行队列 */
    execQueue: Array<Function>;
    /** 子应用执行过标志 */
    execFlag: boolean;
    /** 子应用激活标志 */
    activeFlag: boolean;
    /** 子应用mount标志 */
    mountFlag: boolean;
    /** 路由同步标志 */
    sync: boolean;
    /** 子应用短路径替换，路由同步时生效 */
    prefix: {
        [key: string]: string;
    };
    /** 子应用跳转标志 */
    hrefFlag: boolean;
    /** 子应用采用fiber模式执行 */
    fiber: boolean;
    /** 子应用降级标志 */
    degrade: boolean;
    /** 子应用降级document */
    document: Document;
    /** 子应用styleSheet元素 */
    styleSheetElements: Array<HTMLLinkElement | HTMLStyleElement>;
    /** 子应用 font-face 样式元素，挂载在最外层 document.head */
    fontStyleSheetElements: Array<HTMLStyleElement>;
    /**
     * 子应用通过 document.head.appendChild(<script>) 触发的动态脚本节点。
     * 由 insertScriptToIframe 在收到 rawElement（即 effect.ts 转发的动态 script）
     * 时登记，sandbox.destroy() 时统一从 iframe head detach 并清空。
     */
    dynamicScriptElements: Array<HTMLScriptElement>;
    /**
     * 动态 <link rel=stylesheet> 以空 href 插入（先 appendChild 后 setAttribute('href')，
     * 如 tinymce 的 StyleSheetLoader）时，effect.ts 会注册一个 MutationObserver 监听
     * href 的后续赋值。这些 observer 必须在 destroy 时统一 disconnect，否则游离 link
     * 会通过 node → registered observer → callback 闭包链路把已销毁的 sandbox 钉在内存中。
     */
    deferredStyleObservers: Array<MutationObserver>;
    /** 子应用head元素 */
    head: HTMLHeadElement;
    /** 子应用body元素 */
    body: HTMLBodyElement;
    /** 子应用dom监听事件留存，当降级时用于保存元素事件 */
    elementEventCacheMap: WeakMap<Node, Array<{
        type: string;
        handler: EventListenerOrEventListenerObject;
        options: any;
    }>>;
    /** 子应用window监听事件 */
    iframeAddEventListeners?: Array<string>;
    /** 子应用iframe on事件 */
    iframeOnEvents?: Array<string>;
    /** 销毁链路清理跟踪器：记录被转发到主应用 window/document 上的副作用，destroy 时统一回收 */
    eventCleanupTracker: EventCleanupTracker;
    /** $wujie对象，提供给子应用的接口 */
    provide: {
        bus: EventBus;
        shadowRoot?: ShadowRoot;
        props?: {
            [key: string]: any;
        };
        location?: Object;
    };
    /** 子应用嵌套场景，父应用传递给子应用的数据 */
    inject: {
        idToSandboxMap: Map<String, SandboxCache>;
        appEventObjMap: Map<String, EventObj>;
        mainHostPath: string;
        fontStyleSheetContainer?: HTMLElement;
    };
    /** 激活子应用
     * 1、同步路由
     * 2、动态修改iframe的fetch
     * 3、准备shadow
     * 4、准备子应用注入
     */
    active(options: {
        url: string;
        sync?: boolean;
        prefix?: {
            [key: string]: string;
        };
        template?: string;
        el?: string | HTMLElement;
        props?: {
            [key: string]: any;
        };
        alive?: boolean;
        fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
        replace?: (code: string) => string;
    }): Promise<void>;
    requestIdleCallback(callback: any): number;
    /** 启动子应用
     * 1、运行js
     * 2、处理兼容样式
     */
    start(getExternalScripts: () => ScriptResultList): Promise<void>;
    /**
     * 框架主动发起mount，如果子应用是异步渲染实例，比如将生命周__WUJIE_MOUNT放到async函数内
     * 此时如果采用fiber模式渲染（主应用调用mount的时机也是异步不确定的），框架调用mount时可能
     * 子应用的__WUJIE_MOUNT还没有挂载到window，所以这里封装一个mount函数，当子应用是异步渲染
     * 实例时，子应用异步函数里面最后加上window.__WUJIE.mount()来主动调用
     */
    mount(): void;
    /** 保活模式和使用proxyLocation.href跳转链接都不应该销毁shadow */
    unmount(): Promise<void>;
    /** 销毁子应用 */
    destroy(): Promise<void>;
    /**
     * destroy 阶段清空 styleSheetElements，同时把节点从父节点 detach。
     *
     * 仅供 destroy 调用：unmount 阶段需要保留数组以便 rebuildStyleSheets 复用样式节点
     * （子应用 JS 模块只 init 一次，模块代码不会再次生成动态样式）。
     */
    clearStyleSheets(): void;
    /**
     * destroy 阶段清空 dynamicScriptElements，同时把残留的 <script> 节点从父节点 detach。
     * 仅供 destroy 调用，理由同 clearStyleSheets。
     */
    clearDynamicScripts(): void;
    /**
     * destroy 阶段清空 fontStyleSheetElements，同时把节点从父节点 detach。
     * 使用 WUJIE_APP_ID 标识属于当前子应用的 font 样式。
     */
    clearFontStyleSheets(): void;
    /**
     * unmount / destroy 阶段统一 disconnect 等待 href 赋值的 MutationObserver。
     * observer 在 href 命中或超时兜底时会自行 disconnect 并出队；
     * 这里兜底处理「子应用先于 href 赋值被卸载/销毁」的场景。
     */
    clearDeferredStyleObservers(): void;
    /**
     * 创建或获取 font 样式容器（挂载在最外层 document.head）
     * 用于存放子应用的 @font-face 样式，确保嵌套子应用也能正确应用字体
     */
    private createFontStyleSheetContainer;
    /** 当子应用再次激活后，只运行mount函数，样式需要重新恢复 */
    rebuildStyleSheets(): void;
    /**
     * 子应用样式打补丁
     * 1、兼容:root选择器样式到:host选择器上
     * 2、将@font-face定义到shadowRoot外部
     */
    patchCssRules(): void;
    /**
     * @param id 子应用的id，唯一标识
     * @param url 子应用的url，可以包含protocol、host、path、query、hash
     */
    constructor(options: {
        name: string;
        url: string;
        attrs: {
            [key: string]: any;
        };
        degradeAttrs: {
            [key: string]: any;
        };
        fiber: boolean;
        degrade: any;
        plugins: Array<plugin>;
        lifecycles: lifecycles;
        iframeAddEventListeners?: Array<string>;
        iframeOnEvents?: Array<string>;
    });
}
export {};
