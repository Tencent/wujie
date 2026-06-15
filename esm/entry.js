import _defineProperty from "@babel/runtime/helpers/defineProperty";
import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _regeneratorRuntime from "@babel/runtime/regenerator";
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
import processTpl, { genLinkReplaceSymbol, getInlineStyleReplaceSymbol } from "./template";
import { defaultGetPublicPath, getInlineCode, requestIdleCallback, error, compose, getCurUrl } from "./utils";
import { WUJIE_TIPS_NO_FETCH, WUJIE_TIPS_SCRIPT_ERROR_REQUESTED, WUJIE_TIPS_CSS_ERROR_REQUESTED, WUJIE_TIPS_HTML_ERROR_REQUESTED } from "./constant";
import { getEffectLoaders, isMatchUrl } from "./plugin";
// 模块级资源缓存：导出仅供 clearAssetsCache 内部使用，外部代码勿直接 mutate
export var styleCache = {};
export var scriptCache = {};
export var embedHTMLCache = {};

/**
 * 清空资源缓存：不传 host 时全清；传单个/数组 host 时按 url 前缀清。
 * 用于热更新或多 host 子应用切换时主动失效，避免缓存命中已变更资源。
 */
export function clearAssetsCache(host) {
  var matchers = host == null ? null : Array.isArray(host) ? host : [host];
  var matchAndDelete = function matchAndDelete(cache) {
    if (!matchers) {
      Object.keys(cache).forEach(function (key) {
        return delete cache[key];
      });
      return;
    }
    Object.keys(cache).forEach(function (key) {
      if (matchers.some(function (prefix) {
        return key.startsWith(prefix);
      })) {
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
var defaultFetch = window.fetch.bind(window);
function defaultGetTemplate(tpl) {
  return tpl;
}

/**
 * 处理css-loader
 */
export function processCssLoader(_x, _x2, _x3) {
  return _processCssLoader.apply(this, arguments);
}

/**
 * convert external css link to inline style for performance optimization
 * @return embedHTML
 */
function _processCssLoader() {
  _processCssLoader = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime.mark(function _callee(sandbox, template, getExternalStyleSheets) {
    var curUrl, composeCssLoader, processedCssList, embedHTML;
    return _regeneratorRuntime.wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          curUrl = getCurUrl(sandbox.proxyLocation);
          /** css-loader */
          composeCssLoader = compose(sandbox.plugins.map(function (plugin) {
            return plugin.cssLoader;
          }));
          processedCssList = getExternalStyleSheets().map(function (_ref2) {
            var src = _ref2.src,
              ignore = _ref2.ignore,
              contentPromise = _ref2.contentPromise;
            return {
              src: src,
              ignore: ignore,
              contentPromise: contentPromise.then(function (content) {
                return composeCssLoader(content, src, curUrl);
              })
            };
          });
          _context.next = 1;
          return getEmbedHTML(template, processedCssList);
        case 1:
          embedHTML = _context.sent;
          return _context.abrupt("return", sandbox.replace ? sandbox.replace(embedHTML) : embedHTML);
        case 2:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return _processCssLoader.apply(this, arguments);
}
function getEmbedHTML(_x4, _x5) {
  return _getEmbedHTML.apply(this, arguments);
}
function _getEmbedHTML() {
  _getEmbedHTML = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime.mark(function _callee2(template, styleResultList) {
    var embedHTML;
    return _regeneratorRuntime.wrap(function (_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          embedHTML = template;
          return _context2.abrupt("return", Promise.all(styleResultList.map(function (styleResult, index) {
            return styleResult.contentPromise.then(function (content) {
              if (styleResult.src) {
                embedHTML = embedHTML.replace(genLinkReplaceSymbol(styleResult.src), styleResult.ignore ? "<link href=\"".concat(styleResult.src, "\" rel=\"stylesheet\" type=\"text/css\">") : "<style>/* ".concat(styleResult.src, " */").concat(content, "</style>"));
              } else if (content) {
                embedHTML = embedHTML.replace(getInlineStyleReplaceSymbol(index), "<style>/* inline-style-".concat(index, " */").concat(content, "</style>"));
              }
            });
          })).then(function () {
            return embedHTML;
          }));
        case 1:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return _getEmbedHTML.apply(this, arguments);
}
var isInlineCode = function isInlineCode(code) {
  return code.startsWith("<");
};
var fetchAssets = function fetchAssets(src, cache, fetch, cssFlag, loadError) {
  return cache[src] || (cache[src] = fetch(src).then(function (response) {
    // usually browser treats 4xx and 5xx response of script loading as an error and will fire a script error event
    // https://stackoverflow.com/questions/5625420/what-http-headers-responses-trigger-the-onerror-handler-on-a-script-tag/5625603
    if (response.status >= 400) {
      cache[src] = null;
      if (cssFlag) {
        error(WUJIE_TIPS_CSS_ERROR_REQUESTED, {
          src: src,
          response: response
        });
        loadError === null || loadError === void 0 || loadError(src, new Error(WUJIE_TIPS_CSS_ERROR_REQUESTED));
        return "";
      } else {
        error(WUJIE_TIPS_SCRIPT_ERROR_REQUESTED, {
          src: src,
          response: response
        });
        loadError === null || loadError === void 0 || loadError(src, new Error(WUJIE_TIPS_SCRIPT_ERROR_REQUESTED));
        throw new Error(WUJIE_TIPS_SCRIPT_ERROR_REQUESTED);
      }
    }
    return response.text();
  })["catch"](function (e) {
    cache[src] = null;
    if (cssFlag) {
      error(WUJIE_TIPS_CSS_ERROR_REQUESTED, src);
      loadError === null || loadError === void 0 || loadError(src, e);
      return "";
    } else {
      error(WUJIE_TIPS_SCRIPT_ERROR_REQUESTED, src);
      loadError === null || loadError === void 0 || loadError(src, e);
      return "";
    }
  }));
};

// for prefetch
function _getExternalStyleSheets(styles) {
  var fetch = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultFetch;
  var loadError = arguments.length > 2 ? arguments[2] : undefined;
  return styles.map(function (_ref) {
    var src = _ref.src,
      content = _ref.content,
      ignore = _ref.ignore;
    // 内联
    if (content) {
      return {
        src: "",
        contentPromise: Promise.resolve(content)
      };
    } else if (isInlineCode(src)) {
      // if it is inline style
      return {
        src: "",
        contentPromise: Promise.resolve(getInlineCode(src))
      };
    } else {
      // external styles
      return {
        src: src,
        ignore: ignore,
        contentPromise: ignore ? Promise.resolve("") : fetchAssets(src, styleCache, fetch, true, loadError)
      };
    }
  });
}

// for prefetch
export { _getExternalStyleSheets as getExternalStyleSheets };
function _getExternalScripts(scripts) {
  var fetch = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultFetch;
  var loadError = arguments.length > 2 ? arguments[2] : undefined;
  var fiber = arguments.length > 3 ? arguments[3] : undefined;
  // module should be requested in iframe
  return scripts.map(function (script) {
    var src = script.src,
      async = script.async,
      defer = script.defer,
      module = script.module,
      ignore = script.ignore;
    var contentPromise = null;
    // async
    if ((async || defer) && src && !module) {
      contentPromise = new Promise(function (resolve, reject) {
        return fiber ? requestIdleCallback(function () {
          return fetchAssets(src, scriptCache, fetch, false, loadError).then(resolve, reject);
        }) : fetchAssets(src, scriptCache, fetch, false, loadError).then(resolve, reject);
      });
      // module || ignore
    } else if (module && src || ignore) {
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
    return _objectSpread(_objectSpread({}, script), {}, {
      contentPromise: contentPromise
    });
  });
}
export { _getExternalScripts as getExternalScripts };
export default function importHTML(params) {
  var _opts$fetch, _opts$fiber;
  var url = params.url,
    opts = params.opts,
    html = params.html;
  var fetch = (_opts$fetch = opts.fetch) !== null && _opts$fetch !== void 0 ? _opts$fetch : defaultFetch;
  var fiber = (_opts$fiber = opts.fiber) !== null && _opts$fiber !== void 0 ? _opts$fiber : true;
  var plugins = opts.plugins,
    loadError = opts.loadError;
  var htmlLoader = plugins ? compose(plugins.map(function (plugin) {
    return plugin.htmlLoader;
  })) : defaultGetTemplate;
  var jsExcludes = getEffectLoaders("jsExcludes", plugins);
  var cssExcludes = getEffectLoaders("cssExcludes", plugins);
  var jsIgnores = getEffectLoaders("jsIgnores", plugins);
  var cssIgnores = getEffectLoaders("cssIgnores", plugins);
  var getPublicPath = defaultGetPublicPath;
  var getHtmlParseResult = function getHtmlParseResult(url, html, htmlLoader) {
    return (html ? Promise.resolve(html) : fetch(url).then(function (response) {
      if (response.status >= 400) {
        error(WUJIE_TIPS_HTML_ERROR_REQUESTED, {
          url: url,
          response: response
        });
        loadError === null || loadError === void 0 || loadError(url, new Error(WUJIE_TIPS_HTML_ERROR_REQUESTED));
        return "";
      }
      return response.text();
    })["catch"](function (e) {
      embedHTMLCache[url] = null;
      loadError === null || loadError === void 0 || loadError(url, e);
      return Promise.reject(e);
    })).then(function (html) {
      var assetPublicPath = getPublicPath(url);
      var _processTpl = processTpl(htmlLoader(html), assetPublicPath),
        template = _processTpl.template,
        scripts = _processTpl.scripts,
        styles = _processTpl.styles;
      return {
        template: template,
        assetPublicPath: assetPublicPath,
        getExternalScripts: function getExternalScripts() {
          return _getExternalScripts(scripts.filter(function (script) {
            return !script.src || !isMatchUrl(script.src, jsExcludes);
          }).map(function (script) {
            return _objectSpread(_objectSpread({}, script), {}, {
              ignore: script.src && isMatchUrl(script.src, jsIgnores)
            });
          }), fetch, loadError, fiber);
        },
        getExternalStyleSheets: function getExternalStyleSheets() {
          return _getExternalStyleSheets(styles.filter(function (style) {
            return !style.src || !isMatchUrl(style.src, cssExcludes);
          }).map(function (style) {
            return _objectSpread(_objectSpread({}, style), {}, {
              ignore: style.src && isMatchUrl(style.src, cssIgnores)
            });
          }), fetch, loadError);
        }
      };
    });
  };
  if (opts !== null && opts !== void 0 && opts.plugins.some(function (plugin) {
    return plugin.htmlLoader;
  })) {
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
export function getWujieWindow(appId) {
  try {
    var _contentWindow$__WUJI, _contentWindow$__WUJI2;
    var iframe = queryWujieIframe(appId);
    if (!iframe) {
      console.warn("[wujie] Cannot find iframe for app ".concat(appId));
      return window;
    }
    var contentWindow = iframe.contentWindow;
    if (!contentWindow) {
      console.warn("[wujie] Cannot get contentWindow for app ".concat(appId));
      return window;
    }

    // 非降级模式返回 proxy，降级模式直接返回 iframe.contentWindow
    var targetWindow = (_contentWindow$__WUJI = contentWindow.__WUJIE) !== null && _contentWindow$__WUJI !== void 0 && _contentWindow$__WUJI.degrade ? contentWindow : (_contentWindow$__WUJI2 = contentWindow.__WUJIE) === null || _contentWindow$__WUJI2 === void 0 ? void 0 : _contentWindow$__WUJI2.proxy;
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
var INLINE_EVENT_UNSCOPABLES = {
  event: true
};

/**
 * 给 proxyWindow 包一层，仅拦截 Symbol.unscopables，其余转发给底层 proxy。
 * with(此对象){...} 时，对 INLINE_EVENT_UNSCOPABLES 中的名字不从 proxy 取值，
 * 而是回落到外层 handler 作用域（拿到原生 event 形参），其它名字（如子应用函数）照常经 proxy 解析。
 */
function withInlineEventUnscopables(proxyWindow) {
  return new Proxy(proxyWindow, {
    get: function get(target, p) {
      if (p === Symbol.unscopables) return INLINE_EVENT_UNSCOPABLES;
      // 不传 receiver，沿用底层 proxy 既有的取值与 this 绑定逻辑
      return Reflect.get(target, p);
    },
    has: function has(target, p) {
      return Reflect.has(target, p);
    }
  });
}

/**
 * 在当前 document 及其父级 document 链上查找子应用沙箱 iframe。
 * 兼容降级模式：内联事件运行在渲染 iframe 内，需向上到 parent.document 查找。
 */
function queryWujieIframe(appId) {
  var selector = "iframe[name=\"".concat(appId, "\"]");
  var win = window;
  for (var i = 0; i < 10; i++) {
    try {
      var _win$document;
      var iframe = (_win$document = win.document) === null || _win$document === void 0 ? void 0 : _win$document.querySelector(selector);
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
export function initInlineEventHelper() {
  if (typeof window !== "undefined" && !window.__getWujieWindow__) {
    window.__getWujieWindow__ = getWujieWindow;
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwcm9jZXNzVHBsIiwiZ2VuTGlua1JlcGxhY2VTeW1ib2wiLCJnZXRJbmxpbmVTdHlsZVJlcGxhY2VTeW1ib2wiLCJkZWZhdWx0R2V0UHVibGljUGF0aCIsImdldElubGluZUNvZGUiLCJyZXF1ZXN0SWRsZUNhbGxiYWNrIiwiZXJyb3IiLCJjb21wb3NlIiwiZ2V0Q3VyVXJsIiwiV1VKSUVfVElQU19OT19GRVRDSCIsIldVSklFX1RJUFNfU0NSSVBUX0VSUk9SX1JFUVVFU1RFRCIsIldVSklFX1RJUFNfQ1NTX0VSUk9SX1JFUVVFU1RFRCIsIldVSklFX1RJUFNfSFRNTF9FUlJPUl9SRVFVRVNURUQiLCJnZXRFZmZlY3RMb2FkZXJzIiwiaXNNYXRjaFVybCIsInN0eWxlQ2FjaGUiLCJzY3JpcHRDYWNoZSIsImVtYmVkSFRNTENhY2hlIiwiY2xlYXJBc3NldHNDYWNoZSIsImhvc3QiLCJtYXRjaGVycyIsIkFycmF5IiwiaXNBcnJheSIsIm1hdGNoQW5kRGVsZXRlIiwiY2FjaGUiLCJPYmplY3QiLCJrZXlzIiwiZm9yRWFjaCIsImtleSIsInNvbWUiLCJwcmVmaXgiLCJzdGFydHNXaXRoIiwid2luZG93IiwiZmV0Y2giLCJFcnJvciIsImRlZmF1bHRGZXRjaCIsImJpbmQiLCJkZWZhdWx0R2V0VGVtcGxhdGUiLCJ0cGwiLCJwcm9jZXNzQ3NzTG9hZGVyIiwiX3giLCJfeDIiLCJfeDMiLCJfcHJvY2Vzc0Nzc0xvYWRlciIsImFwcGx5IiwiYXJndW1lbnRzIiwiX2FzeW5jVG9HZW5lcmF0b3IiLCJfcmVnZW5lcmF0b3JSdW50aW1lIiwibWFyayIsIl9jYWxsZWUiLCJzYW5kYm94IiwidGVtcGxhdGUiLCJnZXRFeHRlcm5hbFN0eWxlU2hlZXRzIiwiY3VyVXJsIiwiY29tcG9zZUNzc0xvYWRlciIsInByb2Nlc3NlZENzc0xpc3QiLCJlbWJlZEhUTUwiLCJ3cmFwIiwiX2NvbnRleHQiLCJwcmV2IiwibmV4dCIsInByb3h5TG9jYXRpb24iLCJwbHVnaW5zIiwibWFwIiwicGx1Z2luIiwiY3NzTG9hZGVyIiwiX3JlZjIiLCJzcmMiLCJpZ25vcmUiLCJjb250ZW50UHJvbWlzZSIsInRoZW4iLCJjb250ZW50IiwiZ2V0RW1iZWRIVE1MIiwic2VudCIsImFicnVwdCIsInJlcGxhY2UiLCJzdG9wIiwiX3g0IiwiX3g1IiwiX2dldEVtYmVkSFRNTCIsIl9jYWxsZWUyIiwic3R5bGVSZXN1bHRMaXN0IiwiX2NvbnRleHQyIiwiUHJvbWlzZSIsImFsbCIsInN0eWxlUmVzdWx0IiwiaW5kZXgiLCJjb25jYXQiLCJpc0lubGluZUNvZGUiLCJjb2RlIiwiZmV0Y2hBc3NldHMiLCJjc3NGbGFnIiwibG9hZEVycm9yIiwicmVzcG9uc2UiLCJzdGF0dXMiLCJ0ZXh0IiwiZSIsInN0eWxlcyIsImxlbmd0aCIsInVuZGVmaW5lZCIsIl9yZWYiLCJyZXNvbHZlIiwiX2dldEV4dGVybmFsU3R5bGVTaGVldHMiLCJnZXRFeHRlcm5hbFNjcmlwdHMiLCJzY3JpcHRzIiwiZmliZXIiLCJzY3JpcHQiLCJhc3luYyIsImRlZmVyIiwibW9kdWxlIiwicmVqZWN0IiwiX29iamVjdFNwcmVhZCIsIl9nZXRFeHRlcm5hbFNjcmlwdHMiLCJpbXBvcnRIVE1MIiwicGFyYW1zIiwiX29wdHMkZmV0Y2giLCJfb3B0cyRmaWJlciIsInVybCIsIm9wdHMiLCJodG1sIiwiaHRtbExvYWRlciIsImpzRXhjbHVkZXMiLCJjc3NFeGNsdWRlcyIsImpzSWdub3JlcyIsImNzc0lnbm9yZXMiLCJnZXRQdWJsaWNQYXRoIiwiZ2V0SHRtbFBhcnNlUmVzdWx0IiwiYXNzZXRQdWJsaWNQYXRoIiwiX3Byb2Nlc3NUcGwiLCJmaWx0ZXIiLCJzdHlsZSIsImdldFd1amllV2luZG93IiwiYXBwSWQiLCJfY29udGVudFdpbmRvdyRfX1dVSkkiLCJfY29udGVudFdpbmRvdyRfX1dVSkkyIiwiaWZyYW1lIiwicXVlcnlXdWppZUlmcmFtZSIsImNvbnNvbGUiLCJ3YXJuIiwiY29udGVudFdpbmRvdyIsInRhcmdldFdpbmRvdyIsIl9fV1VKSUUiLCJkZWdyYWRlIiwicHJveHkiLCJ3aXRoSW5saW5lRXZlbnRVbnNjb3BhYmxlcyIsIklOTElORV9FVkVOVF9VTlNDT1BBQkxFUyIsImV2ZW50IiwicHJveHlXaW5kb3ciLCJQcm94eSIsImdldCIsInRhcmdldCIsInAiLCJTeW1ib2wiLCJ1bnNjb3BhYmxlcyIsIlJlZmxlY3QiLCJoYXMiLCJzZWxlY3RvciIsIndpbiIsImkiLCJfd2luJGRvY3VtZW50IiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yIiwicGFyZW50IiwiaW5pdElubGluZUV2ZW50SGVscGVyIiwiX19nZXRXdWppZVdpbmRvd19fIl0sInNvdXJjZXMiOlsiLi4vc3JjL2VudHJ5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwcm9jZXNzVHBsLCB7XG4gIGdlbkxpbmtSZXBsYWNlU3ltYm9sLFxuICBnZXRJbmxpbmVTdHlsZVJlcGxhY2VTeW1ib2wsXG4gIFNjcmlwdE9iamVjdCxcbiAgU2NyaXB0QmFzZU9iamVjdCxcbiAgU3R5bGVPYmplY3QsXG59IGZyb20gXCIuL3RlbXBsYXRlXCI7XG5pbXBvcnQgeyBkZWZhdWx0R2V0UHVibGljUGF0aCwgZ2V0SW5saW5lQ29kZSwgcmVxdWVzdElkbGVDYWxsYmFjaywgZXJyb3IsIGNvbXBvc2UsIGdldEN1clVybCB9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQge1xuICBXVUpJRV9USVBTX05PX0ZFVENILFxuICBXVUpJRV9USVBTX1NDUklQVF9FUlJPUl9SRVFVRVNURUQsXG4gIFdVSklFX1RJUFNfQ1NTX0VSUk9SX1JFUVVFU1RFRCxcbiAgV1VKSUVfVElQU19IVE1MX0VSUk9SX1JFUVVFU1RFRCxcbn0gZnJvbSBcIi4vY29uc3RhbnRcIjtcbmltcG9ydCB7IGdldEVmZmVjdExvYWRlcnMsIGlzTWF0Y2hVcmwgfSBmcm9tIFwiLi9wbHVnaW5cIjtcbmltcG9ydCBXdWppZSBmcm9tIFwiLi9zYW5kYm94XCI7XG5pbXBvcnQgeyBwbHVnaW4sIGxvYWRFcnJvckhhbmRsZXIgfSBmcm9tIFwiLi9pbmRleFwiO1xuXG5leHBvcnQgdHlwZSBTY3JpcHRSZXN1bHRMaXN0ID0gKFNjcmlwdEJhc2VPYmplY3QgJiB7IGNvbnRlbnRQcm9taXNlOiBQcm9taXNlPHN0cmluZz4gfSlbXTtcbmV4cG9ydCB0eXBlIFN0eWxlUmVzdWx0TGlzdCA9IHsgc3JjOiBzdHJpbmc7IGNvbnRlbnRQcm9taXNlOiBQcm9taXNlPHN0cmluZz47IGlnbm9yZT86IGJvb2xlYW4gfVtdO1xuXG5pbnRlcmZhY2UgaHRtbFBhcnNlUmVzdWx0IHtcbiAgdGVtcGxhdGU6IHN0cmluZztcblxuICBhc3NldFB1YmxpY1BhdGg6IHN0cmluZztcblxuICBnZXRFeHRlcm5hbFNjcmlwdHMoKTogU2NyaXB0UmVzdWx0TGlzdDtcblxuICBnZXRFeHRlcm5hbFN0eWxlU2hlZXRzKCk6IFN0eWxlUmVzdWx0TGlzdDtcbn1cblxudHlwZSBJbXBvcnRFbnRyeU9wdHMgPSB7XG4gIGZldGNoPzogdHlwZW9mIHdpbmRvdy5mZXRjaDtcbiAgZmliZXI/OiBib29sZWFuO1xuICBwbHVnaW5zPzogQXJyYXk8cGx1Z2luPjtcbiAgbG9hZEVycm9yPzogbG9hZEVycm9ySGFuZGxlcjtcbn07XG5cbi8vIOaooeWdl+e6p+i1hOa6kOe8k+WtmO+8muWvvOWHuuS7heS+myBjbGVhckFzc2V0c0NhY2hlIOWGhemDqOS9v+eUqO+8jOWklumDqOS7o+eggeWLv+ebtOaOpSBtdXRhdGVcbmV4cG9ydCBjb25zdCBzdHlsZUNhY2hlOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XG5leHBvcnQgY29uc3Qgc2NyaXB0Q2FjaGU6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbmV4cG9ydCBjb25zdCBlbWJlZEhUTUxDYWNoZTogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuXG4vKipcbiAqIOa4heepuui1hOa6kOe8k+WtmO+8muS4jeS8oCBob3N0IOaXtuWFqOa4he+8m+S8oOWNleS4qi/mlbDnu4QgaG9zdCDml7bmjIkgdXJsIOWJjee8gOa4heOAglxuICog55So5LqO54Ot5pu05paw5oiW5aSaIGhvc3Qg5a2Q5bqU55So5YiH5o2i5pe25Li75Yqo5aSx5pWI77yM6YG/5YWN57yT5a2Y5ZG95Lit5bey5Y+Y5pu06LWE5rqQ44CCXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhckFzc2V0c0NhY2hlKGhvc3Q/OiBzdHJpbmcgfCBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCBtYXRjaGVycyA9IGhvc3QgPT0gbnVsbCA/IG51bGwgOiBBcnJheS5pc0FycmF5KGhvc3QpID8gaG9zdCA6IFtob3N0XTtcbiAgY29uc3QgbWF0Y2hBbmREZWxldGUgPSAoY2FjaGU6IFJlY29yZDxzdHJpbmcsIGFueT4pID0+IHtcbiAgICBpZiAoIW1hdGNoZXJzKSB7XG4gICAgICBPYmplY3Qua2V5cyhjYWNoZSkuZm9yRWFjaCgoa2V5KSA9PiBkZWxldGUgY2FjaGVba2V5XSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIE9iamVjdC5rZXlzKGNhY2hlKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGlmIChtYXRjaGVycy5zb21lKChwcmVmaXgpID0+IGtleS5zdGFydHNXaXRoKHByZWZpeCkpKSB7XG4gICAgICAgIGRlbGV0ZSBjYWNoZVtrZXldO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuICBtYXRjaEFuZERlbGV0ZShzdHlsZUNhY2hlKTtcbiAgbWF0Y2hBbmREZWxldGUoc2NyaXB0Q2FjaGUpO1xuICBtYXRjaEFuZERlbGV0ZShlbWJlZEhUTUxDYWNoZSk7XG59XG5cbmlmICghd2luZG93LmZldGNoKSB7XG4gIGVycm9yKFdVSklFX1RJUFNfTk9fRkVUQ0gpO1xuICB0aHJvdyBuZXcgRXJyb3IoKTtcbn1cbmNvbnN0IGRlZmF1bHRGZXRjaCA9IHdpbmRvdy5mZXRjaC5iaW5kKHdpbmRvdyk7XG5cbmZ1bmN0aW9uIGRlZmF1bHRHZXRUZW1wbGF0ZSh0cGwpIHtcbiAgcmV0dXJuIHRwbDtcbn1cblxuLyoqXG4gKiDlpITnkIZjc3MtbG9hZGVyXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwcm9jZXNzQ3NzTG9hZGVyKFxuICBzYW5kYm94OiBXdWppZSxcbiAgdGVtcGxhdGU6IHN0cmluZyxcbiAgZ2V0RXh0ZXJuYWxTdHlsZVNoZWV0czogKCkgPT4gU3R5bGVSZXN1bHRMaXN0XG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBjdXJVcmwgPSBnZXRDdXJVcmwoc2FuZGJveC5wcm94eUxvY2F0aW9uKTtcbiAgLyoqIGNzcy1sb2FkZXIgKi9cbiAgY29uc3QgY29tcG9zZUNzc0xvYWRlciA9IGNvbXBvc2Uoc2FuZGJveC5wbHVnaW5zLm1hcCgocGx1Z2luKSA9PiBwbHVnaW4uY3NzTG9hZGVyKSk7XG4gIGNvbnN0IHByb2Nlc3NlZENzc0xpc3Q6IFN0eWxlUmVzdWx0TGlzdCA9IGdldEV4dGVybmFsU3R5bGVTaGVldHMoKS5tYXAoKHsgc3JjLCBpZ25vcmUsIGNvbnRlbnRQcm9taXNlIH0pID0+ICh7XG4gICAgc3JjLFxuICAgIGlnbm9yZSxcbiAgICBjb250ZW50UHJvbWlzZTogY29udGVudFByb21pc2UudGhlbigoY29udGVudCkgPT4gY29tcG9zZUNzc0xvYWRlcihjb250ZW50LCBzcmMsIGN1clVybCkpLFxuICB9KSk7XG4gIGNvbnN0IGVtYmVkSFRNTCA9IGF3YWl0IGdldEVtYmVkSFRNTCh0ZW1wbGF0ZSwgcHJvY2Vzc2VkQ3NzTGlzdCk7XG4gIHJldHVybiBzYW5kYm94LnJlcGxhY2UgPyBzYW5kYm94LnJlcGxhY2UoZW1iZWRIVE1MKSA6IGVtYmVkSFRNTDtcbn1cblxuLyoqXG4gKiBjb252ZXJ0IGV4dGVybmFsIGNzcyBsaW5rIHRvIGlubGluZSBzdHlsZSBmb3IgcGVyZm9ybWFuY2Ugb3B0aW1pemF0aW9uXG4gKiBAcmV0dXJuIGVtYmVkSFRNTFxuICovXG5hc3luYyBmdW5jdGlvbiBnZXRFbWJlZEhUTUwodGVtcGxhdGUsIHN0eWxlUmVzdWx0TGlzdDogU3R5bGVSZXN1bHRMaXN0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgbGV0IGVtYmVkSFRNTCA9IHRlbXBsYXRlO1xuXG4gIHJldHVybiBQcm9taXNlLmFsbChcbiAgICBzdHlsZVJlc3VsdExpc3QubWFwKChzdHlsZVJlc3VsdCwgaW5kZXgpID0+XG4gICAgICBzdHlsZVJlc3VsdC5jb250ZW50UHJvbWlzZS50aGVuKChjb250ZW50KSA9PiB7XG4gICAgICAgIGlmIChzdHlsZVJlc3VsdC5zcmMpIHtcbiAgICAgICAgICBlbWJlZEhUTUwgPSBlbWJlZEhUTUwucmVwbGFjZShcbiAgICAgICAgICAgIGdlbkxpbmtSZXBsYWNlU3ltYm9sKHN0eWxlUmVzdWx0LnNyYyksXG4gICAgICAgICAgICBzdHlsZVJlc3VsdC5pZ25vcmVcbiAgICAgICAgICAgICAgPyBgPGxpbmsgaHJlZj1cIiR7c3R5bGVSZXN1bHQuc3JjfVwiIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIj5gXG4gICAgICAgICAgICAgIDogYDxzdHlsZT4vKiAke3N0eWxlUmVzdWx0LnNyY30gKi8ke2NvbnRlbnR9PC9zdHlsZT5gXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIGlmIChjb250ZW50KSB7XG4gICAgICAgICAgZW1iZWRIVE1MID0gZW1iZWRIVE1MLnJlcGxhY2UoXG4gICAgICAgICAgICBnZXRJbmxpbmVTdHlsZVJlcGxhY2VTeW1ib2woaW5kZXgpLFxuICAgICAgICAgICAgYDxzdHlsZT4vKiBpbmxpbmUtc3R5bGUtJHtpbmRleH0gKi8ke2NvbnRlbnR9PC9zdHlsZT5gXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICApXG4gICkudGhlbigoKSA9PiBlbWJlZEhUTUwpO1xufVxuXG5jb25zdCBpc0lubGluZUNvZGUgPSAoY29kZSkgPT4gY29kZS5zdGFydHNXaXRoKFwiPFwiKTtcblxuY29uc3QgZmV0Y2hBc3NldHMgPSAoXG4gIHNyYzogc3RyaW5nLFxuICBjYWNoZTogT2JqZWN0LFxuICBmZXRjaDogKGlucHV0OiBSZXF1ZXN0SW5mbywgaW5pdD86IFJlcXVlc3RJbml0KSA9PiBQcm9taXNlPFJlc3BvbnNlPixcbiAgY3NzRmxhZz86IGJvb2xlYW4sXG4gIGxvYWRFcnJvcj86IGxvYWRFcnJvckhhbmRsZXJcbikgPT5cbiAgY2FjaGVbc3JjXSB8fFxuICAoY2FjaGVbc3JjXSA9IGZldGNoKHNyYylcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIC8vIHVzdWFsbHkgYnJvd3NlciB0cmVhdHMgNHh4IGFuZCA1eHggcmVzcG9uc2Ugb2Ygc2NyaXB0IGxvYWRpbmcgYXMgYW4gZXJyb3IgYW5kIHdpbGwgZmlyZSBhIHNjcmlwdCBlcnJvciBldmVudFxuICAgICAgLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTYyNTQyMC93aGF0LWh0dHAtaGVhZGVycy1yZXNwb25zZXMtdHJpZ2dlci10aGUtb25lcnJvci1oYW5kbGVyLW9uLWEtc2NyaXB0LXRhZy81NjI1NjAzXG4gICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID49IDQwMCkge1xuICAgICAgICBjYWNoZVtzcmNdID0gbnVsbDtcbiAgICAgICAgaWYgKGNzc0ZsYWcpIHtcbiAgICAgICAgICBlcnJvcihXVUpJRV9USVBTX0NTU19FUlJPUl9SRVFVRVNURUQsIHsgc3JjLCByZXNwb25zZSB9KTtcbiAgICAgICAgICBsb2FkRXJyb3I/LihzcmMsIG5ldyBFcnJvcihXVUpJRV9USVBTX0NTU19FUlJPUl9SRVFVRVNURUQpKTtcbiAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlcnJvcihXVUpJRV9USVBTX1NDUklQVF9FUlJPUl9SRVFVRVNURUQsIHsgc3JjLCByZXNwb25zZSB9KTtcbiAgICAgICAgICBsb2FkRXJyb3I/LihzcmMsIG5ldyBFcnJvcihXVUpJRV9USVBTX1NDUklQVF9FUlJPUl9SRVFVRVNURUQpKTtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoV1VKSUVfVElQU19TQ1JJUFRfRVJST1JfUkVRVUVTVEVEKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3BvbnNlLnRleHQoKTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgY2FjaGVbc3JjXSA9IG51bGw7XG4gICAgICBpZiAoY3NzRmxhZykge1xuICAgICAgICBlcnJvcihXVUpJRV9USVBTX0NTU19FUlJPUl9SRVFVRVNURUQsIHNyYyk7XG4gICAgICAgIGxvYWRFcnJvcj8uKHNyYywgZSk7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXJyb3IoV1VKSUVfVElQU19TQ1JJUFRfRVJST1JfUkVRVUVTVEVELCBzcmMpO1xuICAgICAgICBsb2FkRXJyb3I/LihzcmMsIGUpO1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgIH1cbiAgICB9KSk7XG5cbi8vIGZvciBwcmVmZXRjaFxuZXhwb3J0IGZ1bmN0aW9uIGdldEV4dGVybmFsU3R5bGVTaGVldHMoXG4gIHN0eWxlczogU3R5bGVPYmplY3RbXSxcbiAgZmV0Y2g6IChpbnB1dDogUmVxdWVzdEluZm8sIGluaXQ/OiBSZXF1ZXN0SW5pdCkgPT4gUHJvbWlzZTxSZXNwb25zZT4gPSBkZWZhdWx0RmV0Y2gsXG4gIGxvYWRFcnJvcjogbG9hZEVycm9ySGFuZGxlclxuKTogU3R5bGVSZXN1bHRMaXN0IHtcbiAgcmV0dXJuIHN0eWxlcy5tYXAoKHsgc3JjLCBjb250ZW50LCBpZ25vcmUgfSkgPT4ge1xuICAgIC8vIOWGheiBlFxuICAgIGlmIChjb250ZW50KSB7XG4gICAgICByZXR1cm4geyBzcmM6IFwiXCIsIGNvbnRlbnRQcm9taXNlOiBQcm9taXNlLnJlc29sdmUoY29udGVudCkgfTtcbiAgICB9IGVsc2UgaWYgKGlzSW5saW5lQ29kZShzcmMpKSB7XG4gICAgICAvLyBpZiBpdCBpcyBpbmxpbmUgc3R5bGVcbiAgICAgIHJldHVybiB7IHNyYzogXCJcIiwgY29udGVudFByb21pc2U6IFByb21pc2UucmVzb2x2ZShnZXRJbmxpbmVDb2RlKHNyYykpIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGV4dGVybmFsIHN0eWxlc1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3JjLFxuICAgICAgICBpZ25vcmUsXG4gICAgICAgIGNvbnRlbnRQcm9taXNlOiBpZ25vcmUgPyBQcm9taXNlLnJlc29sdmUoXCJcIikgOiBmZXRjaEFzc2V0cyhzcmMsIHN0eWxlQ2FjaGUsIGZldGNoLCB0cnVlLCBsb2FkRXJyb3IpLFxuICAgICAgfTtcbiAgICB9XG4gIH0pO1xufVxuXG4vLyBmb3IgcHJlZmV0Y2hcbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHRlcm5hbFNjcmlwdHMoXG4gIHNjcmlwdHM6IFNjcmlwdE9iamVjdFtdLFxuICBmZXRjaDogKGlucHV0OiBSZXF1ZXN0SW5mbywgaW5pdD86IFJlcXVlc3RJbml0KSA9PiBQcm9taXNlPFJlc3BvbnNlPiA9IGRlZmF1bHRGZXRjaCxcbiAgbG9hZEVycm9yOiBsb2FkRXJyb3JIYW5kbGVyLFxuICBmaWJlcjogYm9vbGVhblxuKTogU2NyaXB0UmVzdWx0TGlzdCB7XG4gIC8vIG1vZHVsZSBzaG91bGQgYmUgcmVxdWVzdGVkIGluIGlmcmFtZVxuICByZXR1cm4gc2NyaXB0cy5tYXAoKHNjcmlwdCkgPT4ge1xuICAgIGNvbnN0IHsgc3JjLCBhc3luYywgZGVmZXIsIG1vZHVsZSwgaWdub3JlIH0gPSBzY3JpcHQ7XG4gICAgbGV0IGNvbnRlbnRQcm9taXNlID0gbnVsbDtcbiAgICAvLyBhc3luY1xuICAgIGlmICgoYXN5bmMgfHwgZGVmZXIpICYmIHNyYyAmJiAhbW9kdWxlKSB7XG4gICAgICBjb250ZW50UHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgICAgIGZpYmVyXG4gICAgICAgICAgPyByZXF1ZXN0SWRsZUNhbGxiYWNrKCgpID0+IGZldGNoQXNzZXRzKHNyYywgc2NyaXB0Q2FjaGUsIGZldGNoLCBmYWxzZSwgbG9hZEVycm9yKS50aGVuKHJlc29sdmUsIHJlamVjdCkpXG4gICAgICAgICAgOiBmZXRjaEFzc2V0cyhzcmMsIHNjcmlwdENhY2hlLCBmZXRjaCwgZmFsc2UsIGxvYWRFcnJvcikudGhlbihyZXNvbHZlLCByZWplY3QpXG4gICAgICApO1xuICAgICAgLy8gbW9kdWxlIHx8IGlnbm9yZVxuICAgIH0gZWxzZSBpZiAoKG1vZHVsZSAmJiBzcmMpIHx8IGlnbm9yZSkge1xuICAgICAgY29udGVudFByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoXCJcIik7XG4gICAgICAvLyBpbmxpbmVcbiAgICB9IGVsc2UgaWYgKCFzcmMpIHtcbiAgICAgIGNvbnRlbnRQcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKHNjcmlwdC5jb250ZW50KTtcbiAgICAgIC8vIG91dGxpbmVcbiAgICB9IGVsc2Uge1xuICAgICAgY29udGVudFByb21pc2UgPSBmZXRjaEFzc2V0cyhzcmMsIHNjcmlwdENhY2hlLCBmZXRjaCwgZmFsc2UsIGxvYWRFcnJvcik7XG4gICAgfVxuICAgIC8vIHJlZmVyIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL3NjcmlwdGluZy5odG1sI2F0dHItc2NyaXB0LWRlZmVyXG4gICAgaWYgKG1vZHVsZSAmJiAhYXN5bmMpIHNjcmlwdC5kZWZlciA9IHRydWU7XG4gICAgcmV0dXJuIHsgLi4uc2NyaXB0LCBjb250ZW50UHJvbWlzZSB9O1xuICB9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW1wb3J0SFRNTChwYXJhbXM6IHtcbiAgdXJsOiBzdHJpbmc7XG4gIGh0bWw/OiBzdHJpbmc7XG4gIG9wdHM6IEltcG9ydEVudHJ5T3B0cztcbn0pOiBQcm9taXNlPGh0bWxQYXJzZVJlc3VsdD4ge1xuICBjb25zdCB7IHVybCwgb3B0cywgaHRtbCB9ID0gcGFyYW1zO1xuICBjb25zdCBmZXRjaCA9IG9wdHMuZmV0Y2ggPz8gZGVmYXVsdEZldGNoO1xuICBjb25zdCBmaWJlciA9IG9wdHMuZmliZXIgPz8gdHJ1ZTtcbiAgY29uc3QgeyBwbHVnaW5zLCBsb2FkRXJyb3IgfSA9IG9wdHM7XG4gIGNvbnN0IGh0bWxMb2FkZXIgPSBwbHVnaW5zID8gY29tcG9zZShwbHVnaW5zLm1hcCgocGx1Z2luKSA9PiBwbHVnaW4uaHRtbExvYWRlcikpIDogZGVmYXVsdEdldFRlbXBsYXRlO1xuICBjb25zdCBqc0V4Y2x1ZGVzID0gZ2V0RWZmZWN0TG9hZGVycyhcImpzRXhjbHVkZXNcIiwgcGx1Z2lucyk7XG4gIGNvbnN0IGNzc0V4Y2x1ZGVzID0gZ2V0RWZmZWN0TG9hZGVycyhcImNzc0V4Y2x1ZGVzXCIsIHBsdWdpbnMpO1xuICBjb25zdCBqc0lnbm9yZXMgPSBnZXRFZmZlY3RMb2FkZXJzKFwianNJZ25vcmVzXCIsIHBsdWdpbnMpO1xuICBjb25zdCBjc3NJZ25vcmVzID0gZ2V0RWZmZWN0TG9hZGVycyhcImNzc0lnbm9yZXNcIiwgcGx1Z2lucyk7XG4gIGNvbnN0IGdldFB1YmxpY1BhdGggPSBkZWZhdWx0R2V0UHVibGljUGF0aDtcblxuICBjb25zdCBnZXRIdG1sUGFyc2VSZXN1bHQgPSAodXJsLCBodG1sLCBodG1sTG9hZGVyKSA9PlxuICAgIChodG1sXG4gICAgICA/IFByb21pc2UucmVzb2x2ZShodG1sKVxuICAgICAgOiBmZXRjaCh1cmwpXG4gICAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID49IDQwMCkge1xuICAgICAgICAgICAgICBlcnJvcihXVUpJRV9USVBTX0hUTUxfRVJST1JfUkVRVUVTVEVELCB7IHVybCwgcmVzcG9uc2UgfSk7XG4gICAgICAgICAgICAgIGxvYWRFcnJvcj8uKHVybCwgbmV3IEVycm9yKFdVSklFX1RJUFNfSFRNTF9FUlJPUl9SRVFVRVNURUQpKTtcbiAgICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UudGV4dCgpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICBlbWJlZEhUTUxDYWNoZVt1cmxdID0gbnVsbDtcbiAgICAgICAgICAgIGxvYWRFcnJvcj8uKHVybCwgZSk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZSk7XG4gICAgICAgICAgfSlcbiAgICApLnRoZW4oKGh0bWwpID0+IHtcbiAgICAgIGNvbnN0IGFzc2V0UHVibGljUGF0aCA9IGdldFB1YmxpY1BhdGgodXJsKTtcbiAgICAgIGNvbnN0IHsgdGVtcGxhdGUsIHNjcmlwdHMsIHN0eWxlcyB9ID0gcHJvY2Vzc1RwbChodG1sTG9hZGVyKGh0bWwpLCBhc3NldFB1YmxpY1BhdGgpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxuICAgICAgICBhc3NldFB1YmxpY1BhdGgsXG4gICAgICAgIGdldEV4dGVybmFsU2NyaXB0czogKCkgPT5cbiAgICAgICAgICBnZXRFeHRlcm5hbFNjcmlwdHMoXG4gICAgICAgICAgICBzY3JpcHRzXG4gICAgICAgICAgICAgIC5maWx0ZXIoKHNjcmlwdCkgPT4gIXNjcmlwdC5zcmMgfHwgIWlzTWF0Y2hVcmwoc2NyaXB0LnNyYywganNFeGNsdWRlcykpXG4gICAgICAgICAgICAgIC5tYXAoKHNjcmlwdCkgPT4gKHsgLi4uc2NyaXB0LCBpZ25vcmU6IHNjcmlwdC5zcmMgJiYgaXNNYXRjaFVybChzY3JpcHQuc3JjLCBqc0lnbm9yZXMpIH0pKSxcbiAgICAgICAgICAgIGZldGNoLFxuICAgICAgICAgICAgbG9hZEVycm9yLFxuICAgICAgICAgICAgZmliZXJcbiAgICAgICAgICApLFxuICAgICAgICBnZXRFeHRlcm5hbFN0eWxlU2hlZXRzOiAoKSA9PlxuICAgICAgICAgIGdldEV4dGVybmFsU3R5bGVTaGVldHMoXG4gICAgICAgICAgICBzdHlsZXNcbiAgICAgICAgICAgICAgLmZpbHRlcigoc3R5bGUpID0+ICFzdHlsZS5zcmMgfHwgIWlzTWF0Y2hVcmwoc3R5bGUuc3JjLCBjc3NFeGNsdWRlcykpXG4gICAgICAgICAgICAgIC5tYXAoKHN0eWxlKSA9PiAoeyAuLi5zdHlsZSwgaWdub3JlOiBzdHlsZS5zcmMgJiYgaXNNYXRjaFVybChzdHlsZS5zcmMsIGNzc0lnbm9yZXMpIH0pKSxcbiAgICAgICAgICAgIGZldGNoLFxuICAgICAgICAgICAgbG9hZEVycm9yXG4gICAgICAgICAgKSxcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgaWYgKG9wdHM/LnBsdWdpbnMuc29tZSgocGx1Z2luKSA9PiBwbHVnaW4uaHRtbExvYWRlcikpIHtcbiAgICByZXR1cm4gZ2V0SHRtbFBhcnNlUmVzdWx0KHVybCwgaHRtbCwgaHRtbExvYWRlcik7XG4gICAgLy8g5rKh5pyJaHRtbC1sb2FkZXLlj6/ku6XlgZrnvJPlrZhcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZW1iZWRIVE1MQ2FjaGVbdXJsXSB8fCAoZW1iZWRIVE1MQ2FjaGVbdXJsXSA9IGdldEh0bWxQYXJzZVJlc3VsdCh1cmwsIGh0bWwsIGh0bWxMb2FkZXIpKTtcbiAgfVxufVxuLyoqXG4gKiDlhoXogZTkuovku7blpITnkIblmajovoXliqnlh73mlbBcbiAqIOeUqOS6juWcqCBTaGFkb3dET00g5Lit5Yqo5oCB6I635Y+W5a2Q5bqU55So55qEIHdpbmRvdyDlr7nosaFcbiAqL1xuXG4vKipcbiAqIOiOt+WPluWtkOW6lOeUqOeahCB3aW5kb3cg5a+56LGhXG4gKiDnlKjkuo7lhoXogZTkuovku7blpITnkIblmajnvJbor5HlkI7nmoQgd2l0aCDor63lj6VcbiAqXG4gKiDnm7TmjqXku6UgYXBwSWQg5L2c5Li65YWl5Y+C77yI57yW6K+R6Zi25q6154Ok6L+b5a2X56ym5Liy5a2X6Z2i6YeP77yJ77yM6YG/5YWN6L+Q6KGM5pe25L6d6LWWXG4gKiDooqvmspnnrrHliqvmjIHnmoQgZWxlbWVudC5nZXRSb290Tm9kZe+8m+mAmui/hyBxdWVyeVNlbGVjdG9yIOWunuaXtuafpeaJviBpZnJhbWXvvIxcbiAqIOS4jeaMgeacieS7u+S9lemXreWMheW8leeUqO+8jOinhOmBv+WGheWtmOazhOa8j+OAglxuICpcbiAqIOaymeeusSBpZnJhbWXvvIhuYW1lPWFwcElk77yJ5aeL57uI5oyC5Zyo5Li75bqU55SoIGRvY3VtZW50IOS4iuOAglxuICogLSDpnZ7pmY3nuqfvvJrlhoXogZTkuovku7bov5DooYzlnKjkuLvlupTnlKggcmVhbG3vvIxkb2N1bWVudCDljbPkuLvlupTnlKggZG9jdW1lbnTvvIznm7TmjqXlkb3kuK3vvJtcbiAqIC0g6ZmN57qn77ya5YaF6IGU5LqL5Lu26L+Q6KGM5Zyo5riy5p+TIGlmcmFtZSDlhoXvvIzmspnnrrEgaWZyYW1lIOWcqOWFtiB3aW5kb3cucGFyZW50LmRvY3VtZW50IOS4iu+8jFxuICogICDmlYUgZG9jdW1lbnQg5om+5LiN5Yiw5pe26YCQ57qn5ZCR5LiK5YiwIHBhcmVudC5kb2N1bWVudCDmn6Xmib7jgIJcbiAqXG4gKiBAcGFyYW0gYXBwSWQgLSDlrZDlupTnlKggYXBwSWTvvIhpZnJhbWUg55qEIG5hbWXvvIlcbiAqIEByZXR1cm5zIOWtkOW6lOeUqOeahCBwcm94eVdpbmRvd++8jOaJvuS4jeWIsOaXtumZjee6p+S4uuS4u+W6lOeUqCB3aW5kb3dcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFd1amllV2luZG93KGFwcElkOiBzdHJpbmcpOiBXaW5kb3dQcm94eSB7XG4gIHRyeSB7XG4gICAgY29uc3QgaWZyYW1lID0gcXVlcnlXdWppZUlmcmFtZShhcHBJZCk7XG4gICAgaWYgKCFpZnJhbWUpIHtcbiAgICAgIGNvbnNvbGUud2FybihgW3d1amllXSBDYW5ub3QgZmluZCBpZnJhbWUgZm9yIGFwcCAke2FwcElkfWApO1xuICAgICAgcmV0dXJuIHdpbmRvdztcbiAgICB9XG5cbiAgICBjb25zdCBjb250ZW50V2luZG93ID0gaWZyYW1lLmNvbnRlbnRXaW5kb3c7XG4gICAgaWYgKCFjb250ZW50V2luZG93KSB7XG4gICAgICBjb25zb2xlLndhcm4oYFt3dWppZV0gQ2Fubm90IGdldCBjb250ZW50V2luZG93IGZvciBhcHAgJHthcHBJZH1gKTtcbiAgICAgIHJldHVybiB3aW5kb3c7XG4gICAgfVxuXG4gICAgLy8g6Z2e6ZmN57qn5qih5byP6L+U5ZueIHByb3h577yM6ZmN57qn5qih5byP55u05o6l6L+U5ZueIGlmcmFtZS5jb250ZW50V2luZG93XG4gICAgY29uc3QgdGFyZ2V0V2luZG93ID0gY29udGVudFdpbmRvdy5fX1dVSklFPy5kZWdyYWRlID8gY29udGVudFdpbmRvdyA6IGNvbnRlbnRXaW5kb3cuX19XVUpJRT8ucHJveHk7XG4gICAgcmV0dXJuIHdpdGhJbmxpbmVFdmVudFVuc2NvcGFibGVzKHRhcmdldFdpbmRvdyk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLndhcm4oXCJbd3VqaWVdIEZhaWxlZCB0byBnZXQgd3VqaWUgd2luZG93OlwiLCBlKTtcbiAgICByZXR1cm4gd2luZG93O1xuICB9XG59XG5cbi8qKlxuICog5YaF6IGU5LqL5Lu2IHdpdGgocHJveHkpIOS9nOeUqOWfn+mHjOmcgOimgeKAnOaUvuihjOKAneOAgeWbnuiQveWIsOWkluWxguWOn+eUnyBoYW5kbGVyIOS9nOeUqOWfn+eahOagh+ivhuespuOAglxuICog5L6L5aaCIG9uY2xpY2s9XCJmbihldmVudClcIu+8jOWOn+eUnyBoYW5kbGVyIOW9ouWPguaPkOS+myBldmVudO+8jOS9hiAnZXZlbnQnIOWQjOaXtuWtmOWcqOS6jlxuICog5a2Q5bqU55SoIHdpbmRvd++8iFdpbmRvdy5wcm90b3R5cGUg5LiK55qE6YGX55WZ6K6/6Zeu5Zmo77yJ77yM6Iul5LiN5aSE55CG5Lya6KKrIHByb3h5IOmBruiUveaIkCB1bmRlZmluZWTjgIJcbiAqL1xuY29uc3QgSU5MSU5FX0VWRU5UX1VOU0NPUEFCTEVTOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiA9IHtcbiAgZXZlbnQ6IHRydWUsXG59O1xuXG4vKipcbiAqIOe7mSBwcm94eVdpbmRvdyDljIXkuIDlsYLvvIzku4Xmi6bmiKogU3ltYm9sLnVuc2NvcGFibGVz77yM5YW25L2Z6L2s5Y+R57uZ5bqV5bGCIHByb3h544CCXG4gKiB3aXRoKOatpOWvueixoSl7Li4ufSDml7bvvIzlr7kgSU5MSU5FX0VWRU5UX1VOU0NPUEFCTEVTIOS4reeahOWQjeWtl+S4jeS7jiBwcm94eSDlj5blgLzvvIxcbiAqIOiAjOaYr+WbnuiQveWIsOWkluWxgiBoYW5kbGVyIOS9nOeUqOWfn++8iOaLv+WIsOWOn+eUnyBldmVudCDlvaLlj4LvvInvvIzlhbblroPlkI3lrZfvvIjlpoLlrZDlupTnlKjlh73mlbDvvInnhafluLjnu48gcHJveHkg6Kej5p6Q44CCXG4gKi9cbmZ1bmN0aW9uIHdpdGhJbmxpbmVFdmVudFVuc2NvcGFibGVzKHByb3h5V2luZG93OiBXaW5kb3dQcm94eSk6IFdpbmRvd1Byb3h5IHtcbiAgcmV0dXJuIG5ldyBQcm94eShwcm94eVdpbmRvdywge1xuICAgIGdldCh0YXJnZXQsIHApIHtcbiAgICAgIGlmIChwID09PSBTeW1ib2wudW5zY29wYWJsZXMpIHJldHVybiBJTkxJTkVfRVZFTlRfVU5TQ09QQUJMRVM7XG4gICAgICAvLyDkuI3kvKAgcmVjZWl2ZXLvvIzmsr/nlKjlupXlsYIgcHJveHkg5pei5pyJ55qE5Y+W5YC85LiOIHRoaXMg57uR5a6a6YC76L6RXG4gICAgICByZXR1cm4gUmVmbGVjdC5nZXQodGFyZ2V0LCBwKTtcbiAgICB9LFxuICAgIGhhcyh0YXJnZXQsIHApIHtcbiAgICAgIHJldHVybiBSZWZsZWN0Lmhhcyh0YXJnZXQsIHApO1xuICAgIH0sXG4gIH0pIGFzIFdpbmRvd1Byb3h5O1xufVxuXG4vKipcbiAqIOWcqOW9k+WJjSBkb2N1bWVudCDlj4rlhbbniLbnuqcgZG9jdW1lbnQg6ZO+5LiK5p+l5om+5a2Q5bqU55So5rKZ566xIGlmcmFtZeOAglxuICog5YW85a656ZmN57qn5qih5byP77ya5YaF6IGU5LqL5Lu26L+Q6KGM5Zyo5riy5p+TIGlmcmFtZSDlhoXvvIzpnIDlkJHkuIrliLAgcGFyZW50LmRvY3VtZW50IOafpeaJvuOAglxuICovXG5mdW5jdGlvbiBxdWVyeVd1amllSWZyYW1lKGFwcElkOiBzdHJpbmcpOiBIVE1MSUZyYW1lRWxlbWVudCB8IG51bGwge1xuICBjb25zdCBzZWxlY3RvciA9IGBpZnJhbWVbbmFtZT1cIiR7YXBwSWR9XCJdYDtcbiAgbGV0IHdpbjogV2luZG93ID0gd2luZG93O1xuICBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgaWZyYW1lID0gd2luLmRvY3VtZW50Py5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKSBhcyBIVE1MSUZyYW1lRWxlbWVudCB8IG51bGw7XG4gICAgICBpZiAoaWZyYW1lKSByZXR1cm4gaWZyYW1lO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIOi3qOWfn+eItue6pyBkb2N1bWVudCDorr/pl67lpLHotKXvvIzlgZzmraLlkJHkuIrmn6Xmib5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoIXdpbi5wYXJlbnQgfHwgd2luLnBhcmVudCA9PT0gd2luKSBicmVhaztcbiAgICB3aW4gPSB3aW4ucGFyZW50O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIOWIneWni+WMluWFqOWxgOi+heWKqeWHveaVsFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdElubGluZUV2ZW50SGVscGVyKCk6IHZvaWQge1xuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiAhd2luZG93Ll9fZ2V0V3VqaWVXaW5kb3dfXykge1xuICAgIHdpbmRvdy5fX2dldFd1amllV2luZG93X18gPSBnZXRXdWppZVdpbmRvdztcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7OztBQUFBLE9BQU9BLFVBQVUsSUFDZkMsb0JBQW9CLEVBQ3BCQywyQkFBMkIsUUFJdEIsWUFBWTtBQUNuQixTQUFTQyxvQkFBb0IsRUFBRUMsYUFBYSxFQUFFQyxtQkFBbUIsRUFBRUMsS0FBSyxFQUFFQyxPQUFPLEVBQUVDLFNBQVMsUUFB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