import Wujie from "./sandbox";
/**
 * 劫持处理样式元素的属性
 * @internal 仅出于可测性导出，外部不应直接调用
 */
export declare function patchStylesheetElement(stylesheetElement: HTMLStyleElement & {
    _hasPatchStyle?: boolean;
}, cssLoader: (code: string, url: string, base: string) => string, sandbox: Wujie, curUrl: string): void;
/**
 * 处理「先 appendChild(link) 后 setAttribute('href')」的延迟 href 场景。
 *
 * 通过 MutationObserver 监听 href 属性赋值，命中后走传入的 loadStyleSheet 完成加载。
 * 生命周期管理（避免内存泄漏）：
 *   1. 命中 / 超时 / 子应用已销毁 时立即 disconnect 并从 sandbox 出队；
 *   2. observer 登记到 sandbox.deferredStyleObservers，destroy 阶段统一兜底 disconnect；
 *   3. 回调内通过 wujieId 动态获取 sandbox，不捕获 sandbox/iframe，子应用销毁后闭包不再 pin 上下文。
 */
export declare function deferStyleSheetByHref(opts: {
    element: HTMLLinkElement;
    wujieId: string;
    iframeWindow: Window;
    loadStyleSheet: (href: string, element: HTMLLinkElement) => void;
}): void;
/**
 * 清空head和body的绑定的事件
 */
export declare function removeEventListener(element: HTMLHeadElement | HTMLBodyElement): void;
/**
 * patch head and body in render
 * intercept appendChild and insertBefore
 */
export declare function patchRenderEffect(render: ShadowRoot | Document, id: string, degrade: boolean): void;
