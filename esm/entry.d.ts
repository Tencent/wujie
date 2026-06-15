import { ScriptObject, ScriptBaseObject, StyleObject } from "./template";
import Wujie from "./sandbox";
import { plugin, loadErrorHandler } from "./index";
export type ScriptResultList = (ScriptBaseObject & {
    contentPromise: Promise<string>;
})[];
export type StyleResultList = {
    src: string;
    contentPromise: Promise<string>;
    ignore?: boolean;
}[];
interface htmlParseResult {
    template: string;
    assetPublicPath: string;
    getExternalScripts(): ScriptResultList;
    getExternalStyleSheets(): StyleResultList;
}
type ImportEntryOpts = {
    fetch?: typeof window.fetch;
    fiber?: boolean;
    plugins?: Array<plugin>;
    loadError?: loadErrorHandler;
};
export declare const styleCache: Record<string, any>;
export declare const scriptCache: Record<string, any>;
export declare const embedHTMLCache: Record<string, any>;
/**
 * 清空资源缓存：不传 host 时全清；传单个/数组 host 时按 url 前缀清。
 * 用于热更新或多 host 子应用切换时主动失效，避免缓存命中已变更资源。
 */
export declare function clearAssetsCache(host?: string | string[]): void;
/**
 * 处理css-loader
 */
export declare function processCssLoader(sandbox: Wujie, template: string, getExternalStyleSheets: () => StyleResultList): Promise<string>;
export declare function getExternalStyleSheets(styles: StyleObject[], fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>, loadError: loadErrorHandler): StyleResultList;
export declare function getExternalScripts(scripts: ScriptObject[], fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>, loadError: loadErrorHandler, fiber: boolean): ScriptResultList;
export default function importHTML(params: {
    url: string;
    html?: string;
    opts: ImportEntryOpts;
}): Promise<htmlParseResult>;
/**
 * 内联事件处理器辅助函数
 * 用于在 ShadowDOM 中动态获取子应用的 window 对象
 */
/**
 * 获取子应用的 window 对象
 * 用于内联事件处理器编译后的 with 语句
 *
 * 直接以 appId 作为入参（编译阶段烤进字符串字面量），避免运行时依赖
 * 被沙箱劫持的 element.getRootNode；通过 querySelector 实时查找 iframe，
 * 不持有任何闭包引用，规避内存泄漏。
 *
 * 沙箱 iframe（name=appId）始终挂在主应用 document 上。
 * - 非降级：内联事件运行在主应用 realm，document 即主应用 document，直接命中；
 * - 降级：内联事件运行在渲染 iframe 内，沙箱 iframe 在其 window.parent.document 上，
 *   故 document 找不到时逐级向上到 parent.document 查找。
 *
 * @param appId - 子应用 appId（iframe 的 name）
 * @returns 子应用的 proxyWindow，找不到时降级为主应用 window
 */
export declare function getWujieWindow(appId: string): WindowProxy;
/**
 * 初始化全局辅助函数
 */
export declare function initInlineEventHelper(): void;
export {};
