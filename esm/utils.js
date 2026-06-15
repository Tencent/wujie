import _typeof from "@babel/runtime/helpers/typeof";
import _toConsumableArray from "@babel/runtime/helpers/toConsumableArray";
import { WUJIE_SCRIPT_ID, WUJIE_TIPS_NO_URL, WUJIE_APP_ID, WUJIE_TIPS_STOP_APP, WUJIE_TIPS_STOP_APP_DETAIL } from "./constant";
export function toArray(array) {
  return Array.isArray(array) ? array : [array];
}
export function isFunction(value) {
  return typeof value === "function";
}
export function isHijackingTag(tagName) {
  return (tagName === null || tagName === void 0 ? void 0 : tagName.toUpperCase()) === "LINK" || (tagName === null || tagName === void 0 ? void 0 : tagName.toUpperCase()) === "STYLE" || (tagName === null || tagName === void 0 ? void 0 : tagName.toUpperCase()) === "SCRIPT" || (tagName === null || tagName === void 0 ? void 0 : tagName.toUpperCase()) === "IFRAME";
}
export var wujieSupport = window.Proxy && window.CustomElementRegistry;

/**
 * in safari
 * typeof document.all === 'undefined' // true
 * typeof document.all === 'function' // true
 * We need to discriminate safari for better performance
 */
var naughtySafari = typeof document.all === "function" && typeof document.all === "undefined";
var callableFnCacheMap = new WeakMap();
export var isCallable = function isCallable(fn) {
  if (callableFnCacheMap.has(fn)) {
    return true;
  }
  var callable = naughtySafari ? typeof fn === "function" && typeof fn !== "undefined" : typeof fn === "function";
  if (callable) {
    callableFnCacheMap.set(fn, callable);
  }
  return callable;
};
var boundedMap = new WeakMap();
export function isBoundedFunction(fn) {
  if (boundedMap.has(fn)) {
    return boundedMap.get(fn);
  }
  var bounded = fn.name.indexOf("bound ") === 0 && !fn.hasOwnProperty("prototype");
  boundedMap.set(fn, bounded);
  return bounded;
}
var fnRegexCheckCacheMap = new WeakMap();
export function isConstructable(fn) {
  var hasPrototypeMethods = fn.prototype && fn.prototype.constructor === fn && Object.getOwnPropertyNames(fn.prototype).length > 1;
  if (hasPrototypeMethods) return true;
  if (fnRegexCheckCacheMap.has(fn)) {
    return fnRegexCheckCacheMap.get(fn);
  }
  var constructable = hasPrototypeMethods;
  if (!constructable) {
    var fnString = fn.toString();
    var constructableFunctionRegex = /^function\b\s[A-Z].*/;
    var classRegex = /^class\b/;
    constructable = constructableFunctionRegex.test(fnString) || classRegex.test(fnString);
  }
  fnRegexCheckCacheMap.set(fn, constructable);
  return constructable;
}

// 修复多个子应用启动，拿到的全局对象都是第一个子应用全局对象的bug：https://github.com/Tencent/wujie/issues/770
var setFnCacheMap = new WeakMap();
export function checkProxyFunction(target, value) {
  if (isCallable(value) && !isBoundedFunction(value) && !isConstructable(value)) {
    if (!setFnCacheMap.has(target)) {
      setFnCacheMap.set(target, new WeakMap());
      setFnCacheMap.get(target).set(value, value);
    } else if (!setFnCacheMap.get(target).has(value)) {
      setFnCacheMap.get(target).set(value, value);
    }
  }
}
export function getTargetValue(target, p) {
  var value = target[p];
  if (setFnCacheMap.has(target) && setFnCacheMap.get(target).has(value)) {
    return setFnCacheMap.get(target).get(value);
  }
  if (isCallable(value) && !isBoundedFunction(value) && !isConstructable(value)) {
    var boundValue = Function.prototype.bind.call(value, target);
    if (setFnCacheMap.has(target)) {
      setFnCacheMap.get(target).set(value, boundValue);
    } else {
      setFnCacheMap.set(target, new WeakMap());
      setFnCacheMap.get(target).set(value, boundValue);
    }
    for (var key in value) {
      boundValue[key] = value[key];
    }
    if (value.hasOwnProperty("prototype") && !boundValue.hasOwnProperty("prototype")) {
      // https://github.com/kuitos/kuitos.github.io/issues/47
      Object.defineProperty(boundValue, "prototype", {
        value: value.prototype,
        enumerable: false,
        writable: true
      });
    }
    return boundValue;
  }
  return value;
}
export function getDegradeIframe(id) {
  return window.document.querySelector("iframe[".concat(WUJIE_APP_ID, "=\"").concat(id, "\"]"));
}
export function setAttrsToElement(element, attrs) {
  Object.keys(attrs).forEach(function (name) {
    element.setAttribute(name, attrs[name]);
  });
}
export function appRouteParse(url) {
  if (!url) {
    error(WUJIE_TIPS_NO_URL);
    throw new Error();
  }
  var urlElement = anchorElementGenerator(url);
  var appHostPath = urlElement.protocol + "//" + urlElement.host;
  var appRoutePath = urlElement.pathname + urlElement.search + urlElement.hash;
  if (!appRoutePath.startsWith("/")) appRoutePath = "/" + appRoutePath; // hack ie
  return {
    urlElement: urlElement,
    appHostPath: appHostPath,
    appRoutePath: appRoutePath
  };
}
export function anchorElementGenerator(url) {
  var element = window.document.createElement("a");
  element.href = url;
  element.href = element.href; // hack ie
  return element;
}
export function getAnchorElementQueryMap(anchorElement) {
  var queryString = anchorElement.search || "";
  return _toConsumableArray(new URLSearchParams(queryString).entries()).reduce(function (p, c) {
    p[c[0]] = c[1];
    return p;
  }, {});
}

/**
 * 当前url的查询参数中是否有给定的id
 */
export function isMatchSyncQueryById(id) {
  var queryMap = getAnchorElementQueryMap(anchorElementGenerator(window.location.href));
  return Object.keys(queryMap).includes(id);
}

/**
 * 劫持元素原型对相对地址的赋值转绝对地址
 * @param iframeWindow
 */
export function fixElementCtrSrcOrHref(iframeWindow, elementCtr, attr) {
  // patch setAttribute
  var rawElementSetAttribute = iframeWindow.Element.prototype.setAttribute;
  elementCtr.prototype.setAttribute = function (name, value) {
    var targetValue = value;
    if (name === attr) targetValue = getAbsolutePath(value, this.baseURI || "", true);
    rawElementSetAttribute.call(this, name, targetValue);
  };
  // patch href get and set
  var rawAnchorElementHrefDescriptor = Object.getOwnPropertyDescriptor(elementCtr.prototype, attr);
  var enumerable = rawAnchorElementHrefDescriptor.enumerable,
    configurable = rawAnchorElementHrefDescriptor.configurable,
    _get = rawAnchorElementHrefDescriptor.get,
    _set = rawAnchorElementHrefDescriptor.set;
  Object.defineProperty(elementCtr.prototype, attr, {
    enumerable: enumerable,
    configurable: configurable,
    get: function get() {
      return _get.call(this);
    },
    set: function set(href) {
      _set.call(this, getAbsolutePath(href, this.baseURI, true));
    }
  });
  // TODO: innerHTML的处理
}
export function getCurUrl(proxyLocation) {
  var location = proxyLocation;
  return location.protocol + "//" + location.host + location.pathname;
}
export function getAbsolutePath(url, base, hash) {
  try {
    // 为空值无需处理
    if (url) {
      // 需要处理hash的场景
      if (hash && url.startsWith("#")) return url;
      return new URL(url, base).href;
    } else return url;
  } catch (_unused) {
    return url;
  }
}
/**
 * 获取需要同步的url
 */
export function getSyncUrl(id, prefix) {
  var _syncUrl$match;
  var winUrlElement = anchorElementGenerator(window.location.href);
  var queryMap = getAnchorElementQueryMap(winUrlElement);
  winUrlElement = null;
  var syncUrl = queryMap[id] || "";
  var validShortPath = (_syncUrl$match = syncUrl.match(/^{([^}]*)}/)) === null || _syncUrl$match === void 0 ? void 0 : _syncUrl$match[1];
  if (prefix && validShortPath) {
    return syncUrl.replace("{".concat(validShortPath, "}"), prefix[validShortPath]);
  }
  return syncUrl;
}
// @ts-ignore
export var requestIdleCallback = window.requestIdleCallback || function (cb) {
  return setTimeout(cb, 1);
};
export function getContainer(container) {
  return typeof container === "string" ? document.querySelector(container) : container;
}
export function warn(msg, data) {
  var _console;
  (_console = console) === null || _console === void 0 || _console.warn("[wujie warn]: ".concat(msg), data);
}
export function error(msg, data) {
  var _console2;
  (_console2 = console) === null || _console2 === void 0 || _console2.error("[wujie error]: ".concat(msg), data);
}
export function getInlineCode(match) {
  var start = match.indexOf(">") + 1;
  var end = match.lastIndexOf("<");
  return match.substring(start, end);
}
export function defaultGetPublicPath(entry) {
  if (_typeof(entry) === "object") {
    return "/";
  }
  try {
    var _URL = new URL(entry, location.href),
      origin = _URL.origin,
      pathname = _URL.pathname;
    var paths = pathname.split("/");
    // 移除最后一个元素
    paths.pop();
    return "".concat(origin).concat(paths.join("/"), "/");
  } catch (e) {
    console.warn(e);
    return "";
  }
}

/** [f1, f2, f3, f4] => f4(f3(f2(f1))) 函数柯里化 */
export function compose(fnList) {
  return function (code) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    return fnList.reduce(function (newCode, fn) {
      return isFunction(fn) ? fn.apply(void 0, [newCode].concat(args)) : newCode;
    }, code || "");
  };
}

// 微任务
export function nextTick(cb) {
  Promise.resolve().then(cb);
}

//执行钩子函数
export function execHooks(plugins, hookName) {
  for (var _len2 = arguments.length, args = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
    args[_key2 - 2] = arguments[_key2];
  }
  try {
    if (plugins && plugins.length > 0) {
      plugins.map(function (plugin) {
        return plugin[hookName];
      }).filter(function (hook) {
        return isFunction(hook);
      }).forEach(function (hook) {
        return hook.apply(void 0, args);
      });
    }
  } catch (e) {
    error(e);
  }
}
export function isScriptElement(element) {
  var _element$tagName;
  return ((_element$tagName = element.tagName) === null || _element$tagName === void 0 ? void 0 : _element$tagName.toUpperCase()) === "SCRIPT";
}
var count = 1;
export function setTagToScript(element, tag) {
  if (isScriptElement(element)) {
    var scriptTag = tag || String(count++);
    element.setAttribute(WUJIE_SCRIPT_ID, scriptTag);
  }
}
export function getTagFromScript(element) {
  if (isScriptElement(element)) {
    return element.getAttribute(WUJIE_SCRIPT_ID);
  }
  return null;
}

// 合并缓存
export function mergeOptions(options, cacheOptions) {
  return {
    name: options.name,
    el: options.el || (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.el),
    url: options.url || (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.url),
    html: options.html || (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.html),
    exec: options.exec !== undefined ? options.exec : cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.exec,
    replace: options.replace || (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.replace),
    fetch: options.fetch || (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.fetch),
    props: options.props || (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.props),
    sync: options.sync !== undefined ? options.sync : cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.sync,
    prefix: options.prefix || (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.prefix),
    loading: options.loading || (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.loading),
    // 默认 {}
    attrs: options.attrs !== undefined ? options.attrs : (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.attrs) || {},
    degradeAttrs: options.degradeAttrs !== undefined ? options.degradeAttrs : (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.degradeAttrs) || {},
    // 默认 true
    fiber: options.fiber !== undefined ? options.fiber : (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.fiber) !== undefined ? cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.fiber : true,
    alive: options.alive !== undefined ? options.alive : cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.alive,
    degrade: options.degrade !== undefined ? options.degrade : cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.degrade,
    plugins: options.plugins || (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.plugins),
    iframeAddEventListeners: options.iframeAddEventListeners || (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.iframeAddEventListeners) || [],
    iframeOnEvents: options.iframeOnEvents || (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.iframeOnEvents) || [],
    lifecycles: {
      beforeLoad: options.beforeLoad || (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.beforeLoad),
      beforeMount: options.beforeMount || (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.beforeMount),
      afterMount: options.afterMount || (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.afterMount),
      beforeUnmount: options.beforeUnmount || (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.beforeUnmount),
      afterUnmount: options.afterUnmount || (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.afterUnmount),
      activated: options.activated || (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.activated),
      deactivated: options.deactivated || (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.deactivated),
      loadError: options.loadError || (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.loadError)
    }
  };
}

/**
 * 事件触发器
 */
export function eventTrigger(el, eventName, detail) {
  var event;
  if (typeof window.CustomEvent === "function") {
    event = new CustomEvent(eventName, {
      detail: detail
    });
  } else {
    event = document.createEvent("CustomEvent");
    event.initCustomEvent(eventName, true, false, detail);
  }
  el.dispatchEvent(event);
}
export function stopMainAppRun() {
  warn(WUJIE_TIPS_STOP_APP_DETAIL);
  throw new Error(WUJIE_TIPS_STOP_APP);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJXVUpJRV9TQ1JJUFRfSUQiLCJXVUpJRV9USVBTX05PX1VSTCIsIldVSklFX0FQUF9JRCIsIldVSklFX1RJUFNfU1RPUF9BUFAiLCJXVUpJRV9USVBTX1NUT1BfQVBQX0RFVEFJTCIsInRvQXJyYXkiLCJhcnJheSIsIkFycmF5IiwiaXNBcnJheSIsImlzRnVuY3Rpb24iLCJ2YWx1ZSIsImlzSGlqYWNraW5nVGFnIiwidGFnTmFtZSIsInRvVXBwZXJDYXNlIiwid3VqaWVTdXBwb3J0Iiwid2luZG93IiwiUHJveHkiLCJDdXN0b21FbGVtZW50UmVnaXN0cnkiLCJuYXVnaHR5U2FmYXJpIiwiZG9jdW1lbnQiLCJhbGwiLCJjYWxsYWJsZUZuQ2FjaGVNYXAiLCJXZWFrTWFwIiwiaXNDYWxsYWJsZSIsImZuIiwiaGFzIiwiY2FsbGFibGUiLCJzZXQiLCJib3VuZGVkTWFwIiwiaXNCb3VuZGVkRnVuY3Rpb24iLCJnZXQiLCJib3VuZGVkIiwibmFtZSIsImluZGV4T2YiLCJoYXNPd25Qcm9wZXJ0eSIsImZuUmVnZXhDaGVja0NhY2hlTWFwIiwiaXNDb25zdHJ1Y3RhYmxlIiwiaGFzUHJvdG90eXBlTWV0aG9kcyIsInByb3RvdHlwZSIsImNvbnN0cnVjdG9yIiwiT2JqZWN0IiwiZ2V0T3duUHJvcGVydHlOYW1lcyIsImxlbmd0aCIsImNvbnN0cnVjdGFibGUiLCJmblN0cmluZyIsInRvU3RyaW5nIiwiY29uc3RydWN0YWJsZUZ1bmN0aW9uUmVnZXgiLCJjbGFzc1JlZ2V4IiwidGVzdCIsInNldEZuQ2FjaGVNYXAiLCJjaGVja1Byb3h5RnVuY3Rpb24iLCJ0YXJnZXQiLCJnZXRUYXJnZXRWYWx1ZSIsInAiLCJib3VuZFZhbHVlIiwiRnVuY3Rpb24iLCJiaW5kIiwiY2FsbCIsImtleSIsImRlZmluZVByb3BlcnR5IiwiZW51bWVyYWJsZSIsIndyaXRhYmxlIiwiZ2V0RGVncmFkZUlmcmFtZSIsImlkIiwicXVlcnlTZWxlY3RvciIsImNvbmNhdCIsInNldEF0dHJzVG9FbGVtZW50IiwiZWxlbWVudCIsImF0dHJzIiwia2V5cyIsImZvckVhY2giLCJzZXRBdHRyaWJ1dGUiLCJhcHBSb3V0ZVBhcnNlIiwidXJsIiwiZXJyb3IiLCJFcnJvciIsInVybEVsZW1lbnQiLCJhbmNob3JFbGVtZW50R2VuZXJhdG9yIiwiYXBwSG9zdFBhdGgiLCJwcm90b2NvbCIsImhvc3QiLCJhcHBSb3V0ZVBhdGgiLCJwYXRobmFtZSIsInNlYXJjaCIsImhhc2giLCJzdGFydHNXaXRoIiwiY3JlYXRlRWxlbWVudCIsImhyZWYiLCJnZXRBbmNob3JFbGVtZW50UXVlcnlNYXAiLCJhbmNob3JFbGVtZW50IiwicXVlcnlTdHJpbmciLCJfdG9Db25zdW1hYmxlQXJyYXkiLCJVUkxTZWFyY2hQYXJhbXMiLCJlbnRyaWVzIiwicmVkdWNlIiwiYyIsImlzTWF0Y2hTeW5jUXVlcnlCeUlkIiwicXVlcnlNYXAiLCJsb2NhdGlvbiIsImluY2x1ZGVzIiwiZml4RWxlbWVudEN0clNyY09ySHJlZiIsImlmcmFtZVdpbmRvdyIsImVsZW1lbnRDdHIiLCJhdHRyIiwicmF3RWxlbWVudFNldEF0dHJpYnV0ZSIsIkVsZW1lbnQiLCJ0YXJnZXRWYWx1ZSIsImdldEFic29sdXRlUGF0aCIsImJhc2VVUkkiLCJyYXdBbmNob3JFbGVtZW50SHJlZkRlc2NyaXB0b3IiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJjb25maWd1cmFibGUiLCJnZXRDdXJVcmwiLCJwcm94eUxvY2F0aW9uIiwiYmFzZSIsIlVSTCIsIl91bnVzZWQiLCJnZXRTeW5jVXJsIiwicHJlZml4IiwiX3N5bmNVcmwkbWF0Y2giLCJ3aW5VcmxFbGVtZW50Iiwic3luY1VybCIsInZhbGlkU2hvcnRQYXRoIiwibWF0Y2giLCJyZXBsYWNlIiwicmVxdWVzdElkbGVDYWxsYmFjayIsImNiIiwic2V0VGltZW91dCIsImdldENvbnRhaW5lciIsImNvbnRhaW5lciIsIndhcm4iLCJtc2ciLCJkYXRhIiwiX2NvbnNvbGUiLCJjb25zb2xlIiwiX2NvbnNvbGUyIiwiZ2V0SW5saW5lQ29kZSIsInN0YXJ0IiwiZW5kIiwibGFzdEluZGV4T2YiLCJzdWJzdHJpbmciLCJkZWZhdWx0R2V0UHVibGljUGF0aCIsImVudHJ5IiwiX3R5cGVvZiIsIl9VUkwiLCJvcmlnaW4iLCJwYXRocyIsInNwbGl0IiwicG9wIiwiam9pbiIsImUiLCJjb21wb3NlIiwiZm5MaXN0IiwiY29kZSIsIl9sZW4iLCJhcmd1bWVudHMiLCJhcmdzIiwiX2tleSIsIm5ld0NvZGUiLCJhcHBseSIsIm5leHRUaWNrIiwiUHJvbWlzZSIsInJlc29sdmUiLCJ0aGVuIiwiZXhlY0hvb2tzIiwicGx1Z2lucyIsImhvb2tOYW1lIiwiX2xlbjIiLCJfa2V5MiIsIm1hcCIsInBsdWdpbiIsImZpbHRlciIsImhvb2siLCJpc1NjcmlwdEVsZW1lbnQiLCJfZWxlbWVudCR0YWdOYW1lIiwiY291bnQiLCJzZXRUYWdUb1NjcmlwdCIsInRhZyIsInNjcmlwdFRhZyIsIlN0cmluZyIsImdldFRhZ0Zyb21TY3JpcHQiLCJnZXRBdHRyaWJ1dGUiLCJtZXJnZU9wdGlvbnMiLCJvcHRpb25zIiwiY2FjaGVPcHRpb25zIiwiZWwiLCJodG1sIiwiZXhlYyIsInVuZGVmaW5lZCIsImZldGNoIiwicHJvcHMiLCJzeW5jIiwibG9hZGluZyIsImRlZ3JhZGVBdHRycyIsImZpYmVyIiwiYWxpdmUiLCJkZWdyYWRlIiwiaWZyYW1lQWRkRXZlbnRMaXN0ZW5lcnMiLCJpZnJhbWVPbkV2ZW50cyIsImxpZmVjeWNsZXMiLCJiZWZvcmVMb2FkIiwiYmVmb3JlTW91bnQiLCJhZnRlck1vdW50IiwiYmVmb3JlVW5tb3VudCIsImFmdGVyVW5tb3VudCIsImFjdGl2YXRlZCIsImRlYWN0aXZhdGVkIiwibG9hZEVycm9yIiwiZXZlbnRUcmlnZ2VyIiwiZXZlbnROYW1lIiwiZGV0YWlsIiwiZXZlbnQiLCJDdXN0b21FdmVudCIsImNyZWF0ZUV2ZW50IiwiaW5pdEN1c3RvbUV2ZW50IiwiZGlzcGF0Y2hFdmVudCIsInN0b3BNYWluQXBwUnVuIl0sInNvdXJjZXMiOlsiLi4vc3JjL3V0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIFdVSklFX1NDUklQVF9JRCxcbiAgV1VKSUVfVElQU19OT19VUkwsXG4gIFdVSklFX0FQUF9JRCxcbiAgV1VKSUVfVElQU19TVE9QX0FQUCxcbiAgV1VKSUVfVElQU19TVE9QX0FQUF9ERVRBSUwsXG59IGZyb20gXCIuL2NvbnN0YW50XCI7XG5pbXBvcnQgeyBwbHVnaW4sIGNhY2hlT3B0aW9ucyB9IGZyb20gXCIuL2luZGV4XCI7XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0FycmF5PFQ+KGFycmF5OiBUIHwgVFtdKTogVFtdIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXJyYXkpID8gYXJyYXkgOiBbYXJyYXldO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzSGlqYWNraW5nVGFnKHRhZ05hbWU/OiBzdHJpbmcpIHtcbiAgcmV0dXJuIChcbiAgICB0YWdOYW1lPy50b1VwcGVyQ2FzZSgpID09PSBcIkxJTktcIiB8fFxuICAgIHRhZ05hbWU/LnRvVXBwZXJDYXNlKCkgPT09IFwiU1RZTEVcIiB8fFxuICAgIHRhZ05hbWU/LnRvVXBwZXJDYXNlKCkgPT09IFwiU0NSSVBUXCIgfHxcbiAgICB0YWdOYW1lPy50b1VwcGVyQ2FzZSgpID09PSBcIklGUkFNRVwiXG4gICk7XG59XG5cbmV4cG9ydCBjb25zdCB3dWppZVN1cHBvcnQgPSB3aW5kb3cuUHJveHkgJiYgd2luZG93LkN1c3RvbUVsZW1lbnRSZWdpc3RyeTtcblxuLyoqXG4gKiBpbiBzYWZhcmlcbiAqIHR5cGVvZiBkb2N1bWVudC5hbGwgPT09ICd1bmRlZmluZWQnIC8vIHRydWVcbiAqIHR5cGVvZiBkb2N1bWVudC5hbGwgPT09ICdmdW5jdGlvbicgLy8gdHJ1ZVxuICogV2UgbmVlZCB0byBkaXNjcmltaW5hdGUgc2FmYXJpIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2VcbiAqL1xuY29uc3QgbmF1Z2h0eVNhZmFyaSA9IHR5cGVvZiBkb2N1bWVudC5hbGwgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgZG9jdW1lbnQuYWxsID09PSBcInVuZGVmaW5lZFwiO1xuY29uc3QgY2FsbGFibGVGbkNhY2hlTWFwID0gbmV3IFdlYWtNYXA8Q2FsbGFibGVGdW5jdGlvbiwgYm9vbGVhbj4oKTtcbmV4cG9ydCBjb25zdCBpc0NhbGxhYmxlID0gKGZuOiBhbnkpID0+IHtcbiAgaWYgKGNhbGxhYmxlRm5DYWNoZU1hcC5oYXMoZm4pKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBjb25zdCBjYWxsYWJsZSA9IG5hdWdodHlTYWZhcmkgPyB0eXBlb2YgZm4gPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgZm4gIT09IFwidW5kZWZpbmVkXCIgOiB0eXBlb2YgZm4gPT09IFwiZnVuY3Rpb25cIjtcbiAgaWYgKGNhbGxhYmxlKSB7XG4gICAgY2FsbGFibGVGbkNhY2hlTWFwLnNldChmbiwgY2FsbGFibGUpO1xuICB9XG4gIHJldHVybiBjYWxsYWJsZTtcbn07XG5cbmNvbnN0IGJvdW5kZWRNYXAgPSBuZXcgV2Vha01hcDxDYWxsYWJsZUZ1bmN0aW9uLCBib29sZWFuPigpO1xuZXhwb3J0IGZ1bmN0aW9uIGlzQm91bmRlZEZ1bmN0aW9uKGZuOiBDYWxsYWJsZUZ1bmN0aW9uKSB7XG4gIGlmIChib3VuZGVkTWFwLmhhcyhmbikpIHtcbiAgICByZXR1cm4gYm91bmRlZE1hcC5nZXQoZm4pO1xuICB9XG4gIGNvbnN0IGJvdW5kZWQgPSBmbi5uYW1lLmluZGV4T2YoXCJib3VuZCBcIikgPT09IDAgJiYgIWZuLmhhc093blByb3BlcnR5KFwicHJvdG90eXBlXCIpO1xuICBib3VuZGVkTWFwLnNldChmbiwgYm91bmRlZCk7XG4gIHJldHVybiBib3VuZGVkO1xufVxuXG5jb25zdCBmblJlZ2V4Q2hlY2tDYWNoZU1hcCA9IG5ldyBXZWFrTWFwPGFueSB8IEZ1bmN0aW9uQ29uc3RydWN0b3IsIGJvb2xlYW4+KCk7XG5leHBvcnQgZnVuY3Rpb24gaXNDb25zdHJ1Y3RhYmxlKGZuOiAoKSA9PiBhbnkgfCBGdW5jdGlvbkNvbnN0cnVjdG9yKSB7XG4gIGNvbnN0IGhhc1Byb3RvdHlwZU1ldGhvZHMgPVxuICAgIGZuLnByb3RvdHlwZSAmJiBmbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPT09IGZuICYmIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGZuLnByb3RvdHlwZSkubGVuZ3RoID4gMTtcblxuICBpZiAoaGFzUHJvdG90eXBlTWV0aG9kcykgcmV0dXJuIHRydWU7XG5cbiAgaWYgKGZuUmVnZXhDaGVja0NhY2hlTWFwLmhhcyhmbikpIHtcbiAgICByZXR1cm4gZm5SZWdleENoZWNrQ2FjaGVNYXAuZ2V0KGZuKTtcbiAgfVxuXG4gIGxldCBjb25zdHJ1Y3RhYmxlID0gaGFzUHJvdG90eXBlTWV0aG9kcztcbiAgaWYgKCFjb25zdHJ1Y3RhYmxlKSB7XG4gICAgY29uc3QgZm5TdHJpbmcgPSBmbi50b1N0cmluZygpO1xuICAgIGNvbnN0IGNvbnN0cnVjdGFibGVGdW5jdGlvblJlZ2V4ID0gL15mdW5jdGlvblxcYlxcc1tBLVpdLiovO1xuICAgIGNvbnN0IGNsYXNzUmVnZXggPSAvXmNsYXNzXFxiLztcbiAgICBjb25zdHJ1Y3RhYmxlID0gY29uc3RydWN0YWJsZUZ1bmN0aW9uUmVnZXgudGVzdChmblN0cmluZykgfHwgY2xhc3NSZWdleC50ZXN0KGZuU3RyaW5nKTtcbiAgfVxuXG4gIGZuUmVnZXhDaGVja0NhY2hlTWFwLnNldChmbiwgY29uc3RydWN0YWJsZSk7XG4gIHJldHVybiBjb25zdHJ1Y3RhYmxlO1xufVxuXG4vLyDkv67lpI3lpJrkuKrlrZDlupTnlKjlkK/liqjvvIzmi7/liLDnmoTlhajlsYDlr7nosaHpg73mmK/nrKzkuIDkuKrlrZDlupTnlKjlhajlsYDlr7nosaHnmoRidWfvvJpodHRwczovL2dpdGh1Yi5jb20vVGVuY2VudC93dWppZS9pc3N1ZXMvNzcwXG5jb25zdCBzZXRGbkNhY2hlTWFwID0gbmV3IFdlYWtNYXA8XG4gIFdpbmRvdyB8IERvY3VtZW50IHwgU2hhZG93Um9vdCB8IExvY2F0aW9uLFxuICBXZWFrTWFwPENhbGxhYmxlRnVuY3Rpb24sIENhbGxhYmxlRnVuY3Rpb24+XG4+KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja1Byb3h5RnVuY3Rpb24odGFyZ2V0OiBXaW5kb3cgfCBEb2N1bWVudCB8IFNoYWRvd1Jvb3QgfCBMb2NhdGlvbiwgdmFsdWU6IGFueSkge1xuICBpZiAoaXNDYWxsYWJsZSh2YWx1ZSkgJiYgIWlzQm91bmRlZEZ1bmN0aW9uKHZhbHVlKSAmJiAhaXNDb25zdHJ1Y3RhYmxlKHZhbHVlKSkge1xuICAgIGlmICghc2V0Rm5DYWNoZU1hcC5oYXModGFyZ2V0KSkge1xuICAgICAgc2V0Rm5DYWNoZU1hcC5zZXQodGFyZ2V0LCBuZXcgV2Vha01hcCgpKTtcbiAgICAgIHNldEZuQ2FjaGVNYXAuZ2V0KHRhcmdldCkuc2V0KHZhbHVlLCB2YWx1ZSk7XG4gICAgfSBlbHNlIGlmICghc2V0Rm5DYWNoZU1hcC5nZXQodGFyZ2V0KS5oYXModmFsdWUpKSB7XG4gICAgICBzZXRGbkNhY2hlTWFwLmdldCh0YXJnZXQpLnNldCh2YWx1ZSwgdmFsdWUpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGFyZ2V0VmFsdWUodGFyZ2V0OiBhbnksIHA6IGFueSk6IGFueSB7XG4gIGNvbnN0IHZhbHVlID0gdGFyZ2V0W3BdO1xuICBpZiAoc2V0Rm5DYWNoZU1hcC5oYXModGFyZ2V0KSAmJiBzZXRGbkNhY2hlTWFwLmdldCh0YXJnZXQpLmhhcyh2YWx1ZSkpIHtcbiAgICByZXR1cm4gc2V0Rm5DYWNoZU1hcC5nZXQodGFyZ2V0KS5nZXQodmFsdWUpO1xuICB9XG4gIGlmIChpc0NhbGxhYmxlKHZhbHVlKSAmJiAhaXNCb3VuZGVkRnVuY3Rpb24odmFsdWUpICYmICFpc0NvbnN0cnVjdGFibGUodmFsdWUpKSB7XG4gICAgY29uc3QgYm91bmRWYWx1ZSA9IEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kLmNhbGwodmFsdWUsIHRhcmdldCk7XG4gICAgaWYgKHNldEZuQ2FjaGVNYXAuaGFzKHRhcmdldCkpIHtcbiAgICAgIHNldEZuQ2FjaGVNYXAuZ2V0KHRhcmdldCkuc2V0KHZhbHVlLCBib3VuZFZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0Rm5DYWNoZU1hcC5zZXQodGFyZ2V0LCBuZXcgV2Vha01hcCgpKTtcbiAgICAgIHNldEZuQ2FjaGVNYXAuZ2V0KHRhcmdldCkuc2V0KHZhbHVlLCBib3VuZFZhbHVlKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBrZXkgaW4gdmFsdWUpIHtcbiAgICAgIGJvdW5kVmFsdWVba2V5XSA9IHZhbHVlW2tleV07XG4gICAgfVxuICAgIGlmICh2YWx1ZS5oYXNPd25Qcm9wZXJ0eShcInByb3RvdHlwZVwiKSAmJiAhYm91bmRWYWx1ZS5oYXNPd25Qcm9wZXJ0eShcInByb3RvdHlwZVwiKSkge1xuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2t1aXRvcy9rdWl0b3MuZ2l0aHViLmlvL2lzc3Vlcy80N1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGJvdW5kVmFsdWUsIFwicHJvdG90eXBlXCIsIHsgdmFsdWU6IHZhbHVlLnByb3RvdHlwZSwgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlIH0pO1xuICAgIH1cbiAgICByZXR1cm4gYm91bmRWYWx1ZTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWdyYWRlSWZyYW1lKGlkOiBzdHJpbmcpOiBIVE1MSUZyYW1lRWxlbWVudCB7XG4gIHJldHVybiB3aW5kb3cuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgaWZyYW1lWyR7V1VKSUVfQVBQX0lEfT1cIiR7aWR9XCJdYCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRBdHRyc1RvRWxlbWVudChlbGVtZW50OiBIVE1MRWxlbWVudCwgYXR0cnM6IHsgW2tleTogc3RyaW5nXTogYW55IH0pIHtcbiAgT2JqZWN0LmtleXMoYXR0cnMpLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShuYW1lLCBhdHRyc1tuYW1lXSk7XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBwUm91dGVQYXJzZSh1cmw6IHN0cmluZyk6IHtcbiAgdXJsRWxlbWVudDogSFRNTEFuY2hvckVsZW1lbnQ7XG4gIGFwcEhvc3RQYXRoOiBzdHJpbmc7XG4gIGFwcFJvdXRlUGF0aDogc3RyaW5nO1xufSB7XG4gIGlmICghdXJsKSB7XG4gICAgZXJyb3IoV1VKSUVfVElQU19OT19VUkwpO1xuICAgIHRocm93IG5ldyBFcnJvcigpO1xuICB9XG4gIGNvbnN0IHVybEVsZW1lbnQgPSBhbmNob3JFbGVtZW50R2VuZXJhdG9yKHVybCk7XG4gIGNvbnN0IGFwcEhvc3RQYXRoID0gdXJsRWxlbWVudC5wcm90b2NvbCArIFwiLy9cIiArIHVybEVsZW1lbnQuaG9zdDtcbiAgbGV0IGFwcFJvdXRlUGF0aCA9IHVybEVsZW1lbnQucGF0aG5hbWUgKyB1cmxFbGVtZW50LnNlYXJjaCArIHVybEVsZW1lbnQuaGFzaDtcbiAgaWYgKCFhcHBSb3V0ZVBhdGguc3RhcnRzV2l0aChcIi9cIikpIGFwcFJvdXRlUGF0aCA9IFwiL1wiICsgYXBwUm91dGVQYXRoOyAvLyBoYWNrIGllXG4gIHJldHVybiB7IHVybEVsZW1lbnQsIGFwcEhvc3RQYXRoLCBhcHBSb3V0ZVBhdGggfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFuY2hvckVsZW1lbnRHZW5lcmF0b3IodXJsOiBzdHJpbmcpOiBIVE1MQW5jaG9yRWxlbWVudCB7XG4gIGNvbnN0IGVsZW1lbnQgPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gIGVsZW1lbnQuaHJlZiA9IHVybDtcbiAgZWxlbWVudC5ocmVmID0gZWxlbWVudC5ocmVmOyAvLyBoYWNrIGllXG4gIHJldHVybiBlbGVtZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QW5jaG9yRWxlbWVudFF1ZXJ5TWFwKGFuY2hvckVsZW1lbnQ6IEhUTUxBbmNob3JFbGVtZW50KTogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSB7XG4gIGNvbnN0IHF1ZXJ5U3RyaW5nID0gYW5jaG9yRWxlbWVudC5zZWFyY2ggfHwgXCJcIjtcbiAgcmV0dXJuIFsuLi5uZXcgVVJMU2VhcmNoUGFyYW1zKHF1ZXJ5U3RyaW5nKS5lbnRyaWVzKCldLnJlZHVjZSgocCwgYykgPT4ge1xuICAgIHBbY1swXV0gPSBjWzFdO1xuICAgIHJldHVybiBwO1xuICB9LCB7fSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KTtcbn1cblxuLyoqXG4gKiDlvZPliY11cmznmoTmn6Xor6Llj4LmlbDkuK3mmK/lkKbmnInnu5nlrprnmoRpZFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNNYXRjaFN5bmNRdWVyeUJ5SWQoaWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBxdWVyeU1hcCA9IGdldEFuY2hvckVsZW1lbnRRdWVyeU1hcChhbmNob3JFbGVtZW50R2VuZXJhdG9yKHdpbmRvdy5sb2NhdGlvbi5ocmVmKSk7XG4gIHJldHVybiBPYmplY3Qua2V5cyhxdWVyeU1hcCkuaW5jbHVkZXMoaWQpO1xufVxuXG4vKipcbiAqIOWKq+aMgeWFg+e0oOWOn+Wei+WvueebuOWvueWcsOWdgOeahOi1i+WAvOi9rOe7neWvueWcsOWdgFxuICogQHBhcmFtIGlmcmFtZVdpbmRvd1xuICovXG5leHBvcnQgZnVuY3Rpb24gZml4RWxlbWVudEN0clNyY09ySHJlZihcbiAgaWZyYW1lV2luZG93OiBXaW5kb3csXG4gIGVsZW1lbnRDdHI6XG4gICAgfCB0eXBlb2YgSFRNTEltYWdlRWxlbWVudFxuICAgIHwgdHlwZW9mIEhUTUxBbmNob3JFbGVtZW50XG4gICAgfCB0eXBlb2YgSFRNTFNvdXJjZUVsZW1lbnRcbiAgICB8IHR5cGVvZiBIVE1MTGlua0VsZW1lbnRcbiAgICB8IHR5cGVvZiBIVE1MU2NyaXB0RWxlbWVudFxuICAgIHwgdHlwZW9mIEhUTUxNZWRpYUVsZW1lbnQsXG4gIGF0dHJcbik6IHZvaWQge1xuICAvLyBwYXRjaCBzZXRBdHRyaWJ1dGVcbiAgY29uc3QgcmF3RWxlbWVudFNldEF0dHJpYnV0ZSA9IGlmcmFtZVdpbmRvdy5FbGVtZW50LnByb3RvdHlwZS5zZXRBdHRyaWJ1dGU7XG4gIGVsZW1lbnRDdHIucHJvdG90eXBlLnNldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uIChuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBsZXQgdGFyZ2V0VmFsdWUgPSB2YWx1ZTtcbiAgICBpZiAobmFtZSA9PT0gYXR0cikgdGFyZ2V0VmFsdWUgPSBnZXRBYnNvbHV0ZVBhdGgodmFsdWUsIHRoaXMuYmFzZVVSSSB8fCBcIlwiLCB0cnVlKTtcbiAgICByYXdFbGVtZW50U2V0QXR0cmlidXRlLmNhbGwodGhpcywgbmFtZSwgdGFyZ2V0VmFsdWUpO1xuICB9O1xuICAvLyBwYXRjaCBocmVmIGdldCBhbmQgc2V0XG4gIGNvbnN0IHJhd0FuY2hvckVsZW1lbnRIcmVmRGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoZWxlbWVudEN0ci5wcm90b3R5cGUsIGF0dHIpO1xuICBjb25zdCB7IGVudW1lcmFibGUsIGNvbmZpZ3VyYWJsZSwgZ2V0LCBzZXQgfSA9IHJhd0FuY2hvckVsZW1lbnRIcmVmRGVzY3JpcHRvcjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnRDdHIucHJvdG90eXBlLCBhdHRyLCB7XG4gICAgZW51bWVyYWJsZSxcbiAgICBjb25maWd1cmFibGUsXG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gZ2V0LmNhbGwodGhpcyk7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIChocmVmKSB7XG4gICAgICBzZXQuY2FsbCh0aGlzLCBnZXRBYnNvbHV0ZVBhdGgoaHJlZiwgdGhpcy5iYXNlVVJJLCB0cnVlKSk7XG4gICAgfSxcbiAgfSk7XG4gIC8vIFRPRE86IGlubmVySFRNTOeahOWkhOeQhlxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VyVXJsKHByb3h5TG9jYXRpb246IE9iamVjdCk6IHN0cmluZyB7XG4gIGNvbnN0IGxvY2F0aW9uID0gcHJveHlMb2NhdGlvbiBhcyBMb2NhdGlvbjtcbiAgcmV0dXJuIGxvY2F0aW9uLnByb3RvY29sICsgXCIvL1wiICsgbG9jYXRpb24uaG9zdCArIGxvY2F0aW9uLnBhdGhuYW1lO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWJzb2x1dGVQYXRoKHVybDogc3RyaW5nLCBiYXNlOiBzdHJpbmcsIGhhc2g/OiBib29sZWFuKTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICAvLyDkuLrnqbrlgLzml6DpnIDlpITnkIZcbiAgICBpZiAodXJsKSB7XG4gICAgICAvLyDpnIDopoHlpITnkIZoYXNo55qE5Zy65pmvXG4gICAgICBpZiAoaGFzaCAmJiB1cmwuc3RhcnRzV2l0aChcIiNcIikpIHJldHVybiB1cmw7XG4gICAgICByZXR1cm4gbmV3IFVSTCh1cmwsIGJhc2UpLmhyZWY7XG4gICAgfSBlbHNlIHJldHVybiB1cmw7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiB1cmw7XG4gIH1cbn1cbi8qKlxuICog6I635Y+W6ZyA6KaB5ZCM5q2l55qEdXJsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTeW5jVXJsKGlkOiBzdHJpbmcsIHByZWZpeDogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSk6IHN0cmluZyB7XG4gIGxldCB3aW5VcmxFbGVtZW50ID0gYW5jaG9yRWxlbWVudEdlbmVyYXRvcih3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gIGNvbnN0IHF1ZXJ5TWFwID0gZ2V0QW5jaG9yRWxlbWVudFF1ZXJ5TWFwKHdpblVybEVsZW1lbnQpO1xuICB3aW5VcmxFbGVtZW50ID0gbnVsbDtcbiAgY29uc3Qgc3luY1VybCA9IHF1ZXJ5TWFwW2lkXSB8fCBcIlwiO1xuICBjb25zdCB2YWxpZFNob3J0UGF0aCA9IHN5bmNVcmwubWF0Y2goL157KFtefV0qKX0vKT8uWzFdO1xuICBpZiAocHJlZml4ICYmIHZhbGlkU2hvcnRQYXRoKSB7XG4gICAgcmV0dXJuIHN5bmNVcmwucmVwbGFjZShgeyR7dmFsaWRTaG9ydFBhdGh9fWAsIHByZWZpeFt2YWxpZFNob3J0UGF0aF0pO1xuICB9XG4gIHJldHVybiBzeW5jVXJsO1xufVxuLy8gQHRzLWlnbm9yZVxuZXhwb3J0IGNvbnN0IHJlcXVlc3RJZGxlQ2FsbGJhY2sgPSB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFjayB8fCAoKGNiOiBGdW5jdGlvbikgPT4gc2V0VGltZW91dChjYiwgMSkpO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29udGFpbmVyKGNvbnRhaW5lcjogc3RyaW5nIHwgSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB7XG4gIHJldHVybiB0eXBlb2YgY29udGFpbmVyID09PSBcInN0cmluZ1wiID8gKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoY29udGFpbmVyKSBhcyBIVE1MRWxlbWVudCkgOiBjb250YWluZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3YXJuKG1zZzogc3RyaW5nLCBkYXRhPzogYW55KTogdm9pZCB7XG4gIGNvbnNvbGU/Lndhcm4oYFt3dWppZSB3YXJuXTogJHttc2d9YCwgZGF0YSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlcnJvcihtc2c6IHN0cmluZywgZGF0YT86IGFueSk6IHZvaWQge1xuICBjb25zb2xlPy5lcnJvcihgW3d1amllIGVycm9yXTogJHttc2d9YCwgZGF0YSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbmxpbmVDb2RlKG1hdGNoKSB7XG4gIGNvbnN0IHN0YXJ0ID0gbWF0Y2guaW5kZXhPZihcIj5cIikgKyAxO1xuICBjb25zdCBlbmQgPSBtYXRjaC5sYXN0SW5kZXhPZihcIjxcIik7XG4gIHJldHVybiBtYXRjaC5zdWJzdHJpbmcoc3RhcnQsIGVuZCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWZhdWx0R2V0UHVibGljUGF0aChlbnRyeSkge1xuICBpZiAodHlwZW9mIGVudHJ5ID09PSBcIm9iamVjdFwiKSB7XG4gICAgcmV0dXJuIFwiL1wiO1xuICB9XG4gIHRyeSB7XG4gICAgY29uc3QgeyBvcmlnaW4sIHBhdGhuYW1lIH0gPSBuZXcgVVJMKGVudHJ5LCBsb2NhdGlvbi5ocmVmKTtcbiAgICBjb25zdCBwYXRocyA9IHBhdGhuYW1lLnNwbGl0KFwiL1wiKTtcbiAgICAvLyDnp7vpmaTmnIDlkI7kuIDkuKrlhYPntKBcbiAgICBwYXRocy5wb3AoKTtcbiAgICByZXR1cm4gYCR7b3JpZ2lufSR7cGF0aHMuam9pbihcIi9cIil9L2A7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLndhcm4oZSk7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbn1cblxuLyoqIFtmMSwgZjIsIGYzLCBmNF0gPT4gZjQoZjMoZjIoZjEpKSkg5Ye95pWw5p+v6YeM5YyWICovXG5leHBvcnQgZnVuY3Rpb24gY29tcG9zZShmbkxpc3Q6IEFycmF5PEZ1bmN0aW9uPik6ICguLi5hcmdzOiBBcnJheTxzdHJpbmc+KSA9PiBzdHJpbmcge1xuICByZXR1cm4gZnVuY3Rpb24gKGNvZGU6IHN0cmluZywgLi4uYXJnczogQXJyYXk8YW55Pikge1xuICAgIHJldHVybiBmbkxpc3QucmVkdWNlKChuZXdDb2RlLCBmbikgPT4gKGlzRnVuY3Rpb24oZm4pID8gZm4obmV3Q29kZSwgLi4uYXJncykgOiBuZXdDb2RlKSwgY29kZSB8fCBcIlwiKTtcbiAgfTtcbn1cblxuLy8g5b6u5Lu75YqhXG5leHBvcnQgZnVuY3Rpb24gbmV4dFRpY2soY2I6ICgpID0+IGFueSk6IHZvaWQge1xuICBQcm9taXNlLnJlc29sdmUoKS50aGVuKGNiKTtcbn1cblxuLy/miafooYzpkqnlrZDlh73mlbBcbmV4cG9ydCBmdW5jdGlvbiBleGVjSG9va3MocGx1Z2luczogQXJyYXk8cGx1Z2luPiwgaG9va05hbWU6IHN0cmluZywgLi4uYXJnczogQXJyYXk8YW55Pik6IHZvaWQge1xuICB0cnkge1xuICAgIGlmIChwbHVnaW5zICYmIHBsdWdpbnMubGVuZ3RoID4gMCkge1xuICAgICAgcGx1Z2luc1xuICAgICAgICAubWFwKChwbHVnaW4pID0+IHBsdWdpbltob29rTmFtZV0pXG4gICAgICAgIC5maWx0ZXIoKGhvb2spID0+IGlzRnVuY3Rpb24oaG9vaykpXG4gICAgICAgIC5mb3JFYWNoKChob29rKSA9PiBob29rKC4uLmFyZ3MpKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBlcnJvcihlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTY3JpcHRFbGVtZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XG4gIHJldHVybiBlbGVtZW50LnRhZ05hbWU/LnRvVXBwZXJDYXNlKCkgPT09IFwiU0NSSVBUXCI7XG59XG5cbmxldCBjb3VudCA9IDE7XG5leHBvcnQgZnVuY3Rpb24gc2V0VGFnVG9TY3JpcHQoZWxlbWVudDogSFRNTFNjcmlwdEVsZW1lbnQsIHRhZz86IHN0cmluZyk6IHZvaWQge1xuICBpZiAoaXNTY3JpcHRFbGVtZW50KGVsZW1lbnQpKSB7XG4gICAgY29uc3Qgc2NyaXB0VGFnID0gdGFnIHx8IFN0cmluZyhjb3VudCsrKTtcbiAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShXVUpJRV9TQ1JJUFRfSUQsIHNjcmlwdFRhZyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRhZ0Zyb21TY3JpcHQoZWxlbWVudDogSFRNTFNjcmlwdEVsZW1lbnQpOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKGlzU2NyaXB0RWxlbWVudChlbGVtZW50KSkge1xuICAgIHJldHVybiBlbGVtZW50LmdldEF0dHJpYnV0ZShXVUpJRV9TQ1JJUFRfSUQpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vLyDlkIjlubbnvJPlrZhcbmV4cG9ydCBmdW5jdGlvbiBtZXJnZU9wdGlvbnMob3B0aW9uczogY2FjaGVPcHRpb25zLCBjYWNoZU9wdGlvbnM6IGNhY2hlT3B0aW9ucykge1xuICByZXR1cm4ge1xuICAgIG5hbWU6IG9wdGlvbnMubmFtZSxcbiAgICBlbDogb3B0aW9ucy5lbCB8fCBjYWNoZU9wdGlvbnM/LmVsLFxuICAgIHVybDogb3B0aW9ucy51cmwgfHwgY2FjaGVPcHRpb25zPy51cmwsXG4gICAgaHRtbDogb3B0aW9ucy5odG1sIHx8IGNhY2hlT3B0aW9ucz8uaHRtbCxcbiAgICBleGVjOiBvcHRpb25zLmV4ZWMgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuZXhlYyA6IGNhY2hlT3B0aW9ucz8uZXhlYyxcbiAgICByZXBsYWNlOiBvcHRpb25zLnJlcGxhY2UgfHwgY2FjaGVPcHRpb25zPy5yZXBsYWNlLFxuICAgIGZldGNoOiBvcHRpb25zLmZldGNoIHx8IGNhY2hlT3B0aW9ucz8uZmV0Y2gsXG4gICAgcHJvcHM6IG9wdGlvbnMucHJvcHMgfHwgY2FjaGVPcHRpb25zPy5wcm9wcyxcbiAgICBzeW5jOiBvcHRpb25zLnN5bmMgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuc3luYyA6IGNhY2hlT3B0aW9ucz8uc3luYyxcbiAgICBwcmVmaXg6IG9wdGlvbnMucHJlZml4IHx8IGNhY2hlT3B0aW9ucz8ucHJlZml4LFxuICAgIGxvYWRpbmc6IG9wdGlvbnMubG9hZGluZyB8fCBjYWNoZU9wdGlvbnM/LmxvYWRpbmcsXG4gICAgLy8g6buY6K6kIHt9XG4gICAgYXR0cnM6IG9wdGlvbnMuYXR0cnMgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuYXR0cnMgOiBjYWNoZU9wdGlvbnM/LmF0dHJzIHx8IHt9LFxuICAgIGRlZ3JhZGVBdHRyczogb3B0aW9ucy5kZWdyYWRlQXR0cnMgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuZGVncmFkZUF0dHJzIDogY2FjaGVPcHRpb25zPy5kZWdyYWRlQXR0cnMgfHwge30sXG4gICAgLy8g6buY6K6kIHRydWVcbiAgICBmaWJlcjogb3B0aW9ucy5maWJlciAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5maWJlciA6IGNhY2hlT3B0aW9ucz8uZmliZXIgIT09IHVuZGVmaW5lZCA/IGNhY2hlT3B0aW9ucz8uZmliZXIgOiB0cnVlLFxuICAgIGFsaXZlOiBvcHRpb25zLmFsaXZlICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmFsaXZlIDogY2FjaGVPcHRpb25zPy5hbGl2ZSxcbiAgICBkZWdyYWRlOiBvcHRpb25zLmRlZ3JhZGUgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuZGVncmFkZSA6IGNhY2hlT3B0aW9ucz8uZGVncmFkZSxcbiAgICBwbHVnaW5zOiBvcHRpb25zLnBsdWdpbnMgfHwgY2FjaGVPcHRpb25zPy5wbHVnaW5zLFxuICAgIGlmcmFtZUFkZEV2ZW50TGlzdGVuZXJzOiBvcHRpb25zLmlmcmFtZUFkZEV2ZW50TGlzdGVuZXJzIHx8IGNhY2hlT3B0aW9ucz8uaWZyYW1lQWRkRXZlbnRMaXN0ZW5lcnMgfHwgW10sXG4gICAgaWZyYW1lT25FdmVudHM6IG9wdGlvbnMuaWZyYW1lT25FdmVudHMgfHwgY2FjaGVPcHRpb25zPy5pZnJhbWVPbkV2ZW50cyB8fCBbXSxcbiAgICBsaWZlY3ljbGVzOiB7XG4gICAgICBiZWZvcmVMb2FkOiBvcHRpb25zLmJlZm9yZUxvYWQgfHwgY2FjaGVPcHRpb25zPy5iZWZvcmVMb2FkLFxuICAgICAgYmVmb3JlTW91bnQ6IG9wdGlvbnMuYmVmb3JlTW91bnQgfHwgY2FjaGVPcHRpb25zPy5iZWZvcmVNb3VudCxcbiAgICAgIGFmdGVyTW91bnQ6IG9wdGlvbnMuYWZ0ZXJNb3VudCB8fCBjYWNoZU9wdGlvbnM/LmFmdGVyTW91bnQsXG4gICAgICBiZWZvcmVVbm1vdW50OiBvcHRpb25zLmJlZm9yZVVubW91bnQgfHwgY2FjaGVPcHRpb25zPy5iZWZvcmVVbm1vdW50LFxuICAgICAgYWZ0ZXJVbm1vdW50OiBvcHRpb25zLmFmdGVyVW5tb3VudCB8fCBjYWNoZU9wdGlvbnM/LmFmdGVyVW5tb3VudCxcbiAgICAgIGFjdGl2YXRlZDogb3B0aW9ucy5hY3RpdmF0ZWQgfHwgY2FjaGVPcHRpb25zPy5hY3RpdmF0ZWQsXG4gICAgICBkZWFjdGl2YXRlZDogb3B0aW9ucy5kZWFjdGl2YXRlZCB8fCBjYWNoZU9wdGlvbnM/LmRlYWN0aXZhdGVkLFxuICAgICAgbG9hZEVycm9yOiBvcHRpb25zLmxvYWRFcnJvciB8fCBjYWNoZU9wdGlvbnM/LmxvYWRFcnJvcixcbiAgICB9LFxuICB9O1xufVxuXG4vKipcbiAqIOS6i+S7tuinpuWPkeWZqFxuICovXG5leHBvcnQgZnVuY3Rpb24gZXZlbnRUcmlnZ2VyKGVsOiBIVE1MRWxlbWVudCB8IFdpbmRvdyB8IERvY3VtZW50LCBldmVudE5hbWU6IHN0cmluZywgZGV0YWlsPzogYW55KSB7XG4gIGxldCBldmVudDtcbiAgaWYgKHR5cGVvZiB3aW5kb3cuQ3VzdG9tRXZlbnQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KGV2ZW50TmFtZSwgeyBkZXRhaWwgfSk7XG4gIH0gZWxzZSB7XG4gICAgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkN1c3RvbUV2ZW50XCIpO1xuICAgIGV2ZW50LmluaXRDdXN0b21FdmVudChldmVudE5hbWUsIHRydWUsIGZhbHNlLCBkZXRhaWwpO1xuICB9XG4gIGVsLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RvcE1haW5BcHBSdW4oKSB7XG4gIHdhcm4oV1VKSUVfVElQU19TVE9QX0FQUF9ERVRBSUwpO1xuICB0aHJvdyBuZXcgRXJyb3IoV1VKSUVfVElQU19TVE9QX0FQUCk7XG59XG4iXSwibWFwcGluZ3MiOiI7O0FBQUEsU0FDRUEsZUFBZSxFQUNmQyxpQkFBaUIsRUFDakJDLFlBQVksRUFDWkMsbUJBQW1CLEVBQ25CQywwQkFBMEIsUUFDckIsWUFBWTtBQUduQixPQUFPLFNBQVNDLE9BQU9BLENBQUlDLEtBQWMsRUFBTztFQUM5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