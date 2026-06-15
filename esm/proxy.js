import { patchElementEffect, renderIframeReplaceApp } from "./iframe";
import { renderElementToContainer } from "./shadow";
import { pushUrlToWindow } from "./sync";
import { documentProxyProperties, rawDocumentQuerySelector } from "./common";
import { WUJIE_TIPS_RELOAD_DISABLED, WUJIE_TIPS_GET_ELEMENT_BY_ID } from "./constant";
import { getTargetValue, anchorElementGenerator, getDegradeIframe, isCallable, checkProxyFunction, warn, stopMainAppRun } from "./utils";

/**
 * location href 的set劫持操作
 */
function locationHrefSet(iframe, value, appHostPath) {
  var _iframe$contentWindow = iframe.contentWindow.__WUJIE,
    shadowRoot = _iframe$contentWindow.shadowRoot,
    id = _iframe$contentWindow.id,
    degrade = _iframe$contentWindow.degrade,
    document = _iframe$contentWindow.document,
    degradeAttrs = _iframe$contentWindow.degradeAttrs;
  var url = value;
  if (!/^http/.test(url)) {
    var hrefElement = anchorElementGenerator(url);
    url = appHostPath + hrefElement.pathname + hrefElement.search + hrefElement.hash;
    hrefElement = null;
  }
  iframe.contentWindow.__WUJIE.hrefFlag = true;
  if (degrade) {
    var iframeBody = rawDocumentQuerySelector.call(iframe.contentDocument, "body");
    renderElementToContainer(document.documentElement, iframeBody);
    renderIframeReplaceApp(window.decodeURIComponent(url), getDegradeIframe(id).parentElement, degradeAttrs);
  } else renderIframeReplaceApp(url, shadowRoot.host.parentElement, degradeAttrs);
  pushUrlToWindow(id, url);
  return true;
}

/**
 * 非降级情况下window、document、location代理
 */
export function proxyGenerator(iframe, urlElement, mainHostPath, appHostPath) {
  var _Proxy$revocable = Proxy.revocable(iframe.contentWindow, {
      get: function get(target, p) {
        // location进行劫持
        if (p === "location") {
          return target.__WUJIE.proxyLocation;
        }
        // 判断自身
        if (p === "self" || p === "window" && Object.getOwnPropertyDescriptor(window, "window").get) {
          return target.__WUJIE.proxy;
        }
        // 不要绑定this
        if (p === "__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__" || p === "__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR_ALL__") {
          return target[p];
        }
        // https://262.ecma-international.org/8.0/#sec-proxy-object-internal-methods-and-internal-slots-get-p-receiver
        var descriptor = Object.getOwnPropertyDescriptor(target, p);
        if ((descriptor === null || descriptor === void 0 ? void 0 : descriptor.configurable) === false && (descriptor === null || descriptor === void 0 ? void 0 : descriptor.writable) === false) {
          return target[p];
        }
        // 修正this指针指向
        return getTargetValue(target, p);
      },
      set: function set(target, p, value) {
        checkProxyFunction(target, value);
        target[p] = value;
        return true;
      },
      has: function has(target, p) {
        return p in target;
      }
    }),
    proxyWindow = _Proxy$revocable.proxy,
    revokeWindow = _Proxy$revocable.revoke;

  // proxy document
  var _Proxy$revocable2 = Proxy.revocable({}, {
      get: function get(_fakeDocument, propKey) {
        var document = window.document;
        var _iframe$contentWindow2 = iframe.contentWindow.__WUJIE,
          shadowRoot = _iframe$contentWindow2.shadowRoot,
          proxyLocation = _iframe$contentWindow2.proxyLocation;
        // iframe初始化完成后，webcomponent还未挂在上去，此时运行了主应用代码，必须中止
        if (!shadowRoot) stopMainAppRun();
        var rawCreateElement = iframe.contentWindow.__WUJIE_RAW_DOCUMENT_CREATE_ELEMENT__;
        var rawCreateTextNode = iframe.contentWindow.__WUJIE_RAW_DOCUMENT_CREATE_TEXT_NODE__;
        // need fix
        if (propKey === "createElement" || propKey === "createTextNode") {
          return new Proxy(document[propKey], {
            apply: function apply(_createElement, _ctx, args) {
              var rawCreateMethod = propKey === "createElement" ? rawCreateElement : rawCreateTextNode;
              var element = rawCreateMethod.apply(iframe.contentDocument, args);
              patchElementEffect(element, iframe.contentWindow);
              return element;
            }
          });
        }
        if (propKey === "documentURI" || propKey === "URL") {
          return proxyLocation.href;
        }

        // from shadowRoot
        if (propKey === "getElementsByTagName" || propKey === "getElementsByClassName" || propKey === "getElementsByName") {
          return new Proxy(shadowRoot.querySelectorAll, {
            apply: function apply(querySelectorAll, _ctx, args) {
              var arg = args[0];
              if (_ctx !== iframe.contentDocument) {
                return _ctx[propKey].apply(_ctx, args);
              }
              if (propKey === "getElementsByTagName" && arg === "script") {
                return iframe.contentDocument.scripts;
              }
              if (propKey === "getElementsByClassName") arg = "." + arg;
              if (propKey === "getElementsByName") arg = "[name=\"".concat(arg, "\"]");

              // FIXME: This string must be a valid CSS selector string; if it's not, a SyntaxError exception is thrown;
              // so we should ensure that the program can execute normally in case of exceptions.
              // reference: https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll

              var res;
              try {
                res = querySelectorAll.call(shadowRoot, arg);
              } catch (error) {
                res = [];
              }
              return res;
            }
          });
        }
        if (propKey === "getElementById") {
          return new Proxy(shadowRoot.querySelector, {
            // case document.querySelector.call
            apply: function apply(target, ctx, args) {
              if (ctx !== iframe.contentDocument) {
                var _ctx$propKey;
                return (_ctx$propKey = ctx[propKey]) === null || _ctx$propKey === void 0 ? void 0 : _ctx$propKey.apply(ctx, args);
              }
              try {
                return target.call(shadowRoot, "[id=\"".concat(args[0], "\"]")) || iframe.contentWindow.__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__.call(iframe.contentWindow.document, "#".concat(args[0]));
              } catch (error) {
                warn(WUJIE_TIPS_GET_ELEMENT_BY_ID);
                return null;
              }
            }
          });
        }
        if (propKey === "querySelector" || propKey === "querySelectorAll") {
          var rawPropMap = {
            querySelector: "__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__",
            querySelectorAll: "__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR_ALL__"
          };
          return new Proxy(shadowRoot[propKey], {
            apply: function apply(target, ctx, args) {
              if (ctx !== iframe.contentDocument) {
                var _ctx$propKey2;
                return (_ctx$propKey2 = ctx[propKey]) === null || _ctx$propKey2 === void 0 ? void 0 : _ctx$propKey2.apply(ctx, args);
              }
              // 二选一，优先shadowDom，除非采用array合并，排除base，防止对router造成影响
              return target.apply(shadowRoot, args) || (args[0] === "base" ? null : iframe.contentWindow[rawPropMap[propKey]].call(iframe.contentWindow.document, args[0]));
            }
          });
        }
        if (propKey === "documentElement" || propKey === "scrollingElement") return shadowRoot.firstElementChild;
        if (propKey === "forms") return shadowRoot.querySelectorAll("form");
        if (propKey === "images") return shadowRoot.querySelectorAll("img");
        if (propKey === "links") return shadowRoot.querySelectorAll("a");
        var ownerProperties = documentProxyProperties.ownerProperties,
          shadowProperties = documentProxyProperties.shadowProperties,
          shadowMethods = documentProxyProperties.shadowMethods,
          documentProperties = documentProxyProperties.documentProperties,
          documentMethods = documentProxyProperties.documentMethods;
        if (ownerProperties.concat(shadowProperties).includes(propKey.toString())) {
          if (propKey === "activeElement" && shadowRoot.activeElement === null) return shadowRoot.body;
          return shadowRoot[propKey];
        }
        if (shadowMethods.includes(propKey.toString())) {
          var _getTargetValue;
          return (_getTargetValue = getTargetValue(shadowRoot, propKey)) !== null && _getTargetValue !== void 0 ? _getTargetValue : getTargetValue(document, propKey);
        }
        // from window.document
        if (documentProperties.includes(propKey.toString())) {
          return document[propKey];
        }
        if (documentMethods.includes(propKey.toString())) {
          return getTargetValue(document, propKey);
        }
      }
    }),
    proxyDocument = _Proxy$revocable2.proxy,
    revokeDocument = _Proxy$revocable2.revoke;

  // proxy location
  var _Proxy$revocable3 = Proxy.revocable({}, {
      get: function get(_fakeLocation, propKey) {
        var location = iframe.contentWindow.location;
        if (propKey === "host" || propKey === "hostname" || propKey === "protocol" || propKey === "port" || propKey === "origin") {
          return urlElement[propKey];
        }
        if (propKey === "href") {
          return location[propKey].replace(mainHostPath, appHostPath);
        }
        if (propKey === "reload") {
          warn(WUJIE_TIPS_RELOAD_DISABLED);
          return function () {
            return null;
          };
        }
        if (propKey === "replace") {
          return new Proxy(location[propKey], {
            apply: function apply(replace, _ctx, args) {
              var _args$;
              return replace.call(location, (_args$ = args[0]) === null || _args$ === void 0 ? void 0 : _args$.replace(appHostPath, mainHostPath));
            }
          });
        }
        return getTargetValue(location, propKey);
      },
      set: function set(_fakeLocation, propKey, value) {
        // 如果是跳转链接的话重开一个iframe
        if (propKey === "href") {
          return locationHrefSet(iframe, value, appHostPath);
        }
        iframe.contentWindow.location[propKey] = value;
        return true;
      },
      ownKeys: function ownKeys() {
        return Object.keys(iframe.contentWindow.location).filter(function (key) {
          return key !== "reload";
        });
      },
      getOwnPropertyDescriptor: function getOwnPropertyDescriptor(_target, key) {
        return {
          enumerable: true,
          configurable: true,
          value: this[key]
        };
      }
    }),
    proxyLocation = _Proxy$revocable3.proxy,
    revokeLocation = _Proxy$revocable3.revoke;
  // revoke 后引擎清空代理的 [[ProxyTarget]] / [[ProxyHandler]]，使捕获了 iframe / urlElement
  // 的 handler 闭包不可达，从而释放对 iframe 的强引用
  var proxyRevoke = function proxyRevoke() {
    revokeWindow();
    revokeDocument();
    revokeLocation();
  };
  return {
    proxyWindow: proxyWindow,
    proxyDocument: proxyDocument,
    proxyLocation: proxyLocation,
    proxyRevoke: proxyRevoke
  };
}

/**
 * 降级情况下document、location代理处理
 */
export function localGenerator(iframe, urlElement, mainHostPath, appHostPath) {
  // 降级模式无法使用 Proxy.revocable，改用可清空的引用：getter 闭包统一通过 iframeRef /
  // sandboxRef / locationRef 这三个 let 绑定访问 DOM，proxyRevoke 时置 null，闭包即丢失
  // 对 iframe 的强引用，斩断「主应用 → 代理闭包 → iframe」的引用链。
  var iframeRef = iframe;
  var sandboxRef = iframe.contentWindow.__WUJIE;
  var locationRef = iframe.contentWindow.location;
  // 代理 document
  var proxyDocument = {};
  // 特殊处理
  Object.defineProperties(proxyDocument, {
    createElement: {
      get: function get() {
        return function () {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          var element = iframeRef.contentWindow.__WUJIE_RAW_DOCUMENT_CREATE_ELEMENT__.apply(iframeRef.contentDocument, args);
          patchElementEffect(element, iframeRef.contentWindow);
          return element;
        };
      }
    },
    createTextNode: {
      get: function get() {
        return function () {
          for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
          }
          var element = iframeRef.contentWindow.__WUJIE_RAW_DOCUMENT_CREATE_TEXT_NODE__.apply(iframeRef.contentDocument, args);
          patchElementEffect(element, iframeRef.contentWindow);
          return element;
        };
      }
    },
    documentURI: {
      get: function get() {
        var _sandboxRef;
        return (_sandboxRef = sandboxRef) === null || _sandboxRef === void 0 || (_sandboxRef = _sandboxRef.proxyLocation) === null || _sandboxRef === void 0 ? void 0 : _sandboxRef.href;
      }
    },
    URL: {
      get: function get() {
        var _sandboxRef2;
        return (_sandboxRef2 = sandboxRef) === null || _sandboxRef2 === void 0 || (_sandboxRef2 = _sandboxRef2.proxyLocation) === null || _sandboxRef2 === void 0 ? void 0 : _sandboxRef2.href;
      }
    },
    getElementsByTagName: {
      get: function get() {
        return function () {
          var tagName = arguments.length <= 0 ? undefined : arguments[0];
          if (tagName === "script") {
            return iframeRef.contentDocument.scripts;
          }
          return sandboxRef.document.getElementsByTagName(tagName);
        };
      }
    },
    getElementById: {
      get: function get() {
        return function () {
          var id = arguments.length <= 0 ? undefined : arguments[0];
          return sandboxRef.document.getElementById(id) || iframeRef.contentWindow.__WUJIE_RAW_DOCUMENT_HEAD__.querySelector("#".concat(id));
        };
      }
    }
  });
  // 普通处理
  var modifyLocalProperties = documentProxyProperties.modifyLocalProperties,
    modifyProperties = documentProxyProperties.modifyProperties,
    ownerProperties = documentProxyProperties.ownerProperties,
    shadowProperties = documentProxyProperties.shadowProperties,
    shadowMethods = documentProxyProperties.shadowMethods,
    documentProperties = documentProxyProperties.documentProperties,
    documentMethods = documentProxyProperties.documentMethods;
  modifyProperties.filter(function (key) {
    return !modifyLocalProperties.includes(key);
  }).concat(ownerProperties, shadowProperties, shadowMethods, documentProperties, documentMethods).forEach(function (key) {
    Object.defineProperty(proxyDocument, key, {
      get: function get() {
        var _sandboxRef3;
        var value = (_sandboxRef3 = sandboxRef) === null || _sandboxRef3 === void 0 || (_sandboxRef3 = _sandboxRef3.document) === null || _sandboxRef3 === void 0 ? void 0 : _sandboxRef3[key];
        return isCallable(value) ? value.bind(sandboxRef.document) : value;
      }
    });
  });

  // 代理 location
  var proxyLocation = {};
  var locationKeys = Object.keys(locationRef);
  var constantKey = ["host", "hostname", "port", "protocol", "port"];
  constantKey.forEach(function (key) {
    proxyLocation[key] = urlElement[key];
  });
  Object.defineProperties(proxyLocation, {
    href: {
      get: function get() {
        var _locationRef;
        return (_locationRef = locationRef) === null || _locationRef === void 0 ? void 0 : _locationRef.href.replace(mainHostPath, appHostPath);
      },
      set: function set(value) {
        locationHrefSet(iframeRef, value, appHostPath);
      }
    },
    reload: {
      get: function get() {
        warn(WUJIE_TIPS_RELOAD_DISABLED);
        return function () {
          return null;
        };
      }
    }
  });
  locationKeys.filter(function (key) {
    return !constantKey.concat(["href", "reload"]).includes(key);
  }).forEach(function (key) {
    Object.defineProperty(proxyLocation, key, {
      get: function get() {
        var _locationRef2, _locationRef3;
        return isCallable((_locationRef2 = locationRef) === null || _locationRef2 === void 0 ? void 0 : _locationRef2[key]) ? locationRef[key].bind(locationRef) : (_locationRef3 = locationRef) === null || _locationRef3 === void 0 ? void 0 : _locationRef3[key];
      }
    });
  });
  // 置空捕获的 DOM 引用，斩断 getter 闭包对 iframe / location / sandbox 的强引用
  var proxyRevoke = function proxyRevoke() {
    iframeRef = null;
    sandboxRef = null;
    locationRef = null;
  };
  return {
    proxyDocument: proxyDocument,
    proxyLocation: proxyLocation,
    proxyRevoke: proxyRevoke
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwYXRjaEVsZW1lbnRFZmZlY3QiLCJyZW5kZXJJZnJhbWVSZXBsYWNlQXBwIiwicmVuZGVyRWxlbWVudFRvQ29udGFpbmVyIiwicHVzaFVybFRvV2luZG93IiwiZG9jdW1lbnRQcm94eVByb3BlcnRpZXMiLCJyYXdEb2N1bWVudFF1ZXJ5U2VsZWN0b3IiLCJXVUpJRV9USVBTX1JFTE9BRF9ESVNBQkxFRCIsIldVSklFX1RJUFNfR0VUX0VMRU1FTlRfQllfSUQiLCJnZXRUYXJnZXRWYWx1ZSIsImFuY2hvckVsZW1lbnRHZW5lcmF0b3IiLCJnZXREZWdyYWRlSWZyYW1lIiwiaXNDYWxsYWJsZSIsImNoZWNrUHJveHlGdW5jdGlvbiIsIndhcm4iLCJzdG9wTWFpbkFwcFJ1biIsImxvY2F0aW9uSHJlZlNldCIsImlmcmFtZSIsInZhbHVlIiwiYXBwSG9zdFBhdGgiLCJfaWZyYW1lJGNvbnRlbnRXaW5kb3ciLCJjb250ZW50V2luZG93IiwiX19XVUpJRSIsInNoYWRvd1Jvb3QiLCJpZCIsImRlZ3JhZGUiLCJkb2N1bWVudCIsImRlZ3JhZGVBdHRycyIsInVybCIsInRlc3QiLCJocmVmRWxlbWVudCIsInBhdGhuYW1lIiwic2VhcmNoIiwiaGFzaCIsImhyZWZGbGFnIiwiaWZyYW1lQm9keSIsImNhbGwiLCJjb250ZW50RG9jdW1lbnQiLCJkb2N1bWVudEVsZW1lbnQiLCJ3aW5kb3ciLCJkZWNvZGVVUklDb21wb25lbnQiLCJwYXJlbnRFbGVtZW50IiwiaG9zdCIsInByb3h5R2VuZXJhdG9yIiwidXJsRWxlbWVudCIsIm1haW5Ib3N0UGF0aCIsIl9Qcm94eSRyZXZvY2FibGUiLCJQcm94eSIsInJldm9jYWJsZSIsImdldCIsInRhcmdldCIsInAiLCJwcm94eUxvY2F0aW9uIiwiT2JqZWN0IiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIiwicHJveHkiLCJkZXNjcmlwdG9yIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJzZXQiLCJoYXMiLCJwcm94eVdpbmRvdyIsInJldm9rZVdpbmRvdyIsInJldm9rZSIsIl9Qcm94eSRyZXZvY2FibGUyIiwiX2Zha2VEb2N1bWVudCIsInByb3BLZXkiLCJfaWZyYW1lJGNvbnRlbnRXaW5kb3cyIiwicmF3Q3JlYXRlRWxlbWVudCIsIl9fV1VKSUVfUkFXX0RPQ1VNRU5UX0NSRUFURV9FTEVNRU5UX18iLCJyYXdDcmVhdGVUZXh0Tm9kZSIsIl9fV1VKSUVfUkFXX0RPQ1VNRU5UX0NSRUFURV9URVhUX05PREVfXyIsImFwcGx5IiwiX2NyZWF0ZUVsZW1lbnQiLCJfY3R4IiwiYXJncyIsInJhd0NyZWF0ZU1ldGhvZCIsImVsZW1lbnQiLCJocmVmIiwicXVlcnlTZWxlY3RvckFsbCIsImFyZyIsInNjcmlwdHMiLCJjb25jYXQiLCJyZXMiLCJlcnJvciIsInF1ZXJ5U2VsZWN0b3IiLCJjdHgiLCJfY3R4JHByb3BLZXkiLCJfX1dVSklFX1JBV19ET0NVTUVOVF9RVUVSWV9TRUxFQ1RPUl9fIiwicmF3UHJvcE1hcCIsIl9jdHgkcHJvcEtleTIiLCJmaXJzdEVsZW1lbnRDaGlsZCIsIm93bmVyUHJvcGVydGllcyIsInNoYWRvd1Byb3BlcnRpZXMiLCJzaGFkb3dNZXRob2RzIiwiZG9jdW1lbnRQcm9wZXJ0aWVzIiwiZG9jdW1lbnRNZXRob2RzIiwiaW5jbHVkZXMiLCJ0b1N0cmluZyIsImFjdGl2ZUVsZW1lbnQiLCJib2R5IiwiX2dldFRhcmdldFZhbHVlIiwicHJveHlEb2N1bWVudCIsInJldm9rZURvY3VtZW50IiwiX1Byb3h5JHJldm9jYWJsZTMiLCJfZmFrZUxvY2F0aW9uIiwibG9jYXRpb24iLCJyZXBsYWNlIiwiX2FyZ3MkIiwib3duS2V5cyIsImtleXMiLCJmaWx0ZXIiLCJrZXkiLCJfdGFyZ2V0IiwiZW51bWVyYWJsZSIsInJldm9rZUxvY2F0aW9uIiwicHJveHlSZXZva2UiLCJsb2NhbEdlbmVyYXRvciIsImlmcmFtZVJlZiIsInNhbmRib3hSZWYiLCJsb2NhdGlvblJlZiIsImRlZmluZVByb3BlcnRpZXMiLCJjcmVhdGVFbGVtZW50IiwiX2xlbiIsImFyZ3VtZW50cyIsImxlbmd0aCIsIkFycmF5IiwiX2tleSIsImNyZWF0ZVRleHROb2RlIiwiX2xlbjIiLCJfa2V5MiIsImRvY3VtZW50VVJJIiwiX3NhbmRib3hSZWYiLCJVUkwiLCJfc2FuZGJveFJlZjIiLCJnZXRFbGVtZW50c0J5VGFnTmFtZSIsInRhZ05hbWUiLCJ1bmRlZmluZWQiLCJnZXRFbGVtZW50QnlJZCIsIl9fV1VKSUVfUkFXX0RPQ1VNRU5UX0hFQURfXyIsIm1vZGlmeUxvY2FsUHJvcGVydGllcyIsIm1vZGlmeVByb3BlcnRpZXMiLCJmb3JFYWNoIiwiZGVmaW5lUHJvcGVydHkiLCJfc2FuZGJveFJlZjMiLCJiaW5kIiwibG9jYXRpb25LZXlzIiwiY29uc3RhbnRLZXkiLCJfbG9jYXRpb25SZWYiLCJyZWxvYWQiLCJfbG9jYXRpb25SZWYyIiwiX2xvY2F0aW9uUmVmMyJdLCJzb3VyY2VzIjpbIi4uL3NyYy9wcm94eS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwYXRjaEVsZW1lbnRFZmZlY3QsIHJlbmRlcklmcmFtZVJlcGxhY2VBcHAgfSBmcm9tIFwiLi9pZnJhbWVcIjtcbmltcG9ydCB7IHJlbmRlckVsZW1lbnRUb0NvbnRhaW5lciB9IGZyb20gXCIuL3NoYWRvd1wiO1xuaW1wb3J0IHsgcHVzaFVybFRvV2luZG93IH0gZnJvbSBcIi4vc3luY1wiO1xuaW1wb3J0IHsgZG9jdW1lbnRQcm94eVByb3BlcnRpZXMsIHJhd0RvY3VtZW50UXVlcnlTZWxlY3RvciB9IGZyb20gXCIuL2NvbW1vblwiO1xuaW1wb3J0IHsgV1VKSUVfVElQU19SRUxPQURfRElTQUJMRUQsIFdVSklFX1RJUFNfR0VUX0VMRU1FTlRfQllfSUQgfSBmcm9tIFwiLi9jb25zdGFudFwiO1xuaW1wb3J0IHtcbiAgZ2V0VGFyZ2V0VmFsdWUsXG4gIGFuY2hvckVsZW1lbnRHZW5lcmF0b3IsXG4gIGdldERlZ3JhZGVJZnJhbWUsXG4gIGlzQ2FsbGFibGUsXG4gIGNoZWNrUHJveHlGdW5jdGlvbixcbiAgd2FybixcbiAgc3RvcE1haW5BcHBSdW4sXG59IGZyb20gXCIuL3V0aWxzXCI7XG5cbi8qKlxuICogbG9jYXRpb24gaHJlZiDnmoRzZXTliqvmjIHmk43kvZxcbiAqL1xuZnVuY3Rpb24gbG9jYXRpb25IcmVmU2V0KGlmcmFtZTogSFRNTElGcmFtZUVsZW1lbnQsIHZhbHVlOiBzdHJpbmcsIGFwcEhvc3RQYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgeyBzaGFkb3dSb290LCBpZCwgZGVncmFkZSwgZG9jdW1lbnQsIGRlZ3JhZGVBdHRycyB9ID0gaWZyYW1lLmNvbnRlbnRXaW5kb3cuX19XVUpJRTtcbiAgbGV0IHVybCA9IHZhbHVlO1xuICBpZiAoIS9eaHR0cC8udGVzdCh1cmwpKSB7XG4gICAgbGV0IGhyZWZFbGVtZW50ID0gYW5jaG9yRWxlbWVudEdlbmVyYXRvcih1cmwpO1xuICAgIHVybCA9IGFwcEhvc3RQYXRoICsgaHJlZkVsZW1lbnQucGF0aG5hbWUgKyBocmVmRWxlbWVudC5zZWFyY2ggKyBocmVmRWxlbWVudC5oYXNoO1xuICAgIGhyZWZFbGVtZW50ID0gbnVsbDtcbiAgfVxuICBpZnJhbWUuY29udGVudFdpbmRvdy5fX1dVSklFLmhyZWZGbGFnID0gdHJ1ZTtcbiAgaWYgKGRlZ3JhZGUpIHtcbiAgICBjb25zdCBpZnJhbWVCb2R5ID0gcmF3RG9jdW1lbnRRdWVyeVNlbGVjdG9yLmNhbGwoaWZyYW1lLmNvbnRlbnREb2N1bWVudCwgXCJib2R5XCIpO1xuICAgIHJlbmRlckVsZW1lbnRUb0NvbnRhaW5lcihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsIGlmcmFtZUJvZHkpO1xuICAgIHJlbmRlcklmcmFtZVJlcGxhY2VBcHAod2luZG93LmRlY29kZVVSSUNvbXBvbmVudCh1cmwpLCBnZXREZWdyYWRlSWZyYW1lKGlkKS5wYXJlbnRFbGVtZW50LCBkZWdyYWRlQXR0cnMpO1xuICB9IGVsc2UgcmVuZGVySWZyYW1lUmVwbGFjZUFwcCh1cmwsIHNoYWRvd1Jvb3QuaG9zdC5wYXJlbnRFbGVtZW50LCBkZWdyYWRlQXR0cnMpO1xuICBwdXNoVXJsVG9XaW5kb3coaWQsIHVybCk7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIOmdnumZjee6p+aDheWGteS4i3dpbmRvd+OAgWRvY3VtZW5044CBbG9jYXRpb27ku6PnkIZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3h5R2VuZXJhdG9yKFxuICBpZnJhbWU6IEhUTUxJRnJhbWVFbGVtZW50LFxuICB1cmxFbGVtZW50OiBIVE1MQW5jaG9yRWxlbWVudCxcbiAgbWFpbkhvc3RQYXRoOiBzdHJpbmcsXG4gIGFwcEhvc3RQYXRoOiBzdHJpbmdcbik6IHtcbiAgcHJveHlXaW5kb3c6IFdpbmRvdztcbiAgcHJveHlEb2N1bWVudDogT2JqZWN0O1xuICBwcm94eUxvY2F0aW9uOiBPYmplY3Q7XG4gIHByb3h5UmV2b2tlOiAoKSA9PiB2b2lkO1xufSB7XG4gIGNvbnN0IHsgcHJveHk6IHByb3h5V2luZG93LCByZXZva2U6IHJldm9rZVdpbmRvdyB9ID0gUHJveHkucmV2b2NhYmxlKGlmcmFtZS5jb250ZW50V2luZG93LCB7XG4gICAgZ2V0OiAodGFyZ2V0OiBXaW5kb3csIHA6IFByb3BlcnR5S2V5KTogYW55ID0+IHtcbiAgICAgIC8vIGxvY2F0aW9u6L+b6KGM5Yqr5oyBXG4gICAgICBpZiAocCA9PT0gXCJsb2NhdGlvblwiKSB7XG4gICAgICAgIHJldHVybiB0YXJnZXQuX19XVUpJRS5wcm94eUxvY2F0aW9uO1xuICAgICAgfVxuICAgICAgLy8g5Yik5pat6Ieq6LqrXG4gICAgICBpZiAocCA9PT0gXCJzZWxmXCIgfHwgKHAgPT09IFwid2luZG93XCIgJiYgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih3aW5kb3csIFwid2luZG93XCIpLmdldCkpIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldC5fX1dVSklFLnByb3h5O1xuICAgICAgfVxuICAgICAgLy8g5LiN6KaB57uR5a6adGhpc1xuICAgICAgaWYgKHAgPT09IFwiX19XVUpJRV9SQVdfRE9DVU1FTlRfUVVFUllfU0VMRUNUT1JfX1wiIHx8IHAgPT09IFwiX19XVUpJRV9SQVdfRE9DVU1FTlRfUVVFUllfU0VMRUNUT1JfQUxMX19cIikge1xuICAgICAgICByZXR1cm4gdGFyZ2V0W3BdO1xuICAgICAgfVxuICAgICAgLy8gaHR0cHM6Ly8yNjIuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy84LjAvI3NlYy1wcm94eS1vYmplY3QtaW50ZXJuYWwtbWV0aG9kcy1hbmQtaW50ZXJuYWwtc2xvdHMtZ2V0LXAtcmVjZWl2ZXJcbiAgICAgIGNvbnN0IGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwgcCk7XG4gICAgICBpZiAoZGVzY3JpcHRvcj8uY29uZmlndXJhYmxlID09PSBmYWxzZSAmJiBkZXNjcmlwdG9yPy53cml0YWJsZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldFtwXTtcbiAgICAgIH1cbiAgICAgIC8vIOS/ruato3RoaXPmjIfpkojmjIflkJFcbiAgICAgIHJldHVybiBnZXRUYXJnZXRWYWx1ZSh0YXJnZXQsIHApO1xuICAgIH0sXG5cbiAgICBzZXQ6ICh0YXJnZXQ6IFdpbmRvdywgcDogUHJvcGVydHlLZXksIHZhbHVlOiBhbnkpID0+IHtcbiAgICAgIGNoZWNrUHJveHlGdW5jdGlvbih0YXJnZXQsIHZhbHVlKTtcbiAgICAgIHRhcmdldFtwXSA9IHZhbHVlO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIGhhczogKHRhcmdldDogV2luZG93LCBwOiBQcm9wZXJ0eUtleSkgPT4gcCBpbiB0YXJnZXQsXG4gIH0pO1xuXG4gIC8vIHByb3h5IGRvY3VtZW50XG4gIGNvbnN0IHsgcHJveHk6IHByb3h5RG9jdW1lbnQsIHJldm9rZTogcmV2b2tlRG9jdW1lbnQgfSA9IFByb3h5LnJldm9jYWJsZShcbiAgICB7fSxcbiAgICB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uIChfZmFrZURvY3VtZW50LCBwcm9wS2V5KSB7XG4gICAgICAgIGNvbnN0IGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50O1xuICAgICAgICBjb25zdCB7IHNoYWRvd1Jvb3QsIHByb3h5TG9jYXRpb24gfSA9IGlmcmFtZS5jb250ZW50V2luZG93Ll9fV1VKSUU7XG4gICAgICAgIC8vIGlmcmFtZeWIneWni+WMluWujOaIkOWQju+8jHdlYmNvbXBvbmVudOi/mOacquaMguWcqOS4iuWOu++8jOatpOaXtui/kOihjOS6huS4u+W6lOeUqOS7o+egge+8jOW/hemhu+S4reatolxuICAgICAgICBpZiAoIXNoYWRvd1Jvb3QpIHN0b3BNYWluQXBwUnVuKCk7XG4gICAgICAgIGNvbnN0IHJhd0NyZWF0ZUVsZW1lbnQgPSBpZnJhbWUuY29udGVudFdpbmRvdy5fX1dVSklFX1JBV19ET0NVTUVOVF9DUkVBVEVfRUxFTUVOVF9fO1xuICAgICAgICBjb25zdCByYXdDcmVhdGVUZXh0Tm9kZSA9IGlmcmFtZS5jb250ZW50V2luZG93Ll9fV1VKSUVfUkFXX0RPQ1VNRU5UX0NSRUFURV9URVhUX05PREVfXztcbiAgICAgICAgLy8gbmVlZCBmaXhcbiAgICAgICAgaWYgKHByb3BLZXkgPT09IFwiY3JlYXRlRWxlbWVudFwiIHx8IHByb3BLZXkgPT09IFwiY3JlYXRlVGV4dE5vZGVcIikge1xuICAgICAgICAgIHJldHVybiBuZXcgUHJveHkoZG9jdW1lbnRbcHJvcEtleV0sIHtcbiAgICAgICAgICAgIGFwcGx5KF9jcmVhdGVFbGVtZW50LCBfY3R4LCBhcmdzKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHJhd0NyZWF0ZU1ldGhvZCA9IHByb3BLZXkgPT09IFwiY3JlYXRlRWxlbWVudFwiID8gcmF3Q3JlYXRlRWxlbWVudCA6IHJhd0NyZWF0ZVRleHROb2RlO1xuICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gcmF3Q3JlYXRlTWV0aG9kLmFwcGx5KGlmcmFtZS5jb250ZW50RG9jdW1lbnQsIGFyZ3MpO1xuICAgICAgICAgICAgICBwYXRjaEVsZW1lbnRFZmZlY3QoZWxlbWVudCwgaWZyYW1lLmNvbnRlbnRXaW5kb3cpO1xuICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByb3BLZXkgPT09IFwiZG9jdW1lbnRVUklcIiB8fCBwcm9wS2V5ID09PSBcIlVSTFwiKSB7XG4gICAgICAgICAgcmV0dXJuIChwcm94eUxvY2F0aW9uIGFzIExvY2F0aW9uKS5ocmVmO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZnJvbSBzaGFkb3dSb290XG4gICAgICAgIGlmIChcbiAgICAgICAgICBwcm9wS2V5ID09PSBcImdldEVsZW1lbnRzQnlUYWdOYW1lXCIgfHxcbiAgICAgICAgICBwcm9wS2V5ID09PSBcImdldEVsZW1lbnRzQnlDbGFzc05hbWVcIiB8fFxuICAgICAgICAgIHByb3BLZXkgPT09IFwiZ2V0RWxlbWVudHNCeU5hbWVcIlxuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm4gbmV3IFByb3h5KHNoYWRvd1Jvb3QucXVlcnlTZWxlY3RvckFsbCwge1xuICAgICAgICAgICAgYXBwbHkocXVlcnlTZWxlY3RvckFsbCwgX2N0eCwgYXJncykge1xuICAgICAgICAgICAgICBsZXQgYXJnID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgaWYgKF9jdHggIT09IGlmcmFtZS5jb250ZW50RG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2N0eFtwcm9wS2V5XS5hcHBseShfY3R4LCBhcmdzKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChwcm9wS2V5ID09PSBcImdldEVsZW1lbnRzQnlUYWdOYW1lXCIgJiYgYXJnID09PSBcInNjcmlwdFwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmcmFtZS5jb250ZW50RG9jdW1lbnQuc2NyaXB0cztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAocHJvcEtleSA9PT0gXCJnZXRFbGVtZW50c0J5Q2xhc3NOYW1lXCIpIGFyZyA9IFwiLlwiICsgYXJnO1xuICAgICAgICAgICAgICBpZiAocHJvcEtleSA9PT0gXCJnZXRFbGVtZW50c0J5TmFtZVwiKSBhcmcgPSBgW25hbWU9XCIke2FyZ31cIl1gO1xuXG4gICAgICAgICAgICAgIC8vIEZJWE1FOiBUaGlzIHN0cmluZyBtdXN0IGJlIGEgdmFsaWQgQ1NTIHNlbGVjdG9yIHN0cmluZzsgaWYgaXQncyBub3QsIGEgU3ludGF4RXJyb3IgZXhjZXB0aW9uIGlzIHRocm93bjtcbiAgICAgICAgICAgICAgLy8gc28gd2Ugc2hvdWxkIGVuc3VyZSB0aGF0IHRoZSBwcm9ncmFtIGNhbiBleGVjdXRlIG5vcm1hbGx5IGluIGNhc2Ugb2YgZXhjZXB0aW9ucy5cbiAgICAgICAgICAgICAgLy8gcmVmZXJlbmNlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRG9jdW1lbnQvcXVlcnlTZWxlY3RvckFsbFxuXG4gICAgICAgICAgICAgIGxldCByZXM6IE5vZGVMaXN0W10gfCBbXTtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXMgPSBxdWVyeVNlbGVjdG9yQWxsLmNhbGwoc2hhZG93Um9vdCwgYXJnKTtcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZXMgPSBbXTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwcm9wS2V5ID09PSBcImdldEVsZW1lbnRCeUlkXCIpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IFByb3h5KHNoYWRvd1Jvb3QucXVlcnlTZWxlY3Rvciwge1xuICAgICAgICAgICAgLy8gY2FzZSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yLmNhbGxcbiAgICAgICAgICAgIGFwcGx5KHRhcmdldCwgY3R4LCBhcmdzKSB7XG4gICAgICAgICAgICAgIGlmIChjdHggIT09IGlmcmFtZS5jb250ZW50RG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3R4W3Byb3BLZXldPy5hcHBseShjdHgsIGFyZ3MpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgIHRhcmdldC5jYWxsKHNoYWRvd1Jvb3QsIGBbaWQ9XCIke2FyZ3NbMF19XCJdYCkgfHxcbiAgICAgICAgICAgICAgICAgIGlmcmFtZS5jb250ZW50V2luZG93Ll9fV1VKSUVfUkFXX0RPQ1VNRU5UX1FVRVJZX1NFTEVDVE9SX18uY2FsbChcbiAgICAgICAgICAgICAgICAgICAgaWZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGAjJHthcmdzWzBdfWBcbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHdhcm4oV1VKSUVfVElQU19HRVRfRUxFTUVOVF9CWV9JRCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByb3BLZXkgPT09IFwicXVlcnlTZWxlY3RvclwiIHx8IHByb3BLZXkgPT09IFwicXVlcnlTZWxlY3RvckFsbFwiKSB7XG4gICAgICAgICAgY29uc3QgcmF3UHJvcE1hcCA9IHtcbiAgICAgICAgICAgIHF1ZXJ5U2VsZWN0b3I6IFwiX19XVUpJRV9SQVdfRE9DVU1FTlRfUVVFUllfU0VMRUNUT1JfX1wiLFxuICAgICAgICAgICAgcXVlcnlTZWxlY3RvckFsbDogXCJfX1dVSklFX1JBV19ET0NVTUVOVF9RVUVSWV9TRUxFQ1RPUl9BTExfX1wiLFxuICAgICAgICAgIH07XG4gICAgICAgICAgcmV0dXJuIG5ldyBQcm94eShzaGFkb3dSb290W3Byb3BLZXldLCB7XG4gICAgICAgICAgICBhcHBseSh0YXJnZXQsIGN0eCwgYXJncykge1xuICAgICAgICAgICAgICBpZiAoY3R4ICE9PSBpZnJhbWUuY29udGVudERvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN0eFtwcm9wS2V5XT8uYXBwbHkoY3R4LCBhcmdzKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyDkuozpgInkuIDvvIzkvJjlhYhzaGFkb3dEb23vvIzpmaTpnZ7ph4fnlKhhcnJheeWQiOW5tu+8jOaOkumZpGJhc2XvvIzpmLLmraLlr7lyb3V0ZXLpgKDmiJDlvbHlk41cbiAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICB0YXJnZXQuYXBwbHkoc2hhZG93Um9vdCwgYXJncykgfHxcbiAgICAgICAgICAgICAgICAoYXJnc1swXSA9PT0gXCJiYXNlXCJcbiAgICAgICAgICAgICAgICAgID8gbnVsbFxuICAgICAgICAgICAgICAgICAgOiBpZnJhbWUuY29udGVudFdpbmRvd1tyYXdQcm9wTWFwW3Byb3BLZXldXS5jYWxsKGlmcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50LCBhcmdzWzBdKSlcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByb3BLZXkgPT09IFwiZG9jdW1lbnRFbGVtZW50XCIgfHwgcHJvcEtleSA9PT0gXCJzY3JvbGxpbmdFbGVtZW50XCIpIHJldHVybiBzaGFkb3dSb290LmZpcnN0RWxlbWVudENoaWxkO1xuICAgICAgICBpZiAocHJvcEtleSA9PT0gXCJmb3Jtc1wiKSByZXR1cm4gc2hhZG93Um9vdC5xdWVyeVNlbGVjdG9yQWxsKFwiZm9ybVwiKTtcbiAgICAgICAgaWYgKHByb3BLZXkgPT09IFwiaW1hZ2VzXCIpIHJldHVybiBzaGFkb3dSb290LnF1ZXJ5U2VsZWN0b3JBbGwoXCJpbWdcIik7XG4gICAgICAgIGlmIChwcm9wS2V5ID09PSBcImxpbmtzXCIpIHJldHVybiBzaGFkb3dSb290LnF1ZXJ5U2VsZWN0b3JBbGwoXCJhXCIpO1xuICAgICAgICBjb25zdCB7IG93bmVyUHJvcGVydGllcywgc2hhZG93UHJvcGVydGllcywgc2hhZG93TWV0aG9kcywgZG9jdW1lbnRQcm9wZXJ0aWVzLCBkb2N1bWVudE1ldGhvZHMgfSA9XG4gICAgICAgICAgZG9jdW1lbnRQcm94eVByb3BlcnRpZXM7XG4gICAgICAgIGlmIChvd25lclByb3BlcnRpZXMuY29uY2F0KHNoYWRvd1Byb3BlcnRpZXMpLmluY2x1ZGVzKHByb3BLZXkudG9TdHJpbmcoKSkpIHtcbiAgICAgICAgICBpZiAocHJvcEtleSA9PT0gXCJhY3RpdmVFbGVtZW50XCIgJiYgc2hhZG93Um9vdC5hY3RpdmVFbGVtZW50ID09PSBudWxsKSByZXR1cm4gc2hhZG93Um9vdC5ib2R5O1xuICAgICAgICAgIHJldHVybiBzaGFkb3dSb290W3Byb3BLZXldO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzaGFkb3dNZXRob2RzLmluY2x1ZGVzKHByb3BLZXkudG9TdHJpbmcoKSkpIHtcbiAgICAgICAgICByZXR1cm4gZ2V0VGFyZ2V0VmFsdWUoc2hhZG93Um9vdCwgcHJvcEtleSkgPz8gZ2V0VGFyZ2V0VmFsdWUoZG9jdW1lbnQsIHByb3BLZXkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGZyb20gd2luZG93LmRvY3VtZW50XG4gICAgICAgIGlmIChkb2N1bWVudFByb3BlcnRpZXMuaW5jbHVkZXMocHJvcEtleS50b1N0cmluZygpKSkge1xuICAgICAgICAgIHJldHVybiBkb2N1bWVudFtwcm9wS2V5XTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZG9jdW1lbnRNZXRob2RzLmluY2x1ZGVzKHByb3BLZXkudG9TdHJpbmcoKSkpIHtcbiAgICAgICAgICByZXR1cm4gZ2V0VGFyZ2V0VmFsdWUoZG9jdW1lbnQsIHByb3BLZXkpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH1cbiAgKTtcblxuICAvLyBwcm94eSBsb2NhdGlvblxuICBjb25zdCB7IHByb3h5OiBwcm94eUxvY2F0aW9uLCByZXZva2U6IHJldm9rZUxvY2F0aW9uIH0gPSBQcm94eS5yZXZvY2FibGUoXG4gICAge30sXG4gICAge1xuICAgICAgZ2V0OiBmdW5jdGlvbiAoX2Zha2VMb2NhdGlvbiwgcHJvcEtleSkge1xuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IGlmcmFtZS5jb250ZW50V2luZG93LmxvY2F0aW9uO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgcHJvcEtleSA9PT0gXCJob3N0XCIgfHxcbiAgICAgICAgICBwcm9wS2V5ID09PSBcImhvc3RuYW1lXCIgfHxcbiAgICAgICAgICBwcm9wS2V5ID09PSBcInByb3RvY29sXCIgfHxcbiAgICAgICAgICBwcm9wS2V5ID09PSBcInBvcnRcIiB8fFxuICAgICAgICAgIHByb3BLZXkgPT09IFwib3JpZ2luXCJcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuIHVybEVsZW1lbnRbcHJvcEtleV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByb3BLZXkgPT09IFwiaHJlZlwiKSB7XG4gICAgICAgICAgcmV0dXJuIGxvY2F0aW9uW3Byb3BLZXldLnJlcGxhY2UobWFpbkhvc3RQYXRoLCBhcHBIb3N0UGF0aCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByb3BLZXkgPT09IFwicmVsb2FkXCIpIHtcbiAgICAgICAgICB3YXJuKFdVSklFX1RJUFNfUkVMT0FEX0RJU0FCTEVEKTtcbiAgICAgICAgICByZXR1cm4gKCkgPT4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJvcEtleSA9PT0gXCJyZXBsYWNlXCIpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IFByb3h5KGxvY2F0aW9uW3Byb3BLZXldLCB7XG4gICAgICAgICAgICBhcHBseShyZXBsYWNlLCBfY3R4LCBhcmdzKSB7XG4gICAgICAgICAgICAgIHJldHVybiByZXBsYWNlLmNhbGwobG9jYXRpb24sIGFyZ3NbMF0/LnJlcGxhY2UoYXBwSG9zdFBhdGgsIG1haW5Ib3N0UGF0aCkpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZ2V0VGFyZ2V0VmFsdWUobG9jYXRpb24sIHByb3BLZXkpO1xuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24gKF9mYWtlTG9jYXRpb24sIHByb3BLZXksIHZhbHVlKSB7XG4gICAgICAgIC8vIOWmguaenOaYr+i3s+i9rOmTvuaOpeeahOivnemHjeW8gOS4gOS4qmlmcmFtZVxuICAgICAgICBpZiAocHJvcEtleSA9PT0gXCJocmVmXCIpIHtcbiAgICAgICAgICByZXR1cm4gbG9jYXRpb25IcmVmU2V0KGlmcmFtZSwgdmFsdWUsIGFwcEhvc3RQYXRoKTtcbiAgICAgICAgfVxuICAgICAgICBpZnJhbWUuY29udGVudFdpbmRvdy5sb2NhdGlvbltwcm9wS2V5XSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG4gICAgICBvd25LZXlzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhpZnJhbWUuY29udGVudFdpbmRvdy5sb2NhdGlvbikuZmlsdGVyKChrZXkpID0+IGtleSAhPT0gXCJyZWxvYWRcIik7XG4gICAgICB9LFxuICAgICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yOiBmdW5jdGlvbiAoX3RhcmdldCwga2V5KSB7XG4gICAgICAgIHJldHVybiB7IGVudW1lcmFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgdmFsdWU6IHRoaXNba2V5XSB9O1xuICAgICAgfSxcbiAgICB9XG4gICk7XG4gIC8vIHJldm9rZSDlkI7lvJXmk47muIXnqbrku6PnkIbnmoQgW1tQcm94eVRhcmdldF1dIC8gW1tQcm94eUhhbmRsZXJdXe+8jOS9v+aNleiOt+S6hiBpZnJhbWUgLyB1cmxFbGVtZW50XG4gIC8vIOeahCBoYW5kbGVyIOmXreWMheS4jeWPr+i+vu+8jOS7juiAjOmHiuaUvuWvuSBpZnJhbWUg55qE5by65byV55SoXG4gIGNvbnN0IHByb3h5UmV2b2tlID0gKCkgPT4ge1xuICAgIHJldm9rZVdpbmRvdygpO1xuICAgIHJldm9rZURvY3VtZW50KCk7XG4gICAgcmV2b2tlTG9jYXRpb24oKTtcbiAgfTtcbiAgcmV0dXJuIHsgcHJveHlXaW5kb3csIHByb3h5RG9jdW1lbnQsIHByb3h5TG9jYXRpb24sIHByb3h5UmV2b2tlIH07XG59XG5cbi8qKlxuICog6ZmN57qn5oOF5Ya15LiLZG9jdW1lbnTjgIFsb2NhdGlvbuS7o+eQhuWkhOeQhlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9jYWxHZW5lcmF0b3IoXG4gIGlmcmFtZTogSFRNTElGcmFtZUVsZW1lbnQsXG4gIHVybEVsZW1lbnQ6IEhUTUxBbmNob3JFbGVtZW50LFxuICBtYWluSG9zdFBhdGg6IHN0cmluZyxcbiAgYXBwSG9zdFBhdGg6IHN0cmluZ1xuKToge1xuICBwcm94eURvY3VtZW50OiBPYmplY3Q7XG4gIHByb3h5TG9jYXRpb246IE9iamVjdDtcbiAgcHJveHlSZXZva2U6ICgpID0+IHZvaWQ7XG59IHtcbiAgLy8g6ZmN57qn5qih5byP5peg5rOV5L2/55SoIFByb3h5LnJldm9jYWJsZe+8jOaUueeUqOWPr+a4heepuueahOW8leeUqO+8mmdldHRlciDpl63ljIXnu5/kuIDpgJrov4cgaWZyYW1lUmVmIC9cbiAgLy8gc2FuZGJveFJlZiAvIGxvY2F0aW9uUmVmIOi/meS4ieS4qiBsZXQg57uR5a6a6K6/6ZeuIERPTe+8jHByb3h5UmV2b2tlIOaXtue9riBudWxs77yM6Zet5YyF5Y2z5Lii5aSxXG4gIC8vIOWvuSBpZnJhbWUg55qE5by65byV55So77yM5pap5pat44CM5Li75bqU55SoIOKGkiDku6PnkIbpl63ljIUg4oaSIGlmcmFtZeOAjeeahOW8leeUqOmTvuOAglxuICBsZXQgaWZyYW1lUmVmOiBIVE1MSUZyYW1lRWxlbWVudCB8IG51bGwgPSBpZnJhbWU7XG4gIGxldCBzYW5kYm94UmVmID0gaWZyYW1lLmNvbnRlbnRXaW5kb3cuX19XVUpJRTtcbiAgbGV0IGxvY2F0aW9uUmVmOiBMb2NhdGlvbiB8IG51bGwgPSBpZnJhbWUuY29udGVudFdpbmRvdy5sb2NhdGlvbjtcbiAgLy8g5Luj55CGIGRvY3VtZW50XG4gIGNvbnN0IHByb3h5RG9jdW1lbnQgPSB7fTtcbiAgLy8g54m55q6K5aSE55CGXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHByb3h5RG9jdW1lbnQsIHtcbiAgICBjcmVhdGVFbGVtZW50OiB7XG4gICAgICBnZXQ6ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgICAgY29uc3QgZWxlbWVudCA9IGlmcmFtZVJlZi5jb250ZW50V2luZG93Ll9fV1VKSUVfUkFXX0RPQ1VNRU5UX0NSRUFURV9FTEVNRU5UX18uYXBwbHkoXG4gICAgICAgICAgICBpZnJhbWVSZWYuY29udGVudERvY3VtZW50LFxuICAgICAgICAgICAgYXJnc1xuICAgICAgICAgICk7XG4gICAgICAgICAgcGF0Y2hFbGVtZW50RWZmZWN0KGVsZW1lbnQsIGlmcmFtZVJlZi5jb250ZW50V2luZG93KTtcbiAgICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgfSxcbiAgICBjcmVhdGVUZXh0Tm9kZToge1xuICAgICAgZ2V0OiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBpZnJhbWVSZWYuY29udGVudFdpbmRvdy5fX1dVSklFX1JBV19ET0NVTUVOVF9DUkVBVEVfVEVYVF9OT0RFX18uYXBwbHkoXG4gICAgICAgICAgICBpZnJhbWVSZWYuY29udGVudERvY3VtZW50LFxuICAgICAgICAgICAgYXJnc1xuICAgICAgICAgICk7XG4gICAgICAgICAgcGF0Y2hFbGVtZW50RWZmZWN0KGVsZW1lbnQsIGlmcmFtZVJlZi5jb250ZW50V2luZG93KTtcbiAgICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgfSxcbiAgICBkb2N1bWVudFVSSToge1xuICAgICAgZ2V0OiAoKSA9PiAoc2FuZGJveFJlZj8ucHJveHlMb2NhdGlvbiBhcyBMb2NhdGlvbik/LmhyZWYsXG4gICAgfSxcbiAgICBVUkw6IHtcbiAgICAgIGdldDogKCkgPT4gKHNhbmRib3hSZWY/LnByb3h5TG9jYXRpb24gYXMgTG9jYXRpb24pPy5ocmVmLFxuICAgIH0sXG4gICAgZ2V0RWxlbWVudHNCeVRhZ05hbWU6IHtcbiAgICAgIGdldCgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgICAgY29uc3QgdGFnTmFtZSA9IGFyZ3NbMF07XG4gICAgICAgICAgaWYgKHRhZ05hbWUgPT09IFwic2NyaXB0XCIpIHtcbiAgICAgICAgICAgIHJldHVybiBpZnJhbWVSZWYuY29udGVudERvY3VtZW50LnNjcmlwdHMgYXMgYW55O1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gc2FuZGJveFJlZi5kb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWdOYW1lKSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICB9LFxuICAgIH0sXG4gICAgZ2V0RWxlbWVudEJ5SWQ6IHtcbiAgICAgIGdldCgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgICAgY29uc3QgaWQgPSBhcmdzWzBdO1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAoc2FuZGJveFJlZi5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkgYXMgYW55KSB8fFxuICAgICAgICAgICAgaWZyYW1lUmVmLmNvbnRlbnRXaW5kb3cuX19XVUpJRV9SQVdfRE9DVU1FTlRfSEVBRF9fLnF1ZXJ5U2VsZWN0b3IoYCMke2lkfWApXG4gICAgICAgICAgKTtcbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgfSxcbiAgfSk7XG4gIC8vIOaZrumAmuWkhOeQhlxuICBjb25zdCB7XG4gICAgbW9kaWZ5TG9jYWxQcm9wZXJ0aWVzLFxuICAgIG1vZGlmeVByb3BlcnRpZXMsXG4gICAgb3duZXJQcm9wZXJ0aWVzLFxuICAgIHNoYWRvd1Byb3BlcnRpZXMsXG4gICAgc2hhZG93TWV0aG9kcyxcbiAgICBkb2N1bWVudFByb3BlcnRpZXMsXG4gICAgZG9jdW1lbnRNZXRob2RzLFxuICB9ID0gZG9jdW1lbnRQcm94eVByb3BlcnRpZXM7XG4gIG1vZGlmeVByb3BlcnRpZXNcbiAgICAuZmlsdGVyKChrZXkpID0+ICFtb2RpZnlMb2NhbFByb3BlcnRpZXMuaW5jbHVkZXMoa2V5KSlcbiAgICAuY29uY2F0KG93bmVyUHJvcGVydGllcywgc2hhZG93UHJvcGVydGllcywgc2hhZG93TWV0aG9kcywgZG9jdW1lbnRQcm9wZXJ0aWVzLCBkb2N1bWVudE1ldGhvZHMpXG4gICAgLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3h5RG9jdW1lbnQsIGtleSwge1xuICAgICAgICBnZXQ6ICgpID0+IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IHNhbmRib3hSZWY/LmRvY3VtZW50Py5ba2V5XTtcbiAgICAgICAgICByZXR1cm4gaXNDYWxsYWJsZSh2YWx1ZSkgPyB2YWx1ZS5iaW5kKHNhbmRib3hSZWYuZG9jdW1lbnQpIDogdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAvLyDku6PnkIYgbG9jYXRpb25cbiAgY29uc3QgcHJveHlMb2NhdGlvbiA9IHt9O1xuICBjb25zdCBsb2NhdGlvbktleXMgPSBPYmplY3Qua2V5cyhsb2NhdGlvblJlZik7XG4gIGNvbnN0IGNvbnN0YW50S2V5ID0gW1wiaG9zdFwiLCBcImhvc3RuYW1lXCIsIFwicG9ydFwiLCBcInByb3RvY29sXCIsIFwicG9ydFwiXTtcbiAgY29uc3RhbnRLZXkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgcHJveHlMb2NhdGlvbltrZXldID0gdXJsRWxlbWVudFtrZXldO1xuICB9KTtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMocHJveHlMb2NhdGlvbiwge1xuICAgIGhyZWY6IHtcbiAgICAgIGdldDogKCkgPT4gbG9jYXRpb25SZWY/LmhyZWYucmVwbGFjZShtYWluSG9zdFBhdGgsIGFwcEhvc3RQYXRoKSxcbiAgICAgIHNldDogKHZhbHVlKSA9PiB7XG4gICAgICAgIGxvY2F0aW9uSHJlZlNldChpZnJhbWVSZWYsIHZhbHVlLCBhcHBIb3N0UGF0aCk7XG4gICAgICB9LFxuICAgIH0sXG4gICAgcmVsb2FkOiB7XG4gICAgICBnZXQoKSB7XG4gICAgICAgIHdhcm4oV1VKSUVfVElQU19SRUxPQURfRElTQUJMRUQpO1xuICAgICAgICByZXR1cm4gKCkgPT4gbnVsbDtcbiAgICAgIH0sXG4gICAgfSxcbiAgfSk7XG4gIGxvY2F0aW9uS2V5c1xuICAgIC5maWx0ZXIoKGtleSkgPT4gIWNvbnN0YW50S2V5LmNvbmNhdChbXCJocmVmXCIsIFwicmVsb2FkXCJdKS5pbmNsdWRlcyhrZXkpKVxuICAgIC5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm94eUxvY2F0aW9uLCBrZXksIHtcbiAgICAgICAgZ2V0OiAoKSA9PiAoaXNDYWxsYWJsZShsb2NhdGlvblJlZj8uW2tleV0pID8gbG9jYXRpb25SZWZba2V5XS5iaW5kKGxvY2F0aW9uUmVmKSA6IGxvY2F0aW9uUmVmPy5ba2V5XSksXG4gICAgICB9KTtcbiAgICB9KTtcbiAgLy8g572u56m65o2V6I6355qEIERPTSDlvJXnlKjvvIzmlqnmlq0gZ2V0dGVyIOmXreWMheWvuSBpZnJhbWUgLyBsb2NhdGlvbiAvIHNhbmRib3gg55qE5by65byV55SoXG4gIGNvbnN0IHByb3h5UmV2b2tlID0gKCkgPT4ge1xuICAgIGlmcmFtZVJlZiA9IG51bGw7XG4gICAgc2FuZGJveFJlZiA9IG51bGw7XG4gICAgbG9jYXRpb25SZWYgPSBudWxsO1xuICB9O1xuICByZXR1cm4geyBwcm94eURvY3VtZW50LCBwcm94eUxvY2F0aW9uLCBwcm94eVJldm9rZSB9O1xufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxTQUFTQSxrQkFBa0IsRUFBRUMsc0JBQXNCLFFBQVEsVUFBVTtBQUNyRSxTQUFTQyx3QkFBd0IsUUFBUSxVQUFVO0FBQ25ELFNBQVNDLGVBQWUsUUFBUSxRQUFRO0FBQ3hDLFNBQVNDLHVCQUF1QixFQUFFQyx3QkFBd0IsUUFBUSxVQUFVO0FBQzVFLFNBQVNDLDBCQUEwQixFQUFFQyw0QkFBNEIsUUFBUSxZQUFZO0FBQ3JGLFNBQ0VDLGNBQWMsRUFDZEMsc0JBQXNCLEVBQ3RCQyxnQkFBZ0IsRUFDaEJDLFVBQVUsRUFDVkMsa0JBQWtCLEVBQ2xCQyxJQUFJLEVBQ0pDLGNBQWMsUUFDVCxTQUFTOztBQUVoQjtBQUNBO0FBQ0E7QUFDQSxTQUFTQyxlQUFlQSxDQUFDQyxNQUF5QixFQUFFQyxLQUFhLEVBQUVDLFdBQW1CLEVBQVc7RUFDL0YsSUFBQUMscUJBQUEsR0FBNERILE1BQU0sQ0FBQ0ksYUFBYSxDQUFDQyxPQUFPO0lBQWhGQyxVQUFVLEdBQUFILHFCQUFBLENBQVZHLFVBQVU7SUFBRUMsRUFBRSxHQUFBSixxQkFBQSxDQUFGSSxFQUFFO0lBQUVDLE9BQU8sR0FBQUwscUJBQUEsQ0FBUEssT0FBTztJQUFFQyxRQUFRLEdBQUFOLHFCQUFBLENBQVJNLFFBQVE7SUFBRUMsWUFBWSxHQUFBUCxxQkFBQSxDQUFaTyxZQUFZO0VBQ3ZELElBQUlDLEdBQUcsR0FBR1YsS0FBSztFQUNmLElBQUksQ0FBQyxPQUFPLENBQUNXLElBQUksQ0FBQ0QsR0FBRyxDQUFDLEVBQUU7SUFDdEIsSUFBSUUsV0FBVyxHQUFHcEIsc0JBQXNCLENBQUNrQixHQUFHLENBQUM7SUFDN0NBLEdBQUcs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QUFBO1FBQUEsUUFBQUEsWUFBQSxHQUFRNUIsV0FBVyxjQUFBNEIsWUFBQSx1QkFBWEEsWUFBQSxDQUFhdEUsSUFBSSxDQUFDNkIsT0FBTyxDQUFDOUQsWUFBWSxFQUFFMUIsV0FBVyxDQUFDO01BQUE7TUFDL0R3QyxHQUFHLEVBQUUsU0FBTEEsR0FBR0EsQ0FBR3pDLEtBQUssRUFBSztRQUNkRixlQUFlLENBQUNzRyxTQUFTLEVBQUVwRyxLQUFLLEVBQUVDLFdBQVcsQ0FBQztNQUNoRDtJQUNGLENBQUM7SUFDRGtJLE1BQU0sRUFBRTtNQUNOcEcsR0FBRyxXQUFIQSxHQUFHQSxDQUFBLEVBQUc7UUFDSm5DLElBQUksQ0FBQ1AsMEJBQTBCLENBQUM7UUFDaEMsT0FBTztVQUFBLE9BQU0sSUFBSTtRQUFBO01BQ25CO0lBQ0Y7RUFDRixDQUFDLENBQUM7RUFDRjJJLFlBQVksQ0FDVG5DLE1BQU0sQ0FBQyxVQUFDQyxHQUFHO0lBQUEsT0FBSyxDQUFDbUMsV0FBVyxDQUFDakUsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUNlLFFBQVEsQ0FBQ2UsR0FBRyxDQUFDO0VBQUEsRUFBQyxDQUN0RThCLE9BQU8sQ0FBQyxVQUFDOUIsR0FBRyxFQUFLO0lBQ2hCM0QsTUFBTSxDQUFDMEYsY0FBYyxDQUFDM0YsYUFBYSxFQUFFNEQsR0FBRyxFQUFFO01BQ3hDL0QsR0FBRyxFQUFFLFNBQUxBLEdBQUdBLENBQUE7UUFBQSxJQUFBcUcsYUFBQSxFQUFBQyxhQUFBO1FBQUEsT0FBUzNJLFVBQVUsRUFBQTBJLGFBQUEsR0FBQzlCLFdBQVcsY0FBQThCLGFBQUEsdUJBQVhBLGFBQUEsQ0FBY3RDLEdBQUcsQ0FBQyxDQUFDLEdBQUdRLFdBQVcsQ0FBQ1IsR0FBRyxDQUFDLENBQUNpQyxJQUFJLENBQUN6QixXQUFXLENBQUMsSUFBQStCLGFBQUEsR0FBRy9CLFdBQVcsY0FBQStCLGFBQUEsdUJBQVhBLGFBQUEsQ0FBY3ZDLEdBQUcsQ0FBQztNQUFBO0lBQ3RHLENBQUMsQ0FBQztFQUNKLENBQUMsQ0FBQztFQUNKO0VBQ0EsSUFBTUksV0FBVyxHQUFHLFNBQWRBLFdBQVdBLENBQUEsRUFBUztJQUN4QkUsU0FBUyxHQUFHLElBQUk7SUFDaEJDLFVBQVUsR0FBRyxJQUFJO0lBQ2pCQyxXQUFXLEdBQUcsSUFBSTtFQUNwQixDQUFDO0VBQ0QsT0FBTztJQUFFbEIsYUFBYSxFQUFiQSxhQUFhO0lBQUVsRCxhQUFhLEVBQWJBLGFBQWE7SUFBRWdFLFdBQVcsRUFBWEE7RUFBWSxDQUFDO0FBQ3REIiwiaWdub3JlTGlzdCI6W119