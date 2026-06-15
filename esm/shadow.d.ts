import Wujie from "./sandbox";
declare global {
    interface ShadowRoot {
        head: HTMLHeadElement;
        body: HTMLBodyElement;
    }
}
/**
 * 处理 wujie-app webComponent disconnect 时的销毁策略，按运行模式自动决定 destroy / unmount：
 *
 * - 保活模式（alive）：仅 unmount，保留 sandbox / iframe，再次进入直接 active 复用。
 * - 单例模式（非保活但做了生命周期改造，存在 __WUJIE_MOUNT）：仅 unmount，sandbox 复用，
 *   再次进入走 startApp 的 unmount → active → mount 时序。
 * - 重建模式（非保活且未做生命周期改造）：sandbox 不会被复用，且 unmount 对其而言基本是空操作
 *   （没有 mountFlag / __WUJIE_UNMOUNT），若仅 unmount 会导致 sandbox / iframe 长期驻留累积，
 *   故直接 destroy。
 */
export declare function handleWujieAppDisconnect(sandbox: Wujie | null | undefined): void;
/**
 * 定义 wujie webComponent，将shadow包裹并获得dom装载和卸载的生命周期
 */
export declare function defineWujieWebComponent(): void;
export declare function createWujieWebComponent(id: string): HTMLElement;
/**
 * 将准备好的内容插入容器
 */
export declare function renderElementToContainer(element: Element | ChildNode, selectorOrElement: string | HTMLElement): HTMLElement;
/**
 * 将降级的iframe挂在到容器上并进行初始化
 */
export declare function initRenderIframeAndContainer(id: string, parent: string | HTMLElement, degradeAttrs?: {
    [key: string]: any;
}): {
    iframe: HTMLIFrameElement;
    container: HTMLElement;
};
/**
 * 将template渲染到shadowRoot
 */
export declare function renderTemplateToShadowRoot(shadowRoot: ShadowRoot, iframeWindow: Window, template: string): Promise<void>;
export declare function createIframeContainer(id: string, degradeAttrs?: {
    [key: string]: any;
}): HTMLIFrameElement;
/**
 * 将template渲染到iframe
 */
export declare function renderTemplateToIframe(renderDocument: Document, iframeWindow: Window, template: string): Promise<void>;
/**
 * 清除Element所有节点
 */
export declare function clearChild(root: ShadowRoot | Node): void;
/**
 * 给容器添加loading
 */
export declare function addLoading(el: string | HTMLElement, loading: HTMLElement): void;
/**
 * 移除loading
 */
export declare function removeLoading(el: HTMLElement): void;
/**
 * 获取修复好的样式元素
 * 主要是针对对root样式和font-face样式
 */
export declare function getPatchStyleElements(rootStyleSheets: Array<CSSStyleSheet>): Array<HTMLStyleElement | null>;
