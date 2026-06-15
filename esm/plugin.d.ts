import { plugin } from "./index";
interface loaderOption {
    plugins: Array<plugin>;
    replace: (code: string) => string;
}
/**
 * 获取柯里化 cssLoader
 */
export declare function getCssLoader({ plugins, replace }: loaderOption): (code: string, src: string, base: string) => string;
/**
 * 获取柯里化 jsLoader
 */
export declare function getJsLoader({ plugins, replace }: loaderOption): (code: string, src: string, base: string) => string;
/**
 * 获取预置插件
 */
type presetLoadersType = "cssBeforeLoaders" | "cssAfterLoaders" | "jsBeforeLoaders" | "jsAfterLoaders";
export declare function getPresetLoaders(loaderType: presetLoadersType, plugins: Array<plugin>): plugin[presetLoadersType];
/**
 * 获取影响插件
 */
type effectLoadersType = "jsExcludes" | "cssExcludes" | "jsIgnores" | "cssIgnores";
export declare function getEffectLoaders(loaderType: effectLoadersType, plugins: Array<plugin>): plugin[effectLoadersType];
export declare function isMatchUrl(url: string, effectLoaders: plugin[effectLoadersType]): boolean;
/**
 * 转换子应用css内的相对地址成绝对地址
 */
declare function cssRelativePathResolve(code: string, src: string, base: string): string;
declare const defaultPlugin: {
    cssLoader: typeof cssRelativePathResolve;
    cssBeforeLoaders: {
        content: string;
    }[];
};
export declare function getPlugins(plugins: Array<plugin>): Array<plugin>;
export default defaultPlugin;
