import _slicedToArray from "@babel/runtime/helpers/slicedToArray";
import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _classCallCheck from "@babel/runtime/helpers/classCallCheck";
import _createClass from "@babel/runtime/helpers/createClass";
import _defineProperty from "@babel/runtime/helpers/defineProperty";
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
import _regeneratorRuntime from "@babel/runtime/regenerator";
import { iframeGenerator, recoverEventListeners, recoverDocumentListeners, insertScriptToIframe, patchEventTimeStamp, patchDegradeInstanceofAcrossRealms } from "./iframe";
import { syncUrlToWindow, syncUrlToIframe, clearInactiveAppUrl } from "./sync";
import { createWujieWebComponent, clearChild, getPatchStyleElements, renderElementToContainer, renderTemplateToShadowRoot, renderTemplateToIframe, initRenderIframeAndContainer, removeLoading } from "./shadow";
import { proxyGenerator, localGenerator } from "./proxy";
import { getPlugins, getPresetLoaders } from "./plugin";
import { removeEventListener } from "./effect";
import { idToSandboxCacheMap, addSandboxCacheWithWujie, deleteWujieById, rawElementAppendChild, rawDocumentQuerySelector } from "./common";
import { EventBus, appEventObjMap } from "./event";
import { EventCleanupTracker } from "./tracker";
import { isFunction, wujieSupport, appRouteParse, requestIdleCallback as _requestIdleCallback, getAbsolutePath, eventTrigger } from "./utils";
import { WUJIE_DATA_ATTACH_CSS_FLAG, WUJIE_APP_ID, WUJIE_FONT_STYLE_CONTAINER_ATTR } from "./constant";
/**
 * 基于 Proxy和iframe 实现的沙箱
 */
var Wujie = /*#__PURE__*/function () {
  /**
   * @param id 子应用的id，唯一标识
   * @param url 子应用的url，可以包含protocol、host、path、query、hash
   */
  function Wujie(options) {
    _classCallCheck(this, Wujie);
    /** 激活时路由地址 */
    /** 子应用保活 */
    /** window代理 */
    /** document代理 */
    /** location代理 */
    /**
     * 释放 window / document / location 代理。
     * 代理的 handler 闭包捕获了 iframe / urlElement 等 DOM 引用，destroy 时调用此函数
     * 解除代理与 handler 的关联，斩断「主应用 → 代理闭包 → iframe」的引用链。
     */
    /** 事件中心 */
    /** 容器 */
    /** js沙箱 */
    /** css沙箱 */
    /** 子应用的template */
    /** 子应用代码替换钩子 */
    /** 子应用自定义fetch */
    /** 子应用的生命周期 */
    /** 子应用的插件 */
    /** js沙箱ready态 */
    /** 子应用预加载态 */
    /** 降级时渲染iframe的属性 */
    /** 子应用js执行队列 */
    /** 子应用执行过标志 */
    /** 子应用激活标志 */
    /** 子应用mount标志 */
    /** 路由同步标志 */
    /** 子应用短路径替换，路由同步时生效 */
    /** 子应用跳转标志 */
    /** 子应用采用fiber模式执行 */
    /** 子应用降级标志 */
    /** 子应用降级document */
    /** 子应用styleSheet元素 */
    /** 子应用 font-face 样式元素，挂载在最外层 document.head */
    _defineProperty(this, "fontStyleSheetElements", []);
    /**
     * 子应用通过 document.head.appendChild(<script>) 触发的动态脚本节点。
     * 由 insertScriptToIframe 在收到 rawElement（即 effect.ts 转发的动态 script）
     * 时登记，sandbox.destroy() 时统一从 iframe head detach 并清空。
     */
    _defineProperty(this, "dynamicScriptElements", []);
    /**
     * 动态 <link rel=stylesheet> 以空 href 插入（先 appendChild 后 setAttribute('href')，
     * 如 tinymce 的 StyleSheetLoader）时，effect.ts 会注册一个 MutationObserver 监听
     * href 的后续赋值。这些 observer 必须在 destroy 时统一 disconnect，否则游离 link
     * 会通过 node → registered observer → callback 闭包链路把已销毁的 sandbox 钉在内存中。
     */
    _defineProperty(this, "deferredStyleObservers", []);
    /** 子应用dom监听事件留存，当降级时用于保存元素事件 */
    _defineProperty(this, "elementEventCacheMap", new WeakMap());
    /** 销毁链路清理跟踪器：记录被转发到主应用 window/document 上的副作用，destroy 时统一回收 */
    _defineProperty(this, "eventCleanupTracker", new EventCleanupTracker());
    // 传递inject给嵌套子应用（显式 as：__WUJIE_INJECT 全局类型是 Partial，需断言回完整结构）
    if (window.__POWERED_BY_WUJIE__) this.inject = window.__WUJIE.inject;else {
      this.inject = {
        idToSandboxMap: idToSandboxCacheMap,
        appEventObjMap: appEventObjMap,
        mainHostPath: window.location.protocol + "//" + window.location.host,
        fontStyleSheetContainer: this.createFontStyleSheetContainer()
      };
    }
    var name = options.name,
      url = options.url,
      attrs = options.attrs,
      fiber = options.fiber,
      degradeAttrs = options.degradeAttrs,
      degrade = options.degrade,
      lifecycles = options.lifecycles,
      plugins = options.plugins;
    this.id = name;
    this.fiber = fiber;
    this.degrade = degrade || !wujieSupport;
    this.bus = new EventBus(this.id);
    this.url = url;
    this.degradeAttrs = degradeAttrs;
    this.provide = {
      bus: this.bus
    };
    this.styleSheetElements = [];
    this.execQueue = [];
    this.lifecycles = lifecycles;
    this.plugins = getPlugins(plugins);
    this.iframeAddEventListeners = options.iframeAddEventListeners;
    this.iframeOnEvents = options.iframeOnEvents;

    // 创建目标地址的解析
    var _appRouteParse = appRouteParse(url),
      urlElement = _appRouteParse.urlElement,
      appHostPath = _appRouteParse.appHostPath,
      appRoutePath = _appRouteParse.appRoutePath;
    var mainHostPath = this.inject.mainHostPath;
    // 创建iframe
    this.iframe = iframeGenerator(this, attrs, mainHostPath, appHostPath, appRoutePath);
    if (this.degrade) {
      var _localGenerator = localGenerator(this.iframe, urlElement, mainHostPath, appHostPath),
        proxyDocument = _localGenerator.proxyDocument,
        proxyLocation = _localGenerator.proxyLocation,
        proxyRevoke = _localGenerator.proxyRevoke;
      this.proxyDocument = proxyDocument;
      this.proxyLocation = proxyLocation;
      this.proxyRevoke = proxyRevoke;
    } else {
      var _proxyGenerator = proxyGenerator(this.iframe, urlElement, mainHostPath, appHostPath),
        proxyWindow = _proxyGenerator.proxyWindow,
        _proxyDocument = _proxyGenerator.proxyDocument,
        _proxyLocation = _proxyGenerator.proxyLocation,
        _proxyRevoke = _proxyGenerator.proxyRevoke;
      this.proxy = proxyWindow;
      this.proxyDocument = _proxyDocument;
      this.proxyLocation = _proxyLocation;
      this.proxyRevoke = _proxyRevoke;
    }
    this.provide.location = this.proxyLocation;
    addSandboxCacheWithWujie(this.id, this);
  }
  return _createClass(Wujie, [{
    key: "active",
    value: (
    /** $wujie对象，提供给子应用的接口 */
    /** 子应用嵌套场景，父应用传递给子应用的数据 */
    /** 激活子应用
     * 1、同步路由
     * 2、动态修改iframe的fetch
     * 3、准备shadow
     * 4、准备子应用注入
     */
    function () {
      var _active = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime.mark(function _callee(options) {
        var _this = this;
        var sync, url, el, template, props, alive, prefix, fetch, replace, iframeWindow, iframeFetch, iframeBody, _initRenderIframeAndC, iframe, container, renderWindow, _iframeBody;
        return _regeneratorRuntime.wrap(function (_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              sync = options.sync, url = options.url, el = options.el, template = options.template, props = options.props, alive = options.alive, prefix = options.prefix, fetch = options.fetch, replace = options.replace;
              this.url = url;
              this.sync = sync;
              this.alive = alive;
              this.hrefFlag = false;
              this.prefix = prefix !== null && prefix !== void 0 ? prefix : this.prefix;
              this.replace = replace !== null && replace !== void 0 ? replace : this.replace;
              this.provide.props = props !== null && props !== void 0 ? props : this.provide.props;
              this.activeFlag = true;
              // wait iframe init
              _context.next = 1;
              return this.iframeReady;
            case 1:
              // 处理子应用自定义fetch
              // TODO fetch检验合法性
              iframeWindow = this.iframe.contentWindow;
              iframeFetch = fetch ? function (input, init) {
                return fetch(typeof input === "string" ? getAbsolutePath(input, _this.proxyLocation.href) : input, init);
              } : this.fetch;
              if (iframeFetch) {
                iframeWindow.fetch = iframeFetch;
                this.fetch = iframeFetch;
              }

              // 处理子应用路由同步
              if (this.execFlag && this.alive) {
                // 当保活模式下子应用重新激活时，只需要将子应用路径同步回主应用
                syncUrlToWindow(iframeWindow);
              } else {
                // 先将url同步回iframe，然后再同步回浏览器url
                syncUrlToIframe(iframeWindow);
                syncUrlToWindow(iframeWindow);
              }

              // inject template
              this.template = template !== null && template !== void 0 ? template : this.template;

              /* 降级处理 */
              if (!this.degrade) {
                _context.next = 7;
                break;
              }
              iframeBody = rawDocumentQuerySelector.call(iframeWindow.document, "body");
              _initRenderIframeAndC = initRenderIframeAndContainer(this.id, el !== null && el !== void 0 ? el : iframeBody, this.degradeAttrs), iframe = _initRenderIframeAndC.iframe, container = _initRenderIframeAndC.container;
              this.el = container;
              // 销毁js运行iframe容器内部dom
              if (el) clearChild(iframeBody);
              // 修复vue的event.timeStamp问题
              patchEventTimeStamp(iframe.contentWindow, iframeWindow);
              // 当销毁iframe时主动unmount子应用
              iframe.contentWindow.onunload = function () {
                _this.unmount();
              };
              if (!this.document) {
                _context.next = 5;
                break;
              }
              if (!this.alive) {
                _context.next = 2;
                break;
              }
              iframe.contentDocument.replaceChild(this.document.documentElement, iframe.contentDocument.documentElement);
              // 保活场景需要事件全部恢复
              recoverEventListeners(iframe.contentDocument.documentElement, iframeWindow);
              _context.next = 4;
              break;
            case 2:
              _context.next = 3;
              return renderTemplateToIframe(iframe.contentDocument, this.iframe.contentWindow, this.template);
            case 3:
              // 非保活场景需要恢复根节点的事件，防止react16监听事件丢失
              recoverDocumentListeners(this.document.documentElement, iframe.contentDocument.documentElement, iframeWindow);
            case 4:
              _context.next = 6;
              break;
            case 5:
              _context.next = 6;
              return renderTemplateToIframe(iframe.contentDocument, this.iframe.contentWindow, this.template);
            case 6:
              this.document = iframe.contentDocument;
              renderWindow = this.document.defaultView;
              if (renderWindow) {
                patchDegradeInstanceofAcrossRealms(iframeWindow, renderWindow);
              }
              return _context.abrupt("return");
            case 7:
              if (!this.shadowRoot) {
                _context.next = 9;
                break;
              }
              /*
               document.addEventListener was transfer to shadowRoot.addEventListener
               react 16 SyntheticEvent will remember document event for avoid repeat listen
               shadowRoot have to dispatchEvent for react 16 so can't be destroyed
               this may lead memory leak risk
               */
              this.el = renderElementToContainer(this.shadowRoot.host, el);
              if (!this.alive) {
                _context.next = 8;
                break;
              }
              return _context.abrupt("return");
            case 8:
              _context.next = 10;
              break;
            case 9:
              // 预执行无容器，暂时插入iframe内部触发Web Component的connect
              _iframeBody = rawDocumentQuerySelector.call(iframeWindow.document, "body");
              this.el = renderElementToContainer(createWujieWebComponent(this.id), el !== null && el !== void 0 ? el : _iframeBody);
            case 10:
              _context.next = 11;
              return renderTemplateToShadowRoot(this.shadowRoot, iframeWindow, this.template);
            case 11:
              this.patchCssRules();

              // inject shadowRoot to app
              this.provide.shadowRoot = this.shadowRoot;
            case 12:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function active(_x) {
        return _active.apply(this, arguments);
      }
      return active;
    }() // 未销毁，空闲时才回调
    )
  }, {
    key: "requestIdleCallback",
    value: function requestIdleCallback(callback) {
      var _this2 = this;
      return _requestIdleCallback(function () {
        // 假如已经被销毁了
        if (!_this2.iframe) return;
        callback.apply(_this2);
      });
    }
    /** 启动子应用
     * 1、运行js
     * 2、处理兼容样式
     */
  }, {
    key: "start",
    value: (function () {
      var _start = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime.mark(function _callee2(getExternalScripts) {
        var _this3 = this;
        var scriptResultList, iframeWindow, beforeScriptResultList, afterScriptResultList, syncScriptResultList, asyncScriptResultList, deferScriptResultList, domContentLoadedTrigger, domLoadedTrigger;
        return _regeneratorRuntime.wrap(function (_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              this.execFlag = true;
              // 执行脚本
              _context2.next = 1;
              return getExternalScripts();
            case 1:
              scriptResultList = _context2.sent;
              if (this.iframe) {
                _context2.next = 2;
                break;
              }
              return _context2.abrupt("return");
            case 2:
              iframeWindow = this.iframe.contentWindow; // 标志位，执行代码前设置
              iframeWindow.__POWERED_BY_WUJIE__ = true;
              // 用户自定义代码前
              beforeScriptResultList = getPresetLoaders("jsBeforeLoaders", this.plugins); // 用户自定义代码后
              afterScriptResultList = getPresetLoaders("jsAfterLoaders", this.plugins); // 同步代码
              syncScriptResultList = []; // async代码无需保证顺序，所以不用放入执行队列
              asyncScriptResultList = []; // defer代码需要保证顺序并且DOMContentLoaded前完成，这里统一放置同步脚本后执行
              deferScriptResultList = [];
              scriptResultList.forEach(function (scriptResult) {
                if (scriptResult.defer) deferScriptResultList.push(scriptResult);else if (scriptResult.async) asyncScriptResultList.push(scriptResult);else syncScriptResultList.push(scriptResult);
              });

              // 插入代码前
              beforeScriptResultList.forEach(function (beforeScriptResult) {
                _this3.execQueue.push(function () {
                  return _this3.fiber ? _this3.requestIdleCallback(function () {
                    return insertScriptToIframe(beforeScriptResult, iframeWindow);
                  }) : insertScriptToIframe(beforeScriptResult, iframeWindow);
                });
              });

              // 同步代码
              syncScriptResultList.concat(deferScriptResultList).forEach(function (scriptResult) {
                _this3.execQueue.push(function () {
                  return scriptResult.contentPromise.then(function (content) {
                    return _this3.fiber ? _this3.requestIdleCallback(function () {
                      return insertScriptToIframe(_objectSpread(_objectSpread({}, scriptResult), {}, {
                        content: content
                      }), iframeWindow);
                    }) : insertScriptToIframe(_objectSpread(_objectSpread({}, scriptResult), {}, {
                      content: content
                    }), iframeWindow);
                  });
                });
              });

              // 异步代码
              asyncScriptResultList.forEach(function (scriptResult) {
                scriptResult.contentPromise.then(function (content) {
                  _this3.fiber ? _this3.requestIdleCallback(function () {
                    return insertScriptToIframe(_objectSpread(_objectSpread({}, scriptResult), {}, {
                      content: content
                    }), iframeWindow);
                  }) : insertScriptToIframe(_objectSpread(_objectSpread({}, scriptResult), {}, {
                    content: content
                  }), iframeWindow);
                });
              });

              //框架主动调用mount方法
              this.execQueue.push(this.fiber ? function () {
                return _this3.requestIdleCallback(function () {
                  return _this3.mount();
                });
              } : function () {
                return _this3.mount();
              });

              //触发 DOMContentLoaded 事件
              domContentLoadedTrigger = function domContentLoadedTrigger() {
                var _this3$execQueue$shif;
                eventTrigger(iframeWindow.document, "DOMContentLoaded");
                eventTrigger(iframeWindow, "DOMContentLoaded");
                (_this3$execQueue$shif = _this3.execQueue.shift()) === null || _this3$execQueue$shif === void 0 || _this3$execQueue$shif();
              };
              this.execQueue.push(this.fiber ? function () {
                return _this3.requestIdleCallback(domContentLoadedTrigger);
              } : domContentLoadedTrigger);

              // 插入代码后
              afterScriptResultList.forEach(function (afterScriptResult) {
                _this3.execQueue.push(function () {
                  return _this3.fiber ? _this3.requestIdleCallback(function () {
                    return insertScriptToIframe(afterScriptResult, iframeWindow);
                  }) : insertScriptToIframe(afterScriptResult, iframeWindow);
                });
              });

              //触发 loaded 事件
              domLoadedTrigger = function domLoadedTrigger() {
                var _this3$execQueue$shif2;
                eventTrigger(iframeWindow.document, "readystatechange");
                eventTrigger(iframeWindow, "load");
                (_this3$execQueue$shif2 = _this3.execQueue.shift()) === null || _this3$execQueue$shif2 === void 0 || _this3$execQueue$shif2();
              };
              this.execQueue.push(this.fiber ? function () {
                return _this3.requestIdleCallback(domLoadedTrigger);
              } : domLoadedTrigger);
              // 由于没有办法准确定位是哪个代码做了mount，保活、重建模式提前关闭loading
              if (this.alive || !isFunction(this.iframe.contentWindow.__WUJIE_UNMOUNT)) removeLoading(this.el);
              this.execQueue.shift()();

              // 所有的execQueue队列执行完毕，start才算结束，保证串行的执行子应用
              return _context2.abrupt("return", new Promise(function (resolve) {
                _this3.execQueue.push(function () {
                  var _this3$execQueue$shif3;
                  resolve();
                  (_this3$execQueue$shif3 = _this3.execQueue.shift()) === null || _this3$execQueue$shif3 === void 0 || _this3$execQueue$shif3();
                });
              }));
            case 3:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this);
      }));
      function start(_x2) {
        return _start.apply(this, arguments);
      }
      return start;
    }()
    /**
     * 框架主动发起mount，如果子应用是异步渲染实例，比如将生命周__WUJIE_MOUNT放到async函数内
     * 此时如果采用fiber模式渲染（主应用调用mount的时机也是异步不确定的），框架调用mount时可能
     * 子应用的__WUJIE_MOUNT还没有挂载到window，所以这里封装一个mount函数，当子应用是异步渲染
     * 实例时，子应用异步函数里面最后加上window.__WUJIE.mount()来主动调用
     */
    )
  }, {
    key: "mount",
    value: function mount() {
      var _this$execQueue$shift;
      if (this.mountFlag) return;
      if (isFunction(this.iframe.contentWindow.__WUJIE_MOUNT)) {
        var _this$lifecycles, _this$lifecycles$befo, _this$lifecycles2, _this$lifecycles2$aft;
        removeLoading(this.el);
        (_this$lifecycles = this.lifecycles) === null || _this$lifecycles === void 0 || (_this$lifecycles$befo = _this$lifecycles.beforeMount) === null || _this$lifecycles$befo === void 0 || _this$lifecycles$befo.call(_this$lifecycles, this.iframe.contentWindow);
        this.iframe.contentWindow.__WUJIE_MOUNT();
        (_this$lifecycles2 = this.lifecycles) === null || _this$lifecycles2 === void 0 || (_this$lifecycles2$aft = _this$lifecycles2.afterMount) === null || _this$lifecycles2$aft === void 0 || _this$lifecycles2$aft.call(_this$lifecycles2, this.iframe.contentWindow);
        this.mountFlag = true;
      }
      if (this.alive) {
        var _this$lifecycles3, _this$lifecycles3$act;
        (_this$lifecycles3 = this.lifecycles) === null || _this$lifecycles3 === void 0 || (_this$lifecycles3$act = _this$lifecycles3.activated) === null || _this$lifecycles3$act === void 0 || _this$lifecycles3$act.call(_this$lifecycles3, this.iframe.contentWindow);
      }
      (_this$execQueue$shift = this.execQueue.shift()) === null || _this$execQueue$shift === void 0 || _this$execQueue$shift();
    }

    /** 保活模式和使用proxyLocation.href跳转链接都不应该销毁shadow */
  }, {
    key: "unmount",
    value: (function () {
      var _unmount = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime.mark(function _callee3() {
        var _this$lifecycles4, _this$lifecycles4$dea, _this$lifecycles5, _this$lifecycles5$bef, _this$lifecycles6, _this$lifecycles6$aft, _this$bus;
        return _regeneratorRuntime.wrap(function (_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              // 子应用卸载时 disconnect 等待 href 的 MutationObserver，避免闭包在 remount 前仍持有上下文
              this.clearDeferredStyleObservers();
              this.activeFlag = false;
              // 清理子应用过期的同步参数
              clearInactiveAppUrl();
              if (this.alive) {
                (_this$lifecycles4 = this.lifecycles) === null || _this$lifecycles4 === void 0 || (_this$lifecycles4$dea = _this$lifecycles4.deactivated) === null || _this$lifecycles4$dea === void 0 || _this$lifecycles4$dea.call(_this$lifecycles4, this.iframe.contentWindow);
              }
              if (this.mountFlag) {
                _context3.next = 1;
                break;
              }
              return _context3.abrupt("return");
            case 1:
              if (!(isFunction(this.iframe.contentWindow.__WUJIE_UNMOUNT) && !this.alive && !this.hrefFlag)) {
                _context3.next = 3;
                break;
              }
              (_this$lifecycles5 = this.lifecycles) === null || _this$lifecycles5 === void 0 || (_this$lifecycles5$bef = _this$lifecycles5.beforeUnmount) === null || _this$lifecycles5$bef === void 0 || _this$lifecycles5$bef.call(_this$lifecycles5, this.iframe.contentWindow);
              _context3.next = 2;
              return this.iframe.contentWindow.__WUJIE_UNMOUNT();
            case 2:
              (_this$lifecycles6 = this.lifecycles) === null || _this$lifecycles6 === void 0 || (_this$lifecycles6$aft = _this$lifecycles6.afterUnmount) === null || _this$lifecycles6$aft === void 0 || _this$lifecycles6$aft.call(_this$lifecycles6, this.iframe.contentWindow);
              this.mountFlag = false;
              (_this$bus = this.bus) === null || _this$bus === void 0 || _this$bus.$clear();
              if (!this.degrade) {
                clearChild(this.shadowRoot);
                // head body需要复用，每次都要清空事件
                removeEventListener(this.head);
                removeEventListener(this.body);
              }
              clearChild(this.head);
              clearChild(this.body);
              // styleSheetElements / dynamicScriptElements 不能在 unmount 中清空：
              // 子应用的 JS 模块只在 sandbox.start() 阶段执行一次，unmount → active 后
              // 模块代码不会重跑，再次 mount 依赖 rebuildStyleSheets() 把数组里登记的
              // 样式节点重新挂回 shadowRoot.head。两数组的彻底清理放在 destroy() 中。
            case 3:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this);
      }));
      function unmount() {
        return _unmount.apply(this, arguments);
      }
      return unmount;
    }() /** 销毁子应用 */)
  }, {
    key: "destroy",
    value: (function () {
      var _destroy = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime.mark(function _callee4() {
        var _this$iframe$parentNo, _iframeWindow, _this$proxyRevoke;
        return _regeneratorRuntime.wrap(function (_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 1;
              return this.unmount();
            case 1:
              // 释放动态样式 / 脚本节点（unmount 阶段保留以便 rebuildStyleSheets 复用，destroy 阶段才彻底清）
              this.clearStyleSheets();
              this.clearDynamicScripts();
              this.clearFontStyleSheets();
              // 解绑等待 href 赋值的 MutationObserver，避免闭包钉住已销毁的 sandbox
              this.clearDeferredStyleObservers();
              // 先 $destroy 再置 null：清空事件并从全局 appEventObjMap 中移除当前 id 的 entry，
              // 避免 setupApp → destroyApp 反复后 map 条目持续累积。
              this.bus.$destroy();
              this.shadowRoot = null;
              this.proxy = null;
              this.proxyDocument = null;
              this.proxyLocation = null;
              this.execQueue = null;
              this.provide = null;
              this.degradeAttrs = null;
              this.styleSheetElements = null;
              this.fontStyleSheetElements = null;
              this.dynamicScriptElements = null;
              this.deferredStyleObservers = null;
              this.bus = null;
              this.replace = null;
              this.fetch = null;
              this.execFlag = null;
              this.mountFlag = null;
              this.hrefFlag = null;
              this.document = null;
              this.head = null;
              this.body = null;
              this.elementEventCacheMap = null;
              this.lifecycles = null;
              this.plugins = null;
              this.provide = null;
              this.inject = null;
              this.execQueue = null;
              this.prefix = null;
              this.iframeAddEventListeners = null;
              this.iframeOnEvents = null;
              // 清除 dom
              if (this.el) {
                clearChild(this.el);
                this.el = null;
              }
              // 清除 iframe 沙箱
              if (this.iframe) {
                _iframeWindow = this.iframe.contentWindow;
                if (_iframeWindow !== null && _iframeWindow !== void 0 && _iframeWindow.__WUJIE_EVENTLISTENER__) {
                  _iframeWindow.__WUJIE_EVENTLISTENER__.forEach(function (o) {
                    _iframeWindow.removeEventListener(o.type, o.listener, o.options);
                  });
                }
                // patchElementEffect 给散落到主应用 DOM 上的 element 留了 baseURI / ownerDocument
                // getter，它们通过 iframeWindow.__WUJIE 动态读取。这里主动断链让残留 getter 立即
                // 降级到主 document，避免 element 把 sandbox 钉在内存中。
                // __WUJIE / $wujie 均挂在 iframeWindow 上，destroy 时须一并置 null。
                if (_iframeWindow) {
                  try {
                    _iframeWindow.__WUJIE = null;
                    _iframeWindow.$wujie = null;
                  } catch (_) {
                    /* noop: iframe 已 detach 时赋值可能抛错 */
                  }
                }
                (_this$iframe$parentNo = this.iframe.parentNode) === null || _this$iframe$parentNo === void 0 || _this$iframe$parentNo.removeChild(this.iframe);
                this.iframe = null;
              }
              // 释放 window / document / location 代理：解除代理与 handler 的关联，使捕获了 iframe /
              // urlElement 的 handler 闭包不可达，斩断「主应用 → 代理闭包 → iframe」的引用链。
              try {
                (_this$proxyRevoke = this.proxyRevoke) === null || _this$proxyRevoke === void 0 || _this$proxyRevoke.call(this);
              } catch (_) {
                /* noop: 代理已释放时重复调用可能抛错 */
              }
              this.proxyRevoke = null;
              // 反向解绑 patchDocumentEffect / patchWindowEffect 在主 window / document 上挂的副作用
              this.eventCleanupTracker.cleanupAll();
              deleteWujieById(this.id);
            case 2:
            case "end":
              return _context4.stop();
          }
        }, _callee4, this);
      }));
      function destroy() {
        return _destroy.apply(this, arguments);
      }
      return destroy;
    }()
    /**
     * destroy 阶段清空 styleSheetElements，同时把节点从父节点 detach。
     *
     * 仅供 destroy 调用：unmount 阶段需要保留数组以便 rebuildStyleSheets 复用样式节点
     * （子应用 JS 模块只 init 一次，模块代码不会再次生成动态样式）。
     */
    )
  }, {
    key: "clearStyleSheets",
    value: function clearStyleSheets() {
      if (!Array.isArray(this.styleSheetElements)) return;
      this.styleSheetElements.forEach(function (el) {
        try {
          var _el$parentNode;
          (_el$parentNode = el.parentNode) === null || _el$parentNode === void 0 || _el$parentNode.removeChild(el);
        } catch (_) {
          /* noop: destroy 阶段任何异常不应中断后续清理 */
        }
      });
      this.styleSheetElements.length = 0;
    }

    /**
     * destroy 阶段清空 dynamicScriptElements，同时把残留的 <script> 节点从父节点 detach。
     * 仅供 destroy 调用，理由同 clearStyleSheets。
     */
  }, {
    key: "clearDynamicScripts",
    value: function clearDynamicScripts() {
      if (!Array.isArray(this.dynamicScriptElements)) return;
      this.dynamicScriptElements.forEach(function (script) {
        try {
          var _script$parentNode;
          (_script$parentNode = script.parentNode) === null || _script$parentNode === void 0 || _script$parentNode.removeChild(script);
        } catch (_) {
          /* noop */
        }
      });
      this.dynamicScriptElements.length = 0;
    }

    /**
     * destroy 阶段清空 fontStyleSheetElements，同时把节点从父节点 detach。
     * 使用 WUJIE_APP_ID 标识属于当前子应用的 font 样式。
     */
  }, {
    key: "clearFontStyleSheets",
    value: function clearFontStyleSheets() {
      if (!Array.isArray(this.fontStyleSheetElements)) return;
      this.fontStyleSheetElements.forEach(function (el) {
        try {
          var _el$parentNode2;
          (_el$parentNode2 = el.parentNode) === null || _el$parentNode2 === void 0 || _el$parentNode2.removeChild(el);
        } catch (_) {
          /* noop */
        }
      });
      this.fontStyleSheetElements.length = 0;
    }

    /**
     * unmount / destroy 阶段统一 disconnect 等待 href 赋值的 MutationObserver。
     * observer 在 href 命中或超时兜底时会自行 disconnect 并出队；
     * 这里兜底处理「子应用先于 href 赋值被卸载/销毁」的场景。
     */
  }, {
    key: "clearDeferredStyleObservers",
    value: function clearDeferredStyleObservers() {
      if (!Array.isArray(this.deferredStyleObservers)) return;
      this.deferredStyleObservers.forEach(function (observer) {
        try {
          observer.disconnect();
        } catch (_) {
          /* noop: destroy 阶段任何异常不应中断后续清理 */
        }
      });
      this.deferredStyleObservers.length = 0;
    }

    /**
     * 创建或获取 font 样式容器（挂载在最外层 document.head）
     * 用于存放子应用的 @font-face 样式，确保嵌套子应用也能正确应用字体
     */
  }, {
    key: "createFontStyleSheetContainer",
    value: function createFontStyleSheetContainer() {
      var container = rawDocumentQuerySelector.call(document, "[".concat(WUJIE_FONT_STYLE_CONTAINER_ATTR, "]"));
      if (container) return container;
      var styleElement = document.createElement("style");
      styleElement.setAttribute(WUJIE_FONT_STYLE_CONTAINER_ATTR, "");
      document.head.appendChild(styleElement);
      return styleElement;
    }

    /** 当子应用再次激活后，只运行mount函数，样式需要重新恢复 */
  }, {
    key: "rebuildStyleSheets",
    value: function rebuildStyleSheets() {
      var _this4 = this;
      if (this.styleSheetElements && this.styleSheetElements.length) {
        this.styleSheetElements.forEach(function (styleSheetElement) {
          rawElementAppendChild.call(_this4.degrade ? _this4.document.head : _this4.shadowRoot.head, styleSheetElement);
        });
      }
      this.patchCssRules();
    }

    /**
     * 子应用样式打补丁
     * 1、兼容:root选择器样式到:host选择器上
     * 2、将@font-face定义到shadowRoot外部
     */
  }, {
    key: "patchCssRules",
    value: function patchCssRules() {
      if (this.degrade) return;
      if (this.shadowRoot.host.hasAttribute(WUJIE_DATA_ATTACH_CSS_FLAG)) return;
      var _getPatchStyleElement = getPatchStyleElements(Array.from(this.iframe.contentDocument.querySelectorAll("style")).map(function (styleSheetElement) {
          return styleSheetElement.sheet;
        })),
        _getPatchStyleElement2 = _slicedToArray(_getPatchStyleElement, 2),
        hostStyleSheetElement = _getPatchStyleElement2[0],
        fontStyleSheetElement = _getPatchStyleElement2[1];
      if (hostStyleSheetElement) {
        this.shadowRoot.head.appendChild(hostStyleSheetElement);
        this.styleSheetElements.push(hostStyleSheetElement);
      }
      if (fontStyleSheetElement) {
        var _this$inject$fontStyl;
        (_this$inject$fontStyl = this.inject.fontStyleSheetContainer) === null || _this$inject$fontStyl === void 0 || _this$inject$fontStyl.appendChild(fontStyleSheetElement);
        fontStyleSheetElement.setAttribute(WUJIE_APP_ID, this.id);
        this.fontStyleSheetElements.push(fontStyleSheetElement);
      }
      (hostStyleSheetElement || fontStyleSheetElement) && this.shadowRoot.host.setAttribute(WUJIE_DATA_ATTACH_CSS_FLAG, "");
    }
  }]);
}();
export { Wujie as default };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJpZnJhbWVHZW5lcmF0b3IiLCJyZWNvdmVyRXZlbnRMaXN0ZW5lcnMiLCJyZWNvdmVyRG9jdW1lbnRMaXN0ZW5lcnMiLCJpbnNlcnRTY3JpcHRUb0lmcmFtZSIsInBhdGNoRXZlbnRUaW1lU3RhbXAiLCJwYXRjaERlZ3JhZGVJbnN0YW5jZW9mQWNyb3NzUmVhbG1zIiwic3luY1VybFRvV2luZG93Iiwic3luY1VybFRvSWZyYW1lIiwiY2xlYXJJbmFjdGl2ZUFwcFVybCIsImNyZWF0ZVd1amllV2ViQ29tcG9uZW50IiwiY2xlYXJDaGlsZCIsImdldFBhdGNoU3R5bGVFbGVtZW50cyIsInJlbmRlckVsZW1lbnRUb0NvbnRhaW5lciIsInJlbmRlclRlbXBsYXRlVG9TaGFkb3dSb290IiwicmVuZGVyVGVtcGxhdGVUb0lmcmFtZSIsImluaXRSZW5kZXJJZnJhbWVBbmRDb250YWluZXIiLCJyZW1vdmVMb2FkaW5nIiwicHJveHlHZW5lcmF0b3IiLCJsb2NhbEdlbmVyYXRvciIsImdldFBsdWdpbnMiLCJnZXRQcmVzZXRMb2FkZXJzIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImlkVG9TYW5kYm94Q2FjaGVNYXAiLCJhZGRTYW5kYm94Q2FjaGVXaXRoV3VqaWUiLCJkZWxldGVXdWppZUJ5SWQiLCJyYXdFbGVtZW50QXBwZW5kQ2hpbGQiLCJyYXdEb2N1bWVudFF1ZXJ5U2VsZWN0b3IiLCJFdmVudEJ1cyIsImFwcEV2ZW50T2JqTWFwIiwiRXZlbnRDbGVhbnVwVHJhY2tlciIsImlzRnVuY3Rpb24iLCJ3dWppZVN1cHBvcnQiLCJhcHBSb3V0ZVBhcnNlIiwicmVxdWVzdElkbGVDYWxsYmFjayIsImdldEFic29sdXRlUGF0aCIsImV2ZW50VHJpZ2dlciIsIldVSklFX0RBVEFfQVRUQUNIX0NTU19GTEFHIiwiV1VKSUVfQVBQX0lEIiwiV1VKSUVfRk9OVF9TVFlMRV9DT05UQUlORVJfQVRUUiIsIld1amllIiwib3B0aW9ucyIsIl9jbGFzc0NhbGxDaGVjayIsIl9kZWZpbmVQcm9wZXJ0eSIsIldlYWtNYXAiLCJ3aW5kb3ciLCJfX1BPV0VSRURfQllfV1VKSUVfXyIsImluamVjdCIsIl9fV1VKSUUiLCJpZFRvU2FuZGJveE1hcCIsIm1haW5Ib3N0UGF0aCIsImxvY2F0aW9uIiwicHJvdG9jb2wiLCJob3N0IiwiZm9udFN0eWxlU2hlZXRDb250YWluZXIiLCJjcmVhdGVGb250U3R5bGVTaGVldENvbnRhaW5lciIsIm5hbWUiLCJ1cmwiLCJhdHRycyIsImZpYmVyIiwiZGVncmFkZUF0dHJzIiwiZGVncmFkZSIsImxpZmVjeWNsZXMiLCJwbHVnaW5zIiwiaWQiLCJidXMiLCJwcm92aWRlIiwic3R5bGVTaGVldEVsZW1lbnRzIiwiZXhlY1F1ZXVlIiwiaWZyYW1lQWRkRXZlbnRMaXN0ZW5lcnMiLCJpZnJhbWVPbkV2ZW50cyIsIl9hcHBSb3V0ZVBhcnNlIiwidXJsRWxlbWVudCIsImFwcEhvc3RQYXRoIiwiYXBwUm91dGVQYXRoIiwiaWZyYW1lIiwiX2xvY2FsR2VuZXJhdG9yIiwicHJveHlEb2N1bWVudCIsInByb3h5TG9jYXRpb24iLCJwcm94eVJldm9rZSIsIl9wcm94eUdlbmVyYXRvciIsInByb3h5V2luZG93IiwicHJveHkiLCJfY3JlYXRlQ2xhc3MiLCJrZXkiLCJ2YWx1ZSIsIl9hY3RpdmUiLCJfYXN5bmNUb0dlbmVyYXRvciIsIl9yZWdlbmVyYXRvclJ1bnRpbWUiLCJtYXJrIiwiX2NhbGxlZSIsIl90aGlzIiwic3luYyIsImVsIiwidGVtcGxhdGUiLCJwcm9wcyIsImFsaXZlIiwicHJlZml4IiwiZmV0Y2giLCJyZXBsYWNlIiwiaWZyYW1lV2luZG93IiwiaWZyYW1lRmV0Y2giLCJpZnJhbWVCb2R5IiwiX2luaXRSZW5kZXJJZnJhbWVBbmRDIiwiY29udGFpbmVyIiwicmVuZGVyV2luZG93IiwiX2lmcmFtZUJvZHkiLCJ3cmFwIiwiX2NvbnRleHQiLCJwcmV2IiwibmV4dCIsImhyZWZGbGFnIiwiYWN0aXZlRmxhZyIsImlmcmFtZVJlYWR5IiwiY29udGVudFdpbmRvdyIsImlucHV0IiwiaW5pdCIsImhyZWYiLCJleGVjRmxhZyIsImNhbGwiLCJkb2N1bWVudCIsIm9udW5sb2FkIiwidW5tb3VudCIsImNvbnRlbnREb2N1bWVudCIsInJlcGxhY2VDaGlsZCIsImRvY3VtZW50RWxlbWVudCIsImRlZmF1bHRWaWV3IiwiYWJydXB0Iiwic2hhZG93Um9vdCIsInBhdGNoQ3NzUnVsZXMiLCJzdG9wIiwiYWN0aXZlIiwiX3giLCJhcHBseSIsImFyZ3VtZW50cyIsImNhbGxiYWNrIiwiX3RoaXMyIiwiX3N0YXJ0IiwiX2NhbGxlZTIiLCJnZXRFeHRlcm5hbFNjcmlwdHMiLCJfdGhpczMiLCJzY3JpcHRSZXN1bHRMaXN0IiwiYmVmb3JlU2NyaXB0UmVzdWx0TGlzdCIsImFmdGVyU2NyaXB0UmVzdWx0TGlzdCIsInN5bmNTY3JpcHRSZXN1bHRMaXN0IiwiYXN5bmNTY3JpcHRSZXN1bHRMaXN0IiwiZGVmZXJTY3JpcHRSZXN1bHRMaXN0IiwiZG9tQ29udGVudExvYWRlZFRyaWdnZXIiLCJkb21Mb2FkZWRUcmlnZ2VyIiwiX2NvbnRleHQyIiwic2VudCIsImZvckVhY2giLCJzY3JpcHRSZXN1bHQiLCJkZWZlciIsInB1c2giLCJhc3luYyIsImJlZm9yZVNjcmlwdFJlc3VsdCIsImNvbmNhdCIsImNvbnRlbnRQcm9taXNlIiwidGhlbiIsImNvbnRlbnQiLCJfb2JqZWN0U3ByZWFkIiwibW91bnQiLCJfdGhpczMkZXhlY1F1ZXVlJHNoaWYiLCJzaGlmdCIsImFmdGVyU2NyaXB0UmVzdWx0IiwiX3RoaXMzJGV4ZWNRdWV1ZSRzaGlmMiIsIl9fV1VKSUVfVU5NT1VOVCIsIlByb21pc2UiLCJyZXNvbHZlIiwiX3RoaXMzJGV4ZWNRdWV1ZSRzaGlmMyIsInN0YXJ0IiwiX3gyIiwiX3RoaXMkZXhlY1F1ZXVlJHNoaWZ0IiwibW91bnRGbGFnIiwiX19XVUpJRV9NT1VOVCIsIl90aGlzJGxpZmVjeWNsZXMiLCJfdGhpcyRsaWZlY3ljbGVzJGJlZm8iLCJfdGhpcyRsaWZlY3ljbGVzMiIsIl90aGlzJGxpZmVjeWNsZXMyJGFmdCIsImJlZm9yZU1vdW50IiwiYWZ0ZXJNb3VudCIsIl90aGlzJGxpZmVjeWNsZXMzIiwiX3RoaXMkbGlmZWN5Y2xlczMkYWN0IiwiYWN0aXZhdGVkIiwiX3VubW91bnQiLCJfY2FsbGVlMyIsIl90aGlzJGxpZmVjeWNsZXM0IiwiX3RoaXMkbGlmZWN5Y2xlczQkZGVhIiwiX3RoaXMkbGlmZWN5Y2xlczUiLCJfdGhpcyRsaWZlY3ljbGVzNSRiZWYiLCJfdGhpcyRsaWZlY3ljbGVzNiIsIl90aGlzJGxpZmVjeWNsZXM2JGFmdCIsIl90aGlzJGJ1cyIsIl9jb250ZXh0MyIsImNsZWFyRGVmZXJyZWRTdHlsZU9ic2VydmVycyIsImRlYWN0aXZhdGVkIiwiYmVmb3JlVW5tb3VudCIsImFmdGVyVW5tb3VudCIsIiRjbGVhciIsImhlYWQiLCJib2R5IiwiX2Rlc3Ryb3kiLCJfY2FsbGVlNCIsIl90aGlzJGlmcmFtZSRwYXJlbnRObyIsIl9pZnJhbWVXaW5kb3ciLCJfdGhpcyRwcm94eVJldm9rZSIsIl9jb250ZXh0NCIsImNsZWFyU3R5bGVTaGVldHMiLCJjbGVhckR5bmFtaWNTY3JpcHRzIiwiY2xlYXJGb250U3R5bGVTaGVldHMiLCIkZGVzdHJveSIsImZvbnRTdHlsZVNoZWV0RWxlbWVudHMiLCJkeW5hbWljU2NyaXB0RWxlbWVudHMiLCJkZWZlcnJlZFN0eWxlT2JzZXJ2ZXJzIiwiZWxlbWVudEV2ZW50Q2FjaGVNYXAiLCJfX1dVSklFX0VWRU5UTElTVEVORVJfXyIsIm8iLCJ0eXBlIiwibGlzdGVuZXIiLCIkd3VqaWUiLCJfIiwicGFyZW50Tm9kZSIsInJlbW92ZUNoaWxkIiwiZXZlbnRDbGVhbnVwVHJhY2tlciIsImNsZWFudXBBbGwiLCJkZXN0cm95IiwiQXJyYXkiLCJpc0FycmF5IiwiX2VsJHBhcmVudE5vZGUiLCJsZW5ndGgiLCJzY3JpcHQiLCJfc2NyaXB0JHBhcmVudE5vZGUiLCJfZWwkcGFyZW50Tm9kZTIiLCJvYnNlcnZlciIsImRpc2Nvbm5lY3QiLCJzdHlsZUVsZW1lbnQiLCJjcmVhdGVFbGVtZW50Iiwic2V0QXR0cmlidXRlIiwiYXBwZW5kQ2hpbGQiLCJyZWJ1aWxkU3R5bGVTaGVldHMiLCJfdGhpczQiLCJzdHlsZVNoZWV0RWxlbWVudCIsImhhc0F0dHJpYnV0ZSIsIl9nZXRQYXRjaFN0eWxlRWxlbWVudCIsImZyb20iLCJxdWVyeVNlbGVjdG9yQWxsIiwibWFwIiwic2hlZXQiLCJfZ2V0UGF0Y2hTdHlsZUVsZW1lbnQyIiwiX3NsaWNlZFRvQXJyYXkiLCJob3N0U3R5bGVTaGVldEVsZW1lbnQiLCJmb250U3R5bGVTaGVldEVsZW1lbnQiLCJfdGhpcyRpbmplY3QkZm9udFN0eWwiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vc3JjL3NhbmRib3gudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgaWZyYW1lR2VuZXJhdG9yLFxuICByZWNvdmVyRXZlbnRMaXN0ZW5lcnMsXG4gIHJlY292ZXJEb2N1bWVudExpc3RlbmVycyxcbiAgaW5zZXJ0U2NyaXB0VG9JZnJhbWUsXG4gIHBhdGNoRXZlbnRUaW1lU3RhbXAsXG4gIHBhdGNoRGVncmFkZUluc3RhbmNlb2ZBY3Jvc3NSZWFsbXMsXG59IGZyb20gXCIuL2lmcmFtZVwiO1xuaW1wb3J0IHsgc3luY1VybFRvV2luZG93LCBzeW5jVXJsVG9JZnJhbWUsIGNsZWFySW5hY3RpdmVBcHBVcmwgfSBmcm9tIFwiLi9zeW5jXCI7XG5pbXBvcnQge1xuICBjcmVhdGVXdWppZVdlYkNvbXBvbmVudCxcbiAgY2xlYXJDaGlsZCxcbiAgZ2V0UGF0Y2hTdHlsZUVsZW1lbnRzLFxuICByZW5kZXJFbGVtZW50VG9Db250YWluZXIsXG4gIHJlbmRlclRlbXBsYXRlVG9TaGFkb3dSb290LFxuICByZW5kZXJUZW1wbGF0ZVRvSWZyYW1lLFxuICBpbml0UmVuZGVySWZyYW1lQW5kQ29udGFpbmVyLFxuICByZW1vdmVMb2FkaW5nLFxufSBmcm9tIFwiLi9zaGFkb3dcIjtcbmltcG9ydCB7IHByb3h5R2VuZXJhdG9yLCBsb2NhbEdlbmVyYXRvciB9IGZyb20gXCIuL3Byb3h5XCI7XG5pbXBvcnQgeyBTY3JpcHRSZXN1bHRMaXN0IH0gZnJvbSBcIi4vZW50cnlcIjtcbmltcG9ydCB7IGdldFBsdWdpbnMsIGdldFByZXNldExvYWRlcnMgfSBmcm9tIFwiLi9wbHVnaW5cIjtcbmltcG9ydCB7IHJlbW92ZUV2ZW50TGlzdGVuZXIgfSBmcm9tIFwiLi9lZmZlY3RcIjtcbmltcG9ydCB7XG4gIFNhbmRib3hDYWNoZSxcbiAgaWRUb1NhbmRib3hDYWNoZU1hcCxcbiAgYWRkU2FuZGJveENhY2hlV2l0aFd1amllLFxuICBkZWxldGVXdWppZUJ5SWQsXG4gIHJhd0VsZW1lbnRBcHBlbmRDaGlsZCxcbiAgcmF3RG9jdW1lbnRRdWVyeVNlbGVjdG9yLFxufSBmcm9tIFwiLi9jb21tb25cIjtcbmltcG9ydCB7IEV2ZW50QnVzLCBhcHBFdmVudE9iak1hcCwgRXZlbnRPYmogfSBmcm9tIFwiLi9ldmVudFwiO1xuaW1wb3J0IHsgRXZlbnRDbGVhbnVwVHJhY2tlciB9IGZyb20gXCIuL3RyYWNrZXJcIjtcbmltcG9ydCB7IGlzRnVuY3Rpb24sIHd1amllU3VwcG9ydCwgYXBwUm91dGVQYXJzZSwgcmVxdWVzdElkbGVDYWxsYmFjaywgZ2V0QWJzb2x1dGVQYXRoLCBldmVudFRyaWdnZXIgfSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IHsgV1VKSUVfREFUQV9BVFRBQ0hfQ1NTX0ZMQUcsIFdVSklFX0FQUF9JRCwgV1VKSUVfRk9OVF9TVFlMRV9DT05UQUlORVJfQVRUUiB9IGZyb20gXCIuL2NvbnN0YW50XCI7XG5pbXBvcnQgeyBwbHVnaW4sIFNjcmlwdE9iamVjdExvYWRlciwgbG9hZEVycm9ySGFuZGxlciB9IGZyb20gXCIuL2luZGV4XCI7XG5cbmV4cG9ydCB0eXBlIGxpZmVjeWNsZSA9IChhcHBXaW5kb3c6IFdpbmRvdykgPT4gYW55O1xudHlwZSBsaWZlY3ljbGVzID0ge1xuICBiZWZvcmVMb2FkOiBsaWZlY3ljbGU7XG4gIGJlZm9yZU1vdW50OiBsaWZlY3ljbGU7XG4gIGFmdGVyTW91bnQ6IGxpZmVjeWNsZTtcbiAgYmVmb3JlVW5tb3VudDogbGlmZWN5Y2xlO1xuICBhZnRlclVubW91bnQ6IGxpZmVjeWNsZTtcbiAgYWN0aXZhdGVkOiBsaWZlY3ljbGU7XG4gIGRlYWN0aXZhdGVkOiBsaWZlY3ljbGU7XG4gIGxvYWRFcnJvcjogbG9hZEVycm9ySGFuZGxlcjtcbn07XG4vKipcbiAqIOWfuuS6jiBQcm94eeWSjGlmcmFtZSDlrp7njrDnmoTmspnnrrFcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV3VqaWUge1xuICBwdWJsaWMgaWQ6IHN0cmluZztcbiAgLyoqIOa/gOa0u+aXtui3r+eUseWcsOWdgCAqL1xuICBwdWJsaWMgdXJsOiBzdHJpbmc7XG4gIC8qKiDlrZDlupTnlKjkv53mtLsgKi9cbiAgcHVibGljIGFsaXZlOiBib29sZWFuO1xuICAvKiogd2luZG935Luj55CGICovXG4gIHB1YmxpYyBwcm94eTogV2luZG93UHJveHk7XG4gIC8qKiBkb2N1bWVudOS7o+eQhiAqL1xuICBwdWJsaWMgcHJveHlEb2N1bWVudDogT2JqZWN0O1xuICAvKiogbG9jYXRpb27ku6PnkIYgKi9cbiAgcHVibGljIHByb3h5TG9jYXRpb246IE9iamVjdDtcbiAgLyoqXG4gICAqIOmHiuaUviB3aW5kb3cgLyBkb2N1bWVudCAvIGxvY2F0aW9uIOS7o+eQhuOAglxuICAgKiDku6PnkIbnmoQgaGFuZGxlciDpl63ljIXmjZXojrfkuoYgaWZyYW1lIC8gdXJsRWxlbWVudCDnrYkgRE9NIOW8leeUqO+8jGRlc3Ryb3kg5pe26LCD55So5q2k5Ye95pWwXG4gICAqIOino+mZpOS7o+eQhuS4jiBoYW5kbGVyIOeahOWFs+iBlO+8jOaWqeaWreOAjOS4u+W6lOeUqCDihpIg5Luj55CG6Zet5YyFIOKGkiBpZnJhbWXjgI3nmoTlvJXnlKjpk77jgIJcbiAgICovXG4gIHB1YmxpYyBwcm94eVJldm9rZTogKCkgPT4gdm9pZDtcbiAgLyoqIOS6i+S7tuS4reW/gyAqL1xuICBwdWJsaWMgYnVzOiBFdmVudEJ1cztcbiAgLyoqIOWuueWZqCAqL1xuICBwdWJsaWMgZWw6IEhUTUxFbGVtZW50O1xuICAvKioganPmspnnrrEgKi9cbiAgcHVibGljIGlmcmFtZTogSFRNTElGcmFtZUVsZW1lbnQ7XG4gIC8qKiBjc3PmspnnrrEgKi9cbiAgcHVibGljIHNoYWRvd1Jvb3Q6IFNoYWRvd1Jvb3Q7XG4gIC8qKiDlrZDlupTnlKjnmoR0ZW1wbGF0ZSAqL1xuICBwdWJsaWMgdGVtcGxhdGU6IHN0cmluZztcbiAgLyoqIOWtkOW6lOeUqOS7o+eggeabv+aNoumSqeWtkCAqL1xuICBwdWJsaWMgcmVwbGFjZTogKGNvZGU6IHN0cmluZykgPT4gc3RyaW5nO1xuICAvKiog5a2Q5bqU55So6Ieq5a6a5LmJZmV0Y2ggKi9cbiAgcHVibGljIGZldGNoOiAoaW5wdXQ6IFJlcXVlc3RJbmZvLCBpbml0PzogUmVxdWVzdEluaXQpID0+IFByb21pc2U8UmVzcG9uc2U+O1xuICAvKiog5a2Q5bqU55So55qE55Sf5ZG95ZGo5pyfICovXG4gIHB1YmxpYyBsaWZlY3ljbGVzOiBsaWZlY3ljbGVzO1xuICAvKiog5a2Q5bqU55So55qE5o+S5Lu2ICovXG4gIHB1YmxpYyBwbHVnaW5zOiBBcnJheTxwbHVnaW4+O1xuICAvKioganPmspnnrrFyZWFkeeaAgSAqL1xuICBwdWJsaWMgaWZyYW1lUmVhZHk6IFByb21pc2U8dm9pZD47XG4gIC8qKiDlrZDlupTnlKjpooTliqDovb3mgIEgKi9cbiAgcHVibGljIHByZWxvYWQ6IFByb21pc2U8dm9pZD47XG4gIC8qKiDpmY3nuqfml7bmuLLmn5NpZnJhbWXnmoTlsZ7mgKcgKi9cbiAgcHVibGljIGRlZ3JhZGVBdHRyczogeyBba2V5OiBzdHJpbmddOiBhbnkgfTtcbiAgLyoqIOWtkOW6lOeUqGpz5omn6KGM6Zif5YiXICovXG4gIHB1YmxpYyBleGVjUXVldWU6IEFycmF5PEZ1bmN0aW9uPjtcbiAgLyoqIOWtkOW6lOeUqOaJp+ihjOi/h+agh+W/lyAqL1xuICBwdWJsaWMgZXhlY0ZsYWc6IGJvb2xlYW47XG4gIC8qKiDlrZDlupTnlKjmv4DmtLvmoIflv5cgKi9cbiAgcHVibGljIGFjdGl2ZUZsYWc6IGJvb2xlYW47XG4gIC8qKiDlrZDlupTnlKhtb3VudOagh+W/lyAqL1xuICBwdWJsaWMgbW91bnRGbGFnOiBib29sZWFuO1xuICAvKiog6Lev55Sx5ZCM5q2l5qCH5b+XICovXG4gIHB1YmxpYyBzeW5jOiBib29sZWFuO1xuICAvKiog5a2Q5bqU55So55+t6Lev5b6E5pu/5o2i77yM6Lev55Sx5ZCM5q2l5pe255Sf5pWIICovXG4gIHB1YmxpYyBwcmVmaXg6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH07XG4gIC8qKiDlrZDlupTnlKjot7PovazmoIflv5cgKi9cbiAgcHVibGljIGhyZWZGbGFnOiBib29sZWFuO1xuICAvKiog5a2Q5bqU55So6YeH55SoZmliZXLmqKHlvI/miafooYwgKi9cbiAgcHVibGljIGZpYmVyOiBib29sZWFuO1xuICAvKiog5a2Q5bqU55So6ZmN57qn5qCH5b+XICovXG4gIHB1YmxpYyBkZWdyYWRlOiBib29sZWFuO1xuICAvKiog5a2Q5bqU55So6ZmN57qnZG9jdW1lbnQgKi9cbiAgcHVibGljIGRvY3VtZW50OiBEb2N1bWVudDtcbiAgLyoqIOWtkOW6lOeUqHN0eWxlU2hlZXTlhYPntKAgKi9cbiAgcHVibGljIHN0eWxlU2hlZXRFbGVtZW50czogQXJyYXk8SFRNTExpbmtFbGVtZW50IHwgSFRNTFN0eWxlRWxlbWVudD47XG5cbiAgLyoqIOWtkOW6lOeUqCBmb250LWZhY2Ug5qC35byP5YWD57Sg77yM5oyC6L295Zyo5pyA5aSW5bGCIGRvY3VtZW50LmhlYWQgKi9cbiAgcHVibGljIGZvbnRTdHlsZVNoZWV0RWxlbWVudHM6IEFycmF5PEhUTUxTdHlsZUVsZW1lbnQ+ID0gW107XG4gIC8qKlxuICAgKiDlrZDlupTnlKjpgJrov4cgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZCg8c2NyaXB0Pikg6Kem5Y+R55qE5Yqo5oCB6ISa5pys6IqC54K544CCXG4gICAqIOeUsSBpbnNlcnRTY3JpcHRUb0lmcmFtZSDlnKjmlLbliLAgcmF3RWxlbWVudO+8iOWNsyBlZmZlY3QudHMg6L2s5Y+R55qE5Yqo5oCBIHNjcmlwdO+8iVxuICAgKiDml7bnmbvorrDvvIxzYW5kYm94LmRlc3Ryb3koKSDml7bnu5/kuIDku44gaWZyYW1lIGhlYWQgZGV0YWNoIOW5tua4heepuuOAglxuICAgKi9cbiAgcHVibGljIGR5bmFtaWNTY3JpcHRFbGVtZW50czogQXJyYXk8SFRNTFNjcmlwdEVsZW1lbnQ+ID0gW107XG4gIC8qKlxuICAgKiDliqjmgIEgPGxpbmsgcmVsPXN0eWxlc2hlZXQ+IOS7peepuiBocmVmIOaPkuWFpe+8iOWFiCBhcHBlbmRDaGlsZCDlkI4gc2V0QXR0cmlidXRlKCdocmVmJynvvIxcbiAgICog5aaCIHRpbnltY2Ug55qEIFN0eWxlU2hlZXRMb2FkZXLvvInml7bvvIxlZmZlY3QudHMg5Lya5rOo5YaM5LiA5LiqIE11dGF0aW9uT2JzZXJ2ZXIg55uR5ZCsXG4gICAqIGhyZWYg55qE5ZCO57ut6LWL5YC844CC6L+Z5LqbIG9ic2VydmVyIOW/hemhu+WcqCBkZXN0cm95IOaXtue7n+S4gCBkaXNjb25uZWN077yM5ZCm5YiZ5ri456a7IGxpbmtcbiAgICog5Lya6YCa6L+HIG5vZGUg4oaSIHJlZ2lzdGVyZWQgb2JzZXJ2ZXIg4oaSIGNhbGxiYWNrIOmXreWMhemTvui3r+aKiuW3sumUgOavgeeahCBzYW5kYm94IOmSieWcqOWGheWtmOS4reOAglxuICAgKi9cbiAgcHVibGljIGRlZmVycmVkU3R5bGVPYnNlcnZlcnM6IEFycmF5PE11dGF0aW9uT2JzZXJ2ZXI+ID0gW107XG4gIC8qKiDlrZDlupTnlKhoZWFk5YWD57SgICovXG4gIHB1YmxpYyBoZWFkOiBIVE1MSGVhZEVsZW1lbnQ7XG4gIC8qKiDlrZDlupTnlKhib2R55YWD57SgICovXG4gIHB1YmxpYyBib2R5OiBIVE1MQm9keUVsZW1lbnQ7XG4gIC8qKiDlrZDlupTnlKhkb23nm5HlkKzkuovku7bnlZnlrZjvvIzlvZPpmY3nuqfml7bnlKjkuo7kv53lrZjlhYPntKDkuovku7YgKi9cbiAgcHVibGljIGVsZW1lbnRFdmVudENhY2hlTWFwOiBXZWFrTWFwPFxuICAgIE5vZGUsXG4gICAgQXJyYXk8eyB0eXBlOiBzdHJpbmc7IGhhbmRsZXI6IEV2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3Q7IG9wdGlvbnM6IGFueSB9PlxuICA+ID0gbmV3IFdlYWtNYXAoKTtcbiAgLyoqIOWtkOW6lOeUqHdpbmRvd+ebkeWQrOS6i+S7tiAqL1xuICBwdWJsaWMgaWZyYW1lQWRkRXZlbnRMaXN0ZW5lcnM/OiBBcnJheTxzdHJpbmc+O1xuICAvKiog5a2Q5bqU55SoaWZyYW1lIG9u5LqL5Lu2ICovXG4gIHB1YmxpYyBpZnJhbWVPbkV2ZW50cz86IEFycmF5PHN0cmluZz47XG4gIC8qKiDplIDmr4Hpk77ot6/muIXnkIbot5/ouKrlmajvvJrorrDlvZXooqvovazlj5HliLDkuLvlupTnlKggd2luZG93L2RvY3VtZW50IOS4iueahOWJr+S9nOeUqO+8jGRlc3Ryb3kg5pe257uf5LiA5Zue5pS2ICovXG4gIHB1YmxpYyBldmVudENsZWFudXBUcmFja2VyOiBFdmVudENsZWFudXBUcmFja2VyID0gbmV3IEV2ZW50Q2xlYW51cFRyYWNrZXIoKTtcblxuICAvKiogJHd1amll5a+56LGh77yM5o+Q5L6b57uZ5a2Q5bqU55So55qE5o6l5Y+jICovXG4gIHB1YmxpYyBwcm92aWRlOiB7XG4gICAgYnVzOiBFdmVudEJ1cztcbiAgICBzaGFkb3dSb290PzogU2hhZG93Um9vdDtcbiAgICBwcm9wcz86IHsgW2tleTogc3RyaW5nXTogYW55IH07XG4gICAgbG9jYXRpb24/OiBPYmplY3Q7XG4gIH07XG5cbiAgLyoqIOWtkOW6lOeUqOW1jOWll+WcuuaZr++8jOeItuW6lOeUqOS8oOmAkue7meWtkOW6lOeUqOeahOaVsOaNriAqL1xuICBwdWJsaWMgaW5qZWN0OiB7XG4gICAgaWRUb1NhbmRib3hNYXA6IE1hcDxTdHJpbmcsIFNhbmRib3hDYWNoZT47XG4gICAgYXBwRXZlbnRPYmpNYXA6IE1hcDxTdHJpbmcsIEV2ZW50T2JqPjtcbiAgICBtYWluSG9zdFBhdGg6IHN0cmluZztcbiAgICBmb250U3R5bGVTaGVldENvbnRhaW5lcj86IEhUTUxFbGVtZW50O1xuICB9O1xuXG4gIC8qKiDmv4DmtLvlrZDlupTnlKhcbiAgICogMeOAgeWQjOatpei3r+eUsVxuICAgKiAy44CB5Yqo5oCB5L+u5pS5aWZyYW1l55qEZmV0Y2hcbiAgICogM+OAgeWHhuWkh3NoYWRvd1xuICAgKiA044CB5YeG5aSH5a2Q5bqU55So5rOo5YWlXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgYWN0aXZlKG9wdGlvbnM6IHtcbiAgICB1cmw6IHN0cmluZztcbiAgICBzeW5jPzogYm9vbGVhbjtcbiAgICBwcmVmaXg/OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9O1xuICAgIHRlbXBsYXRlPzogc3RyaW5nO1xuICAgIGVsPzogc3RyaW5nIHwgSFRNTEVsZW1lbnQ7XG4gICAgcHJvcHM/OiB7IFtrZXk6IHN0cmluZ106IGFueSB9O1xuICAgIGFsaXZlPzogYm9vbGVhbjtcbiAgICBmZXRjaD86IChpbnB1dDogUmVxdWVzdEluZm8sIGluaXQ/OiBSZXF1ZXN0SW5pdCkgPT4gUHJvbWlzZTxSZXNwb25zZT47XG4gICAgcmVwbGFjZT86IChjb2RlOiBzdHJpbmcpID0+IHN0cmluZztcbiAgfSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHsgc3luYywgdXJsLCBlbCwgdGVtcGxhdGUsIHByb3BzLCBhbGl2ZSwgcHJlZml4LCBmZXRjaCwgcmVwbGFjZSB9ID0gb3B0aW9ucztcbiAgICB0aGlzLnVybCA9IHVybDtcbiAgICB0aGlzLnN5bmMgPSBzeW5jO1xuICAgIHRoaXMuYWxpdmUgPSBhbGl2ZTtcbiAgICB0aGlzLmhyZWZGbGFnID0gZmFsc2U7XG4gICAgdGhpcy5wcmVmaXggPSBwcmVmaXggPz8gdGhpcy5wcmVmaXg7XG4gICAgdGhpcy5yZXBsYWNlID0gcmVwbGFjZSA/PyB0aGlzLnJlcGxhY2U7XG4gICAgdGhpcy5wcm92aWRlLnByb3BzID0gcHJvcHMgPz8gdGhpcy5wcm92aWRlLnByb3BzO1xuICAgIHRoaXMuYWN0aXZlRmxhZyA9IHRydWU7XG4gICAgLy8gd2FpdCBpZnJhbWUgaW5pdFxuICAgIGF3YWl0IHRoaXMuaWZyYW1lUmVhZHk7XG5cbiAgICAvLyDlpITnkIblrZDlupTnlKjoh6rlrprkuYlmZXRjaFxuICAgIC8vIFRPRE8gZmV0Y2jmo4DpqozlkIjms5XmgKdcbiAgICBjb25zdCBpZnJhbWVXaW5kb3cgPSB0aGlzLmlmcmFtZS5jb250ZW50V2luZG93O1xuICAgIGNvbnN0IGlmcmFtZUZldGNoID0gZmV0Y2hcbiAgICAgID8gKGlucHV0OiBSZXF1ZXN0SW5mbywgaW5pdD86IFJlcXVlc3RJbml0KSA9PlxuICAgICAgICAgIGZldGNoKHR5cGVvZiBpbnB1dCA9PT0gXCJzdHJpbmdcIiA/IGdldEFic29sdXRlUGF0aChpbnB1dCwgKHRoaXMucHJveHlMb2NhdGlvbiBhcyBMb2NhdGlvbikuaHJlZikgOiBpbnB1dCwgaW5pdClcbiAgICAgIDogdGhpcy5mZXRjaDtcbiAgICBpZiAoaWZyYW1lRmV0Y2gpIHtcbiAgICAgIGlmcmFtZVdpbmRvdy5mZXRjaCA9IGlmcmFtZUZldGNoO1xuICAgICAgdGhpcy5mZXRjaCA9IGlmcmFtZUZldGNoO1xuICAgIH1cblxuICAgIC8vIOWkhOeQhuWtkOW6lOeUqOi3r+eUseWQjOatpVxuICAgIGlmICh0aGlzLmV4ZWNGbGFnICYmIHRoaXMuYWxpdmUpIHtcbiAgICAgIC8vIOW9k+S/nea0u+aooeW8j+S4i+WtkOW6lOeUqOmHjeaWsOa/gOa0u+aXtu+8jOWPqumcgOimgeWwhuWtkOW6lOeUqOi3r+W+hOWQjOatpeWbnuS4u+W6lOeUqFxuICAgICAgc3luY1VybFRvV2luZG93KGlmcmFtZVdpbmRvdyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIOWFiOWwhnVybOWQjOatpeWbnmlmcmFtZe+8jOeEtuWQjuWGjeWQjOatpeWbnua1j+iniOWZqHVybFxuICAgICAgc3luY1VybFRvSWZyYW1lKGlmcmFtZVdpbmRvdyk7XG4gICAgICBzeW5jVXJsVG9XaW5kb3coaWZyYW1lV2luZG93KTtcbiAgICB9XG5cbiAgICAvLyBpbmplY3QgdGVtcGxhdGVcbiAgICB0aGlzLnRlbXBsYXRlID0gdGVtcGxhdGUgPz8gdGhpcy50ZW1wbGF0ZTtcblxuICAgIC8qIOmZjee6p+WkhOeQhiAqL1xuICAgIGlmICh0aGlzLmRlZ3JhZGUpIHtcbiAgICAgIGNvbnN0IGlmcmFtZUJvZHkgPSByYXdEb2N1bWVudFF1ZXJ5U2VsZWN0b3IuY2FsbChpZnJhbWVXaW5kb3cuZG9jdW1lbnQsIFwiYm9keVwiKSBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGNvbnN0IHsgaWZyYW1lLCBjb250YWluZXIgfSA9IGluaXRSZW5kZXJJZnJhbWVBbmRDb250YWluZXIodGhpcy5pZCwgZWwgPz8gaWZyYW1lQm9keSwgdGhpcy5kZWdyYWRlQXR0cnMpO1xuICAgICAgdGhpcy5lbCA9IGNvbnRhaW5lcjtcbiAgICAgIC8vIOmUgOavgWpz6L+Q6KGMaWZyYW1l5a655Zmo5YaF6YOoZG9tXG4gICAgICBpZiAoZWwpIGNsZWFyQ2hpbGQoaWZyYW1lQm9keSk7XG4gICAgICAvLyDkv67lpI12dWXnmoRldmVudC50aW1lU3RhbXDpl67pophcbiAgICAgIHBhdGNoRXZlbnRUaW1lU3RhbXAoaWZyYW1lLmNvbnRlbnRXaW5kb3csIGlmcmFtZVdpbmRvdyk7XG4gICAgICAvLyDlvZPplIDmr4FpZnJhbWXml7bkuLvliqh1bm1vdW505a2Q5bqU55SoXG4gICAgICBpZnJhbWUuY29udGVudFdpbmRvdy5vbnVubG9hZCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy51bm1vdW50KCk7XG4gICAgICB9O1xuICAgICAgaWYgKHRoaXMuZG9jdW1lbnQpIHtcbiAgICAgICAgaWYgKHRoaXMuYWxpdmUpIHtcbiAgICAgICAgICBpZnJhbWUuY29udGVudERvY3VtZW50LnJlcGxhY2VDaGlsZCh0aGlzLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgaWZyYW1lLmNvbnRlbnREb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpO1xuICAgICAgICAgIC8vIOS/nea0u+WcuuaZr+mcgOimgeS6i+S7tuWFqOmDqOaBouWkjVxuICAgICAgICAgIHJlY292ZXJFdmVudExpc3RlbmVycyhpZnJhbWUuY29udGVudERvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgaWZyYW1lV2luZG93KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhd2FpdCByZW5kZXJUZW1wbGF0ZVRvSWZyYW1lKGlmcmFtZS5jb250ZW50RG9jdW1lbnQsIHRoaXMuaWZyYW1lLmNvbnRlbnRXaW5kb3csIHRoaXMudGVtcGxhdGUpO1xuICAgICAgICAgIC8vIOmdnuS/nea0u+WcuuaZr+mcgOimgeaBouWkjeagueiKgueCueeahOS6i+S7tu+8jOmYsuatonJlYWN0MTbnm5HlkKzkuovku7bkuKLlpLFcbiAgICAgICAgICByZWNvdmVyRG9jdW1lbnRMaXN0ZW5lcnModGhpcy5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsIGlmcmFtZS5jb250ZW50RG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCBpZnJhbWVXaW5kb3cpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCByZW5kZXJUZW1wbGF0ZVRvSWZyYW1lKGlmcmFtZS5jb250ZW50RG9jdW1lbnQsIHRoaXMuaWZyYW1lLmNvbnRlbnRXaW5kb3csIHRoaXMudGVtcGxhdGUpO1xuICAgICAgfVxuICAgICAgdGhpcy5kb2N1bWVudCA9IGlmcmFtZS5jb250ZW50RG9jdW1lbnQ7XG4gICAgICBjb25zdCByZW5kZXJXaW5kb3cgPSB0aGlzLmRvY3VtZW50LmRlZmF1bHRWaWV3O1xuICAgICAgaWYgKHJlbmRlcldpbmRvdykge1xuICAgICAgICBwYXRjaERlZ3JhZGVJbnN0YW5jZW9mQWNyb3NzUmVhbG1zKGlmcmFtZVdpbmRvdywgcmVuZGVyV2luZG93KTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zaGFkb3dSb290KSB7XG4gICAgICAvKlxuICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIgd2FzIHRyYW5zZmVyIHRvIHNoYWRvd1Jvb3QuYWRkRXZlbnRMaXN0ZW5lclxuICAgICAgIHJlYWN0IDE2IFN5bnRoZXRpY0V2ZW50IHdpbGwgcmVtZW1iZXIgZG9jdW1lbnQgZXZlbnQgZm9yIGF2b2lkIHJlcGVhdCBsaXN0ZW5cbiAgICAgICBzaGFkb3dSb290IGhhdmUgdG8gZGlzcGF0Y2hFdmVudCBmb3IgcmVhY3QgMTYgc28gY2FuJ3QgYmUgZGVzdHJveWVkXG4gICAgICAgdGhpcyBtYXkgbGVhZCBtZW1vcnkgbGVhayByaXNrXG4gICAgICAgKi9cbiAgICAgIHRoaXMuZWwgPSByZW5kZXJFbGVtZW50VG9Db250YWluZXIodGhpcy5zaGFkb3dSb290Lmhvc3QsIGVsKTtcbiAgICAgIGlmICh0aGlzLmFsaXZlKSByZXR1cm47XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIOmihOaJp+ihjOaXoOWuueWZqO+8jOaaguaXtuaPkuWFpWlmcmFtZeWGhemDqOinpuWPkVdlYiBDb21wb25lbnTnmoRjb25uZWN0XG4gICAgICBjb25zdCBpZnJhbWVCb2R5ID0gcmF3RG9jdW1lbnRRdWVyeVNlbGVjdG9yLmNhbGwoaWZyYW1lV2luZG93LmRvY3VtZW50LCBcImJvZHlcIikgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICB0aGlzLmVsID0gcmVuZGVyRWxlbWVudFRvQ29udGFpbmVyKGNyZWF0ZVd1amllV2ViQ29tcG9uZW50KHRoaXMuaWQpLCBlbCA/PyBpZnJhbWVCb2R5KTtcbiAgICB9XG5cbiAgICBhd2FpdCByZW5kZXJUZW1wbGF0ZVRvU2hhZG93Um9vdCh0aGlzLnNoYWRvd1Jvb3QsIGlmcmFtZVdpbmRvdywgdGhpcy50ZW1wbGF0ZSk7XG4gICAgdGhpcy5wYXRjaENzc1J1bGVzKCk7XG5cbiAgICAvLyBpbmplY3Qgc2hhZG93Um9vdCB0byBhcHBcbiAgICB0aGlzLnByb3ZpZGUuc2hhZG93Um9vdCA9IHRoaXMuc2hhZG93Um9vdDtcbiAgfVxuXG4gIC8vIOacqumUgOavge+8jOepuumXsuaXtuaJjeWbnuiwg1xuICBwdWJsaWMgcmVxdWVzdElkbGVDYWxsYmFjayhjYWxsYmFjaykge1xuICAgIHJldHVybiByZXF1ZXN0SWRsZUNhbGxiYWNrKCgpID0+IHtcbiAgICAgIC8vIOWBh+WmguW3sue7j+iiq+mUgOavgeS6hlxuICAgICAgaWYgKCF0aGlzLmlmcmFtZSkgcmV0dXJuO1xuICAgICAgY2FsbGJhY2suYXBwbHkodGhpcyk7XG4gICAgfSk7XG4gIH1cbiAgLyoqIOWQr+WKqOWtkOW6lOeUqFxuICAgKiAx44CB6L+Q6KGManNcbiAgICogMuOAgeWkhOeQhuWFvOWuueagt+W8j1xuICAgKi9cbiAgcHVibGljIGFzeW5jIHN0YXJ0KGdldEV4dGVybmFsU2NyaXB0czogKCkgPT4gU2NyaXB0UmVzdWx0TGlzdCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuZXhlY0ZsYWcgPSB0cnVlO1xuICAgIC8vIOaJp+ihjOiEmuacrFxuICAgIGNvbnN0IHNjcmlwdFJlc3VsdExpc3QgPSBhd2FpdCBnZXRFeHRlcm5hbFNjcmlwdHMoKTtcbiAgICAvLyDlgYflpoLlt7Lnu4/ooqvplIDmr4HkuoZcbiAgICBpZiAoIXRoaXMuaWZyYW1lKSByZXR1cm47XG4gICAgY29uc3QgaWZyYW1lV2luZG93ID0gdGhpcy5pZnJhbWUuY29udGVudFdpbmRvdztcbiAgICAvLyDmoIflv5fkvY3vvIzmiafooYzku6PnoIHliY3orr7nva5cbiAgICBpZnJhbWVXaW5kb3cuX19QT1dFUkVEX0JZX1dVSklFX18gPSB0cnVlO1xuICAgIC8vIOeUqOaIt+iHquWumuS5ieS7o+eggeWJjVxuICAgIGNvbnN0IGJlZm9yZVNjcmlwdFJlc3VsdExpc3Q6IFNjcmlwdE9iamVjdExvYWRlcltdID0gZ2V0UHJlc2V0TG9hZGVycyhcImpzQmVmb3JlTG9hZGVyc1wiLCB0aGlzLnBsdWdpbnMpO1xuICAgIC8vIOeUqOaIt+iHquWumuS5ieS7o+eggeWQjlxuICAgIGNvbnN0IGFmdGVyU2NyaXB0UmVzdWx0TGlzdDogU2NyaXB0T2JqZWN0TG9hZGVyW10gPSBnZXRQcmVzZXRMb2FkZXJzKFwianNBZnRlckxvYWRlcnNcIiwgdGhpcy5wbHVnaW5zKTtcbiAgICAvLyDlkIzmraXku6PnoIFcbiAgICBjb25zdCBzeW5jU2NyaXB0UmVzdWx0TGlzdDogU2NyaXB0UmVzdWx0TGlzdCA9IFtdO1xuICAgIC8vIGFzeW5j5Luj56CB5peg6ZyA5L+d6K+B6aG65bqP77yM5omA5Lul5LiN55So5pS+5YWl5omn6KGM6Zif5YiXXG4gICAgY29uc3QgYXN5bmNTY3JpcHRSZXN1bHRMaXN0OiBTY3JpcHRSZXN1bHRMaXN0ID0gW107XG4gICAgLy8gZGVmZXLku6PnoIHpnIDopoHkv53or4Hpobrluo/lubbkuJRET01Db250ZW50TG9hZGVk5YmN5a6M5oiQ77yM6L+Z6YeM57uf5LiA5pS+572u5ZCM5q2l6ISa5pys5ZCO5omn6KGMXG4gICAgY29uc3QgZGVmZXJTY3JpcHRSZXN1bHRMaXN0OiBTY3JpcHRSZXN1bHRMaXN0ID0gW107XG4gICAgc2NyaXB0UmVzdWx0TGlzdC5mb3JFYWNoKChzY3JpcHRSZXN1bHQpID0+IHtcbiAgICAgIGlmIChzY3JpcHRSZXN1bHQuZGVmZXIpIGRlZmVyU2NyaXB0UmVzdWx0TGlzdC5wdXNoKHNjcmlwdFJlc3VsdCk7XG4gICAgICBlbHNlIGlmIChzY3JpcHRSZXN1bHQuYXN5bmMpIGFzeW5jU2NyaXB0UmVzdWx0TGlzdC5wdXNoKHNjcmlwdFJlc3VsdCk7XG4gICAgICBlbHNlIHN5bmNTY3JpcHRSZXN1bHRMaXN0LnB1c2goc2NyaXB0UmVzdWx0KTtcbiAgICB9KTtcblxuICAgIC8vIOaPkuWFpeS7o+eggeWJjVxuICAgIGJlZm9yZVNjcmlwdFJlc3VsdExpc3QuZm9yRWFjaCgoYmVmb3JlU2NyaXB0UmVzdWx0KSA9PiB7XG4gICAgICB0aGlzLmV4ZWNRdWV1ZS5wdXNoKCgpID0+XG4gICAgICAgIHRoaXMuZmliZXJcbiAgICAgICAgICA/IHRoaXMucmVxdWVzdElkbGVDYWxsYmFjaygoKSA9PiBpbnNlcnRTY3JpcHRUb0lmcmFtZShiZWZvcmVTY3JpcHRSZXN1bHQsIGlmcmFtZVdpbmRvdykpXG4gICAgICAgICAgOiBpbnNlcnRTY3JpcHRUb0lmcmFtZShiZWZvcmVTY3JpcHRSZXN1bHQsIGlmcmFtZVdpbmRvdylcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICAvLyDlkIzmraXku6PnoIFcbiAgICBzeW5jU2NyaXB0UmVzdWx0TGlzdC5jb25jYXQoZGVmZXJTY3JpcHRSZXN1bHRMaXN0KS5mb3JFYWNoKChzY3JpcHRSZXN1bHQpID0+IHtcbiAgICAgIHRoaXMuZXhlY1F1ZXVlLnB1c2goKCkgPT5cbiAgICAgICAgc2NyaXB0UmVzdWx0LmNvbnRlbnRQcm9taXNlLnRoZW4oKGNvbnRlbnQpID0+XG4gICAgICAgICAgdGhpcy5maWJlclxuICAgICAgICAgICAgPyB0aGlzLnJlcXVlc3RJZGxlQ2FsbGJhY2soKCkgPT4gaW5zZXJ0U2NyaXB0VG9JZnJhbWUoeyAuLi5zY3JpcHRSZXN1bHQsIGNvbnRlbnQgfSwgaWZyYW1lV2luZG93KSlcbiAgICAgICAgICAgIDogaW5zZXJ0U2NyaXB0VG9JZnJhbWUoeyAuLi5zY3JpcHRSZXN1bHQsIGNvbnRlbnQgfSwgaWZyYW1lV2luZG93KVxuICAgICAgICApXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgLy8g5byC5q2l5Luj56CBXG4gICAgYXN5bmNTY3JpcHRSZXN1bHRMaXN0LmZvckVhY2goKHNjcmlwdFJlc3VsdCkgPT4ge1xuICAgICAgc2NyaXB0UmVzdWx0LmNvbnRlbnRQcm9taXNlLnRoZW4oKGNvbnRlbnQpID0+IHtcbiAgICAgICAgdGhpcy5maWJlclxuICAgICAgICAgID8gdGhpcy5yZXF1ZXN0SWRsZUNhbGxiYWNrKCgpID0+IGluc2VydFNjcmlwdFRvSWZyYW1lKHsgLi4uc2NyaXB0UmVzdWx0LCBjb250ZW50IH0sIGlmcmFtZVdpbmRvdykpXG4gICAgICAgICAgOiBpbnNlcnRTY3JpcHRUb0lmcmFtZSh7IC4uLnNjcmlwdFJlc3VsdCwgY29udGVudCB9LCBpZnJhbWVXaW5kb3cpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvL+ahhuaetuS4u+WKqOiwg+eUqG1vdW505pa55rOVXG4gICAgdGhpcy5leGVjUXVldWUucHVzaCh0aGlzLmZpYmVyID8gKCkgPT4gdGhpcy5yZXF1ZXN0SWRsZUNhbGxiYWNrKCgpID0+IHRoaXMubW91bnQoKSkgOiAoKSA9PiB0aGlzLm1vdW50KCkpO1xuXG4gICAgLy/op6blj5EgRE9NQ29udGVudExvYWRlZCDkuovku7ZcbiAgICBjb25zdCBkb21Db250ZW50TG9hZGVkVHJpZ2dlciA9ICgpID0+IHtcbiAgICAgIGV2ZW50VHJpZ2dlcihpZnJhbWVXaW5kb3cuZG9jdW1lbnQsIFwiRE9NQ29udGVudExvYWRlZFwiKTtcbiAgICAgIGV2ZW50VHJpZ2dlcihpZnJhbWVXaW5kb3csIFwiRE9NQ29udGVudExvYWRlZFwiKTtcbiAgICAgIHRoaXMuZXhlY1F1ZXVlLnNoaWZ0KCk/LigpO1xuICAgIH07XG4gICAgdGhpcy5leGVjUXVldWUucHVzaCh0aGlzLmZpYmVyID8gKCkgPT4gdGhpcy5yZXF1ZXN0SWRsZUNhbGxiYWNrKGRvbUNvbnRlbnRMb2FkZWRUcmlnZ2VyKSA6IGRvbUNvbnRlbnRMb2FkZWRUcmlnZ2VyKTtcblxuICAgIC8vIOaPkuWFpeS7o+eggeWQjlxuICAgIGFmdGVyU2NyaXB0UmVzdWx0TGlzdC5mb3JFYWNoKChhZnRlclNjcmlwdFJlc3VsdCkgPT4ge1xuICAgICAgdGhpcy5leGVjUXVldWUucHVzaCgoKSA9PlxuICAgICAgICB0aGlzLmZpYmVyXG4gICAgICAgICAgPyB0aGlzLnJlcXVlc3RJZGxlQ2FsbGJhY2soKCkgPT4gaW5zZXJ0U2NyaXB0VG9JZnJhbWUoYWZ0ZXJTY3JpcHRSZXN1bHQsIGlmcmFtZVdpbmRvdykpXG4gICAgICAgICAgOiBpbnNlcnRTY3JpcHRUb0lmcmFtZShhZnRlclNjcmlwdFJlc3VsdCwgaWZyYW1lV2luZG93KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIC8v6Kem5Y+RIGxvYWRlZCDkuovku7ZcbiAgICBjb25zdCBkb21Mb2FkZWRUcmlnZ2VyID0gKCkgPT4ge1xuICAgICAgZXZlbnRUcmlnZ2VyKGlmcmFtZVdpbmRvdy5kb2N1bWVudCwgXCJyZWFkeXN0YXRlY2hhbmdlXCIpO1xuICAgICAgZXZlbnRUcmlnZ2VyKGlmcmFtZVdpbmRvdywgXCJsb2FkXCIpO1xuICAgICAgdGhpcy5leGVjUXVldWUuc2hpZnQoKT8uKCk7XG4gICAgfTtcbiAgICB0aGlzLmV4ZWNRdWV1ZS5wdXNoKHRoaXMuZmliZXIgPyAoKSA9PiB0aGlzLnJlcXVlc3RJZGxlQ2FsbGJhY2soZG9tTG9hZGVkVHJpZ2dlcikgOiBkb21Mb2FkZWRUcmlnZ2VyKTtcbiAgICAvLyDnlLHkuo7msqHmnInlip7ms5Xlh4bnoa7lrprkvY3mmK/lk6rkuKrku6PnoIHlgZrkuoZtb3VudO+8jOS/nea0u+OAgemHjeW7uuaooeW8j+aPkOWJjeWFs+mXrWxvYWRpbmdcbiAgICBpZiAodGhpcy5hbGl2ZSB8fCAhaXNGdW5jdGlvbih0aGlzLmlmcmFtZS5jb250ZW50V2luZG93Ll9fV1VKSUVfVU5NT1VOVCkpIHJlbW92ZUxvYWRpbmcodGhpcy5lbCk7XG4gICAgdGhpcy5leGVjUXVldWUuc2hpZnQoKSgpO1xuXG4gICAgLy8g5omA5pyJ55qEZXhlY1F1ZXVl6Zif5YiX5omn6KGM5a6M5q+V77yMc3RhcnTmiY3nrpfnu5PmnZ/vvIzkv53or4HkuLLooYznmoTmiafooYzlrZDlupTnlKhcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMuZXhlY1F1ZXVlLnB1c2goKCkgPT4ge1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIHRoaXMuZXhlY1F1ZXVlLnNoaWZ0KCk/LigpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICog5qGG5p625Li75Yqo5Y+R6LW3bW91bnTvvIzlpoLmnpzlrZDlupTnlKjmmK/lvILmraXmuLLmn5Plrp7kvovvvIzmr5TlpoLlsIbnlJ/lkb3lkahfX1dVSklFX01PVU5U5pS+5YiwYXN5bmPlh73mlbDlhoVcbiAgICog5q2k5pe25aaC5p6c6YeH55SoZmliZXLmqKHlvI/muLLmn5PvvIjkuLvlupTnlKjosIPnlKhtb3VudOeahOaXtuacuuS5n+aYr+W8guatpeS4jeehruWumueahO+8ie+8jOahhuaetuiwg+eUqG1vdW505pe25Y+v6IO9XG4gICAqIOWtkOW6lOeUqOeahF9fV1VKSUVfTU9VTlTov5jmsqHmnInmjILovb3liLB3aW5kb3fvvIzmiYDku6Xov5nph4zlsIHoo4XkuIDkuKptb3VudOWHveaVsO+8jOW9k+WtkOW6lOeUqOaYr+W8guatpea4suafk1xuICAgKiDlrp7kvovml7bvvIzlrZDlupTnlKjlvILmraXlh73mlbDph4zpnaLmnIDlkI7liqDkuIp3aW5kb3cuX19XVUpJRS5tb3VudCgp5p2l5Li75Yqo6LCD55SoXG4gICAqL1xuICBwdWJsaWMgbW91bnQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMubW91bnRGbGFnKSByZXR1cm47XG4gICAgaWYgKGlzRnVuY3Rpb24odGhpcy5pZnJhbWUuY29udGVudFdpbmRvdy5fX1dVSklFX01PVU5UKSkge1xuICAgICAgcmVtb3ZlTG9hZGluZyh0aGlzLmVsKTtcbiAgICAgIHRoaXMubGlmZWN5Y2xlcz8uYmVmb3JlTW91bnQ/Lih0aGlzLmlmcmFtZS5jb250ZW50V2luZG93KTtcbiAgICAgIHRoaXMuaWZyYW1lLmNvbnRlbnRXaW5kb3cuX19XVUpJRV9NT1VOVCgpO1xuICAgICAgdGhpcy5saWZlY3ljbGVzPy5hZnRlck1vdW50Py4odGhpcy5pZnJhbWUuY29udGVudFdpbmRvdyk7XG4gICAgICB0aGlzLm1vdW50RmxhZyA9IHRydWU7XG4gICAgfVxuICAgIGlmICh0aGlzLmFsaXZlKSB7XG4gICAgICB0aGlzLmxpZmVjeWNsZXM/LmFjdGl2YXRlZD8uKHRoaXMuaWZyYW1lLmNvbnRlbnRXaW5kb3cpO1xuICAgIH1cbiAgICB0aGlzLmV4ZWNRdWV1ZS5zaGlmdCgpPy4oKTtcbiAgfVxuXG4gIC8qKiDkv53mtLvmqKHlvI/lkozkvb/nlKhwcm94eUxvY2F0aW9uLmhyZWbot7Povazpk77mjqXpg73kuI3lupTor6XplIDmr4FzaGFkb3cgKi9cbiAgcHVibGljIGFzeW5jIHVubW91bnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8g5a2Q5bqU55So5Y246L295pe2IGRpc2Nvbm5lY3Qg562J5b6FIGhyZWYg55qEIE11dGF0aW9uT2JzZXJ2ZXLvvIzpgb/lhY3pl63ljIXlnKggcmVtb3VudCDliY3ku43mjIHmnInkuIrkuIvmlodcbiAgICB0aGlzLmNsZWFyRGVmZXJyZWRTdHlsZU9ic2VydmVycygpO1xuICAgIHRoaXMuYWN0aXZlRmxhZyA9IGZhbHNlO1xuICAgIC8vIOa4heeQhuWtkOW6lOeUqOi/h+acn+eahOWQjOatpeWPguaVsFxuICAgIGNsZWFySW5hY3RpdmVBcHBVcmwoKTtcbiAgICBpZiAodGhpcy5hbGl2ZSkge1xuICAgICAgdGhpcy5saWZlY3ljbGVzPy5kZWFjdGl2YXRlZD8uKHRoaXMuaWZyYW1lLmNvbnRlbnRXaW5kb3cpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMubW91bnRGbGFnKSByZXR1cm47XG4gICAgaWYgKGlzRnVuY3Rpb24odGhpcy5pZnJhbWUuY29udGVudFdpbmRvdy5fX1dVSklFX1VOTU9VTlQpICYmICF0aGlzLmFsaXZlICYmICF0aGlzLmhyZWZGbGFnKSB7XG4gICAgICB0aGlzLmxpZmVjeWNsZXM/LmJlZm9yZVVubW91bnQ/Lih0aGlzLmlmcmFtZS5jb250ZW50V2luZG93KTtcbiAgICAgIGF3YWl0IHRoaXMuaWZyYW1lLmNvbnRlbnRXaW5kb3cuX19XVUpJRV9VTk1PVU5UKCk7XG4gICAgICB0aGlzLmxpZmVjeWNsZXM/LmFmdGVyVW5tb3VudD8uKHRoaXMuaWZyYW1lLmNvbnRlbnRXaW5kb3cpO1xuICAgICAgdGhpcy5tb3VudEZsYWcgPSBmYWxzZTtcbiAgICAgIHRoaXMuYnVzPy4kY2xlYXIoKTtcbiAgICAgIGlmICghdGhpcy5kZWdyYWRlKSB7XG4gICAgICAgIGNsZWFyQ2hpbGQodGhpcy5zaGFkb3dSb290KTtcbiAgICAgICAgLy8gaGVhZCBib2R56ZyA6KaB5aSN55So77yM5q+P5qyh6YO96KaB5riF56m65LqL5Lu2XG4gICAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5oZWFkKTtcbiAgICAgICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmJvZHkpO1xuICAgICAgfVxuICAgICAgY2xlYXJDaGlsZCh0aGlzLmhlYWQpO1xuICAgICAgY2xlYXJDaGlsZCh0aGlzLmJvZHkpO1xuICAgICAgLy8gc3R5bGVTaGVldEVsZW1lbnRzIC8gZHluYW1pY1NjcmlwdEVsZW1lbnRzIOS4jeiDveWcqCB1bm1vdW50IOS4rea4heepuu+8mlxuICAgICAgLy8g5a2Q5bqU55So55qEIEpTIOaooeWdl+WPquWcqCBzYW5kYm94LnN0YXJ0KCkg6Zi25q615omn6KGM5LiA5qyh77yMdW5tb3VudCDihpIgYWN0aXZlIOWQjlxuICAgICAgLy8g5qih5Z2X5Luj56CB5LiN5Lya6YeN6LeR77yM5YaN5qyhIG1vdW50IOS+nei1liByZWJ1aWxkU3R5bGVTaGVldHMoKSDmiormlbDnu4Tph4znmbvorrDnmoRcbiAgICAgIC8vIOagt+W8j+iKgueCuemHjeaWsOaMguWbniBzaGFkb3dSb290LmhlYWTjgILkuKTmlbDnu4TnmoTlvbvlupXmuIXnkIbmlL7lnKggZGVzdHJveSgpIOS4reOAglxuICAgIH1cbiAgfVxuXG4gIC8qKiDplIDmr4HlrZDlupTnlKggKi9cbiAgcHVibGljIGFzeW5jIGRlc3Ryb3koKSB7XG4gICAgYXdhaXQgdGhpcy51bm1vdW50KCk7XG4gICAgLy8g6YeK5pS+5Yqo5oCB5qC35byPIC8g6ISa5pys6IqC54K577yIdW5tb3VudCDpmLbmrrXkv53nlZnku6Xkvr8gcmVidWlsZFN0eWxlU2hlZXRzIOWkjeeUqO+8jGRlc3Ryb3kg6Zi25q615omN5b275bqV5riF77yJXG4gICAgdGhpcy5jbGVhclN0eWxlU2hlZXRzKCk7XG4gICAgdGhpcy5jbGVhckR5bmFtaWNTY3JpcHRzKCk7XG4gICAgdGhpcy5jbGVhckZvbnRTdHlsZVNoZWV0cygpO1xuICAgIC8vIOino+e7keetieW+hSBocmVmIOi1i+WAvOeahCBNdXRhdGlvbk9ic2VydmVy77yM6YG/5YWN6Zet5YyF6ZKJ5L2P5bey6ZSA5q+B55qEIHNhbmRib3hcbiAgICB0aGlzLmNsZWFyRGVmZXJyZWRTdHlsZU9ic2VydmVycygpO1xuICAgIC8vIOWFiCAkZGVzdHJveSDlho3nva4gbnVsbO+8mua4heepuuS6i+S7tuW5tuS7juWFqOWxgCBhcHBFdmVudE9iak1hcCDkuK3np7vpmaTlvZPliY0gaWQg55qEIGVudHJ577yMXG4gICAgLy8g6YG/5YWNIHNldHVwQXBwIOKGkiBkZXN0cm95QXBwIOWPjeWkjeWQjiBtYXAg5p2h55uu5oyB57ut57Sv56ev44CCXG4gICAgdGhpcy5idXMuJGRlc3Ryb3koKTtcbiAgICB0aGlzLnNoYWRvd1Jvb3QgPSBudWxsO1xuICAgIHRoaXMucHJveHkgPSBudWxsO1xuICAgIHRoaXMucHJveHlEb2N1bWVudCA9IG51bGw7XG4gICAgdGhpcy5wcm94eUxvY2F0aW9uID0gbnVsbDtcbiAgICB0aGlzLmV4ZWNRdWV1ZSA9IG51bGw7XG4gICAgdGhpcy5wcm92aWRlID0gbnVsbDtcbiAgICB0aGlzLmRlZ3JhZGVBdHRycyA9IG51bGw7XG4gICAgdGhpcy5zdHlsZVNoZWV0RWxlbWVudHMgPSBudWxsO1xuICAgIHRoaXMuZm9udFN0eWxlU2hlZXRFbGVtZW50cyA9IG51bGw7XG4gICAgdGhpcy5keW5hbWljU2NyaXB0RWxlbWVudHMgPSBudWxsO1xuICAgIHRoaXMuZGVmZXJyZWRTdHlsZU9ic2VydmVycyA9IG51bGw7XG4gICAgdGhpcy5idXMgPSBudWxsO1xuICAgIHRoaXMucmVwbGFjZSA9IG51bGw7XG4gICAgdGhpcy5mZXRjaCA9IG51bGw7XG4gICAgdGhpcy5leGVjRmxhZyA9IG51bGw7XG4gICAgdGhpcy5tb3VudEZsYWcgPSBudWxsO1xuICAgIHRoaXMuaHJlZkZsYWcgPSBudWxsO1xuICAgIHRoaXMuZG9jdW1lbnQgPSBudWxsO1xuICAgIHRoaXMuaGVhZCA9IG51bGw7XG4gICAgdGhpcy5ib2R5ID0gbnVsbDtcbiAgICB0aGlzLmVsZW1lbnRFdmVudENhY2hlTWFwID0gbnVsbDtcbiAgICB0aGlzLmxpZmVjeWNsZXMgPSBudWxsO1xuICAgIHRoaXMucGx1Z2lucyA9IG51bGw7XG4gICAgdGhpcy5wcm92aWRlID0gbnVsbDtcbiAgICB0aGlzLmluamVjdCA9IG51bGw7XG4gICAgdGhpcy5leGVjUXVldWUgPSBudWxsO1xuICAgIHRoaXMucHJlZml4ID0gbnVsbDtcbiAgICB0aGlzLmlmcmFtZUFkZEV2ZW50TGlzdGVuZXJzID0gbnVsbDtcbiAgICB0aGlzLmlmcmFtZU9uRXZlbnRzID0gbnVsbDtcbiAgICAvLyDmuIXpmaQgZG9tXG4gICAgaWYgKHRoaXMuZWwpIHtcbiAgICAgIGNsZWFyQ2hpbGQodGhpcy5lbCk7XG4gICAgICB0aGlzLmVsID0gbnVsbDtcbiAgICB9XG4gICAgLy8g5riF6ZmkIGlmcmFtZSDmspnnrrFcbiAgICBpZiAodGhpcy5pZnJhbWUpIHtcbiAgICAgIGNvbnN0IGlmcmFtZVdpbmRvdyA9IHRoaXMuaWZyYW1lLmNvbnRlbnRXaW5kb3c7XG4gICAgICBpZiAoaWZyYW1lV2luZG93Py5fX1dVSklFX0VWRU5UTElTVEVORVJfXykge1xuICAgICAgICBpZnJhbWVXaW5kb3cuX19XVUpJRV9FVkVOVExJU1RFTkVSX18uZm9yRWFjaCgobykgPT4ge1xuICAgICAgICAgIGlmcmFtZVdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKG8udHlwZSwgby5saXN0ZW5lciwgby5vcHRpb25zKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAvLyBwYXRjaEVsZW1lbnRFZmZlY3Qg57uZ5pWj6JC95Yiw5Li75bqU55SoIERPTSDkuIrnmoQgZWxlbWVudCDnlZnkuoYgYmFzZVVSSSAvIG93bmVyRG9jdW1lbnRcbiAgICAgIC8vIGdldHRlcu+8jOWug+S7rOmAmui/hyBpZnJhbWVXaW5kb3cuX19XVUpJRSDliqjmgIHor7vlj5bjgILov5nph4zkuLvliqjmlq3pk77orqnmrovnlZkgZ2V0dGVyIOeri+WNs1xuICAgICAgLy8g6ZmN57qn5Yiw5Li7IGRvY3VtZW5077yM6YG/5YWNIGVsZW1lbnQg5oqKIHNhbmRib3gg6ZKJ5Zyo5YaF5a2Y5Lit44CCXG4gICAgICAvLyBfX1dVSklFIC8gJHd1amllIOWdh+aMguWcqCBpZnJhbWVXaW5kb3cg5LiK77yMZGVzdHJveSDml7bpobvkuIDlubbnva4gbnVsbOOAglxuICAgICAgaWYgKGlmcmFtZVdpbmRvdykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmcmFtZVdpbmRvdy5fX1dVSklFID0gbnVsbDtcbiAgICAgICAgICBpZnJhbWVXaW5kb3cuJHd1amllID0gbnVsbDtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIC8qIG5vb3A6IGlmcmFtZSDlt7IgZGV0YWNoIOaXtui1i+WAvOWPr+iDveaKm+mUmSAqL1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmlmcmFtZS5wYXJlbnROb2RlPy5yZW1vdmVDaGlsZCh0aGlzLmlmcmFtZSk7XG4gICAgICB0aGlzLmlmcmFtZSA9IG51bGw7XG4gICAgfVxuICAgIC8vIOmHiuaUviB3aW5kb3cgLyBkb2N1bWVudCAvIGxvY2F0aW9uIOS7o+eQhu+8muino+mZpOS7o+eQhuS4jiBoYW5kbGVyIOeahOWFs+iBlO+8jOS9v+aNleiOt+S6hiBpZnJhbWUgL1xuICAgIC8vIHVybEVsZW1lbnQg55qEIGhhbmRsZXIg6Zet5YyF5LiN5Y+v6L6+77yM5pap5pat44CM5Li75bqU55SoIOKGkiDku6PnkIbpl63ljIUg4oaSIGlmcmFtZeOAjeeahOW8leeUqOmTvuOAglxuICAgIHRyeSB7XG4gICAgICB0aGlzLnByb3h5UmV2b2tlPy4oKTtcbiAgICB9IGNhdGNoIChfKSB7XG4gICAgICAvKiBub29wOiDku6PnkIblt7Lph4rmlL7ml7bph43lpI3osIPnlKjlj6/og73mipvplJkgKi9cbiAgICB9XG4gICAgdGhpcy5wcm94eVJldm9rZSA9IG51bGw7XG4gICAgLy8g5Y+N5ZCR6Kej57uRIHBhdGNoRG9jdW1lbnRFZmZlY3QgLyBwYXRjaFdpbmRvd0VmZmVjdCDlnKjkuLsgd2luZG93IC8gZG9jdW1lbnQg5LiK5oyC55qE5Ymv5L2c55SoXG4gICAgdGhpcy5ldmVudENsZWFudXBUcmFja2VyLmNsZWFudXBBbGwoKTtcbiAgICBkZWxldGVXdWppZUJ5SWQodGhpcy5pZCk7XG4gIH1cblxuICAvKipcbiAgICogZGVzdHJveSDpmLbmrrXmuIXnqbogc3R5bGVTaGVldEVsZW1lbnRz77yM5ZCM5pe25oqK6IqC54K55LuO54i26IqC54K5IGRldGFjaOOAglxuICAgKlxuICAgKiDku4XkvpsgZGVzdHJveSDosIPnlKjvvJp1bm1vdW50IOmYtuautemcgOimgeS/neeVmeaVsOe7hOS7peS+vyByZWJ1aWxkU3R5bGVTaGVldHMg5aSN55So5qC35byP6IqC54K5XG4gICAqIO+8iOWtkOW6lOeUqCBKUyDmqKHlnZflj6ogaW5pdCDkuIDmrKHvvIzmqKHlnZfku6PnoIHkuI3kvJrlho3mrKHnlJ/miJDliqjmgIHmoLflvI/vvInjgIJcbiAgICovXG4gIHB1YmxpYyBjbGVhclN0eWxlU2hlZXRzKCk6IHZvaWQge1xuICAgIGlmICghQXJyYXkuaXNBcnJheSh0aGlzLnN0eWxlU2hlZXRFbGVtZW50cykpIHJldHVybjtcbiAgICB0aGlzLnN0eWxlU2hlZXRFbGVtZW50cy5mb3JFYWNoKChlbCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgZWwucGFyZW50Tm9kZT8ucmVtb3ZlQ2hpbGQoZWwpO1xuICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAvKiBub29wOiBkZXN0cm95IOmYtuauteS7u+S9leW8guW4uOS4jeW6lOS4reaWreWQjue7rea4heeQhiAqL1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuc3R5bGVTaGVldEVsZW1lbnRzLmxlbmd0aCA9IDA7XG4gIH1cblxuICAvKipcbiAgICogZGVzdHJveSDpmLbmrrXmuIXnqbogZHluYW1pY1NjcmlwdEVsZW1lbnRz77yM5ZCM5pe25oqK5q6L55WZ55qEIDxzY3JpcHQ+IOiKgueCueS7jueItuiKgueCuSBkZXRhY2jjgIJcbiAgICog5LuF5L6bIGRlc3Ryb3kg6LCD55So77yM55CG55Sx5ZCMIGNsZWFyU3R5bGVTaGVldHPjgIJcbiAgICovXG4gIHB1YmxpYyBjbGVhckR5bmFtaWNTY3JpcHRzKCk6IHZvaWQge1xuICAgIGlmICghQXJyYXkuaXNBcnJheSh0aGlzLmR5bmFtaWNTY3JpcHRFbGVtZW50cykpIHJldHVybjtcbiAgICB0aGlzLmR5bmFtaWNTY3JpcHRFbGVtZW50cy5mb3JFYWNoKChzY3JpcHQpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHNjcmlwdC5wYXJlbnROb2RlPy5yZW1vdmVDaGlsZChzY3JpcHQpO1xuICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAvKiBub29wICovXG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5keW5hbWljU2NyaXB0RWxlbWVudHMubGVuZ3RoID0gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBkZXN0cm95IOmYtuautea4heepuiBmb250U3R5bGVTaGVldEVsZW1lbnRz77yM5ZCM5pe25oqK6IqC54K55LuO54i26IqC54K5IGRldGFjaOOAglxuICAgKiDkvb/nlKggV1VKSUVfQVBQX0lEIOagh+ivhuWxnuS6juW9k+WJjeWtkOW6lOeUqOeahCBmb250IOagt+W8j+OAglxuICAgKi9cbiAgcHVibGljIGNsZWFyRm9udFN0eWxlU2hlZXRzKCk6IHZvaWQge1xuICAgIGlmICghQXJyYXkuaXNBcnJheSh0aGlzLmZvbnRTdHlsZVNoZWV0RWxlbWVudHMpKSByZXR1cm47XG4gICAgdGhpcy5mb250U3R5bGVTaGVldEVsZW1lbnRzLmZvckVhY2goKGVsKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBlbC5wYXJlbnROb2RlPy5yZW1vdmVDaGlsZChlbCk7XG4gICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgIC8qIG5vb3AgKi9cbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLmZvbnRTdHlsZVNoZWV0RWxlbWVudHMubGVuZ3RoID0gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiB1bm1vdW50IC8gZGVzdHJveSDpmLbmrrXnu5/kuIAgZGlzY29ubmVjdCDnrYnlvoUgaHJlZiDotYvlgLznmoQgTXV0YXRpb25PYnNlcnZlcuOAglxuICAgKiBvYnNlcnZlciDlnKggaHJlZiDlkb3kuK3miJbotoXml7blhZzlupXml7bkvJroh6rooYwgZGlzY29ubmVjdCDlubblh7rpmJ/vvJtcbiAgICog6L+Z6YeM5YWc5bqV5aSE55CG44CM5a2Q5bqU55So5YWI5LqOIGhyZWYg6LWL5YC86KKr5Y246L29L+mUgOavgeOAjeeahOWcuuaZr+OAglxuICAgKi9cbiAgcHVibGljIGNsZWFyRGVmZXJyZWRTdHlsZU9ic2VydmVycygpOiB2b2lkIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodGhpcy5kZWZlcnJlZFN0eWxlT2JzZXJ2ZXJzKSkgcmV0dXJuO1xuICAgIHRoaXMuZGVmZXJyZWRTdHlsZU9ic2VydmVycy5mb3JFYWNoKChvYnNlcnZlcikgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAvKiBub29wOiBkZXN0cm95IOmYtuauteS7u+S9leW8guW4uOS4jeW6lOS4reaWreWQjue7rea4heeQhiAqL1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuZGVmZXJyZWRTdHlsZU9ic2VydmVycy5sZW5ndGggPSAwO1xuICB9XG5cbiAgLyoqXG4gICAqIOWIm+W7uuaIluiOt+WPliBmb250IOagt+W8j+WuueWZqO+8iOaMgui9veWcqOacgOWkluWxgiBkb2N1bWVudC5oZWFk77yJXG4gICAqIOeUqOS6juWtmOaUvuWtkOW6lOeUqOeahCBAZm9udC1mYWNlIOagt+W8j++8jOehruS/neW1jOWll+WtkOW6lOeUqOS5n+iDveato+ehruW6lOeUqOWtl+S9k1xuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVGb250U3R5bGVTaGVldENvbnRhaW5lcigpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgY29udGFpbmVyID0gcmF3RG9jdW1lbnRRdWVyeVNlbGVjdG9yLmNhbGwoZG9jdW1lbnQsIGBbJHtXVUpJRV9GT05UX1NUWUxFX0NPTlRBSU5FUl9BVFRSfV1gKTtcbiAgICBpZiAoY29udGFpbmVyKSByZXR1cm4gY29udGFpbmVyIGFzIEhUTUxFbGVtZW50O1xuXG4gICAgY29uc3Qgc3R5bGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICAgIHN0eWxlRWxlbWVudC5zZXRBdHRyaWJ1dGUoV1VKSUVfRk9OVF9TVFlMRV9DT05UQUlORVJfQVRUUiwgXCJcIik7XG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZUVsZW1lbnQpO1xuICAgIHJldHVybiBzdHlsZUVsZW1lbnQ7XG4gIH1cblxuICAvKiog5b2T5a2Q5bqU55So5YaN5qyh5r+A5rS75ZCO77yM5Y+q6L+Q6KGMbW91bnTlh73mlbDvvIzmoLflvI/pnIDopoHph43mlrDmgaLlpI0gKi9cbiAgcHVibGljIHJlYnVpbGRTdHlsZVNoZWV0cygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zdHlsZVNoZWV0RWxlbWVudHMgJiYgdGhpcy5zdHlsZVNoZWV0RWxlbWVudHMubGVuZ3RoKSB7XG4gICAgICB0aGlzLnN0eWxlU2hlZXRFbGVtZW50cy5mb3JFYWNoKChzdHlsZVNoZWV0RWxlbWVudCkgPT4ge1xuICAgICAgICByYXdFbGVtZW50QXBwZW5kQ2hpbGQuY2FsbCh0aGlzLmRlZ3JhZGUgPyB0aGlzLmRvY3VtZW50LmhlYWQgOiB0aGlzLnNoYWRvd1Jvb3QuaGVhZCwgc3R5bGVTaGVldEVsZW1lbnQpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMucGF0Y2hDc3NSdWxlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIOWtkOW6lOeUqOagt+W8j+aJk+ihpeS4gVxuICAgKiAx44CB5YW85a65OnJvb3TpgInmi6nlmajmoLflvI/liLA6aG9zdOmAieaLqeWZqOS4ilxuICAgKiAy44CB5bCGQGZvbnQtZmFjZeWumuS5ieWIsHNoYWRvd1Jvb3TlpJbpg6hcbiAgICovXG4gIHB1YmxpYyBwYXRjaENzc1J1bGVzKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmRlZ3JhZGUpIHJldHVybjtcbiAgICBpZiAodGhpcy5zaGFkb3dSb290Lmhvc3QuaGFzQXR0cmlidXRlKFdVSklFX0RBVEFfQVRUQUNIX0NTU19GTEFHKSkgcmV0dXJuO1xuICAgIGNvbnN0IFtob3N0U3R5bGVTaGVldEVsZW1lbnQsIGZvbnRTdHlsZVNoZWV0RWxlbWVudF0gPSBnZXRQYXRjaFN0eWxlRWxlbWVudHMoXG4gICAgICBBcnJheS5mcm9tKHRoaXMuaWZyYW1lLmNvbnRlbnREb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwic3R5bGVcIikpLm1hcChcbiAgICAgICAgKHN0eWxlU2hlZXRFbGVtZW50KSA9PiBzdHlsZVNoZWV0RWxlbWVudC5zaGVldFxuICAgICAgKVxuICAgICk7XG4gICAgaWYgKGhvc3RTdHlsZVNoZWV0RWxlbWVudCkge1xuICAgICAgdGhpcy5zaGFkb3dSb290LmhlYWQuYXBwZW5kQ2hpbGQoaG9zdFN0eWxlU2hlZXRFbGVtZW50KTtcbiAgICAgIHRoaXMuc3R5bGVTaGVldEVsZW1lbnRzLnB1c2goaG9zdFN0eWxlU2hlZXRFbGVtZW50KTtcbiAgICB9XG4gICAgaWYgKGZvbnRTdHlsZVNoZWV0RWxlbWVudCkge1xuICAgICAgdGhpcy5pbmplY3QuZm9udFN0eWxlU2hlZXRDb250YWluZXI/LmFwcGVuZENoaWxkKGZvbnRTdHlsZVNoZWV0RWxlbWVudCk7XG4gICAgICBmb250U3R5bGVTaGVldEVsZW1lbnQuc2V0QXR0cmlidXRlKFdVSklFX0FQUF9JRCwgdGhpcy5pZCk7XG4gICAgICB0aGlzLmZvbnRTdHlsZVNoZWV0RWxlbWVudHMucHVzaChmb250U3R5bGVTaGVldEVsZW1lbnQpO1xuICAgIH1cbiAgICAoaG9zdFN0eWxlU2hlZXRFbGVtZW50IHx8IGZvbnRTdHlsZVNoZWV0RWxlbWVudCkgJiZcbiAgICAgIHRoaXMuc2hhZG93Um9vdC5ob3N0LnNldEF0dHJpYnV0ZShXVUpJRV9EQVRBX0FUVEFDSF9DU1NfRkxBRywgXCJcIik7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIGlkIOWtkOW6lOeUqOeahGlk77yM5ZSv5LiA5qCH6K+GXG4gICAqIEBwYXJhbSB1cmwg5a2Q5bqU55So55qEdXJs77yM5Y+v5Lul5YyF5ZCrcHJvdG9jb2zjgIFob3N044CBcGF0aOOAgXF1ZXJ544CBaGFzaFxuICAgKi9cbiAgY29uc3RydWN0b3Iob3B0aW9uczoge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICB1cmw6IHN0cmluZztcbiAgICBhdHRyczogeyBba2V5OiBzdHJpbmddOiBhbnkgfTtcbiAgICBkZWdyYWRlQXR0cnM6IHsgW2tleTogc3RyaW5nXTogYW55IH07XG4gICAgZmliZXI6IGJvb2xlYW47XG4gICAgZGVncmFkZTtcbiAgICBwbHVnaW5zOiBBcnJheTxwbHVnaW4+O1xuICAgIGxpZmVjeWNsZXM6IGxpZmVjeWNsZXM7XG4gICAgaWZyYW1lQWRkRXZlbnRMaXN0ZW5lcnM/OiBBcnJheTxzdHJpbmc+O1xuICAgIGlmcmFtZU9uRXZlbnRzPzogQXJyYXk8c3RyaW5nPjtcbiAgfSkge1xuICAgIC8vIOS8oOmAkmluamVjdOe7meW1jOWll+WtkOW6lOeUqO+8iOaYvuW8jyBhc++8ml9fV1VKSUVfSU5KRUNUIOWFqOWxgOexu+Wei+aYryBQYXJ0aWFs77yM6ZyA5pat6KiA5Zue5a6M5pW057uT5p6E77yJXG4gICAgaWYgKHdpbmRvdy5fX1BPV0VSRURfQllfV1VKSUVfXykgdGhpcy5pbmplY3QgPSB3aW5kb3cuX19XVUpJRS5pbmplY3QgYXMgV3VqaWVbXCJpbmplY3RcIl07XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLmluamVjdCA9IHtcbiAgICAgICAgaWRUb1NhbmRib3hNYXA6IGlkVG9TYW5kYm94Q2FjaGVNYXAsXG4gICAgICAgIGFwcEV2ZW50T2JqTWFwLFxuICAgICAgICBtYWluSG9zdFBhdGg6IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIFwiLy9cIiArIHdpbmRvdy5sb2NhdGlvbi5ob3N0LFxuICAgICAgICBmb250U3R5bGVTaGVldENvbnRhaW5lcjogdGhpcy5jcmVhdGVGb250U3R5bGVTaGVldENvbnRhaW5lcigpLFxuICAgICAgfTtcbiAgICB9XG4gICAgY29uc3QgeyBuYW1lLCB1cmwsIGF0dHJzLCBmaWJlciwgZGVncmFkZUF0dHJzLCBkZWdyYWRlLCBsaWZlY3ljbGVzLCBwbHVnaW5zIH0gPSBvcHRpb25zO1xuICAgIHRoaXMuaWQgPSBuYW1lO1xuICAgIHRoaXMuZmliZXIgPSBmaWJlcjtcbiAgICB0aGlzLmRlZ3JhZGUgPSBkZWdyYWRlIHx8ICF3dWppZVN1cHBvcnQ7XG4gICAgdGhpcy5idXMgPSBuZXcgRXZlbnRCdXModGhpcy5pZCk7XG4gICAgdGhpcy51cmwgPSB1cmw7XG4gICAgdGhpcy5kZWdyYWRlQXR0cnMgPSBkZWdyYWRlQXR0cnM7XG4gICAgdGhpcy5wcm92aWRlID0geyBidXM6IHRoaXMuYnVzIH07XG4gICAgdGhpcy5zdHlsZVNoZWV0RWxlbWVudHMgPSBbXTtcbiAgICB0aGlzLmV4ZWNRdWV1ZSA9IFtdO1xuICAgIHRoaXMubGlmZWN5Y2xlcyA9IGxpZmVjeWNsZXM7XG4gICAgdGhpcy5wbHVnaW5zID0gZ2V0UGx1Z2lucyhwbHVnaW5zKTtcbiAgICB0aGlzLmlmcmFtZUFkZEV2ZW50TGlzdGVuZXJzID0gb3B0aW9ucy5pZnJhbWVBZGRFdmVudExpc3RlbmVycztcbiAgICB0aGlzLmlmcmFtZU9uRXZlbnRzID0gb3B0aW9ucy5pZnJhbWVPbkV2ZW50cztcblxuICAgIC8vIOWIm+W7uuebruagh+WcsOWdgOeahOino+aekFxuICAgIGNvbnN0IHsgdXJsRWxlbWVudCwgYXBwSG9zdFBhdGgsIGFwcFJvdXRlUGF0aCB9ID0gYXBwUm91dGVQYXJzZSh1cmwpO1xuICAgIGNvbnN0IHsgbWFpbkhvc3RQYXRoIH0gPSB0aGlzLmluamVjdDtcbiAgICAvLyDliJvlu7ppZnJhbWVcbiAgICB0aGlzLmlmcmFtZSA9IGlmcmFtZUdlbmVyYXRvcih0aGlzLCBhdHRycywgbWFpbkhvc3RQYXRoLCBhcHBIb3N0UGF0aCwgYXBwUm91dGVQYXRoKTtcblxuICAgIGlmICh0aGlzLmRlZ3JhZGUpIHtcbiAgICAgIGNvbnN0IHsgcHJveHlEb2N1bWVudCwgcHJveHlMb2NhdGlvbiwgcHJveHlSZXZva2UgfSA9IGxvY2FsR2VuZXJhdG9yKFxuICAgICAgICB0aGlzLmlmcmFtZSxcbiAgICAgICAgdXJsRWxlbWVudCxcbiAgICAgICAgbWFpbkhvc3RQYXRoLFxuICAgICAgICBhcHBIb3N0UGF0aFxuICAgICAgKTtcbiAgICAgIHRoaXMucHJveHlEb2N1bWVudCA9IHByb3h5RG9jdW1lbnQ7XG4gICAgICB0aGlzLnByb3h5TG9jYXRpb24gPSBwcm94eUxvY2F0aW9uO1xuICAgICAgdGhpcy5wcm94eVJldm9rZSA9IHByb3h5UmV2b2tlO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCB7IHByb3h5V2luZG93LCBwcm94eURvY3VtZW50LCBwcm94eUxvY2F0aW9uLCBwcm94eVJldm9rZSB9ID0gcHJveHlHZW5lcmF0b3IoXG4gICAgICAgIHRoaXMuaWZyYW1lLFxuICAgICAgICB1cmxFbGVtZW50LFxuICAgICAgICBtYWluSG9zdFBhdGgsXG4gICAgICAgIGFwcEhvc3RQYXRoXG4gICAgICApO1xuICAgICAgdGhpcy5wcm94eSA9IHByb3h5V2luZG93O1xuICAgICAgdGhpcy5wcm94eURvY3VtZW50ID0gcHJveHlEb2N1bWVudDtcbiAgICAgIHRoaXMucHJveHlMb2NhdGlvbiA9IHByb3h5TG9jYXRpb247XG4gICAgICB0aGlzLnByb3h5UmV2b2tlID0gcHJveHlSZXZva2U7XG4gICAgfVxuICAgIHRoaXMucHJvdmlkZS5sb2NhdGlvbiA9IHRoaXMucHJveHlMb2NhdGlvbjtcblxuICAgIGFkZFNhbmRib3hDYWNoZVdpdGhXdWppZSh0aGlzLmlkLCB0aGlzKTtcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLFNBQ0VBLGVBQWUsRUFDZkMscUJBQXFCLEVBQ3JCQyx3QkFBd0IsRUFDeEJDLG9CQUFvQixFQUNwQkMsbUJBQW1CLEVBQ25CQyxrQ0FBa0MsUUFDN0IsVUFBVTtBQUNqQixTQUFTQyxlQUFlLEVBQUVDLGVBQWUsRUFBRUMsbUJBQW1CLFFBQVEsUUFBUTtBQUM5RSxTQUNFQyx1QkFBdUIsRUFDdkJDLFVBQVUsRUFDVkMscUJBQXFCLEVBQ3JCQyx3QkFBd0IsRUFDeEJDLDBCQUEwQixFQUMxQkMsc0JBQXNCLEVBQ3RCQyw0QkFBNEIsRUFDNUJDLGFBQWEsUUFDUixVQUFVO0FBQ2pCLFNBQVNDLGNBQWMsRUFBRUMsY0FBYyxRQUFRLFNBQVM7QUFFeEQsU0FBU0MsVUFBVSxFQUFFQyxnQkFBZ0IsUUFBUSxVQUFVO0FBQ3ZELFNBQVNDLG1CQUFtQixRQUFRLFVBQVU7QUFDOUMsU0FFRUMsbUJBQW1CLEVBQ25CQyx3QkFBd0IsRUFDeEJDLGVBQWUsRUFDZkMscUJBQXFCLEVBQ3JCQyx3QkFBd0IsUUFDbkIsVUFBVTtBQUNqQixTQUFTQyxRQUFRLEVBQUVDLGNBQWMsUUFBa0IsU0FBUztBQUM1RCxTQUFTQyxtQkFBbUIsUUFBUSxXQUFXO0FBQy9DLFNBQVNDLFVBQVUsRUFBRUMsWUFBWSxFQUFFQyxhQUFhLEVBQUVDLG1CQUFtQixJQUFuQkEsb0JBQW1CLEVBQUVDLGVBQWUsRUFBRUMsWUFBWSxRQUFRLFNBQVM7QUFDckgsU0FBU0MsMEJBQTBCLEVBQUVDLFlBQVksRUFBRUMsK0JBQStCLFFBQVEsWUFBWTtBQWN0RztBQUNBO0FBQ0E7QUFGQSxJQUdxQkMsS0FBSztFQW9rQnhCO0FBQ0Y7QUFDQTtBQUNBO0VBQ0UsU0FBQUEsTUFBWUMsT0FXWCxFQUFFO0lBQUFDLGVBQUEsT0FBQUYsS0FBQTtJQWpsQkg7SUFFQTtJQUVBO0lBRUE7SUFFQTtJQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7SUFFRTtJQUVBO0lBRUE7SUFFQTtJQUVBO0lBRUE7SUFFQTtJQUVBO0lBRUE7SUFFQTtJQUVBO0lBRUE7SUFFQTtJQUVBO0lBRUE7SUFFQTtJQUVBO0lBRUE7SUFFQTtJQUVBO0lBRUE7SUFFQTtJQUVBO0lBR0E7SUFBQUcsZUFBQSxpQ0FDeUQsRUFBRTtJQUMzRDtBQUNGO0FBQ0E7QUFDQTtBQUNBO0lBSkVBLGVBQUEsZ0NBS3lELEVBQUU7SUFDM0Q7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBTEVBLGVBQUEsaUNBTXlELEVBQUU7SUFLM0Q7SUFBQUEsZUFBQSwrQkFJSSxJQUFJQyxPQUFPLENBQUMsQ0FBQztJQUtqQjtJQUFBRCxlQUFBLDhCQUNrRCxJQUFJYixtQkFBbUIsQ0FBQyxDQUFDO0lBc2Z6RTtJQUNBLElBQUllLE1BQU0sQ0FBQ0Msb0JBQW9CLEVBQUUsSUFBSSxDQUFDQyxNQUFNLEdBQUdGLE1BQU0sQ0FBQ0csT0FBTyxDQUFDRCxNQUF5QixDQUFDLEtBQ25GO01BQ0gsSUFBSSxDQUFDQSxNQUFNLEdBQUc7UUFDWkUsY0FBYyxFQUFFMUIsbUJBQW1CO1FBQ25DTSxjQUFjLEVBQWRBLGNBQWM7UUFDZHFCLFlBQVksRUFBRUwsTUFBTSxDQUFDTSxRQUFRLENBQUNDLFFBQVEsR0FBRyxJQUFJLEdBQUdQLE1BQU0sQ0FBQ00sUUFBUSxDQUFDRSxJQUFJO1FBQ3BFQyx1QkFBdUIsRUFBRSxJQUFJLENBQUNDLDZCQUE2QixDQUFDO01BQzlELENBQUM7SUFDSDtJQUNBLElBQVFDLElBQUksR0FBb0VmLE9BQU8sQ0FBL0VlLElBQUk7TUFBRUMsR0FBRyxHQUErRGhCLE9BQU8sQ0FBekVnQixHQUFHO01BQUVDLEtBQUssR0FBd0RqQixPQUFPLENBQXBFaUIsS0FBSztNQUFFQyxLQUFLLEdBQWlEbEIsT0FBTyxDQUE3RGtCLEtBQUs7TUFBRUMsWUFBWSxHQUFtQ25CLE9BQU8sQ0FBdERtQixZQUFZO01BQUVDLE9BQU8sR0FBMEJwQixPQUFPLENBQXhDb0IsT0FBTztNQUFFQyxVQUFVLEdBQWNyQixPQUFPLENBQS9CcUIsVUFBVTtNQUFFQyxPQUFPLEdBQUt0QixPQUFPLENBQW5Cc0IsT0FBTztJQUMzRSxJQUFJLENBQUNDLEVBQUUsR0FBR1IsSUFBSTtJQUNkLElBQUksQ0FBQ0csS0FBSyxHQUFHQSxLQUFLO0lBQ2xCLElBQUksQ0FBQ0UsT0FBTyxHQUFHQSxPQUFPLElBQUksQ0FBQzdCLFlBQVk7SUFDdkMsSUFBSSxDQUFDaUMsR0FBRyxHQUFHLElBQUlyQyxRQUFRLENBQUMsSUFBSSxDQUFDb0MsRUFBRSxDQUFDO0lBQ2hDLElBQUksQ0FBQ1AsR0FBRyxHQUFHQSxHQUFHO0lBQ2QsSUFBSSxDQUFDRyxZQUFZLEdBQUdBLFlBQVk7SUFDaEMsSUFBSSxDQUFDTSxPQUFPLEdBQUc7TUFBRUQsR0FBRyxFQUFFLElBQUksQ0FBQ0E7SUFBSSxDQUFDO0lBQ2hDLElBQUksQ0FBQ0Usa0JBQWtCLEdBQUcsRUFBRTtJQUM1QixJQUFJLENBQUNDLFNBQVMsR0FBRyxFQUFFO0lBQ25CLElBQUksQ0FBQ04sVUFBVSxHQUFHQSxVQUFVO0lBQzVCLElBQUksQ0FBQ0MsT0FBTyxHQUFHM0MsVUFBVSxDQUFDMkMsT0FBTyxDQUFDO0lBQ2xDLElBQUksQ0FBQ00sdUJBQXVCLEdBQUc1QixPQUFPLENBQUM0Qix1QkFBdUI7SUFDOUQsSUFBSSxDQUFDQyxjQUFjLEdBQUc3QixPQUFPLENBQUM2QixjQUFjOztJQUU1QztJQUNBLElBQUFDLGNBQUEsR0FBa0R0QyxhQUFhLENBQUN3QixHQUFHLENBQUM7TUFBNURlLFVBQVUsR0FBQUQsY0FBQSxDQUFWQyxVQUFVO01BQUVDLFdBQVcsR0FBQUYsY0FBQSxDQUFYRSxXQUFXO01BQUVDLFlBQVksR0FBQUgsY0FBQSxDQUFaRyxZQUFZO0lBQzdDLElBQVF4QixZQUFZLEdBQUssSUFBSSxDQUFDSCxNQUFNLENBQTVCRyxZQUFZO0lBQ3BCO0lBQ0EsSUFBSSxDQUFDeUIsTUFBTSxHQUFHMUUsZUFBZSxDQUFDLElBQUksRUFBRXlELEtBQUssRUFBRVIsWUFBWSxFQUFFdUIsV0FBVyxFQUFFQyxZQUFZLENBQUM7SUFFbkYsSUFBSSxJQUFJLENBQUNiLE9BQU8sRUFBRTtNQUNoQixJQUFBZSxlQUFBLEdBQXNEekQsY0FBYyxDQUNsRSxJQUFJLENBQUN3RCxNQUFNLEVBQ1hILFVBQVUsRUFDVnRCLFlBQVksRUFDWnVCLFdBQ0YsQ0FBQztRQUxPSSxhQUFhLEdBQUFELGVBQUEsQ0FBYkMsYUFBYTtRQUFFQyxhQUFhLEdBQUFGLGVBQUEsQ0FBYkUsYUFBYTtRQUFFQyxXQUFXLEdBQUFILGVBQUEsQ0FBWEcsV0FBVztNQU1qRCxJQUFJLENBQUNGLGFBQWEsR0FBR0EsYUFBYTtNQUNsQyxJQUFJLENBQUNDLGFBQWEsR0FBR0EsYUFBYTtNQUNsQyxJQUFJLENBQUNDLFdBQVcsR0FBR0EsV0FBVztJQUNoQyxDQUFDLE1BQU07TUFDTCxJQUFBQyxlQUFBLEdBQW1FOUQsY0FBYyxDQUMvRSxJQUFJLENBQUN5RCxNQUFNLEVBQ1hILFVBQVUsRUFDVnRCLFlBQVksRUFDWnVCLFdBQ0YsQ0FBQztRQUxPUSxXQUFXLEdBQUFELGVBQUEsQ0FBWEMsV0FBVztRQUFFSixjQUFhLEdBQUFHLGVBQUEsQ0FBYkgsYUFBYTtRQUFFQyxjQUFhLEdBQUFFLGVBQUEsQ0FBYkYsYUFBYTtRQUFFQyxZQUFXLEdBQUFDLGVBQUEsQ0FBWEQsV0FBVztNQU05RCxJQUFJLENBQUNHLEtBQUssR0FBR0QsV0FBVztNQUN4QixJQUFJLENBQUNKLGFBQWEsR0FBR0EsY0FBYTtNQUNsQyxJQUFJLENBQUNDLGFBQWEsR0FBR0EsY0FBYTtNQUNsQyxJQUFJLENBQUNDLFdBQVcsR0FBR0EsWUFBVztJQUNoQztJQUNBLElBQUksQ0FBQ2IsT0FBTyxDQUFDZixRQUFRLEdBQUcsSUFBSSxDQUFDMkIsYUFBYTtJQUUxQ3RELHdCQUF3QixDQUFDLElBQUksQ0FBQ3dDLEVBQUUsRUFBRSxJQUFJLENBQUM7RUFDekM7RUFBQyxPQUFBbUIsWUFBQSxDQUFBM0MsS0FBQTtJQUFBNEMsR0FBQTtJQUFBQyxLQUFBO0lBNWlCRDtJQVFBO0lBUUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBTEU7TUFBQSxJQUFBQyxPQUFBLEdBQUFDLGlCQUFBLGNBQUFDLG1CQUFBLENBQUFDLElBQUEsQ0FNQSxTQUFBQyxRQUFvQmpELE9BVW5CO1FBQUEsSUFBQWtELEtBQUE7UUFBQSxJQUFBQyxJQUFBLEVBQUFuQyxHQUFBLEVBQUFvQyxFQUFBLEVBQUFDLFFBQUEsRUFBQUMsS0FBQSxFQUFBQyxLQUFBLEVBQUFDLE1BQUEsRUFBQUMsS0FBQSxFQUFBQyxPQUFBLEVBQUFDLFlBQUEsRUFBQUMsV0FBQSxFQUFBQyxVQUFBLEVBQUFDLHFCQUFBLEVBQUE1QixNQUFBLEVBQUE2QixTQUFBLEVBQUFDLFlBQUEsRUFBQUMsV0FBQTtRQUFBLE9BQUFsQixtQkFBQSxDQUFBbUIsSUFBQSxXQUFBQyxRQUFBO1VBQUEsa0JBQUFBLFFBQUEsQ0FBQUMsSUFBQSxHQUFBRCxRQUFBLENBQUFFLElBQUE7WUFBQTtjQUNTbEIsSUFBSSxHQUE4RG5ELE9BQU8sQ0FBekVtRCxJQUFJLEVBQUVuQyxHQUFHLEdBQXlEaEIsT0FBTyxDQUFuRWdCLEdBQUcsRUFBRW9DLEVBQUUsR0FBcURwRCxPQUFPLENBQTlEb0QsRUFBRSxFQUFFQyxRQUFRLEdBQTJDckQsT0FBTyxDQUExRHFELFFBQVEsRUFBRUMsS0FBSyxHQUFvQ3RELE9BQU8sQ0FBaERzRCxLQUFLLEVBQUVDLEtBQUssR0FBNkJ2RCxPQUFPLENBQXpDdUQsS0FBSyxFQUFFQyxNQUFNLEdBQXFCeEQsT0FBTyxDQUFsQ3dELE1BQU0sRUFBRUMsS0FBSyxHQUFjekQsT0FBTyxDQUExQnlELEtBQUssRUFBRUMsT0FBTyxHQUFLMUQsT0FBTyxDQUFuQjBELE9BQU87Y0FDckUsSUFBSSxDQUFDMUMsR0FBRyxHQUFHQSxHQUFHO2NBQ2QsSUFBSSxDQUFDbUMsSUFBSSxHQUFHQSxJQUFJO2NBQ2hCLElBQUksQ0FBQ0ksS0FBSyxHQUFHQSxLQUFLO2NBQ2xCLElBQUksQ0FBQ2UsUUFBUSxHQUFHLEtBQUs7Y0FDckIsSUFBSSxDQUFDZCxNQUFNLEdBQUdBLE1BQU0sYUFBTkEsTUFBTSxjQUFOQSxNQUFNLEdBQUksSUFBSSxDQUFDQSxNQUFNO2NBQ25DLElBQUksQ0FBQ0UsT0FBTyxHQUFHQSxPQUFPLGFBQVBBLE9BQU8sY0FBUEEsT0FBTyxHQUFJLElBQUksQ0FBQ0EsT0FBTztjQUN0QyxJQUFJLENBQUNqQyxPQUFPLENBQUM2QixLQUFLLEdBQUdBLEtBQUssYUFBTEEsS0FBSyxjQUFMQSxLQUFLLEdBQUksSUFBSSxDQUFDN0IsT0FBTyxDQUFDNkIsS0FBSztjQUNoRCxJQUFJLENBQUNpQixVQUFVLEdBQUcsSUFBSTtjQUN0QjtjQUFBSixRQUFBLENBQUFFLElBQUE7Y0FBQSxPQUNNLElBQUksQ0FBQ0csV0FBVztZQUFBO2NBRXRCO2NBQ0E7Y0FDTWIsWUFBWSxHQUFHLElBQUksQ0FBQ3pCLE1BQU0sQ0FBQ3VDLGFBQWE7Y0FDeENiLFdBQVcsR0FBR0gsS0FBSyxHQUNyQixVQUFDaUIsS0FBa0IsRUFBRUMsSUFBa0I7Z0JBQUEsT0FDckNsQixLQUFLLENBQUMsT0FBT2lCLEtBQUssS0FBSyxRQUFRLEdBQUdoRixlQUFlLENBQUNnRixLQUFLLEVBQUd4QixLQUFJLENBQUNiLGFBQWEsQ0FBY3VDLElBQUksQ0FBQyxHQUFHRixLQUFLLEVBQUVDLElBQUksQ0FBQztjQUFBLElBQ2hILElBQUksQ0FBQ2xCLEtBQUs7Y0FDZCxJQUFJRyxXQUFXLEVBQUU7Z0JBQ2ZELFlBQVksQ0FBQ0YsS0FBSyxHQUFHRyxXQUFXO2dCQUNoQyxJQUFJLENBQUNILEtBQUssR0FBR0csV0FBVztjQUMxQjs7Y0FFQTtjQUNBLElBQUksSUFBSSxDQUFDaUIsUUFBUSxJQUFJLElBQUksQ0FBQ3RCLEtBQUssRUFBRTtnQkFDL0I7Z0JBQ0F6RixlQUFlLENBQUM2RixZQUFZLENBQUM7Y0FDL0IsQ0FBQyxNQUFNO2dCQUNMO2dCQUNBNUYsZUFBZSxDQUFDNEYsWUFBWSxDQUFDO2dCQUM3QjdGLGVBQWUsQ0FBQzZGLFlBQVksQ0FBQztjQUMvQjs7Y0FFQTtjQUNBLElBQUksQ0FBQ04sUUFBUSxHQUFHQSxRQUFRLGFBQVJBLFFBQVEsY0FBUkEsUUFBUSxHQUFJLElBQUksQ0FBQ0EsUUFBUTs7Y0FFekM7Y0FBQSxLQUNJLElBQUksQ0FBQ2pDLE9BQU87Z0JBQUErQyxRQUFBLENBQUFFLElBQUE7Z0JBQUE7Y0FBQTtjQUNSUixVQUFVLEdBQUczRSx3QkFBd0IsQ0FBQzRGLElBQUksQ0FBQ25CLFlBQVksQ0FBQ29CLFFBQVEsRUFBRSxNQUFNLENBQUM7Y0FBQWpCLHFCQUFBLEdBQ2pEdkYsNEJBQTRCLENBQUMsSUFBSSxDQUFDZ0QsRUFBRSxFQUFFNkIsRUFBRSxhQUFGQSxFQUFFLGNBQUZBLEVBQUUsR0FBSVMsVUFBVSxFQUFFLElBQUksQ0FBQzFDLFlBQVksQ0FBQyxFQUFoR2UsTUFBTSxHQUFBNEIscUJBQUEsQ0FBTjVCLE1BQU0sRUFBRTZCLFNBQVMsR0FBQUQscUJBQUEsQ0FBVEMsU0FBUztjQUN6QixJQUFJLENBQUNYLEVBQUUsR0FBR1csU0FBUztjQUNuQjtjQUNBLElBQUlYLEVBQUUsRUFBRWxGLFVBQVUsQ0FBQzJGLFVBQVUsQ0FBQztjQUM5QjtjQUNBakcsbUJBQW1CLENBQUNzRSxNQUFNLENBQUN1QyxhQUFhLEVBQUVkLFlBQVksQ0FBQztjQUN2RDtjQUNBekIsTUFBTSxDQUFDdUMsYUFBYSxDQUFDTyxRQUFRLEdBQUcsWUFBTTtnQkFDcEM5QixLQUFJLENBQUMrQixPQUFPLENBQUMsQ0FBQztjQUNoQixDQUFDO2NBQUMsS0FDRSxJQUFJLENBQUNGLFFBQVE7Z0JBQUFaLFFBQUEsQ0FBQUUsSUFBQTtnQkFBQTtjQUFBO2NBQUEsS0FDWCxJQUFJLENBQUNkLEtBQUs7Z0JBQUFZLFFBQUEsQ0FBQUUsSUFBQTtnQkFBQTtjQUFBO2NBQ1puQyxNQUFNLENBQUNnRCxlQUFlLENBQUNDLFlBQVksQ0FBQyxJQUFJLENBQUNKLFFBQVEsQ0FBQ0ssZUFBZSxFQUFFbEQsTUFBTSxDQUFDZ0QsZUFBZSxDQUFDRSxlQUFlLENBQUM7Y0FDMUc7Y0FDQTNILHFCQUFxQixDQUFDeUUsTUFBTSxDQUFDZ0QsZUFBZSxDQUFDRSxlQUFlLEVBQUV6QixZQUFZLENBQUM7Y0FBQ1EsUUFBQSxDQUFBRSxJQUFBO2NBQUE7WUFBQTtjQUFBRixRQUFBLENBQUFFLElBQUE7Y0FBQSxPQUV0RS9GLHNCQUFzQixDQUFDNEQsTUFBTSxDQUFDZ0QsZUFBZSxFQUFFLElBQUksQ0FBQ2hELE1BQU0sQ0FBQ3VDLGFBQWEsRUFBRSxJQUFJLENBQUNwQixRQUFRLENBQUM7WUFBQTtjQUM5RjtjQUNBM0Ysd0JBQXdCLENBQUMsSUFBSSxDQUFDcUgsUUFBUSxDQUFDSyxlQUFlLEVBQUVsRCxNQUFNLENBQUNnRCxlQUFlLENBQUNFLGVBQWUsRUFBRXpCLFlBQVksQ0FBQztZQUFDO2NBQUFRLFFBQUEsQ0FBQUUsSUFBQTtjQUFBO1lBQUE7Y0FBQUYsUUFBQSxDQUFBRSxJQUFBO2NBQUEsT0FHMUcvRixzQkFBc0IsQ0FBQzRELE1BQU0sQ0FBQ2dELGVBQWUsRUFBRSxJQUFJLENBQUNoRCxNQUFNLENBQUN1QyxhQUFhLEVBQUUsSUFBSSxDQUFDcEIsUUFBUSxDQUFDO1lBQUE7Y0FFaEcsSUFBSSxDQUFDMEIsUUFBUSxHQUFHN0MsTUFBTSxDQUFDZ0QsZUFBZTtjQUNoQ2xCLFlBQVksR0FBRyxJQUFJLENBQUNlLFFBQVEsQ0FBQ00sV0FBVztjQUM5QyxJQUFJckIsWUFBWSxFQUFFO2dCQUNoQm5HLGtDQUFrQyxDQUFDOEYsWUFBWSxFQUFFSyxZQUFZLENBQUM7Y0FDaEU7Y0FBQyxPQUFBRyxRQUFBLENBQUFtQixNQUFBO1lBQUE7Y0FBQSxLQUlDLElBQUksQ0FBQ0MsVUFBVTtnQkFBQXBCLFFBQUEsQ0FBQUUsSUFBQTtnQkFBQTtjQUFBO2NBQ2pCO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtjQUNNLElBQUksQ0FBQ2pCLEVBQUUsR0FBR2hGLHdCQUF3QixDQUFDLElBQUksQ0FBQ21ILFVBQVUsQ0FBQzNFLElBQUksRUFBRXdDLEVBQUUsQ0FBQztjQUFDLEtBQ3pELElBQUksQ0FBQ0csS0FBSztnQkFBQVksUUFBQSxDQUFBRSxJQUFBO2dCQUFBO2NBQUE7Y0FBQSxPQUFBRixRQUFBLENBQUFtQixNQUFBO1lBQUE7Y0FBQW5CLFFBQUEsQ0FBQUUsSUFBQTtjQUFBO1lBQUE7Y0FFZDtjQUNNUixXQUFVLEdBQUczRSx3QkFBd0IsQ0FBQzRGLElBQUksQ0FBQ25CLFlBQVksQ0FBQ29CLFFBQVEsRUFBRSxNQUFNLENBQUM7Y0FDL0UsSUFBSSxDQUFDM0IsRUFBRSxHQUFHaEYsd0JBQXdCLENBQUNILHVCQUF1QixDQUFDLElBQUksQ0FBQ3NELEVBQUUsQ0FBQyxFQUFFNkIsRUFBRSxhQUFGQSxFQUFFLGNBQUZBLEVBQUUsR0FBSVMsV0FBVSxDQUFDO1lBQUM7Y0FBQU0sUUFBQSxDQUFBRSxJQUFBO2NBQUEsT0FHbkZoRywwQkFBMEIsQ0FBQyxJQUFJLENBQUNrSCxVQUFVLEVBQUU1QixZQUFZLEVBQUUsSUFBSSxDQUFDTixRQUFRLENBQUM7WUFBQTtjQUM5RSxJQUFJLENBQUNtQyxhQUFhLENBQUMsQ0FBQzs7Y0FFcEI7Y0FDQSxJQUFJLENBQUMvRCxPQUFPLENBQUM4RCxVQUFVLEdBQUcsSUFBSSxDQUFDQSxVQUFVO1lBQUM7WUFBQTtjQUFBLE9BQUFwQixRQUFBLENBQUFzQixJQUFBO1VBQUE7UUFBQSxHQUFBeEMsT0FBQTtNQUFBLENBQzNDO01BQUEsU0F0R1l5QyxNQUFNQSxDQUFBQyxFQUFBO1FBQUEsT0FBQTlDLE9BQUEsQ0FBQStDLEtBQUEsT0FBQUMsU0FBQTtNQUFBO01BQUEsT0FBTkgsTUFBTTtJQUFBLElBd0duQjtJQUFBO0VBQUE7SUFBQS9DLEdBQUE7SUFBQUMsS0FBQSxFQUNBLFNBQU9uRCxtQkFBbUJBLENBQUNxRyxRQUFRLEVBQUU7TUFBQSxJQUFBQyxNQUFBO01BQ25DLE9BQU90RyxvQkFBbUIsQ0FBQyxZQUFNO1FBQy9CO1FBQ0EsSUFBSSxDQUFDc0csTUFBSSxDQUFDN0QsTUFBTSxFQUFFO1FBQ2xCNEQsUUFBUSxDQUFDRixLQUFLLENBQUNHLE1BQUksQ0FBQztNQUN0QixDQUFDLENBQUM7SUFDSjtJQUNBO0FBQ0Y7QUFDQTtBQUNBO0VBSEU7SUFBQXBELEdBQUE7SUFBQUMsS0FBQTtNQUFBLElBQUFvRCxNQUFBLEdBQUFsRCxpQkFBQSxjQUFBQyxtQkFBQSxDQUFBQyxJQUFBLENBSUEsU0FBQWlELFNBQW1CQyxrQkFBMEM7UUFBQSxJQUFBQyxNQUFBO1FBQUEsSUFBQUMsZ0JBQUEsRUFBQXpDLFlBQUEsRUFBQTBDLHNCQUFBLEVBQUFDLHFCQUFBLEVBQUFDLG9CQUFBLEVBQUFDLHFCQUFBLEVBQUFDLHFCQUFBLEVBQUFDLHVCQUFBLEVBQUFDLGdCQUFBO1FBQUEsT0FBQTVELG1CQUFBLENBQUFtQixJQUFBLFdBQUEwQyxTQUFBO1VBQUEsa0JBQUFBLFNBQUEsQ0FBQXhDLElBQUEsR0FBQXdDLFNBQUEsQ0FBQXZDLElBQUE7WUFBQTtjQUMzRCxJQUFJLENBQUNRLFFBQVEsR0FBRyxJQUFJO2NBQ3BCO2NBQUErQixTQUFBLENBQUF2QyxJQUFBO2NBQUEsT0FDK0I2QixrQkFBa0IsQ0FBQyxDQUFDO1lBQUE7Y0FBN0NFLGdCQUFnQixHQUFBUSxTQUFBLENBQUFDLElBQUE7Y0FBQSxJQUVqQixJQUFJLENBQUMzRSxNQUFNO2dCQUFBMEUsU0FBQSxDQUFBdkMsSUFBQTtnQkFBQTtjQUFBO2NBQUEsT0FBQXVDLFNBQUEsQ0FBQXRCLE1BQUE7WUFBQTtjQUNWM0IsWUFBWSxHQUFHLElBQUksQ0FBQ3pCLE1BQU0sQ0FBQ3VDLGFBQWEsRUFDOUM7Y0FDQWQsWUFBWSxDQUFDdEQsb0JBQW9CLEdBQUcsSUFBSTtjQUN4QztjQUNNZ0csc0JBQTRDLEdBQUd6SCxnQkFBZ0IsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMwQyxPQUFPLENBQUMsRUFDdEc7Y0FDTWdGLHFCQUEyQyxHQUFHMUgsZ0JBQWdCLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDMEMsT0FBTyxDQUFDLEVBQ3BHO2NBQ01pRixvQkFBc0MsR0FBRyxFQUFFLEVBQ2pEO2NBQ01DLHFCQUF1QyxHQUFHLEVBQUUsRUFDbEQ7Y0FDTUMscUJBQXVDLEdBQUcsRUFBRTtjQUNsREwsZ0JBQWdCLENBQUNVLE9BQU8sQ0FBQyxVQUFDQyxZQUFZLEVBQUs7Z0JBQ3pDLElBQUlBLFlBQVksQ0FBQ0MsS0FBSyxFQUFFUCxxQkFBcUIsQ0FBQ1EsSUFBSSxDQUFDRixZQUFZLENBQUMsQ0FBQyxLQUM1RCxJQUFJQSxZQUFZLENBQUNHLEtBQUssRUFBRVYscUJBQXFCLENBQUNTLElBQUksQ0FBQ0YsWUFBWSxDQUFDLENBQUMsS0FDakVSLG9CQUFvQixDQUFDVSxJQUFJLENBQUNGLFlBQVksQ0FBQztjQUM5QyxDQUFDLENBQUM7O2NBRUY7Y0FDQVYsc0JBQXNCLENBQUNTLE9BQU8sQ0FBQyxVQUFDSyxrQkFBa0IsRUFBSztnQkFDckRoQixNQUFJLENBQUN4RSxTQUFTLENBQUNzRixJQUFJLENBQUM7a0JBQUEsT0FDbEJkLE1BQUksQ0FBQ2pGLEtBQUssR0FDTmlGLE1BQUksQ0FBQzFHLG1CQUFtQixDQUFDO29CQUFBLE9BQU05QixvQkFBb0IsQ0FBQ3dKLGtCQUFrQixFQUFFeEQsWUFBWSxDQUFDO2tCQUFBLEVBQUMsR0FDdEZoRyxvQkFBb0IsQ0FBQ3dKLGtCQUFrQixFQUFFeEQsWUFBWSxDQUFDO2dCQUFBLENBQzVELENBQUM7Y0FDSCxDQUFDLENBQUM7O2NBRUY7Y0FDQTRDLG9CQUFvQixDQUFDYSxNQUFNLENBQUNYLHFCQUFxQixDQUFDLENBQUNLLE9BQU8sQ0FBQyxVQUFDQyxZQUFZLEVBQUs7Z0JBQzNFWixNQUFJLENBQUN4RSxTQUFTLENBQUNzRixJQUFJLENBQUM7a0JBQUEsT0FDbEJGLFlBQVksQ0FBQ00sY0FBYyxDQUFDQyxJQUFJLENBQUMsVUFBQ0MsT0FBTztvQkFBQSxPQUN2Q3BCLE1BQUksQ0FBQ2pGLEtBQUssR0FDTmlGLE1BQUksQ0FBQzFHLG1CQUFtQixDQUFDO3NCQUFBLE9BQU05QixvQkFBb0IsQ0FBQTZKLGFBQUEsQ0FBQUEsYUFBQSxLQUFNVCxZQUFZO3dCQUFFUSxPQUFPLEVBQVBBO3NCQUFPLElBQUk1RCxZQUFZLENBQUM7b0JBQUEsRUFBQyxHQUNoR2hHLG9CQUFvQixDQUFBNkosYUFBQSxDQUFBQSxhQUFBLEtBQU1ULFlBQVk7c0JBQUVRLE9BQU8sRUFBUEE7b0JBQU8sSUFBSTVELFlBQVksQ0FBQztrQkFBQSxDQUN0RSxDQUFDO2dCQUFBLENBQ0gsQ0FBQztjQUNILENBQUMsQ0FBQzs7Y0FFRjtjQUNBNkMscUJBQXFCLENBQUNNLE9BQU8sQ0FBQyxVQUFDQyxZQUFZLEVBQUs7Z0JBQzlDQSxZQUFZLENBQUNNLGNBQWMsQ0FBQ0MsSUFBSSxDQUFDLFVBQUNDLE9BQU8sRUFBSztrQkFDNUNwQixNQUFJLENBQUNqRixLQUFLLEdBQ05pRixNQUFJLENBQUMxRyxtQkFBbUIsQ0FBQztvQkFBQSxPQUFNOUIsb0JBQW9CLENBQUE2SixhQUFBLENBQUFBLGFBQUEsS0FBTVQsWUFBWTtzQkFBRVEsT0FBTyxFQUFQQTtvQkFBTyxJQUFJNUQsWUFBWSxDQUFDO2tCQUFBLEVBQUMsR0FDaEdoRyxvQkFBb0IsQ0FBQTZKLGFBQUEsQ0FBQUEsYUFBQSxLQUFNVCxZQUFZO29CQUFFUSxPQUFPLEVBQVBBO2tCQUFPLElBQUk1RCxZQUFZLENBQUM7Z0JBQ3RFLENBQUMsQ0FBQztjQUNKLENBQUMsQ0FBQzs7Y0FFRjtjQUNBLElBQUksQ0FBQ2hDLFNBQVMsQ0FBQ3NGLElBQUksQ0FBQyxJQUFJLENBQUMvRixLQUFLLEdBQUc7Z0JBQUEsT0FBTWlGLE1BQUksQ0FBQzFHLG1CQUFtQixDQUFDO2tCQUFBLE9BQU0wRyxNQUFJLENBQUNzQixLQUFLLENBQUMsQ0FBQztnQkFBQSxFQUFDO2NBQUEsSUFBRztnQkFBQSxPQUFNdEIsTUFBSSxDQUFDc0IsS0FBSyxDQUFDLENBQUM7Y0FBQSxFQUFDOztjQUV6RztjQUNNZix1QkFBdUIsR0FBRyxTQUExQkEsdUJBQXVCQSxDQUFBLEVBQVM7Z0JBQUEsSUFBQWdCLHFCQUFBO2dCQUNwQy9ILFlBQVksQ0FBQ2dFLFlBQVksQ0FBQ29CLFFBQVEsRUFBRSxrQkFBa0IsQ0FBQztnQkFDdkRwRixZQUFZLENBQUNnRSxZQUFZLEVBQUUsa0JBQWtCLENBQUM7Z0JBQzlDLENBQUErRCxxQkFBQSxHQUFBdkIsTUFBSSxDQUFDeEUsU0FBUyxDQUFDZ0csS0FBSyxDQUFDLENBQUMsY0FBQUQscUJBQUEsZUFBdEJBLHFCQUFBLENBQXlCLENBQUM7Y0FDNUIsQ0FBQztjQUNELElBQUksQ0FBQy9GLFNBQVMsQ0FBQ3NGLElBQUksQ0FBQyxJQUFJLENBQUMvRixLQUFLLEdBQUc7Z0JBQUEsT0FBTWlGLE1BQUksQ0FBQzFHLG1CQUFtQixDQUFDaUgsdUJBQXVCLENBQUM7Y0FBQSxJQUFHQSx1QkFBdUIsQ0FBQzs7Y0FFbkg7Y0FDQUoscUJBQXFCLENBQUNRLE9BQU8sQ0FBQyxVQUFDYyxpQkFBaUIsRUFBSztnQkFDbkR6QixNQUFJLENBQUN4RSxTQUFTLENBQUNzRixJQUFJLENBQUM7a0JBQUEsT0FDbEJkLE1BQUksQ0FBQ2pGLEtBQUssR0FDTmlGLE1BQUksQ0FBQzFHLG1CQUFtQixDQUFDO29CQUFBLE9BQU05QixvQkFBb0IsQ0FBQ2lLLGlCQUFpQixFQUFFakUsWUFBWSxDQUFDO2tCQUFBLEVBQUMsR0FDckZoRyxvQkFBb0IsQ0FBQ2lLLGlCQUFpQixFQUFFakUsWUFBWSxDQUFDO2dCQUFBLENBQzNELENBQUM7Y0FDSCxDQUFDLENBQUM7O2NBRUY7Y0FDTWdELGdCQUFnQixHQUFHLFNBQW5CQSxnQkFBZ0JBLENBQUEsRUFBUztnQkFBQSxJQUFBa0Isc0JBQUE7Z0JBQzdCbEksWUFBWSxDQUFDZ0UsWUFBWSxDQUFDb0IsUUFBUSxFQUFFLGtCQUFrQixDQUFDO2dCQUN2RHBGLFlBQVksQ0FBQ2dFLFlBQVksRUFBRSxNQUFNLENBQUM7Z0JBQ2xDLENBQUFrRSxzQkFBQSxHQUFBMUIsTUFBSSxDQUFDeEUsU0FBUyxDQUFDZ0csS0FBSyxDQUFDLENBQUMsY0FBQUUsc0JBQUEsZUFBdEJBLHNCQUFBLENBQXlCLENBQUM7Y0FDNUIsQ0FBQztjQUNELElBQUksQ0FBQ2xHLFNBQVMsQ0FBQ3NGLElBQUksQ0FBQyxJQUFJLENBQUMvRixLQUFLLEdBQUc7Z0JBQUEsT0FBTWlGLE1BQUksQ0FBQzFHLG1CQUFtQixDQUFDa0gsZ0JBQWdCLENBQUM7Y0FBQSxJQUFHQSxnQkFBZ0IsQ0FBQztjQUNyRztjQUNBLElBQUksSUFBSSxDQUFDcEQsS0FBSyxJQUFJLENBQUNqRSxVQUFVLENBQUMsSUFBSSxDQUFDNEMsTUFBTSxDQUFDdUMsYUFBYSxDQUFDcUQsZUFBZSxDQUFDLEVBQUV0SixhQUFhLENBQUMsSUFBSSxDQUFDNEUsRUFBRSxDQUFDO2NBQ2hHLElBQUksQ0FBQ3pCLFNBQVMsQ0FBQ2dHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Y0FFeEI7Y0FBQSxPQUFBZixTQUFBLENBQUF0QixNQUFBLFdBQ08sSUFBSXlDLE9BQU8sQ0FBQyxVQUFDQyxPQUFPLEVBQUs7Z0JBQzlCN0IsTUFBSSxDQUFDeEUsU0FBUyxDQUFDc0YsSUFBSSxDQUFDLFlBQU07a0JBQUEsSUFBQWdCLHNCQUFBO2tCQUN4QkQsT0FBTyxDQUFDLENBQUM7a0JBQ1QsQ0FBQUMsc0JBQUEsR0FBQTlCLE1BQUksQ0FBQ3hFLFNBQVMsQ0FBQ2dHLEtBQUssQ0FBQyxDQUFDLGNBQUFNLHNCQUFBLGVBQXRCQSxzQkFBQSxDQUF5QixDQUFDO2dCQUM1QixDQUFDLENBQUM7Y0FDSixDQUFDLENBQUM7WUFBQTtZQUFBO2NBQUEsT0FBQXJCLFNBQUEsQ0FBQW5CLElBQUE7VUFBQTtRQUFBLEdBQUFRLFFBQUE7TUFBQSxDQUNIO01BQUEsU0E1RllpQyxLQUFLQSxDQUFBQyxHQUFBO1FBQUEsT0FBQW5DLE1BQUEsQ0FBQUosS0FBQSxPQUFBQyxTQUFBO01BQUE7TUFBQSxPQUFMcUMsS0FBSztJQUFBO0lBOEZsQjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFMRTtFQUFBO0lBQUF2RixHQUFBO0lBQUFDLEtBQUEsRUFNQSxTQUFPNkUsS0FBS0EsQ0FBQSxFQUFTO01BQUEsSUFBQVcscUJBQUE7TUFDbkIsSUFBSSxJQUFJLENBQUNDLFNBQVMsRUFBRTtNQUNwQixJQUFJL0ksVUFBVSxDQUFDLElBQUksQ0FBQzRDLE1BQU0sQ0FBQ3VDLGFBQWEsQ0FBQzZELGFBQWEsQ0FBQyxFQUFFO1FBQUEsSUFBQUMsZ0JBQUEsRUFBQUMscUJBQUEsRUFBQUMsaUJBQUEsRUFBQUMscUJBQUE7UUFDdkRsSyxhQUFhLENBQUMsSUFBSSxDQUFDNEUsRUFBRSxDQUFDO1FBQ3RCLENBQUFtRixnQkFBQSxPQUFJLENBQUNsSCxVQUFVLGNBQUFrSCxnQkFBQSxnQkFBQUMscUJBQUEsR0FBZkQsZ0JBQUEsQ0FBaUJJLFdBQVcsY0FBQUgscUJBQUEsZUFBNUJBLHFCQUFBLENBQUExRCxJQUFBLENBQUF5RCxnQkFBQSxFQUErQixJQUFJLENBQUNyRyxNQUFNLENBQUN1QyxhQUFhLENBQUM7UUFDekQsSUFBSSxDQUFDdkMsTUFBTSxDQUFDdUMsYUFBYSxDQUFDNkQsYUFBYSxDQUFDLENBQUM7UUFDekMsQ0FBQUcsaUJBQUEsT0FBSSxDQUFDcEgsVUFBVSxjQUFBb0gsaUJBQUEsZ0JBQUFDLHFCQUFBLEdBQWZELGlCQUFBLENBQWlCRyxVQUFVLGNBQUFGLHFCQUFBLGVBQTNCQSxxQkFBQSxDQUFBNUQsSUFBQSxDQUFBMkQsaUJBQUEsRUFBOEIsSUFBSSxDQUFDdkcsTUFBTSxDQUFDdUMsYUFBYSxDQUFDO1FBQ3hELElBQUksQ0FBQzRELFNBQVMsR0FBRyxJQUFJO01BQ3ZCO01BQ0EsSUFBSSxJQUFJLENBQUM5RSxLQUFLLEVBQUU7UUFBQSxJQUFBc0YsaUJBQUEsRUFBQUMscUJBQUE7UUFDZCxDQUFBRCxpQkFBQSxPQUFJLENBQUN4SCxVQUFVLGNBQUF3SCxpQkFBQSxnQkFBQUMscUJBQUEsR0FBZkQsaUJBQUEsQ0FBaUJFLFNBQVMsY0FBQUQscUJBQUEsZUFBMUJBLHFCQUFBLENBQUFoRSxJQUFBLENBQUErRCxpQkFBQSxFQUE2QixJQUFJLENBQUMzRyxNQUFNLENBQUN1QyxhQUFhLENBQUM7TUFDekQ7TUFDQSxDQUFBMkQscUJBQUEsT0FBSSxDQUFDekcsU0FBUyxDQUFDZ0csS0FBSyxDQUFDLENBQUMsY0FBQVMscUJBQUEsZUFBdEJBLHFCQUFBLENBQXlCLENBQUM7SUFDNUI7O0lBRUE7RUFBQTtJQUFBekYsR0FBQTtJQUFBQyxLQUFBO01BQUEsSUFBQW9HLFFBQUEsR0FBQWxHLGlCQUFBLGNBQUFDLG1CQUFBLENBQUFDLElBQUEsQ0FDQSxTQUFBaUcsU0FBQTtRQUFBLElBQUFDLGlCQUFBLEVBQUFDLHFCQUFBLEVBQUFDLGlCQUFBLEVBQUFDLHFCQUFBLEVBQUFDLGlCQUFBLEVBQUFDLHFCQUFBLEVBQUFDLFNBQUE7UUFBQSxPQUFBekcsbUJBQUEsQ0FBQW1CLElBQUEsV0FBQXVGLFNBQUE7VUFBQSxrQkFBQUEsU0FBQSxDQUFBckYsSUFBQSxHQUFBcUYsU0FBQSxDQUFBcEYsSUFBQTtZQUFBO2NBQ0U7Y0FDQSxJQUFJLENBQUNxRiwyQkFBMkIsQ0FBQyxDQUFDO2NBQ2xDLElBQUksQ0FBQ25GLFVBQVUsR0FBRyxLQUFLO2NBQ3ZCO2NBQ0F2RyxtQkFBbUIsQ0FBQyxDQUFDO2NBQ3JCLElBQUksSUFBSSxDQUFDdUYsS0FBSyxFQUFFO2dCQUNkLENBQUEyRixpQkFBQSxPQUFJLENBQUM3SCxVQUFVLGNBQUE2SCxpQkFBQSxnQkFBQUMscUJBQUEsR0FBZkQsaUJBQUEsQ0FBaUJTLFdBQVcsY0FBQVIscUJBQUEsZUFBNUJBLHFCQUFBLENBQUFyRSxJQUFBLENBQUFvRSxpQkFBQSxFQUErQixJQUFJLENBQUNoSCxNQUFNLENBQUN1QyxhQUFhLENBQUM7Y0FDM0Q7Y0FBQyxJQUNJLElBQUksQ0FBQzRELFNBQVM7Z0JBQUFvQixTQUFBLENBQUFwRixJQUFBO2dCQUFBO2NBQUE7Y0FBQSxPQUFBb0YsU0FBQSxDQUFBbkUsTUFBQTtZQUFBO2NBQUEsTUFDZmhHLFVBQVUsQ0FBQyxJQUFJLENBQUM0QyxNQUFNLENBQUN1QyxhQUFhLENBQUNxRCxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQ3ZFLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQ2UsUUFBUTtnQkFBQW1GLFNBQUEsQ0FBQXBGLElBQUE7Z0JBQUE7Y0FBQTtjQUN4RixDQUFBK0UsaUJBQUEsT0FBSSxDQUFDL0gsVUFBVSxjQUFBK0gsaUJBQUEsZ0JBQUFDLHFCQUFBLEdBQWZELGlCQUFBLENBQWlCUSxhQUFhLGNBQUFQLHFCQUFBLGVBQTlCQSxxQkFBQSxDQUFBdkUsSUFBQSxDQUFBc0UsaUJBQUEsRUFBaUMsSUFBSSxDQUFDbEgsTUFBTSxDQUFDdUMsYUFBYSxDQUFDO2NBQUNnRixTQUFBLENBQUFwRixJQUFBO2NBQUEsT0FDdEQsSUFBSSxDQUFDbkMsTUFBTSxDQUFDdUMsYUFBYSxDQUFDcUQsZUFBZSxDQUFDLENBQUM7WUFBQTtjQUNqRCxDQUFBd0IsaUJBQUEsT0FBSSxDQUFDakksVUFBVSxjQUFBaUksaUJBQUEsZ0JBQUFDLHFCQUFBLEdBQWZELGlCQUFBLENBQWlCTyxZQUFZLGNBQUFOLHFCQUFBLGVBQTdCQSxxQkFBQSxDQUFBekUsSUFBQSxDQUFBd0UsaUJBQUEsRUFBZ0MsSUFBSSxDQUFDcEgsTUFBTSxDQUFDdUMsYUFBYSxDQUFDO2NBQzFELElBQUksQ0FBQzRELFNBQVMsR0FBRyxLQUFLO2NBQ3RCLENBQUFtQixTQUFBLE9BQUksQ0FBQ2hJLEdBQUcsY0FBQWdJLFNBQUEsZUFBUkEsU0FBQSxDQUFVTSxNQUFNLENBQUMsQ0FBQztjQUNsQixJQUFJLENBQUMsSUFBSSxDQUFDMUksT0FBTyxFQUFFO2dCQUNqQmxELFVBQVUsQ0FBQyxJQUFJLENBQUNxSCxVQUFVLENBQUM7Z0JBQzNCO2dCQUNBMUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDa0wsSUFBSSxDQUFDO2dCQUM5QmxMLG1CQUFtQixDQUFDLElBQUksQ0FBQ21MLElBQUksQ0FBQztjQUNoQztjQUNBOUwsVUFBVSxDQUFDLElBQUksQ0FBQzZMLElBQUksQ0FBQztjQUNyQjdMLFVBQVUsQ0FBQyxJQUFJLENBQUM4TCxJQUFJLENBQUM7Y0FDckI7Y0FDQTtjQUNBO2NBQ0E7WUFBQTtZQUFBO2NBQUEsT0FBQVAsU0FBQSxDQUFBaEUsSUFBQTtVQUFBO1FBQUEsR0FBQXdELFFBQUE7TUFBQSxDQUVIO01BQUEsU0E3QlloRSxPQUFPQSxDQUFBO1FBQUEsT0FBQStELFFBQUEsQ0FBQXBELEtBQUEsT0FBQUMsU0FBQTtNQUFBO01BQUEsT0FBUFosT0FBTztJQUFBLElBK0JwQjtFQUFBO0lBQUF0QyxHQUFBO0lBQUFDLEtBQUE7TUFBQSxJQUFBcUgsUUFBQSxHQUFBbkgsaUJBQUEsY0FBQUMsbUJBQUEsQ0FBQUMsSUFBQSxDQUNBLFNBQUFrSCxTQUFBO1FBQUEsSUFBQUMscUJBQUEsRUFBQUMsYUFBQSxFQUFBQyxpQkFBQTtRQUFBLE9BQUF0SCxtQkFBQSxDQUFBbUIsSUFBQSxXQUFBb0csU0FBQTtVQUFBLGtCQUFBQSxTQUFBLENBQUFsRyxJQUFBLEdBQUFrRyxTQUFBLENBQUFqRyxJQUFBO1lBQUE7Y0FBQWlHLFNBQUEsQ0FBQWpHLElBQUE7Y0FBQSxPQUNRLElBQUksQ0FBQ1ksT0FBTyxDQUFDLENBQUM7WUFBQTtjQUNwQjtjQUNBLElBQUksQ0FBQ3NGLGdCQUFnQixDQUFDLENBQUM7Y0FDdkIsSUFBSSxDQUFDQyxtQkFBbUIsQ0FBQyxDQUFDO2NBQzFCLElBQUksQ0FBQ0Msb0JBQW9CLENBQUMsQ0FBQztjQUMzQjtjQUNBLElBQUksQ0FBQ2YsMkJBQTJCLENBQUMsQ0FBQztjQUNsQztjQUNBO2NBQ0EsSUFBSSxDQUFDbEksR0FBRyxDQUFDa0osUUFBUSxDQUFDLENBQUM7Y0FDbkIsSUFBSSxDQUFDbkYsVUFBVSxHQUFHLElBQUk7Y0FDdEIsSUFBSSxDQUFDOUMsS0FBSyxHQUFHLElBQUk7Y0FDakIsSUFBSSxDQUFDTCxhQUFhLEdBQUcsSUFBSTtjQUN6QixJQUFJLENBQUNDLGFBQWEsR0FBRyxJQUFJO2NBQ3pCLElBQUksQ0FBQ1YsU0FBUyxHQUFHLElBQUk7Y0FDckIsSUFBSSxDQUFDRixPQUFPLEdBQUcsSUFBSTtjQUNuQixJQUFJLENBQUNOLFlBQVksR0FBRyxJQUFJO2NBQ3hCLElBQUksQ0FBQ08sa0JBQWtCLEdBQUcsSUFBSTtjQUM5QixJQUFJLENBQUNpSixzQkFBc0IsR0FBRyxJQUFJO2NBQ2xDLElBQUksQ0FBQ0MscUJBQXFCLEdBQUcsSUFBSTtjQUNqQyxJQUFJLENBQUNDLHNCQUFzQixHQUFHLElBQUk7Y0FDbEMsSUFBSSxDQUFDckosR0FBRyxHQUFHLElBQUk7Y0FDZixJQUFJLENBQUNrQyxPQUFPLEdBQUcsSUFBSTtjQUNuQixJQUFJLENBQUNELEtBQUssR0FBRyxJQUFJO2NBQ2pCLElBQUksQ0FBQ29CLFFBQVEsR0FBRyxJQUFJO2NBQ3BCLElBQUksQ0FBQ3dELFNBQVMsR0FBRyxJQUFJO2NBQ3JCLElBQUksQ0FBQy9ELFFBQVEsR0FBRyxJQUFJO2NBQ3BCLElBQUksQ0FBQ1MsUUFBUSxHQUFHLElBQUk7Y0FDcEIsSUFBSSxDQUFDZ0YsSUFBSSxHQUFHLElBQUk7Y0FDaEIsSUFBSSxDQUFDQyxJQUFJLEdBQUcsSUFBSTtjQUNoQixJQUFJLENBQUNjLG9CQUFvQixHQUFHLElBQUk7Y0FDaEMsSUFBSSxDQUFDekosVUFBVSxHQUFHLElBQUk7Y0FDdEIsSUFBSSxDQUFDQyxPQUFPLEdBQUcsSUFBSTtjQUNuQixJQUFJLENBQUNHLE9BQU8sR0FBRyxJQUFJO2NBQ25CLElBQUksQ0FBQ25CLE1BQU0sR0FBRyxJQUFJO2NBQ2xCLElBQUksQ0FBQ3FCLFNBQVMsR0FBRyxJQUFJO2NBQ3JCLElBQUksQ0FBQzZCLE1BQU0sR0FBRyxJQUFJO2NBQ2xCLElBQUksQ0FBQzVCLHVCQUF1QixHQUFHLElBQUk7Y0FDbkMsSUFBSSxDQUFDQyxjQUFjLEdBQUcsSUFBSTtjQUMxQjtjQUNBLElBQUksSUFBSSxDQUFDdUIsRUFBRSxFQUFFO2dCQUNYbEYsVUFBVSxDQUFDLElBQUksQ0FBQ2tGLEVBQUUsQ0FBQztnQkFDbkIsSUFBSSxDQUFDQSxFQUFFLEdBQUcsSUFBSTtjQUNoQjtjQUNBO2NBQ0EsSUFBSSxJQUFJLENBQUNsQixNQUFNLEVBQUU7Z0JBQ1R5QixhQUFZLEdBQUcsSUFBSSxDQUFDekIsTUFBTSxDQUFDdUMsYUFBYTtnQkFDOUMsSUFBSWQsYUFBWSxhQUFaQSxhQUFZLGVBQVpBLGFBQVksQ0FBRW9ILHVCQUF1QixFQUFFO2tCQUN6Q3BILGFBQVksQ0FBQ29ILHVCQUF1QixDQUFDakUsT0FBTyxDQUFDLFVBQUNrRSxDQUFDLEVBQUs7b0JBQ2xEckgsYUFBWSxDQUFDOUUsbUJBQW1CLENBQUNtTSxDQUFDLENBQUNDLElBQUksRUFBRUQsQ0FBQyxDQUFDRSxRQUFRLEVBQUVGLENBQUMsQ0FBQ2hMLE9BQU8sQ0FBQztrQkFDakUsQ0FBQyxDQUFDO2dCQUNKO2dCQUNBO2dCQUNBO2dCQUNBO2dCQUNBO2dCQUNBLElBQUkyRCxhQUFZLEVBQUU7a0JBQ2hCLElBQUk7b0JBQ0ZBLGFBQVksQ0FBQ3BELE9BQU8sR0FBRyxJQUFJO29CQUMzQm9ELGFBQVksQ0FBQ3dILE1BQU0sR0FBRyxJQUFJO2tCQUM1QixDQUFDLENBQUMsT0FBT0MsQ0FBQyxFQUFFO29CQUNWO2tCQUFBO2dCQUVKO2dCQUNBLENBQUFqQixxQkFBQSxPQUFJLENBQUNqSSxNQUFNLENBQUNtSixVQUFVLGNBQUFsQixxQkFBQSxlQUF0QkEscUJBQUEsQ0FBd0JtQixXQUFXLENBQUMsSUFBSSxDQUFDcEosTUFBTSxDQUFDO2dCQUNoRCxJQUFJLENBQUNBLE1BQU0sR0FBRyxJQUFJO2NBQ3BCO2NBQ0E7Y0FDQTtjQUNBLElBQUk7Z0JBQ0YsQ0FBQW1JLGlCQUFBLE9BQUksQ0FBQy9ILFdBQVcsY0FBQStILGlCQUFBLGVBQWhCQSxpQkFBQSxDQUFBdkYsSUFBQSxLQUFtQixDQUFDO2NBQ3RCLENBQUMsQ0FBQyxPQUFPc0csQ0FBQyxFQUFFO2dCQUNWO2NBQUE7Y0FFRixJQUFJLENBQUM5SSxXQUFXLEdBQUcsSUFBSTtjQUN2QjtjQUNBLElBQUksQ0FBQ2lKLG1CQUFtQixDQUFDQyxVQUFVLENBQUMsQ0FBQztjQUNyQ3hNLGVBQWUsQ0FBQyxJQUFJLENBQUN1QyxFQUFFLENBQUM7WUFBQztZQUFBO2NBQUEsT0FBQStJLFNBQUEsQ0FBQTdFLElBQUE7VUFBQTtRQUFBLEdBQUF5RSxRQUFBO01BQUEsQ0FDMUI7TUFBQSxTQS9FWXVCLE9BQU9BLENBQUE7UUFBQSxPQUFBeEIsUUFBQSxDQUFBckUsS0FBQSxPQUFBQyxTQUFBO01BQUE7TUFBQSxPQUFQNEYsT0FBTztJQUFBO0lBaUZwQjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFMRTtFQUFBO0lBQUE5SSxHQUFBO0lBQUFDLEtBQUEsRUFNQSxTQUFPMkgsZ0JBQWdCQSxDQUFBLEVBQVM7TUFDOUIsSUFBSSxDQUFDbUIsS0FBSyxDQUFDQyxPQUFPLENBQUMsSUFBSSxDQUFDakssa0JBQWtCLENBQUMsRUFBRTtNQUM3QyxJQUFJLENBQUNBLGtCQUFrQixDQUFDb0YsT0FBTyxDQUFDLFVBQUMxRCxFQUFFLEVBQUs7UUFDdEMsSUFBSTtVQUFBLElBQUF3SSxjQUFBO1VBQ0YsQ0FBQUEsY0FBQSxHQUFBeEksRUFBRSxDQUFDaUksVUFBVSxjQUFBTyxjQUFBLGVBQWJBLGNBQUEsQ0FBZU4sV0FBVyxDQUFDbEksRUFBRSxDQUFDO1FBQ2hDLENBQUMsQ0FBQyxPQUFPZ0ksQ0FBQyxFQUFFO1VBQ1Y7UUFBQTtNQUVKLENBQUMsQ0FBQztNQUNGLElBQUksQ0FBQzFKLGtCQUFrQixDQUFDbUssTUFBTSxHQUFHLENBQUM7SUFDcEM7O0lBRUE7QUFDRjtBQUNBO0FBQ0E7RUFIRTtJQUFBbEosR0FBQTtJQUFBQyxLQUFBLEVBSUEsU0FBTzRILG1CQUFtQkEsQ0FBQSxFQUFTO01BQ2pDLElBQUksQ0FBQ2tCLEtBQUssQ0FBQ0MsT0FBTyxDQUFDLElBQUksQ0FBQ2YscUJBQXFCLENBQUMsRUFBRTtNQUNoRCxJQUFJLENBQUNBLHFCQUFxQixDQUFDOUQsT0FBTyxDQUFDLFVBQUNnRixNQUFNLEVBQUs7UUFDN0MsSUFBSTtVQUFBLElBQUFDLGtCQUFBO1VBQ0YsQ0FBQUEsa0JBQUEsR0FBQUQsTUFBTSxDQUFDVCxVQUFVLGNBQUFVLGtCQUFBLGVBQWpCQSxrQkFBQSxDQUFtQlQsV0FBVyxDQUFDUSxNQUFNLENBQUM7UUFDeEMsQ0FBQyxDQUFDLE9BQU9WLENBQUMsRUFBRTtVQUNWO1FBQUE7TUFFSixDQUFDLENBQUM7TUFDRixJQUFJLENBQUNSLHFCQUFxQixDQUFDaUIsTUFBTSxHQUFHLENBQUM7SUFDdkM7O0lBRUE7QUFDRjtBQUNBO0FBQ0E7RUFIRTtJQUFBbEosR0FBQTtJQUFBQyxLQUFBLEVBSUEsU0FBTzZILG9CQUFvQkEsQ0FBQSxFQUFTO01BQ2xDLElBQUksQ0FBQ2lCLEtBQUssQ0FBQ0MsT0FBTyxDQUFDLElBQUksQ0FBQ2hCLHNCQUFzQixDQUFDLEVBQUU7TUFDakQsSUFBSSxDQUFDQSxzQkFBc0IsQ0FBQzdELE9BQU8sQ0FBQyxVQUFDMUQsRUFBRSxFQUFLO1FBQzFDLElBQUk7VUFBQSxJQUFBNEksZUFBQTtVQUNGLENBQUFBLGVBQUEsR0FBQTVJLEVBQUUsQ0FBQ2lJLFVBQVUsY0FBQVcsZUFBQSxlQUFiQSxlQUFBLENBQWVWLFdBQVcsQ0FBQ2xJLEVBQUUsQ0FBQztRQUNoQyxDQUFDLENBQUMsT0FBT2dJLENBQUMsRUFBRTtVQUNWO1FBQUE7TUFFSixDQUFDLENBQUM7TUFDRixJQUFJLENBQUNULHNCQUFzQixDQUFDa0IsTUFBTSxHQUFHLENBQUM7SUFDeEM7O0lBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUpFO0lBQUFsSixHQUFBO0lBQUFDLEtBQUEsRUFLQSxTQUFPOEcsMkJBQTJCQSxDQUFBLEVBQVM7TUFDekMsSUFBSSxDQUFDZ0MsS0FBSyxDQUFDQyxPQUFPLENBQUMsSUFBSSxDQUFDZCxzQkFBc0IsQ0FBQyxFQUFFO01BQ2pELElBQUksQ0FBQ0Esc0JBQXNCLENBQUMvRCxPQUFPLENBQUMsVUFBQ21GLFFBQVEsRUFBSztRQUNoRCxJQUFJO1VBQ0ZBLFFBQVEsQ0FBQ0MsVUFBVSxDQUFDLENBQUM7UUFDdkIsQ0FBQyxDQUFDLE9BQU9kLENBQUMsRUFBRTtVQUNWO1FBQUE7TUFFSixDQUFDLENBQUM7TUFDRixJQUFJLENBQUNQLHNCQUFzQixDQUFDZ0IsTUFBTSxHQUFHLENBQUM7SUFDeEM7O0lBRUE7QUFDRjtBQUNBO0FBQ0E7RUFIRTtJQUFBbEosR0FBQTtJQUFBQyxLQUFBLEVBSUEsU0FBUTlCLDZCQUE2QkEsQ0FBQSxFQUFnQjtNQUNuRCxJQUFNaUQsU0FBUyxHQUFHN0Usd0JBQXdCLENBQUM0RixJQUFJLENBQUNDLFFBQVEsTUFBQXFDLE1BQUEsQ0FBTXRILCtCQUErQixNQUFHLENBQUM7TUFDakcsSUFBSWlFLFNBQVMsRUFBRSxPQUFPQSxTQUFTO01BRS9CLElBQU1vSSxZQUFZLEdBQUdwSCxRQUFRLENBQUNxSCxhQUFhLENBQUMsT0FBTyxDQUFDO01BQ3BERCxZQUFZLENBQUNFLFlBQVksQ0FBQ3ZNLCtCQUErQixFQUFFLEVBQUUsQ0FBQztNQUM5RGlGLFFBQVEsQ0FBQ2dGLElBQUksQ0FBQ3VDLFdBQVcsQ0FBQ0gsWUFBWSxDQUFDO01BQ3ZDLE9BQU9BLFlBQVk7SUFDckI7O0lBRUE7RUFBQTtJQUFBeEosR0FBQTtJQUFBQyxLQUFBLEVBQ0EsU0FBTzJKLGtCQUFrQkEsQ0FBQSxFQUFTO01BQUEsSUFBQUMsTUFBQTtNQUNoQyxJQUFJLElBQUksQ0FBQzlLLGtCQUFrQixJQUFJLElBQUksQ0FBQ0Esa0JBQWtCLENBQUNtSyxNQUFNLEVBQUU7UUFDN0QsSUFBSSxDQUFDbkssa0JBQWtCLENBQUNvRixPQUFPLENBQUMsVUFBQzJGLGlCQUFpQixFQUFLO1VBQ3JEeE4scUJBQXFCLENBQUM2RixJQUFJLENBQUMwSCxNQUFJLENBQUNwTCxPQUFPLEdBQUdvTCxNQUFJLENBQUN6SCxRQUFRLENBQUNnRixJQUFJLEdBQUd5QyxNQUFJLENBQUNqSCxVQUFVLENBQUN3RSxJQUFJLEVBQUUwQyxpQkFBaUIsQ0FBQztRQUN6RyxDQUFDLENBQUM7TUFDSjtNQUNBLElBQUksQ0FBQ2pILGFBQWEsQ0FBQyxDQUFDO0lBQ3RCOztJQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFKRTtJQUFBN0MsR0FBQTtJQUFBQyxLQUFBLEVBS0EsU0FBTzRDLGFBQWFBLENBQUEsRUFBUztNQUMzQixJQUFJLElBQUksQ0FBQ3BFLE9BQU8sRUFBRTtNQUNsQixJQUFJLElBQUksQ0FBQ21FLFVBQVUsQ0FBQzNFLElBQUksQ0FBQzhMLFlBQVksQ0FBQzlNLDBCQUEwQixDQUFDLEVBQUU7TUFDbkUsSUFBQStNLHFCQUFBLEdBQXVEeE8scUJBQXFCLENBQzFFdU4sS0FBSyxDQUFDa0IsSUFBSSxDQUFDLElBQUksQ0FBQzFLLE1BQU0sQ0FBQ2dELGVBQWUsQ0FBQzJILGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUNDLEdBQUcsQ0FDbkUsVUFBQ0wsaUJBQWlCO1VBQUEsT0FBS0EsaUJBQWlCLENBQUNNLEtBQUs7UUFBQSxDQUNoRCxDQUNGLENBQUM7UUFBQUMsc0JBQUEsR0FBQUMsY0FBQSxDQUFBTixxQkFBQTtRQUpNTyxxQkFBcUIsR0FBQUYsc0JBQUE7UUFBRUcscUJBQXFCLEdBQUFILHNCQUFBO01BS25ELElBQUlFLHFCQUFxQixFQUFFO1FBQ3pCLElBQUksQ0FBQzNILFVBQVUsQ0FBQ3dFLElBQUksQ0FBQ3VDLFdBQVcsQ0FBQ1kscUJBQXFCLENBQUM7UUFDdkQsSUFBSSxDQUFDeEwsa0JBQWtCLENBQUN1RixJQUFJLENBQUNpRyxxQkFBcUIsQ0FBQztNQUNyRDtNQUNBLElBQUlDLHFCQUFxQixFQUFFO1FBQUEsSUFBQUMscUJBQUE7UUFDekIsQ0FBQUEscUJBQUEsT0FBSSxDQUFDOU0sTUFBTSxDQUFDTyx1QkFBdUIsY0FBQXVNLHFCQUFBLGVBQW5DQSxxQkFBQSxDQUFxQ2QsV0FBVyxDQUFDYSxxQkFBcUIsQ0FBQztRQUN2RUEscUJBQXFCLENBQUNkLFlBQVksQ0FBQ3hNLFlBQVksRUFBRSxJQUFJLENBQUMwQixFQUFFLENBQUM7UUFDekQsSUFBSSxDQUFDb0osc0JBQXNCLENBQUMxRCxJQUFJLENBQUNrRyxxQkFBcUIsQ0FBQztNQUN6RDtNQUNBLENBQUNELHFCQUFxQixJQUFJQyxxQkFBcUIsS0FDN0MsSUFBSSxDQUFDNUgsVUFBVSxDQUFDM0UsSUFBSSxDQUFDeUwsWUFBWSxDQUFDek0sMEJBQTBCLEVBQUUsRUFBRSxDQUFDO0lBQ3JFO0VBQUM7QUFBQTtBQUFBLFNBbGtCa0JHLEtBQUssSUFBQXNOLE9BQUEiLCJpZ25vcmVMaXN0IjpbXX0=