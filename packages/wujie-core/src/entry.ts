import processTpl, {
  genLinkReplaceSymbol,
  getInlineStyleReplaceSymbol,
  ScriptObject,
  ScriptBaseObject,
  StyleObject,
} from "./template";
import { defaultGetPublicPath, getInlineCode, requestIdleCallback, error, compose, getCurUrl } from "./utils";
import {
  WUJIE_TIPS_NO_FETCH,
  WUJIE_TIPS_SCRIPT_ERROR_REQUESTED,
  WUJIE_TIPS_CSS_ERROR_REQUESTED,
  WUJIE_TIPS_HTML_ERROR_REQUESTED,
} from "./constant";
import { getEffectLoaders, isMatchUrl } from "./plugin";
import Wujie from "./sandbox";
import { plugin, loadErrorHandler } from "./index";

export type ScriptResultList = (ScriptBaseObject & { contentPromise: Promise<string> })[];
export type StyleResultList = { src: string; contentPromise: Promise<string>; ignore?: boolean }[];

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

// 模块级资源缓存：导出仅供 clearAssetsCache 内部使用，外部代码勿直接 mutate
export const styleCache: Record<string, any> = {};
export const scriptCache: Record<string, any> = {};
export const embedHTMLCache: Record<string, any> = {};

/**
 * 清空资源缓存：不传 host 时全清；传单个/数组 host 时按 url 前缀清。
 * 用于热更新或多 host 子应用切换时主动失效，避免缓存命中已变更资源。
 */
export function clearAssetsCache(host?: string | string[]): void {
  const matchers = host == null ? null : Array.isArray(host) ? host : [host];
  const matchAndDelete = (cache: Record<string, any>) => {
    if (!matchers) {
      Object.keys(cache).forEach((key) => delete cache[key]);
      return;
    }
    Object.keys(cache).forEach((key) => {
      if (matchers.some((prefix) => key.startsWith(prefix))) {
        delete cache[key];
      }
    });
  };
  matchAndDelete(styleCache);
  matchAndDelete(scriptCache);
  matchAndDelete(embedHTMLCache);
}

if (!window.fetch) {
  error(WUJIE_TIPS_NO_FETCH);
  throw new Error();
}
const defaultFetch = window.fetch.bind(window);

function defaultGetTemplate(tpl) {
  return tpl;
}

/**
 * 处理css-loader
 */
export async function processCssLoader(
  sandbox: Wujie,
  template: string,
  getExternalStyleSheets: () => StyleResultList
): Promise<string> {
  const curUrl = getCurUrl(sandbox.proxyLocation);
  /** css-loader */
  const composeCssLoader = compose(sandbox.plugins.map((plugin) => plugin.cssLoader));
  const processedCssList: StyleResultList = getExternalStyleSheets().map(({ src, ignore, contentPromise }) => ({
    src,
    ignore,
    contentPromise: contentPromise.then((content) => composeCssLoader(content, src, curUrl)),
  }));
  const embedHTML = await getEmbedHTML(template, processedCssList);
  return sandbox.replace ? sandbox.replace(embedHTML) : embedHTML;
}

/**
 * convert external css link to inline style for performance optimization
 * @return embedHTML
 */
async function getEmbedHTML(template, styleResultList: StyleResultList): Promise<string> {
  let embedHTML = template;

  return Promise.all(
    styleResultList.map((styleResult, index) =>
      styleResult.contentPromise.then((content) => {
        if (styleResult.src) {
          embedHTML = embedHTML.replace(
            genLinkReplaceSymbol(styleResult.src),
            styleResult.ignore
              ? `<link href="${styleResult.src}" rel="stylesheet" type="text/css">`
              : `<style>/* ${styleResult.src} */${content}</style>`
          );
        } else if (content) {
          embedHTML = embedHTML.replace(
            getInlineStyleReplaceSymbol(index),
            `<style>/* inline-style-${index} */${content}</style>`
          );
        }
      })
    )
  ).then(() => embedHTML);
}

const isInlineCode = (code) => code.startsWith("<");

const fetchAssets = (
  src: string,
  cache: Object,
  fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>,
  cssFlag?: boolean,
  loadError?: loadErrorHandler
) =>
  cache[src] ||
  (cache[src] = fetch(src)
    .then((response) => {
      // usually browser treats 4xx and 5xx response of script loading as an error and will fire a script error event
      // https://stackoverflow.com/questions/5625420/what-http-headers-responses-trigger-the-onerror-handler-on-a-script-tag/5625603
      if (response.status >= 400) {
        cache[src] = null;
        if (cssFlag) {
          error(WUJIE_TIPS_CSS_ERROR_REQUESTED, { src, response });
          loadError?.(src, new Error(WUJIE_TIPS_CSS_ERROR_REQUESTED));
          return "";
        } else {
          error(WUJIE_TIPS_SCRIPT_ERROR_REQUESTED, { src, response });
          loadError?.(src, new Error(WUJIE_TIPS_SCRIPT_ERROR_REQUESTED));
          throw new Error(WUJIE_TIPS_SCRIPT_ERROR_REQUESTED);
        }
      }
      return response.text();
    })
    .catch((e) => {
      cache[src] = null;
      if (cssFlag) {
        error(WUJIE_TIPS_CSS_ERROR_REQUESTED, src);
        loadError?.(src, e);
        return "";
      } else {
        error(WUJIE_TIPS_SCRIPT_ERROR_REQUESTED, src);
        loadError?.(src, e);
        return "";
      }
    }));

// for prefetch
export function getExternalStyleSheets(
  styles: StyleObject[],
  fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response> = defaultFetch,
  loadError: loadErrorHandler
): StyleResultList {
  return styles.map(({ src, content, ignore }) => {
    // 内联
    if (content) {
      return { src: "", contentPromise: Promise.resolve(content) };
    } else if (isInlineCode(src)) {
      // if it is inline style
      return { src: "", contentPromise: Promise.resolve(getInlineCode(src)) };
    } else {
      // external styles
      return {
        src,
        ignore,
        contentPromise: ignore ? Promise.resolve("") : fetchAssets(src, styleCache, fetch, true, loadError),
      };
    }
  });
}

// for prefetch
export function getExternalScripts(
  scripts: ScriptObject[],
  fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response> = defaultFetch,
  loadError: loadErrorHandler,
  fiber: boolean
): ScriptResultList {
  // module should be requested in iframe
  return scripts.map((script) => {
    const { src, async, defer, module, ignore } = script;
    let contentPromise = null;
    // async
    if ((async || defer) && src && !module) {
      contentPromise = new Promise((resolve, reject) =>
        fiber
          ? requestIdleCallback(() => fetchAssets(src, scriptCache, fetch, false, loadError).then(resolve, reject))
          : fetchAssets(src, scriptCache, fetch, false, loadError).then(resolve, reject)
      );
      // module || ignore
    } else if ((module && src) || ignore) {
      contentPromise = Promise.resolve("");
      // inline
    } else if (!src) {
      contentPromise = Promise.resolve(script.content);
      // outline
    } else {
      contentPromise = fetchAssets(src, scriptCache, fetch, false, loadError);
    }
    // refer https://html.spec.whatwg.org/multipage/scripting.html#attr-script-defer
    if (module && !async) script.defer = true;
    return { ...script, contentPromise };
  });
}

export default function importHTML(params: {
  url: string;
  html?: string;
  opts: ImportEntryOpts;
}): Promise<htmlParseResult> {
  const { url, opts, html } = params;
  const fetch = opts.fetch ?? defaultFetch;
  const fiber = opts.fiber ?? true;
  const { plugins, loadError } = opts;
  const htmlLoader = plugins ? compose(plugins.map((plugin) => plugin.htmlLoader)) : defaultGetTemplate;
  const jsExcludes = getEffectLoaders("jsExcludes", plugins);
  const cssExcludes = getEffectLoaders("cssExcludes", plugins);
  const jsIgnores = getEffectLoaders("jsIgnores", plugins);
  const cssIgnores = getEffectLoaders("cssIgnores", plugins);
  const getPublicPath = defaultGetPublicPath;

  const getHtmlParseResult = (url, html, htmlLoader) =>
    (html
      ? Promise.resolve(html)
      : fetch(url)
          .then((response) => {
            if (response.status >= 400) {
              error(WUJIE_TIPS_HTML_ERROR_REQUESTED, { url, response });
              loadError?.(url, new Error(WUJIE_TIPS_HTML_ERROR_REQUESTED));
              return "";
            }
            return response.text();
          })
          .catch((e) => {
            embedHTMLCache[url] = null;
            loadError?.(url, e);
            return Promise.reject(e);
          })
    ).then((html) => {
      const assetPublicPath = getPublicPath(url);
      const { template, scripts, styles } = processTpl(htmlLoader(html), assetPublicPath);
      return {
        template: template,
        assetPublicPath,
        getExternalScripts: () =>
          getExternalScripts(
            scripts
              .filter((script) => !script.src || !isMatchUrl(script.src, jsExcludes))
              .map((script) => ({ ...script, ignore: script.src && isMatchUrl(script.src, jsIgnores) })),
            fetch,
            loadError,
            fiber
          ),
        getExternalStyleSheets: () =>
          getExternalStyleSheets(
            styles
              .filter((style) => !style.src || !isMatchUrl(style.src, cssExcludes))
              .map((style) => ({ ...style, ignore: style.src && isMatchUrl(style.src, cssIgnores) })),
            fetch,
            loadError
          ),
      };
    });

  if (opts?.plugins.some((plugin) => plugin.htmlLoader)) {
    return getHtmlParseResult(url, html, htmlLoader);
    // 没有html-loader可以做缓存
  } else {
    return embedHTMLCache[url] || (embedHTMLCache[url] = getHtmlParseResult(url, html, htmlLoader));
  }
}
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
export function getWujieWindow(appId: string): WindowProxy {
  try {
    const iframe = queryWujieIframe(appId);
    if (!iframe) {
      console.warn(`[wujie] Cannot find iframe for app ${appId}`);
      return window;
    }

    const contentWindow = iframe.contentWindow;
    if (!contentWindow) {
      console.warn(`[wujie] Cannot get contentWindow for app ${appId}`);
      return window;
    }

    // 非降级模式返回 proxy，降级模式直接返回 iframe.contentWindow
    const targetWindow = contentWindow.__WUJIE?.degrade ? contentWindow : contentWindow.__WUJIE?.proxy;
    return withInlineEventUnscopables(targetWindow);
  } catch (e) {
    console.warn("[wujie] Failed to get wujie window:", e);
    return window;
  }
}

/**
 * 内联事件 with(proxy) 作用域里需要“放行”、回落到外层原生 handler 作用域的标识符。
 * 例如 onclick="fn(event)"，原生 handler 形参提供 event，但 'event' 同时存在于
 * 子应用 window（Window.prototype 上的遗留访问器），若不处理会被 proxy 遮蔽成 undefined。
 */
const INLINE_EVENT_UNSCOPABLES: Record<string, boolean> = {
  event: true,
};

/**
 * 给 proxyWindow 包一层，仅拦截 Symbol.unscopables，其余转发给底层 proxy。
 * with(此对象){...} 时，对 INLINE_EVENT_UNSCOPABLES 中的名字不从 proxy 取值，
 * 而是回落到外层 handler 作用域（拿到原生 event 形参），其它名字（如子应用函数）照常经 proxy 解析。
 */
function withInlineEventUnscopables(proxyWindow: WindowProxy): WindowProxy {
  return new Proxy(proxyWindow, {
    get(target, p) {
      if (p === Symbol.unscopables) return INLINE_EVENT_UNSCOPABLES;
      // 不传 receiver，沿用底层 proxy 既有的取值与 this 绑定逻辑
      return Reflect.get(target, p);
    },
    has(target, p) {
      return Reflect.has(target, p);
    },
  }) as WindowProxy;
}

/**
 * 在当前 document 及其父级 document 链上查找子应用沙箱 iframe。
 * 兼容降级模式：内联事件运行在渲染 iframe 内，需向上到 parent.document 查找。
 */
function queryWujieIframe(appId: string): HTMLIFrameElement | null {
  const selector = `iframe[name="${appId}"]`;
  let win: Window = window;
  for (let i = 0; i < 10; i++) {
    try {
      const iframe = win.document?.querySelector(selector) as HTMLIFrameElement | null;
      if (iframe) return iframe;
    } catch (e) {
      // 跨域父级 document 访问失败，停止向上查找
      break;
    }
    if (!win.parent || win.parent === win) break;
    win = win.parent;
  }
  return null;
}

/**
 * 初始化全局辅助函数
 */
export function initInlineEventHelper(): void {
  if (typeof window !== "undefined" && !window.__getWujieWindow__) {
    window.__getWujieWindow__ = getWujieWindow;
  }
}
