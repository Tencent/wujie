import { plugin } from "./index";
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
 * 获取有效的 cssBeforeLoaders
 */
export function getCssBeforeLoaders(plugins: Array<plugin>) {
  return plugins
    .map((plugin) => plugin.cssBeforeLoaders)
    .reduce((preLoaders, curLoaders) => preLoaders.concat(curLoaders), [])
    .filter((cssLoader) => typeof cssLoader === "object")
    .reverse();
}

/**
 * 获取有效的 cssAfterLoaders
 */
export function getCssAfterLoaders(plugins: Array<plugin>) {
  return plugins
    .map((plugin) => plugin.cssAfterLoaders)
    .reduce((preLoaders, curLoaders) => preLoaders.concat(curLoaders), [])
    .filter((afterLoader) => typeof afterLoader === "object");
}

/**
 * 获取有效的 jsBeforeLoaders
 */
export function getJsBeforeLoaders(plugins: Array<plugin>) {
  return plugins
    .map((plugin) => plugin.jsBeforeLoaders)
    .reduce((preLoaders, curLoaders) => preLoaders.concat(curLoaders), [])
    .filter((preLoader) => typeof preLoader === "object");
}

/**
 * 获取有效的 jsAfterLoaders
 */
export function getJsAfterLoaders(plugins: Array<plugin>) {
  return plugins
    .map((plugin) => plugin.jsAfterLoaders)
    .reduce((preLoaders, curLoaders) => preLoaders.concat(curLoaders), [])
    .filter((afterLoader) => typeof afterLoader === "object");
}

/**
 * 转换子应用css内的相对地址成绝对地址
 */
function cssRelativePathResolve(code: string, src: string, base: string) {
  const baseUrl = src ? getAbsolutePath(src, base) : base;
  const urlReg = /(url\()([^)]*)(\))/g;
  return code.replace(urlReg, (_m, pre, url, post) => {
    const urlString = url.replace(/["']/g, "");
    const absoluteUrl = getAbsolutePath(urlString, baseUrl);
    return pre + "'" + absoluteUrl + "'" + post;
  });
}

export default {
  cssLoader: cssRelativePathResolve,
};
