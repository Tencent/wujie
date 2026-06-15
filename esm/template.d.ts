export type ScriptAttributes = {
    [key: string]: string | boolean;
};
/** 脚本对象 */
export interface ScriptBaseObject {
    /** 脚本地址，内联为空 */
    src?: string;
    /** 脚本是否为async执行 */
    async?: boolean;
    /** 脚本是否为defer执行 */
    defer?: boolean;
    /** 脚本是否为module模块 */
    module?: boolean;
    /** 脚本是否设置crossorigin */
    crossorigin?: boolean;
    /** 脚本crossorigin的类型 */
    crossoriginType?: "anonymous" | "use-credentials" | "";
    /** 脚本正则匹配属性 */
    attrs?: ScriptAttributes;
}
export type ScriptObject = ScriptBaseObject & {
    /** 内联script的代码 */
    content?: string;
    /** 忽略，子应用自行请求 */
    ignore?: boolean;
    /** 子应用加载完毕事件 */
    onload?: Function;
};
/** 样式对象 */
export interface StyleObject {
    /** 样式地址， 内联为空 */
    src?: string;
    /** 样式代码 */
    content?: string;
    /** 忽略，子应用自行请求 */
    ignore?: boolean;
}
export interface TemplateResult {
    template: string;
    scripts: ScriptObject[];
    styles: StyleObject[];
    entry: string | ScriptObject;
}
/**
 * 解析标签的属性
 * @param scriptOuterHTML script 标签的 outerHTML
 * @returns 返回一个对象，包含 script 标签的所有属性
 */
export declare function parseTagAttributes(TagOuterHTML: any): {};
export declare const genLinkReplaceSymbol: (linkHref: any, preloadOrPrefetch?: boolean) => string;
export declare const getInlineStyleReplaceSymbol: (index: any) => string;
export declare const genScriptReplaceSymbol: (scriptSrc: any, type?: string) => string;
export declare const inlineScriptReplaceSymbol = "<!-- inline scripts replaced by wujie -->";
export declare const genIgnoreAssetReplaceSymbol: (url: any) => string;
export declare const genModuleScriptReplaceSymbol: (scriptSrc: any, moduleSupport: any) => string;
/**
 * parse the script link from the template
 * 1. collect stylesheets
 * 2. use global eval to evaluate the inline scripts
 *    see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function#Difference_between_Function_constructor_and_function_declaration
 *    see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#Do_not_ever_use_eval!
 * @param tpl
 * @param baseURI
 * @stripStyles whether to strip the css links
 * @returns {{template: void | string | *, scripts: *[], entry: *}}
 */
export default function processTpl(tpl: String, baseURI: String, postProcessTemplate?: Function): TemplateResult;
