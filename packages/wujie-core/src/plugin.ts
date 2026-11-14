import { plugin, ScriptObjectLoader } from "./index";
import { StyleObject } from "./template";
import { compose, getAbsolutePath } from "./utils";

interface loaderOption {
  plugins: Array<plugin>;
  replace: (code: string) => string;
}

/**
 * 获取柯里化 cssLoader
 */
export function getCssLoader({ plugins, replace }: loaderOption) {
  return (code: string, src: string = "", base: string): string =>
    compose(plugins.map((plugin) => plugin.cssLoader))(replace ? replace(code) : code, src, base);
}

/**
 * 获取柯里化 jsLoader
 */
export function getJsLoader({ plugins, replace }: loaderOption) {
  return (code: string, src: string = "", base: string): string =>
    compose(plugins.map((plugin) => plugin.jsLoader))(replace ? replace(code) : code, src, base);
}

/**
 * 获取预置插件
 */
type presetLoadersType = "cssBeforeLoaders" | "cssAfterLoaders" | "jsBeforeLoaders" | "jsAfterLoaders";
export function getPresetLoaders(loaderType: presetLoadersType, plugins: Array<plugin>): plugin[presetLoadersType] {
  const loaders: (StyleObject | ScriptObjectLoader)[][] = plugins
    .map((plugin) => plugin[loaderType])
    .filter((loaders) => loaders?.length);
  const res = loaders.reduce((preLoaders, curLoaders) => preLoaders.concat(curLoaders), []);
  return loaderType === "cssBeforeLoaders" ? res.reverse() : res;
}

/**
 * 获取影响插件
 */
type effectLoadersType = "jsExcludes" | "cssExcludes" | "jsIgnores" | "cssIgnores";
export function getEffectLoaders(loaderType: effectLoadersType, plugins: Array<plugin>): plugin[effectLoadersType] {
  return plugins
    .map((plugin) => plugin[loaderType])
    .filter((loaders) => loaders?.length)
    .reduce((preLoaders, curLoaders) => preLoaders.concat(curLoaders), []);
}

// 判断 url 是否符合loader的规则
export function isMatchUrl(url: string, effectLoaders: plugin[effectLoadersType]): boolean {
  return effectLoaders.some((loader) => (typeof loader === "string" ? url === loader : loader.test(url)));
}

/**
 * 转换子应用css内的相对地址成绝对地址
 */
function cssRelativePathResolve(code: string, src: string, base: string) {
  const baseUrl = src ? getAbsolutePath(src, base) : base;
  /**
   * https://developer.mozilla.org/en-US/docs/Web/CSS/url
   *
   * 旧: const urlReg = /(url\((?!['"]?(?:data):)['"]?)([^'")]*)(['"]?\))/g;
   *
   * 这里修改一下正则匹配，先匹配url(xxx)内的xxx，需要兼容一下嵌套括号，
   * 再判断是否为base64，不再预先忽略data:前缀，防止base64的svg内仍有url被匹配
   *
   * eg:
   * background: url(data:image/svg+xml;charset=utf-8,<svg><path fill=url(#a)></path></svg>)
   * 以上样式会匹配出#a并进行修改，svg填充的路径就出问题了。
   *
   *  */
  const urlReg = /url\((['"]?)((?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*)(\1)\)/g;

  return code.replace(urlReg, (_m, pre, url, post) => {
    const base64Regx = /^data:/;
    const isBase64 = base64Regx.test(url);

    /** 如果匹配到data:前缀，则认为是base64文件，直接不进行路径替换吧 */
    if (isBase64) {
      return _m;
    }

    return `url(${pre}${getAbsolutePath(url, baseUrl)}${post})`;
  });
}

const defaultPlugin = {
  cssLoader: cssRelativePathResolve,
  // fix https://github.com/Tencent/wujie/issues/455
  cssBeforeLoaders: [{ content: "html {view-transition-name: none;}" }],
};

export function getPlugins(plugins: Array<plugin>): Array<plugin> {
  return Array.isArray(plugins) ? [defaultPlugin, ...plugins] : [defaultPlugin];
}

export default defaultPlugin;
