import WuJie from "./sandbox";
import { ScriptObject } from "./template";
import { ScriptObjectLoader } from "./index";
declare global {
    interface Window {
        __POWERED_BY_WUJIE__?: boolean;
        __WUJIE_PUBLIC_PATH__: string;
        __WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__: typeof Document.prototype.querySelector;
        __WUJIE_RAW_DOCUMENT_CREATE_ELEMENT__: typeof Document.prototype.createElement;
        __WUJIE_RAW_DOCUMENT_CREATE_TEXT_NODE__: typeof Document.prototype.createTextNode;
        __WUJIE_RAW_DOCUMENT_HEAD__: typeof Document.prototype.head;
        __WUJIE_RAW_DOCUMENT_QUERY_SELECTOR_ALL__: typeof Document.prototype.querySelectorAll;
        __WUJIE_RAW_WINDOW__: Window;
        __WUJIE: WuJie;
        __WUJIE_INJECT: WuJie["inject"];
        __WUJIE_EVENTLISTENER__: Set<{
            listener: EventListenerOrEventListenerObject;
            type: string;
            options: any;
        }>;
        __WUJIE_MOUNT: () => void;
        __WUJIE_UNMOUNT: () => void | Promise<void>;
        __getWujieWindow__: (appId: string) => WindowProxy;
        Document: typeof Document;
        HTMLImageElement: typeof HTMLImageElement;
        Node: typeof Node;
        Element: typeof Element;
        HTMLElement: typeof HTMLElement;
        HTMLAnchorElement: typeof HTMLAnchorElement;
        HTMLSourceElement: typeof HTMLSourceElement;
        HTMLLinkElement: typeof HTMLLinkElement;
        HTMLScriptElement: typeof HTMLScriptElement;
        HTMLMediaElement: typeof HTMLMediaElement;
        EventTarget: typeof EventTarget;
        Event: typeof Event;
        ShadowRoot: typeof ShadowRoot;
        $wujie: {
            [key: string]: any;
        };
    }
    interface HTMLHeadElement {
        _cacheListeners: Map<string, EventListenerOrEventListenerObject[]>;
    }
    interface HTMLBodyElement {
        _cacheListeners: Map<string, EventListenerOrEventListenerObject[]>;
    }
    interface Document {
        createTreeWalker(root: Node, whatToShow?: number, filter?: NodeFilter | null, entityReferenceExpansion?: boolean): TreeWalker;
    }
}
/**
 * patch iframe window effect
 * @param iframeWindow
 */
export declare function patchWindowEffect(iframeWindow: Window): void;
/**
 * 让 targetWindow 上的 DOM 构造函数 instanceof 同时认可 peerWindow realm 的对象。
 * 非降级：targetWindow=子应用 JS iframe，peerWindow=主应用 window（DOM 在 shadowRoot）。
 * 降级：在 patchDegradeInstanceofAcrossRealms 中对渲染 iframe 与执行 iframe 双向调用。
 */
export declare function patchInstanceofAcrossRealms(targetWindow: Window, peerWindow?: Window): void;
/**
 * 降级模式：DOM 在渲染 iframe、JS 在执行 iframe，对两侧 window 双向 patch instanceof。
 * 需在 sandbox.document（渲染 document）就绪后调用，勿在 patchWindowEffect 阶段调用。
 */
export declare function patchDegradeInstanceofAcrossRealms(appWindow: Window, renderWindow: Window): void;
/**
 * 恢复节点的监听事件
 */
export declare function recoverEventListeners(rootElement: Element | ChildNode, iframeWindow: Window): void;
/**
 * 恢复根节点的监听事件
 */
export declare function recoverDocumentListeners(oldRootElement: Element | ChildNode, newRootElement: Element | ChildNode, iframeWindow: Window): void;
/**
 * 修复vue绑定事件e.timeStamp < attachedTimestamp 的情况
 */
export declare function patchEventTimeStamp(targetWindow: Window, iframeWindow: Window): void;
/**
 * patch document effect
 * @param iframeWindow
 */
export declare function patchDocumentEffect(iframeWindow: Window): void;
/**
 * 初始化 base 标签，供 document 内相对路径资源解析使用。
 * @param pathname 可选；降级渲染 iframe 的 location 为 about:blank，需传入 proxyLocation.pathname
 */
export declare function initBase(iframeWindow: Window, url: string, pathname?: string): void;
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
export declare function patchElementEffect(element: (HTMLElement | Node | ShadowRoot) & {
    _hasPatch?: boolean;
}, iframeWindow: Window): void;
/**
 * 子应用前进后退，同步路由到主应用
 * @param iframeWindow
 */
export declare function syncIframeUrlToWindow(iframeWindow: Window): void;
/**
 * iframe插入脚本
 * @param scriptResult script请求结果
 * @param iframeWindow
 * @param rawElement 原始的脚本
 */
export declare function insertScriptToIframe(scriptResult: ScriptObject | ScriptObjectLoader, iframeWindow: Window, rawElement?: HTMLScriptElement): any;
/**
 * 加载iframe替换子应用
 * @param src 地址
 * @param element
 * @param degradeAttrs
 */
export declare function renderIframeReplaceApp(src: string, element: HTMLElement, degradeAttrs?: {
    [key: string]: any;
}): void;
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
export declare function iframeGenerator(sandbox: WuJie, attrs: {
    [key: string]: any;
}, mainHostPath: string, appHostPath: string, appRoutePath: string): HTMLIFrameElement;
