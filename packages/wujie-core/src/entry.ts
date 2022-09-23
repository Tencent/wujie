import processTpl, {
  genLinkReplaceSymbol,
  getInlineStyleReplaceSymbol,
  ScriptObject,
  ScriptBaseObject,
  StyleObject,
} from "./template";
import { defaultGetPublicPath, getInlineCode, requestIdleCallback, error, compose, getCurUrl } from "./utils";
import { WUJIE_TIPS_NO_FETCH, WUJIE_TIPS_SCRIPT_ERROR_REQUESTED, WUJIE_TIPS_CSS_ERROR_REQUESTED } from "./constant";
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

const styleCache = {};
const scriptCache = {};
const embedHTMLCache = {};

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
    return { ...script, contentPromise };
  });
}

export default function importHTML(url: string, opts?: ImportEntryOpts): Promise<htmlParseResult> {
  const fetch = opts.fetch ?? defaultFetch;
  const fiber = opts.fiber ?? true;
  const { plugins, loadError } = opts;
  const htmlLoader = plugins ? compose(plugins.map((plugin) => plugin.htmlLoader)) : defaultGetTemplate;
  const jsExcludes = getEffectLoaders("jsExcludes", plugins);
  const cssExcludes = getEffectLoaders("cssExcludes", plugins);
  const jsIgnores = getEffectLoaders("jsIgnores", plugins);
  const cssIgnores = getEffectLoaders("cssIgnores", plugins);
  const getPublicPath = defaultGetPublicPath;

  const getHtmlParseResult = (url, htmlLoader) =>
    fetch(url)
      .then(
        (response) => response.text(),
        (e) => {
          loadError?.(url, e);
          return Promise.reject(e);
        }
      )
      .then((html) => {
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
    return getHtmlParseResult(url, htmlLoader);
    // 没有html-loader可以做缓存
  } else {
    return embedHTMLCache[url] || (embedHTMLCache[url] = getHtmlParseResult(url, htmlLoader));
  }
}
