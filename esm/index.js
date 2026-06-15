import _defineProperty from "@babel/runtime/helpers/defineProperty";
import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _regeneratorRuntime from "@babel/runtime/regenerator";
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
import importHTML, { processCssLoader } from "./entry";
import { initInlineEventHelper } from "./entry";
export { clearAssetsCache } from "./entry";
import WuJie from "./sandbox";
import { defineWujieWebComponent, addLoading } from "./shadow";
import { processAppForHrefJump } from "./sync";
import { getPlugins } from "./plugin";
import { wujieSupport, mergeOptions, isFunction, requestIdleCallback, isMatchSyncQueryById, warn, stopMainAppRun } from "./utils";
import { getWujieById, getOptionsById, addSandboxCacheWithOptions } from "./common";
import { EventBus } from "./event";
import { WUJIE_TIPS_NOT_SUPPORTED } from "./constant";
export var bus = new EventBus(Date.now().toString());

/**
 * 合并 preOptions 和 startOptions，并且将 url 和 el 变成可选
 */

/**
 * 强制中断主应用运行
 * wujie.__WUJIE 如果为true说明当前运行环境是子应用
 * window.__POWERED_BY_WUJIE__ 如果为false说明子应用还没初始化完成
 * 上述条件同时成立说明主应用代码在iframe的loading阶段混入进来了，必须中断执行
 */
if (window.__WUJIE && !window.__POWERED_BY_WUJIE__) {
  stopMainAppRun();
}

// 处理子应用链接跳转
processAppForHrefJump();

// 定义webComponent容器
defineWujieWebComponent();

// 如果不支持则告警
if (!wujieSupport) warn(WUJIE_TIPS_NOT_SUPPORTED);

/**
 * 缓存子应用配置
 */
export function setupApp(options) {
  if (options.name) addSandboxCacheWithOptions(options.name, options);
}

/**
 * 运行无界app
 */
export function startApp(_x) {
  return _startApp.apply(this, arguments);
}

/**
 * 预加载无界APP
 */
function _startApp() {
  _startApp = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime.mark(function _callee2(startOptions) {
    var _newSandbox$lifecycle, _newSandbox$lifecycle2;
    var sandbox, cacheOptions, options, name, url, html, replace, fetch, props, attrs, degradeAttrs, fiber, alive, degrade, sync, prefix, el, loading, plugins, lifecycles, iframeAddEventListeners, iframeOnEvents, _iframeWindow, _sandbox$lifecycles3, _sandbox$lifecycles3$, _sandbox$lifecycles2, _sandbox$lifecycles2$, _yield$importHTML2, _getExternalScripts, _sandbox$lifecycles4, _sandbox$lifecycles4$, _sandbox$lifecycles5, _sandbox$lifecycles5$, newSandbox, _yield$importHTML3, template, getExternalScripts, getExternalStyleSheets, processedHtml;
    return _regeneratorRuntime.wrap(function (_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          // 初始化内联事件处理器辅助函数
          initInlineEventHelper();
          sandbox = getWujieById(startOptions.name);
          cacheOptions = getOptionsById(startOptions.name); // 合并缓存配置
          options = mergeOptions(startOptions, cacheOptions);
          name = options.name, url = options.url, html = options.html, replace = options.replace, fetch = options.fetch, props = options.props, attrs = options.attrs, degradeAttrs = options.degradeAttrs, fiber = options.fiber, alive = options.alive, degrade = options.degrade, sync = options.sync, prefix = options.prefix, el = options.el, loading = options.loading, plugins = options.plugins, lifecycles = options.lifecycles, iframeAddEventListeners = options.iframeAddEventListeners, iframeOnEvents = options.iframeOnEvents; // 已经初始化过的应用，快速渲染
          if (!sandbox) {
            _context2.next = 9;
            break;
          }
          sandbox.plugins = getPlugins(plugins);
          sandbox.lifecycles = lifecycles;
          _iframeWindow = sandbox.iframe.contentWindow;
          if (!sandbox.preload) {
            _context2.next = 1;
            break;
          }
          _context2.next = 1;
          return sandbox.preload;
        case 1:
          if (!alive) {
            _context2.next = 5;
            break;
          }
          _context2.next = 2;
          return sandbox.active({
            url: url,
            sync: sync,
            prefix: prefix,
            el: el,
            props: props,
            alive: alive,
            fetch: fetch,
            replace: replace
          });
        case 2:
          if (sandbox.execFlag) {
            _context2.next = 4;
            break;
          }
          (_sandbox$lifecycles2 = sandbox.lifecycles) === null || _sandbox$lifecycles2 === void 0 || (_sandbox$lifecycles2$ = _sandbox$lifecycles2.beforeLoad) === null || _sandbox$lifecycles2$ === void 0 || _sandbox$lifecycles2$.call(_sandbox$lifecycles2, sandbox.iframe.contentWindow);
          _context2.next = 3;
          return importHTML({
            url: url,
            html: html,
            opts: {
              fetch: fetch || window.fetch,
              plugins: sandbox.plugins,
              loadError: sandbox.lifecycles.loadError,
              fiber: fiber
            }
          });
        case 3:
          _yield$importHTML2 = _context2.sent;
          _getExternalScripts = _yield$importHTML2.getExternalScripts;
          _context2.next = 4;
          return sandbox.start(_getExternalScripts);
        case 4:
          (_sandbox$lifecycles3 = sandbox.lifecycles) === null || _sandbox$lifecycles3 === void 0 || (_sandbox$lifecycles3$ = _sandbox$lifecycles3.activated) === null || _sandbox$lifecycles3$ === void 0 || _sandbox$lifecycles3$.call(_sandbox$lifecycles3, sandbox.iframe.contentWindow);
          return _context2.abrupt("return", function () {
            return sandbox.destroy();
          });
        case 5:
          if (!isFunction(_iframeWindow.__WUJIE_MOUNT)) {
            _context2.next = 8;
            break;
          }
          _context2.next = 6;
          return sandbox.unmount();
        case 6:
          _context2.next = 7;
          return sandbox.active({
            url: url,
            sync: sync,
            prefix: prefix,
            el: el,
            props: props,
            alive: alive,
            fetch: fetch,
            replace: replace
          });
        case 7:
          // 正常加载的情况，先注入css，最后才mount。重新激活也保持同样的时序
          sandbox.rebuildStyleSheets();
          // 有渲染函数
          (_sandbox$lifecycles4 = sandbox.lifecycles) === null || _sandbox$lifecycles4 === void 0 || (_sandbox$lifecycles4$ = _sandbox$lifecycles4.beforeMount) === null || _sandbox$lifecycles4$ === void 0 || _sandbox$lifecycles4$.call(_sandbox$lifecycles4, sandbox.iframe.contentWindow);
          _iframeWindow.__WUJIE_MOUNT();
          (_sandbox$lifecycles5 = sandbox.lifecycles) === null || _sandbox$lifecycles5 === void 0 || (_sandbox$lifecycles5$ = _sandbox$lifecycles5.afterMount) === null || _sandbox$lifecycles5$ === void 0 || _sandbox$lifecycles5$.call(_sandbox$lifecycles5, sandbox.iframe.contentWindow);
          sandbox.mountFlag = true;
          return _context2.abrupt("return", function () {
            return sandbox.destroy();
          });
        case 8:
          _context2.next = 9;
          return sandbox.destroy();
        case 9:
          // 设置loading
          addLoading(el, loading);
          newSandbox = new WuJie({
            name: name,
            url: url,
            attrs: attrs,
            degradeAttrs: degradeAttrs,
            fiber: fiber,
            degrade: degrade,
            plugins: plugins,
            lifecycles: lifecycles,
            iframeAddEventListeners: iframeAddEventListeners,
            iframeOnEvents: iframeOnEvents
          });
          (_newSandbox$lifecycle = newSandbox.lifecycles) === null || _newSandbox$lifecycle === void 0 || (_newSandbox$lifecycle2 = _newSandbox$lifecycle.beforeLoad) === null || _newSandbox$lifecycle2 === void 0 || _newSandbox$lifecycle2.call(_newSandbox$lifecycle, newSandbox.iframe.contentWindow);
          _context2.next = 10;
          return importHTML({
            url: url,
            html: html,
            opts: {
              fetch: fetch || window.fetch,
              plugins: newSandbox.plugins,
              loadError: newSandbox.lifecycles.loadError,
              fiber: fiber
            }
          });
        case 10:
          _yield$importHTML3 = _context2.sent;
          template = _yield$importHTML3.template;
          getExternalScripts = _yield$importHTML3.getExternalScripts;
          getExternalStyleSheets = _yield$importHTML3.getExternalStyleSheets;
          _context2.next = 11;
          return processCssLoader(newSandbox, template, getExternalStyleSheets);
        case 11:
          processedHtml = _context2.sent;
          _context2.next = 12;
          return newSandbox.active({
            url: url,
            sync: sync,
            prefix: prefix,
            template: processedHtml,
            el: el,
            props: props,
            alive: alive,
            fetch: fetch,
            replace: replace
          });
        case 12:
          _context2.next = 13;
          return newSandbox.start(getExternalScripts);
        case 13:
          return _context2.abrupt("return", function () {
            return newSandbox.destroy();
          });
        case 14:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return _startApp.apply(this, arguments);
}
export function preloadApp(preOptions) {
  requestIdleCallback(function () {
    /**
     * 已经存在
     * url查询参数中有子应用的id，大概率是刷新浏览器或者分享url，此时需要直接打开子应用，无需预加载
     */
    if (getWujieById(preOptions.name) || isMatchSyncQueryById(preOptions.name)) return;
    var cacheOptions = getOptionsById(preOptions.name);
    // 合并缓存配置
    var options = mergeOptions(_objectSpread({}, preOptions), cacheOptions);
    var name = options.name,
      url = options.url,
      html = options.html,
      props = options.props,
      alive = options.alive,
      replace = options.replace,
      fetch = options.fetch,
      exec = options.exec,
      attrs = options.attrs,
      degradeAttrs = options.degradeAttrs,
      fiber = options.fiber,
      degrade = options.degrade,
      prefix = options.prefix,
      plugins = options.plugins,
      lifecycles = options.lifecycles,
      iframeAddEventListeners = options.iframeAddEventListeners,
      iframeOnEvents = options.iframeOnEvents;
    var sandbox = new WuJie({
      name: name,
      url: url,
      attrs: attrs,
      degradeAttrs: degradeAttrs,
      fiber: fiber,
      degrade: degrade,
      plugins: plugins,
      lifecycles: lifecycles,
      iframeAddEventListeners: iframeAddEventListeners,
      iframeOnEvents: iframeOnEvents
    });
    if (sandbox.preload) return sandbox.preload;
    var runPreload = /*#__PURE__*/function () {
      var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
        var _sandbox$lifecycles, _sandbox$lifecycles$b;
        var _yield$importHTML, template, getExternalScripts, getExternalStyleSheets, processedHtml;
        return _regeneratorRuntime.wrap(function (_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              (_sandbox$lifecycles = sandbox.lifecycles) === null || _sandbox$lifecycles === void 0 || (_sandbox$lifecycles$b = _sandbox$lifecycles.beforeLoad) === null || _sandbox$lifecycles$b === void 0 || _sandbox$lifecycles$b.call(_sandbox$lifecycles, sandbox.iframe.contentWindow);
              _context.next = 1;
              return importHTML({
                url: url,
                html: html,
                opts: {
                  fetch: fetch || window.fetch,
                  plugins: sandbox.plugins,
                  loadError: sandbox.lifecycles.loadError,
                  fiber: fiber
                }
              });
            case 1:
              _yield$importHTML = _context.sent;
              template = _yield$importHTML.template;
              getExternalScripts = _yield$importHTML.getExternalScripts;
              getExternalStyleSheets = _yield$importHTML.getExternalStyleSheets;
              _context.next = 2;
              return processCssLoader(sandbox, template, getExternalStyleSheets);
            case 2:
              processedHtml = _context.sent;
              _context.next = 3;
              return sandbox.active({
                url: url,
                props: props,
                prefix: prefix,
                alive: alive,
                template: processedHtml,
                fetch: fetch,
                replace: replace
              });
            case 3:
              if (!exec) {
                _context.next = 5;
                break;
              }
              _context.next = 4;
              return sandbox.start(getExternalScripts);
            case 4:
              _context.next = 6;
              break;
            case 5:
              _context.next = 6;
              return getExternalScripts();
            case 6:
            case "end":
              return _context.stop();
          }
        }, _callee);
      }));
      return function runPreload() {
        return _ref.apply(this, arguments);
      };
    }();
    sandbox.preload = runPreload();
  });
}

/**
 * 销毁无界APP
 */
export function destroyApp(id) {
  var sandbox = getWujieById(id);
  if (sandbox) {
    sandbox.destroy();
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJpbXBvcnRIVE1MIiwicHJvY2Vzc0Nzc0xvYWRlciIsImluaXRJbmxpbmVFdmVudEhlbHBlciIsImNsZWFyQXNzZXRzQ2FjaGUiLCJXdUppZSIsImRlZmluZVd1amllV2ViQ29tcG9uZW50IiwiYWRkTG9hZGluZyIsInByb2Nlc3NBcHBGb3JIcmVmSnVtcCIsImdldFBsdWdpbnMiLCJ3dWppZVN1cHBvcnQiLCJtZXJnZU9wdGlvbnMiLCJpc0Z1bmN0aW9uIiwicmVxdWVzdElkbGVDYWxsYmFjayIsImlzTWF0Y2hTeW5jUXVlcnlCeUlkIiwid2FybiIsInN0b3BNYWluQXBwUnVuIiwiZ2V0V3VqaWVCeUlkIiwiZ2V0T3B0aW9uc0J5SWQiLCJhZGRTYW5kYm94Q2FjaGVXaXRoT3B0aW9ucyIsIkV2ZW50QnVzIiwiV1VKSUVfVElQU19OT1RfU1VQUE9SVEVEIiwiYnVzIiwiRGF0ZSIsIm5vdyIsInRvU3RyaW5nIiwid2luZG93IiwiX19XVUpJRSIsIl9fUE9XRVJFRF9CWV9XVUpJRV9fIiwic2V0dXBBcHAiLCJvcHRpb25zIiwibmFtZSIsInN0YXJ0QXBwIiwiX3giLCJfc3RhcnRBcHAiLCJhcHBseSIsImFyZ3VtZW50cyIsIl9hc3luY1RvR2VuZXJhdG9yIiwiX3JlZ2VuZXJhdG9yUnVudGltZSIsIm1hcmsiLCJfY2FsbGVlMiIsInN0YXJ0T3B0aW9ucyIsIl9uZXdTYW5kYm94JGxpZmVjeWNsZSIsIl9uZXdTYW5kYm94JGxpZmVjeWNsZTIiLCJzYW5kYm94IiwiY2FjaGVPcHRpb25zIiwidXJsIiwiaHRtbCIsInJlcGxhY2UiLCJmZXRjaCIsInByb3BzIiwiYXR0cnMiLCJkZWdyYWRlQXR0cnMiLCJmaWJlciIsImFsaXZlIiwiZGVncmFkZSIsInN5bmMiLCJwcmVmaXgiLCJlbCIsImxvYWRpbmciLCJwbHVnaW5zIiwibGlmZWN5Y2xlcyIsImlmcmFtZUFkZEV2ZW50TGlzdGVuZXJzIiwiaWZyYW1lT25FdmVudHMiLCJfaWZyYW1lV2luZG93IiwiX3NhbmRib3gkbGlmZWN5Y2xlczMiLCJfc2FuZGJveCRsaWZlY3ljbGVzMyQiLCJfc2FuZGJveCRsaWZlY3ljbGVzMiIsIl9zYW5kYm94JGxpZmVjeWNsZXMyJCIsIl95aWVsZCRpbXBvcnRIVE1MMiIsIl9nZXRFeHRlcm5hbFNjcmlwdHMiLCJfc2FuZGJveCRsaWZlY3ljbGVzNCIsIl9zYW5kYm94JGxpZmVjeWNsZXM0JCIsIl9zYW5kYm94JGxpZmVjeWNsZXM1IiwiX3NhbmRib3gkbGlmZWN5Y2xlczUkIiwibmV3U2FuZGJveCIsIl95aWVsZCRpbXBvcnRIVE1MMyIsInRlbXBsYXRlIiwiZ2V0RXh0ZXJuYWxTY3JpcHRzIiwiZ2V0RXh0ZXJuYWxTdHlsZVNoZWV0cyIsInByb2Nlc3NlZEh0bWwiLCJ3cmFwIiwiX2NvbnRleHQyIiwicHJldiIsIm5leHQiLCJpZnJhbWVXaW5kb3ciLCJpZnJhbWUiLCJjb250ZW50V2luZG93IiwicHJlbG9hZCIsImFjdGl2ZSIsImV4ZWNGbGFnIiwiYmVmb3JlTG9hZCIsImNhbGwiLCJvcHRzIiwibG9hZEVycm9yIiwic2VudCIsInN0YXJ0IiwiYWN0aXZhdGVkIiwiYWJydXB0IiwiZGVzdHJveSIsIl9fV1VKSUVfTU9VTlQiLCJ1bm1vdW50IiwicmVidWlsZFN0eWxlU2hlZXRzIiwiYmVmb3JlTW91bnQiLCJhZnRlck1vdW50IiwibW91bnRGbGFnIiwic3RvcCIsInByZWxvYWRBcHAiLCJwcmVPcHRpb25zIiwiX29iamVjdFNwcmVhZCIsImV4ZWMiLCJydW5QcmVsb2FkIiwiX3JlZiIsIl9jYWxsZWUiLCJfc2FuZGJveCRsaWZlY3ljbGVzIiwiX3NhbmRib3gkbGlmZWN5Y2xlcyRiIiwiX3lpZWxkJGltcG9ydEhUTUwiLCJfY29udGV4dCIsImRlc3Ryb3lBcHAiLCJpZCJdLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgaW1wb3J0SFRNTCwgeyBwcm9jZXNzQ3NzTG9hZGVyIH0gZnJvbSBcIi4vZW50cnlcIjtcbmltcG9ydCB7IGluaXRJbmxpbmVFdmVudEhlbHBlciB9IGZyb20gXCIuL2VudHJ5XCI7XG5cbmV4cG9ydCB7IGNsZWFyQXNzZXRzQ2FjaGUgfSBmcm9tIFwiLi9lbnRyeVwiO1xuaW1wb3J0IHsgU3R5bGVPYmplY3QsIFNjcmlwdEF0dHJpYnV0ZXMgfSBmcm9tIFwiLi90ZW1wbGF0ZVwiO1xuaW1wb3J0IFd1SmllLCB7IGxpZmVjeWNsZSB9IGZyb20gXCIuL3NhbmRib3hcIjtcbmltcG9ydCB7IGRlZmluZVd1amllV2ViQ29tcG9uZW50LCBhZGRMb2FkaW5nIH0gZnJvbSBcIi4vc2hhZG93XCI7XG5pbXBvcnQgeyBwcm9jZXNzQXBwRm9ySHJlZkp1bXAgfSBmcm9tIFwiLi9zeW5jXCI7XG5pbXBvcnQgeyBnZXRQbHVnaW5zIH0gZnJvbSBcIi4vcGx1Z2luXCI7XG5pbXBvcnQge1xuICB3dWppZVN1cHBvcnQsXG4gIG1lcmdlT3B0aW9ucyxcbiAgaXNGdW5jdGlvbixcbiAgcmVxdWVzdElkbGVDYWxsYmFjayxcbiAgaXNNYXRjaFN5bmNRdWVyeUJ5SWQsXG4gIHdhcm4sXG4gIHN0b3BNYWluQXBwUnVuLFxufSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IHsgZ2V0V3VqaWVCeUlkLCBnZXRPcHRpb25zQnlJZCwgYWRkU2FuZGJveENhY2hlV2l0aE9wdGlvbnMgfSBmcm9tIFwiLi9jb21tb25cIjtcbmltcG9ydCB7IEV2ZW50QnVzIH0gZnJvbSBcIi4vZXZlbnRcIjtcbmltcG9ydCB7IFdVSklFX1RJUFNfTk9UX1NVUFBPUlRFRCB9IGZyb20gXCIuL2NvbnN0YW50XCI7XG5cbmV4cG9ydCBjb25zdCBidXMgPSBuZXcgRXZlbnRCdXMoRGF0ZS5ub3coKS50b1N0cmluZygpKTtcblxuZXhwb3J0IGludGVyZmFjZSBTY3JpcHRPYmplY3RMb2FkZXIge1xuICAvKiog6ISa5pys5Zyw5Z2A77yM5YaF6IGU5Li656m6ICovXG4gIHNyYz86IHN0cmluZztcbiAgLyoqIOiEmuacrOaYr+WQpuS4um1vZHVsZeaooeWdlyAqL1xuICBtb2R1bGU/OiBib29sZWFuO1xuICAvKiog6ISa5pys5piv5ZCm5Li6YXN5bmPmiafooYwgKi9cbiAgYXN5bmM/OiBib29sZWFuO1xuICAvKiog6ISa5pys5piv5ZCm6K6+572uY3Jvc3NvcmlnaW4gKi9cbiAgY3Jvc3NvcmlnaW4/OiBib29sZWFuO1xuICAvKiog6ISa5pysY3Jvc3NvcmlnaW7nmoTnsbvlnosgKi9cbiAgY3Jvc3NvcmlnaW5UeXBlPzogXCJhbm9ueW1vdXNcIiB8IFwidXNlLWNyZWRlbnRpYWxzXCIgfCBcIlwiO1xuICAvKiog6ISa5pys5Y6f5aeL5bGe5oCnICovXG4gIGF0dHJzPzogU2NyaXB0QXR0cmlidXRlcztcbiAgLyoqIOWGheiBlHNjcmlwdOeahOS7o+eggSAqL1xuICBjb250ZW50Pzogc3RyaW5nO1xuICAvKiog5omn6KGM5Zue6LCD6ZKp5a2QICovXG4gIGNhbGxiYWNrPzogKGFwcFdpbmRvdzogV2luZG93KSA9PiBhbnk7XG4gIC8qKiDlrZDlupTnlKjliqDovb3lrozmr5Xkuovku7YgKi9cbiAgb25sb2FkPzogRnVuY3Rpb247XG59XG5leHBvcnQgaW50ZXJmYWNlIHBsdWdpbiB7XG4gIC8qKiDlpITnkIZodG1s55qEbG9hZGVyICovXG4gIGh0bWxMb2FkZXI/OiAoY29kZTogc3RyaW5nKSA9PiBzdHJpbmc7XG4gIC8qKiBqc+aOkumZpOWIl+ihqCAqL1xuICBqc0V4Y2x1ZGVzPzogQXJyYXk8c3RyaW5nIHwgUmVnRXhwPjtcbiAgLyoqIGpz5b+955Wl5YiX6KGoICovXG4gIGpzSWdub3Jlcz86IEFycmF5PHN0cmluZyB8IFJlZ0V4cD47XG4gIC8qKiDlpITnkIZqc+WKoOi9veWJjeeahGxvYWRlciAqL1xuICBqc0JlZm9yZUxvYWRlcnM/OiBBcnJheTxTY3JpcHRPYmplY3RMb2FkZXI+O1xuICAvKiog5aSE55CGanPnmoRsb2FkZXIgKi9cbiAganNMb2FkZXI/OiAoY29kZTogc3RyaW5nLCB1cmw6IHN0cmluZywgYmFzZTogc3RyaW5nKSA9PiBzdHJpbmc7XG4gIC8qKiDlpITnkIZqc+WKoOi9veWQjueahGxvYWRlciAqL1xuICBqc0FmdGVyTG9hZGVycz86IEFycmF5PFNjcmlwdE9iamVjdExvYWRlcj47XG4gIC8qKiBjc3PmjpLpmaTliJfooaggKi9cbiAgY3NzRXhjbHVkZXM/OiBBcnJheTxzdHJpbmcgfCBSZWdFeHA+O1xuICAvKiogY3Nz5b+955Wl5YiX6KGoICovXG4gIGNzc0lnbm9yZXM/OiBBcnJheTxzdHJpbmcgfCBSZWdFeHA+O1xuICAvKiog5aSE55CGY3Nz5Yqg6L295YmN55qEbG9hZGVyICovXG4gIGNzc0JlZm9yZUxvYWRlcnM/OiBBcnJheTxTdHlsZU9iamVjdD47XG4gIC8qKiDlpITnkIZjc3PnmoRsb2FkZXIgKi9cbiAgY3NzTG9hZGVyPzogKGNvZGU6IHN0cmluZywgdXJsOiBzdHJpbmcsIGJhc2U6IHN0cmluZykgPT4gc3RyaW5nO1xuICAvKiog5aSE55CGY3Nz5Yqg6L295ZCO55qEbG9hZGVyICovXG4gIGNzc0FmdGVyTG9hZGVycz86IEFycmF5PFN0eWxlT2JqZWN0PjtcbiAgLyoqIOWtkOW6lOeUqCB3aW5kb3cgYWRkRXZlbnRMaXN0ZW5lciDpkqnlrZDlm57osIMgKi9cbiAgd2luZG93QWRkRXZlbnRMaXN0ZW5lckhvb2s/OiBldmVudExpc3RlbmVySG9vaztcbiAgLyoqIOWtkOW6lOeUqCB3aW5kb3cgcmVtb3ZlRXZlbnRMaXN0ZW5lciDpkqnlrZDlm57osIMgKi9cbiAgd2luZG93UmVtb3ZlRXZlbnRMaXN0ZW5lckhvb2s/OiBldmVudExpc3RlbmVySG9vaztcbiAgLyoqIOWtkOW6lOeUqCBkb2N1bWVudCBhZGRFdmVudExpc3RlbmVyIOmSqeWtkOWbnuiwgyAqL1xuICBkb2N1bWVudEFkZEV2ZW50TGlzdGVuZXJIb29rPzogZXZlbnRMaXN0ZW5lckhvb2s7XG4gIC8qKiDlrZDlupTnlKggZG9jdW1lbnQgcmVtb3ZlRXZlbnRMaXN0ZW5lciDpkqnlrZDlm57osIMgKi9cbiAgZG9jdW1lbnRSZW1vdmVFdmVudExpc3RlbmVySG9vaz86IGV2ZW50TGlzdGVuZXJIb29rO1xuICAvKiog5a2Q5bqU55SoIOWQkWJvZHnjgIFoZWFk5o+S5YWl5YWD57Sg5ZCO5omn6KGM55qE6ZKp5a2Q5Zue6LCDICovXG4gIGFwcGVuZE9ySW5zZXJ0RWxlbWVudEhvb2s/OiA8VCBleHRlbmRzIE5vZGU+KGVsZW1lbnQ6IFQsIGlmcmFtZVdpbmRvdzogV2luZG93KSA9PiB2b2lkO1xuICAvKiog5a2Q5bqU55So5Yqr5oyB5YWD57Sg55qE6ZKp5a2Q5Zue6LCDICovXG4gIHBhdGNoRWxlbWVudEhvb2s/OiA8VCBleHRlbmRzIE5vZGU+KGVsZW1lbnQ6IFQsIGlmcmFtZVdpbmRvdzogV2luZG93KSA9PiB2b2lkO1xuICAvKiog55So5oi36Ieq5a6a5LmJ6KaG55uW5a2Q5bqU55SoIHdpbmRvdyDlsZ7mgKcgKi9cbiAgd2luZG93UHJvcGVydHlPdmVycmlkZT86IChpZnJhbWVXaW5kb3c6IFdpbmRvdykgPT4gdm9pZDtcbiAgLyoqIOeUqOaIt+iHquWumuS5ieimhuebluWtkOW6lOeUqCBkb2N1bWVudCDlsZ7mgKcgKi9cbiAgZG9jdW1lbnRQcm9wZXJ0eU92ZXJyaWRlPzogKGlmcmFtZVdpbmRvdzogV2luZG93KSA9PiB2b2lkO1xufVxuXG50eXBlIGV2ZW50TGlzdGVuZXJIb29rID0gKFxuICBpZnJhbWVXaW5kb3c6IFdpbmRvdyxcbiAgdHlwZTogc3RyaW5nLFxuICBoYW5kbGVyOiBFdmVudExpc3RlbmVyT3JFdmVudExpc3RlbmVyT2JqZWN0LFxuICBvcHRpb25zPzogYm9vbGVhbiB8IEFkZEV2ZW50TGlzdGVuZXJPcHRpb25zXG4pID0+IHZvaWQ7XG5cbmV4cG9ydCB0eXBlIGxvYWRFcnJvckhhbmRsZXIgPSAodXJsOiBzdHJpbmcsIGU6IEVycm9yKSA9PiBhbnk7XG5cbnR5cGUgYmFzZU9wdGlvbnMgPSB7XG4gIC8qKiDllK/kuIDmgKfnlKjmiLflv4Xpobvkv53or4EgKi9cbiAgbmFtZTogc3RyaW5nO1xuICAvKiog6ZyA6KaB5riy5p+T55qEdXJsICovXG4gIHVybDogc3RyaW5nO1xuICAvKiog6ZyA6KaB5riy5p+T55qEaHRtbCwg5aaC5p6c5bey5pyJ5YiZ5peg6ZyA5LuOdXJs6K+35rGCICovXG4gIGh0bWw/OiBzdHJpbmc7XG4gIC8qKiDku6PnoIHmm7/mjaLpkqnlrZAgKi9cbiAgcmVwbGFjZT86IChjb2RlOiBzdHJpbmcpID0+IHN0cmluZztcbiAgLyoqIOiHquWumuS5iWZldGNoICovXG4gIGZldGNoPzogKGlucHV0OiBSZXF1ZXN0SW5mbywgaW5pdD86IFJlcXVlc3RJbml0KSA9PiBQcm9taXNlPFJlc3BvbnNlPjtcbiAgLyoqIOazqOWFpee7meWtkOW6lOeUqOeahOWxnuaApyAqL1xuICBwcm9wcz86IHsgW2tleTogc3RyaW5nXTogYW55IH07XG4gIC8qKiDoh6rlrprkuYnov5DooYxpZnJhbWXnmoTlsZ7mgKcgKi9cbiAgYXR0cnM/OiB7IFtrZXk6IHN0cmluZ106IGFueSB9O1xuICAvKiog6Ieq5a6a5LmJ6ZmN57qn5riy5p+TaWZyYW1l55qE5bGe5oCnICovXG4gIGRlZ3JhZGVBdHRycz86IHsgW2tleTogc3RyaW5nXTogYW55IH07XG4gIC8qKiDlrZDlupTnlKjph4fnlKhmaWJlcuaooeW8j+aJp+ihjCAqL1xuICBmaWJlcj86IGJvb2xlYW47XG4gIC8qKiDlrZDlupTnlKjkv53mtLvvvIxzdGF0ZeS4jeS8muS4ouWksSAqL1xuICBhbGl2ZT86IGJvb2xlYW47XG4gIC8qKiDlrZDlupTnlKjph4fnlKjpmY3nuqdpZnJhbWXmlrnmoYggKi9cbiAgZGVncmFkZT86IGJvb2xlYW47XG4gIC8qKiDlrZDlupTnlKjmj5Lku7YgKi9cbiAgcGx1Z2lucz86IEFycmF5PHBsdWdpbj47XG4gIC8qKiDlrZDlupTnlKh3aW5kb3fnm5HlkKzkuovku7YgKi9cbiAgaWZyYW1lQWRkRXZlbnRMaXN0ZW5lcnM/OiBBcnJheTxzdHJpbmc+O1xuICAvKiog5a2Q5bqU55SoaWZyYW1lIG9u5LqL5Lu2ICovXG4gIGlmcmFtZU9uRXZlbnRzPzogQXJyYXk8c3RyaW5nPjtcbiAgLyoqIOWtkOW6lOeUqOeUn+WRveWRqOacnyAqL1xuICBiZWZvcmVMb2FkPzogbGlmZWN5Y2xlO1xuICBiZWZvcmVNb3VudD86IGxpZmVjeWNsZTtcbiAgYWZ0ZXJNb3VudD86IGxpZmVjeWNsZTtcbiAgYmVmb3JlVW5tb3VudD86IGxpZmVjeWNsZTtcbiAgYWZ0ZXJVbm1vdW50PzogbGlmZWN5Y2xlO1xuICBhY3RpdmF0ZWQ/OiBsaWZlY3ljbGU7XG4gIGRlYWN0aXZhdGVkPzogbGlmZWN5Y2xlO1xuICBsb2FkRXJyb3I/OiBsb2FkRXJyb3JIYW5kbGVyO1xufTtcblxuZXhwb3J0IHR5cGUgcHJlT3B0aW9ucyA9IE9taXQ8YmFzZU9wdGlvbnMsIFwidXJsXCI+ICYge1xuICAvKiog6aKE5omn6KGMICovXG4gIGV4ZWM/OiBib29sZWFuO1xuICB1cmw/OiBzdHJpbmc7XG59O1xuXG5leHBvcnQgdHlwZSBzdGFydE9wdGlvbnMgPSBiYXNlT3B0aW9ucyAmIHtcbiAgLyoqIOa4suafk+eahOWuueWZqCAqL1xuICBlbDogSFRNTEVsZW1lbnQgfCBzdHJpbmc7XG4gIC8qKlxuICAgKiDot6/nlLHlkIzmraXlvIDlhbNcbiAgICog5aaC5p6cZmFsc2XvvIzlrZDlupTnlKjot7PovazkuLvlupTnlKjot6/nlLHml6Dlj5jljJbvvIzkvYbmmK/kuLvlupTnlKjnmoRoaXN0b3J56L+Y5piv5Lya5aKe5YqgXG4gICAqIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2hpc3RvcnkuaHRtbCN0aGUtaGlzdG9yeS1pbnRlcmZhY2VcbiAgICovXG4gIHN5bmM/OiBib29sZWFuO1xuICAvKiog5a2Q5bqU55So55+t6Lev5b6E5pu/5o2i77yM6Lev55Sx5ZCM5q2l5pe255Sf5pWIICovXG4gIHByZWZpeD86IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH07XG4gIC8qKiDlrZDlupTnlKjliqDovb3ml7Zsb2FkaW5n5YWD57SgICovXG4gIGxvYWRpbmc/OiBIVE1MRWxlbWVudDtcbn07XG5cbnR5cGUgb3B0aW9uUHJvcGVydHkgPSBcInVybFwiIHwgXCJlbFwiO1xuXG4vKipcbiAqIOWQiOW5tiBwcmVPcHRpb25zIOWSjCBzdGFydE9wdGlvbnPvvIzlubbkuJTlsIYgdXJsIOWSjCBlbCDlj5jmiJDlj6/pgIlcbiAqL1xuZXhwb3J0IHR5cGUgY2FjaGVPcHRpb25zID0gT21pdDxwcmVPcHRpb25zICYgc3RhcnRPcHRpb25zLCBvcHRpb25Qcm9wZXJ0eT4gJlxuICBQYXJ0aWFsPFBpY2s8c3RhcnRPcHRpb25zLCBvcHRpb25Qcm9wZXJ0eT4+O1xuXG4vKipcbiAqIOW8uuWItuS4reaWreS4u+W6lOeUqOi/kOihjFxuICogd3VqaWUuX19XVUpJRSDlpoLmnpzkuLp0cnVl6K+05piO5b2T5YmN6L+Q6KGM546v5aKD5piv5a2Q5bqU55SoXG4gKiB3aW5kb3cuX19QT1dFUkVEX0JZX1dVSklFX18g5aaC5p6c5Li6ZmFsc2Xor7TmmI7lrZDlupTnlKjov5jmsqHliJ3lp4vljJblrozmiJBcbiAqIOS4iui/sOadoeS7tuWQjOaXtuaIkOeri+ivtOaYjuS4u+W6lOeUqOS7o+eggeWcqGlmcmFtZeeahGxvYWRpbmfpmLbmrrXmt7flhaXov5vmnaXkuobvvIzlv4XpobvkuK3mlq3miafooYxcbiAqL1xuaWYgKHdpbmRvdy5fX1dVSklFICYmICF3aW5kb3cuX19QT1dFUkVEX0JZX1dVSklFX18pIHtcbiAgc3RvcE1haW5BcHBSdW4oKTtcbn1cblxuLy8g5aSE55CG5a2Q5bqU55So6ZO+5o6l6Lez6L2sXG5wcm9jZXNzQXBwRm9ySHJlZkp1bXAoKTtcblxuLy8g5a6a5LmJd2ViQ29tcG9uZW505a655ZmoXG5kZWZpbmVXdWppZVdlYkNvbXBvbmVudCgpO1xuXG4vLyDlpoLmnpzkuI3mlK/mjIHliJnlkYroraZcbmlmICghd3VqaWVTdXBwb3J0KSB3YXJuKFdVSklFX1RJUFNfTk9UX1NVUFBPUlRFRCk7XG5cbi8qKlxuICog57yT5a2Y5a2Q5bqU55So6YWN572uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXR1cEFwcChvcHRpb25zOiBjYWNoZU9wdGlvbnMpOiB2b2lkIHtcbiAgaWYgKG9wdGlvbnMubmFtZSkgYWRkU2FuZGJveENhY2hlV2l0aE9wdGlvbnMob3B0aW9ucy5uYW1lLCBvcHRpb25zKTtcbn1cblxuLyoqXG4gKiDov5DooYzml6DnlYxhcHBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0YXJ0QXBwKHN0YXJ0T3B0aW9uczogc3RhcnRPcHRpb25zKTogUHJvbWlzZTxGdW5jdGlvbiB8IHZvaWQ+IHtcbiAgLy8g5Yid5aeL5YyW5YaF6IGU5LqL5Lu25aSE55CG5Zmo6L6F5Yqp5Ye95pWwXG4gIGluaXRJbmxpbmVFdmVudEhlbHBlcigpO1xuICBjb25zdCBzYW5kYm94ID0gZ2V0V3VqaWVCeUlkKHN0YXJ0T3B0aW9ucy5uYW1lKTtcbiAgY29uc3QgY2FjaGVPcHRpb25zID0gZ2V0T3B0aW9uc0J5SWQoc3RhcnRPcHRpb25zLm5hbWUpO1xuICAvLyDlkIjlubbnvJPlrZjphY3nva5cbiAgY29uc3Qgb3B0aW9ucyA9IG1lcmdlT3B0aW9ucyhzdGFydE9wdGlvbnMsIGNhY2hlT3B0aW9ucyk7XG4gIGNvbnN0IHtcbiAgICBuYW1lLFxuICAgIHVybCxcbiAgICBodG1sLFxuICAgIHJlcGxhY2UsXG4gICAgZmV0Y2gsXG4gICAgcHJvcHMsXG4gICAgYXR0cnMsXG4gICAgZGVncmFkZUF0dHJzLFxuICAgIGZpYmVyLFxuICAgIGFsaXZlLFxuICAgIGRlZ3JhZGUsXG4gICAgc3luYyxcbiAgICBwcmVmaXgsXG4gICAgZWwsXG4gICAgbG9hZGluZyxcbiAgICBwbHVnaW5zLFxuICAgIGxpZmVjeWNsZXMsXG4gICAgaWZyYW1lQWRkRXZlbnRMaXN0ZW5lcnMsXG4gICAgaWZyYW1lT25FdmVudHMsXG4gIH0gPSBvcHRpb25zO1xuICAvLyDlt7Lnu4/liJ3lp4vljJbov4fnmoTlupTnlKjvvIzlv6vpgJ/muLLmn5NcbiAgaWYgKHNhbmRib3gpIHtcbiAgICBzYW5kYm94LnBsdWdpbnMgPSBnZXRQbHVnaW5zKHBsdWdpbnMpO1xuICAgIHNhbmRib3gubGlmZWN5Y2xlcyA9IGxpZmVjeWNsZXM7XG4gICAgY29uc3QgaWZyYW1lV2luZG93ID0gc2FuZGJveC5pZnJhbWUuY29udGVudFdpbmRvdztcbiAgICBpZiAoc2FuZGJveC5wcmVsb2FkKSB7XG4gICAgICBhd2FpdCBzYW5kYm94LnByZWxvYWQ7XG4gICAgfVxuICAgIGlmIChhbGl2ZSkge1xuICAgICAgLy8g5L+d5rS7XG4gICAgICBhd2FpdCBzYW5kYm94LmFjdGl2ZSh7IHVybCwgc3luYywgcHJlZml4LCBlbCwgcHJvcHMsIGFsaXZlLCBmZXRjaCwgcmVwbGFjZSB9KTtcbiAgICAgIC8vIOmihOWKoOi9veS9huaYr+ayoeacieaJp+ihjOeahOaDheWGtVxuICAgICAgaWYgKCFzYW5kYm94LmV4ZWNGbGFnKSB7XG4gICAgICAgIHNhbmRib3gubGlmZWN5Y2xlcz8uYmVmb3JlTG9hZD8uKHNhbmRib3guaWZyYW1lLmNvbnRlbnRXaW5kb3cpO1xuICAgICAgICBjb25zdCB7IGdldEV4dGVybmFsU2NyaXB0cyB9ID0gYXdhaXQgaW1wb3J0SFRNTCh7XG4gICAgICAgICAgdXJsLFxuICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgb3B0czoge1xuICAgICAgICAgICAgZmV0Y2g6IGZldGNoIHx8IHdpbmRvdy5mZXRjaCxcbiAgICAgICAgICAgIHBsdWdpbnM6IHNhbmRib3gucGx1Z2lucyxcbiAgICAgICAgICAgIGxvYWRFcnJvcjogc2FuZGJveC5saWZlY3ljbGVzLmxvYWRFcnJvcixcbiAgICAgICAgICAgIGZpYmVyLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCBzYW5kYm94LnN0YXJ0KGdldEV4dGVybmFsU2NyaXB0cyk7XG4gICAgICB9XG4gICAgICBzYW5kYm94LmxpZmVjeWNsZXM/LmFjdGl2YXRlZD8uKHNhbmRib3guaWZyYW1lLmNvbnRlbnRXaW5kb3cpO1xuICAgICAgcmV0dXJuICgpID0+IHNhbmRib3guZGVzdHJveSgpO1xuICAgIH0gZWxzZSBpZiAoaXNGdW5jdGlvbihpZnJhbWVXaW5kb3cuX19XVUpJRV9NT1VOVCkpIHtcbiAgICAgIC8qKlxuICAgICAgICog5a2Q5bqU55So5YiH5o2i5Lya6Kem5Y+Rd2ViY29tcG9uZW5055qEZGlzY29ubmVjdGVkQ2FsbGJhY2vosIPnlKhzYW5kYm94LnVubW91bnTov5vooYzlrp7kvovplIDmr4FcbiAgICAgICAqIOatpOWkhOaYr+mYsuatouayoeaciemUgOavgXdlYmNvbXBvbmVudOaXtuiwg+eUqHN0YXJ0QXBw55qE5oOF5Ya177yM6ZyA6KaB5omL5Yqo6LCD55SodW5tb3VudFxuICAgICAgICovXG4gICAgICBhd2FpdCBzYW5kYm94LnVubW91bnQoKTtcbiAgICAgIGF3YWl0IHNhbmRib3guYWN0aXZlKHsgdXJsLCBzeW5jLCBwcmVmaXgsIGVsLCBwcm9wcywgYWxpdmUsIGZldGNoLCByZXBsYWNlIH0pO1xuICAgICAgLy8g5q2j5bi45Yqg6L2955qE5oOF5Ya177yM5YWI5rOo5YWlY3Nz77yM5pyA5ZCO5omNbW91bnTjgILph43mlrDmv4DmtLvkuZ/kv53mjIHlkIzmoLfnmoTml7bluo9cbiAgICAgIHNhbmRib3gucmVidWlsZFN0eWxlU2hlZXRzKCk7XG4gICAgICAvLyDmnInmuLLmn5Plh73mlbBcbiAgICAgIHNhbmRib3gubGlmZWN5Y2xlcz8uYmVmb3JlTW91bnQ/LihzYW5kYm94LmlmcmFtZS5jb250ZW50V2luZG93KTtcbiAgICAgIGlmcmFtZVdpbmRvdy5fX1dVSklFX01PVU5UKCk7XG4gICAgICBzYW5kYm94LmxpZmVjeWNsZXM/LmFmdGVyTW91bnQ/LihzYW5kYm94LmlmcmFtZS5jb250ZW50V2luZG93KTtcbiAgICAgIHNhbmRib3gubW91bnRGbGFnID0gdHJ1ZTtcbiAgICAgIHJldHVybiAoKSA9PiBzYW5kYm94LmRlc3Ryb3koKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8g5rKh5pyJ5riy5p+T5Ye95pWwXG4gICAgICBhd2FpdCBzYW5kYm94LmRlc3Ryb3koKTtcbiAgICB9XG4gIH1cblxuICAvLyDorr7nva5sb2FkaW5nXG4gIGFkZExvYWRpbmcoZWwsIGxvYWRpbmcpO1xuICBjb25zdCBuZXdTYW5kYm94ID0gbmV3IFd1SmllKHtcbiAgICBuYW1lLFxuICAgIHVybCxcbiAgICBhdHRycyxcbiAgICBkZWdyYWRlQXR0cnMsXG4gICAgZmliZXIsXG4gICAgZGVncmFkZSxcbiAgICBwbHVnaW5zLFxuICAgIGxpZmVjeWNsZXMsXG4gICAgaWZyYW1lQWRkRXZlbnRMaXN0ZW5lcnMsXG4gICAgaWZyYW1lT25FdmVudHMsXG4gIH0pO1xuICBuZXdTYW5kYm94LmxpZmVjeWNsZXM/LmJlZm9yZUxvYWQ/LihuZXdTYW5kYm94LmlmcmFtZS5jb250ZW50V2luZG93KTtcbiAgY29uc3QgeyB0ZW1wbGF0ZSwgZ2V0RXh0ZXJuYWxTY3JpcHRzLCBnZXRFeHRlcm5hbFN0eWxlU2hlZXRzIH0gPSBhd2FpdCBpbXBvcnRIVE1MKHtcbiAgICB1cmwsXG4gICAgaHRtbCxcbiAgICBvcHRzOiB7XG4gICAgICBmZXRjaDogZmV0Y2ggfHwgd2luZG93LmZldGNoLFxuICAgICAgcGx1Z2luczogbmV3U2FuZGJveC5wbHVnaW5zLFxuICAgICAgbG9hZEVycm9yOiBuZXdTYW5kYm94LmxpZmVjeWNsZXMubG9hZEVycm9yLFxuICAgICAgZmliZXIsXG4gICAgfSxcbiAgfSk7XG5cbiAgY29uc3QgcHJvY2Vzc2VkSHRtbCA9IGF3YWl0IHByb2Nlc3NDc3NMb2FkZXIobmV3U2FuZGJveCwgdGVtcGxhdGUsIGdldEV4dGVybmFsU3R5bGVTaGVldHMpO1xuICBhd2FpdCBuZXdTYW5kYm94LmFjdGl2ZSh7IHVybCwgc3luYywgcHJlZml4LCB0ZW1wbGF0ZTogcHJvY2Vzc2VkSHRtbCwgZWwsIHByb3BzLCBhbGl2ZSwgZmV0Y2gsIHJlcGxhY2UgfSk7XG4gIGF3YWl0IG5ld1NhbmRib3guc3RhcnQoZ2V0RXh0ZXJuYWxTY3JpcHRzKTtcbiAgcmV0dXJuICgpID0+IG5ld1NhbmRib3guZGVzdHJveSgpO1xufVxuXG4vKipcbiAqIOmihOWKoOi9veaXoOeVjEFQUFxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJlbG9hZEFwcChwcmVPcHRpb25zOiBwcmVPcHRpb25zKTogdm9pZCB7XG4gIHJlcXVlc3RJZGxlQ2FsbGJhY2soKCk6IHZvaWQgfCBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICAvKipcbiAgICAgKiDlt7Lnu4/lrZjlnKhcbiAgICAgKiB1cmzmn6Xor6Llj4LmlbDkuK3mnInlrZDlupTnlKjnmoRpZO+8jOWkp+amgueOh+aYr+WIt+aWsOa1j+iniOWZqOaIluiAheWIhuS6q3VybO+8jOatpOaXtumcgOimgeebtOaOpeaJk+W8gOWtkOW6lOeUqO+8jOaXoOmcgOmihOWKoOi9vVxuICAgICAqL1xuICAgIGlmIChnZXRXdWppZUJ5SWQocHJlT3B0aW9ucy5uYW1lKSB8fCBpc01hdGNoU3luY1F1ZXJ5QnlJZChwcmVPcHRpb25zLm5hbWUpKSByZXR1cm47XG4gICAgY29uc3QgY2FjaGVPcHRpb25zID0gZ2V0T3B0aW9uc0J5SWQocHJlT3B0aW9ucy5uYW1lKTtcbiAgICAvLyDlkIjlubbnvJPlrZjphY3nva5cbiAgICBjb25zdCBvcHRpb25zID0gbWVyZ2VPcHRpb25zKHsgLi4ucHJlT3B0aW9ucyB9LCBjYWNoZU9wdGlvbnMpO1xuICAgIGNvbnN0IHtcbiAgICAgIG5hbWUsXG4gICAgICB1cmwsXG4gICAgICBodG1sLFxuICAgICAgcHJvcHMsXG4gICAgICBhbGl2ZSxcbiAgICAgIHJlcGxhY2UsXG4gICAgICBmZXRjaCxcbiAgICAgIGV4ZWMsXG4gICAgICBhdHRycyxcbiAgICAgIGRlZ3JhZGVBdHRycyxcbiAgICAgIGZpYmVyLFxuICAgICAgZGVncmFkZSxcbiAgICAgIHByZWZpeCxcbiAgICAgIHBsdWdpbnMsXG4gICAgICBsaWZlY3ljbGVzLFxuICAgICAgaWZyYW1lQWRkRXZlbnRMaXN0ZW5lcnMsXG4gICAgICBpZnJhbWVPbkV2ZW50cyxcbiAgICB9ID0gb3B0aW9ucztcblxuICAgIGNvbnN0IHNhbmRib3ggPSBuZXcgV3VKaWUoe1xuICAgICAgbmFtZSxcbiAgICAgIHVybCxcbiAgICAgIGF0dHJzLFxuICAgICAgZGVncmFkZUF0dHJzLFxuICAgICAgZmliZXIsXG4gICAgICBkZWdyYWRlLFxuICAgICAgcGx1Z2lucyxcbiAgICAgIGxpZmVjeWNsZXMsXG4gICAgICBpZnJhbWVBZGRFdmVudExpc3RlbmVycyxcbiAgICAgIGlmcmFtZU9uRXZlbnRzLFxuICAgIH0pO1xuICAgIGlmIChzYW5kYm94LnByZWxvYWQpIHJldHVybiBzYW5kYm94LnByZWxvYWQ7XG4gICAgY29uc3QgcnVuUHJlbG9hZCA9IGFzeW5jICgpID0+IHtcbiAgICAgIHNhbmRib3gubGlmZWN5Y2xlcz8uYmVmb3JlTG9hZD8uKHNhbmRib3guaWZyYW1lLmNvbnRlbnRXaW5kb3cpO1xuICAgICAgY29uc3QgeyB0ZW1wbGF0ZSwgZ2V0RXh0ZXJuYWxTY3JpcHRzLCBnZXRFeHRlcm5hbFN0eWxlU2hlZXRzIH0gPSBhd2FpdCBpbXBvcnRIVE1MKHtcbiAgICAgICAgdXJsLFxuICAgICAgICBodG1sLFxuICAgICAgICBvcHRzOiB7XG4gICAgICAgICAgZmV0Y2g6IGZldGNoIHx8IHdpbmRvdy5mZXRjaCxcbiAgICAgICAgICBwbHVnaW5zOiBzYW5kYm94LnBsdWdpbnMsXG4gICAgICAgICAgbG9hZEVycm9yOiBzYW5kYm94LmxpZmVjeWNsZXMubG9hZEVycm9yLFxuICAgICAgICAgIGZpYmVyLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBjb25zdCBwcm9jZXNzZWRIdG1sID0gYXdhaXQgcHJvY2Vzc0Nzc0xvYWRlcihzYW5kYm94LCB0ZW1wbGF0ZSwgZ2V0RXh0ZXJuYWxTdHlsZVNoZWV0cyk7XG4gICAgICBhd2FpdCBzYW5kYm94LmFjdGl2ZSh7IHVybCwgcHJvcHMsIHByZWZpeCwgYWxpdmUsIHRlbXBsYXRlOiBwcm9jZXNzZWRIdG1sLCBmZXRjaCwgcmVwbGFjZSB9KTtcbiAgICAgIGlmIChleGVjKSB7XG4gICAgICAgIGF3YWl0IHNhbmRib3guc3RhcnQoZ2V0RXh0ZXJuYWxTY3JpcHRzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IGdldEV4dGVybmFsU2NyaXB0cygpO1xuICAgICAgfVxuICAgIH07XG4gICAgc2FuZGJveC5wcmVsb2FkID0gcnVuUHJlbG9hZCgpO1xuICB9KTtcbn1cblxuLyoqXG4gKiDplIDmr4Hml6DnlYxBUFBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lBcHAoaWQ6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBzYW5kYm94ID0gZ2V0V3VqaWVCeUlkKGlkKTtcbiAgaWYgKHNhbmRib3gpIHtcbiAgICBzYW5kYm94LmRlc3Ryb3koKTtcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7OztBQUFBLE9BQU9BLFVBQVUsSUFBSUMsZ0JBQWdCLFFBQVEsU0FBUztBQUN0RCxTQUFTQyxxQkFBcUIsUUFBUSxTQUFTO0FBRS9DLFNBQVNDLGdCQUFnQixRQUFRLFNBQVM7QUFFMUMsT0FBT0MsS0FBSyxNQUFxQixXQUFXO0FBQzVDLFNBQVNDLHVCQUF1QixFQUFFQyxVQUFVLFFBQVEsVUFBVTtBQUM5RCxTQUFTQyxxQkFBcUIsUUFBUSxRQUFRO0FBQzlDLFNBQVNDLFVBQVUsUUFBUSxVQUFVO0FBQ3JDLFNBQ0VDLFlBQVksRUFDWkMsWUFBWSxFQUNaQyxVQUFVLEVBQ1ZDLG1CQUFtQixFQUNuQkMsb0JBQW9CLEVBQ3BCQyxJQUFJLEVBQ0pDLGNBQWMsUUFDVCxTQUFTO0FBQ2hCLFNBQVNDLFlBQVksRUFBRUMsY0FBYyxFQUFFQywwQkFBMEIsUUFBUSxVQUFVO0FBQ25GLFNBQVNDLFFBQVEsUUFBUSxTQUFTO0FBQ2xDLFNBQVNDLHdCQUF3QixRQUFRLFlBQVk7QUFFckQsT0FBTyxJQUFNQyxHQUFHLEdBQUcsSUFBSUYsUUFBUSxDQUFDRyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFDLENBQUNDLFFBQVEsQ0FBQyxDQUFDLENBQUM7O0FBdUl0RDtBQUNB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