import _defineProperty from "@babel/runtime/helpers/defineProperty";
import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _classCallCheck from "@babel/runtime/helpers/classCallCheck";
import _createClass from "@babel/runtime/helpers/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";
import _inherits from "@babel/runtime/helpers/inherits";
import _wrapNativeSuper from "@babel/runtime/helpers/wrapNativeSuper";
import _regeneratorRuntime from "@babel/runtime/regenerator";
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
import { WUJIE_APP_ID, WUJIE_IFRAME_CLASS, WUJIE_SHADE_STYLE, CONTAINER_POSITION_DATA_FLAG, CONTAINER_OVERFLOW_DATA_FLAG, LOADING_DATA_FLAG, WUJIE_LOADING_STYLE, WUJIE_LOADING_SVG } from "./constant";
import { getWujieById, rawAppendChild, rawElementAppendChild, rawElementRemoveChild, relativeElementTagAttrMap } from "./common";
import { getExternalStyleSheets } from "./entry";
import { initBase, patchElementEffect } from "./iframe";
import { patchRenderEffect } from "./effect";
import { getCssLoader, getPresetLoaders } from "./plugin";
import { getAbsolutePath, getContainer, getCurUrl, isFunction, setAttrsToElement } from "./utils";
var cssSelectorMap = {
  ":root": ":host"
};
/**
 * 处理 wujie-app webComponent disconnect 时的销毁策略，按运行模式自动决定 destroy / unmount：
 *
 * - 保活模式（alive）：仅 unmount，保留 sandbox / iframe，再次进入直接 active 复用。
 * - 单例模式（非保活但做了生命周期改造，存在 __WUJIE_MOUNT）：仅 unmount，sandbox 复用，
 *   再次进入走 startApp 的 unmount → active → mount 时序。
 * - 重建模式（非保活且未做生命周期改造）：sandbox 不会被复用，且 unmount 对其而言基本是空操作
 *   （没有 mountFlag / __WUJIE_UNMOUNT），若仅 unmount 会导致 sandbox / iframe 长期驻留累积，
 *   故直接 destroy。
 */
export function handleWujieAppDisconnect(sandbox) {
  var _sandbox$iframe;
  if (!sandbox) return;
  var iframeWindow = (_sandbox$iframe = sandbox.iframe) === null || _sandbox$iframe === void 0 ? void 0 : _sandbox$iframe.contentWindow;
  var isRebuildMode = !sandbox.alive && !isFunction(iframeWindow === null || iframeWindow === void 0 ? void 0 : iframeWindow.__WUJIE_MOUNT);
  if (isRebuildMode) {
    sandbox.destroy();
  } else {
    sandbox.unmount();
  }
}

/**
 * 定义 wujie webComponent，将shadow包裹并获得dom装载和卸载的生命周期
 */
export function defineWujieWebComponent() {
  var customElements = window.customElements;
  if (customElements && !(customElements !== null && customElements !== void 0 && customElements.get("wujie-app"))) {
    var WujieApp = /*#__PURE__*/function (_HTMLElement) {
      function WujieApp() {
        _classCallCheck(this, WujieApp);
        return _callSuper(this, WujieApp, arguments);
      }
      _inherits(WujieApp, _HTMLElement);
      return _createClass(WujieApp, [{
        key: "connectedCallback",
        value: function connectedCallback() {
          if (this.shadowRoot) return;
          var shadowRoot = this.attachShadow({
            mode: "open"
          });
          var sandbox = getWujieById(this.getAttribute(WUJIE_APP_ID));
          patchElementEffect(shadowRoot, sandbox.iframe.contentWindow);
          sandbox.shadowRoot = shadowRoot;
        }
      }, {
        key: "disconnectedCallback",
        value: function disconnectedCallback() {
          var sandbox = getWujieById(this.getAttribute(WUJIE_APP_ID));
          handleWujieAppDisconnect(sandbox);
        }
      }]);
    }(/*#__PURE__*/_wrapNativeSuper(HTMLElement));
    customElements === null || customElements === void 0 || customElements.define("wujie-app", WujieApp);
  }
}
export function createWujieWebComponent(id) {
  var contentElement = window.document.createElement("wujie-app");
  contentElement.setAttribute(WUJIE_APP_ID, id);
  contentElement.classList.add(WUJIE_IFRAME_CLASS);
  return contentElement;
}

/**
 * 将准备好的内容插入容器
 */
export function renderElementToContainer(element, selectorOrElement) {
  var container = getContainer(selectorOrElement);
  if (container && !container.contains(element)) {
    // 有 loading 无需清理，已经清理过了
    if (!container.querySelector("div[".concat(LOADING_DATA_FLAG, "]"))) {
      // 清除内容
      clearChild(container);
    }
    // 插入元素
    if (element) {
      rawElementAppendChild.call(container, element);
    }
  }
  return container;
}

/**
 * 将降级的iframe挂在到容器上并进行初始化
 */
export function initRenderIframeAndContainer(id, parent) {
  var degradeAttrs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var iframe = createIframeContainer(id, degradeAttrs);
  var container = renderElementToContainer(iframe, parent);
  var contentDocument = iframe.contentWindow.document;
  contentDocument.open();
  contentDocument.write("<!DOCTYPE html><html><head></head><body></body></html>");
  contentDocument.close();
  return {
    iframe: iframe,
    container: container
  };
}

/**
 * 处理css-before-loader 以及 css-after-loader
 */
function processCssLoaderForTemplate(_x, _x2) {
  return _processCssLoaderForTemplate.apply(this, arguments);
} // 替换html的head和body
function _processCssLoaderForTemplate() {
  _processCssLoaderForTemplate = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime.mark(function _callee(sandbox, html) {
    var document, plugins, replace, proxyLocation, cssLoader, cssBeforeLoaders, cssAfterLoaders, curUrl;
    return _regeneratorRuntime.wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          document = sandbox.iframe.contentDocument;
          plugins = sandbox.plugins, replace = sandbox.replace, proxyLocation = sandbox.proxyLocation;
          cssLoader = getCssLoader({
            plugins: plugins,
            replace: replace
          });
          cssBeforeLoaders = getPresetLoaders("cssBeforeLoaders", plugins);
          cssAfterLoaders = getPresetLoaders("cssAfterLoaders", plugins);
          curUrl = getCurUrl(proxyLocation);
          _context.next = 1;
          return Promise.all([Promise.all(getExternalStyleSheets(cssBeforeLoaders, sandbox.fetch, sandbox.lifecycles.loadError).map(function (_ref) {
            var src = _ref.src,
              contentPromise = _ref.contentPromise;
            return contentPromise.then(function (content) {
              return {
                src: src,
                content: content
              };
            });
          })).then(function (contentList) {
            contentList.forEach(function (_ref2) {
              var src = _ref2.src,
                content = _ref2.content;
              if (!content) return;
              var styleElement = document.createElement("style");
              styleElement.setAttribute("type", "text/css");
              styleElement.appendChild(document.createTextNode(content ? cssLoader(content, src, curUrl) : content));
              var head = html.querySelector("head");
              var body = html.querySelector("body");
              html.insertBefore(styleElement, head || body || html.firstChild);
            });
          }), Promise.all(getExternalStyleSheets(cssAfterLoaders, sandbox.fetch, sandbox.lifecycles.loadError).map(function (_ref3) {
            var src = _ref3.src,
              contentPromise = _ref3.contentPromise;
            return contentPromise.then(function (content) {
              return {
                src: src,
                content: content
              };
            });
          })).then(function (contentList) {
            contentList.forEach(function (_ref4) {
              var src = _ref4.src,
                content = _ref4.content;
              if (!content) return;
              var styleElement = document.createElement("style");
              styleElement.setAttribute("type", "text/css");
              styleElement.appendChild(document.createTextNode(content ? cssLoader(content, src, curUrl) : content));
              html.appendChild(styleElement);
            });
          })]).then(function () {
            return html;
          }, function () {
            return html;
          });
        case 1:
          return _context.abrupt("return", _context.sent);
        case 2:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return _processCssLoaderForTemplate.apply(this, arguments);
}
function replaceHeadAndBody(html, head, body) {
  var headElement = html.querySelector("head");
  var bodyElement = html.querySelector("body");
  if (headElement) {
    while (headElement.firstChild) {
      rawAppendChild.call(head, headElement.firstChild.cloneNode(true));
      headElement.removeChild(headElement.firstChild);
    }
    headElement.parentNode.replaceChild(head, headElement);
  }
  if (bodyElement) {
    while (bodyElement.firstChild) {
      rawAppendChild.call(body, bodyElement.firstChild.cloneNode(true));
      bodyElement.removeChild(bodyElement.firstChild);
    }
    bodyElement.parentNode.replaceChild(body, bodyElement);
  }
  return html;
}

/**
 * 将template渲染成html元素
 */
function renderTemplateToHtml(iframeWindow, template) {
  var sandbox = iframeWindow.__WUJIE;
  var head = sandbox.head,
    body = sandbox.body,
    alive = sandbox.alive,
    execFlag = sandbox.execFlag;
  var document = iframeWindow.document;
  var parser = new DOMParser();
  var parsedDocument = parser.parseFromString(template, "text/html");

  // 无论 template 是否包含html，documentElement 必然是 HTMLHtmlElement
  var parsedHtml = parsedDocument.documentElement;
  var sourceAttributes = parsedHtml.attributes;
  var html = document.createElement("html");
  html.innerHTML = template;
  for (var i = 0; i < sourceAttributes.length; i++) {
    html.setAttribute(sourceAttributes[i].name, sourceAttributes[i].value);
  }
  // 组件多次渲染，head和body必须一直使用同一个来应对被缓存的场景
  if (!alive && execFlag) {
    html = replaceHeadAndBody(html, head, body);
  } else {
    sandbox.head = html.querySelector("head");
    sandbox.body = html.querySelector("body");
  }
  var ElementIterator = document.createTreeWalker(html, NodeFilter.SHOW_ELEMENT, null, false);
  var nextElement = ElementIterator.currentNode;
  while (nextElement) {
    patchElementEffect(nextElement, iframeWindow);
    var relativeAttr = relativeElementTagAttrMap[nextElement.tagName];
    var url = nextElement[relativeAttr];
    if (relativeAttr) nextElement.setAttribute(relativeAttr, getAbsolutePath(url, nextElement.baseURI || ""));
    nextElement = ElementIterator.nextNode();
  }
  if (!html.querySelector("head")) {
    var _head = document.createElement("head");
    html.appendChild(_head);
  }
  if (!html.querySelector("body")) {
    var _body = document.createElement("body");
    html.appendChild(_body);
  }
  return html;
}

/**
 * 将template渲染到shadowRoot
 */
export function renderTemplateToShadowRoot(_x3, _x4, _x5) {
  return _renderTemplateToShadowRoot.apply(this, arguments);
}
function _renderTemplateToShadowRoot() {
  _renderTemplateToShadowRoot = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime.mark(function _callee2(shadowRoot, iframeWindow, template) {
    var html, processedHtml, shade, shadowHtml;
    return _regeneratorRuntime.wrap(function (_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          html = renderTemplateToHtml(iframeWindow, template); // 处理 css-before-loader 和 css-after-loader
          _context2.next = 1;
          return processCssLoaderForTemplate(iframeWindow.__WUJIE, html);
        case 1:
          processedHtml = _context2.sent;
          // change ownerDocument
          shadowRoot.appendChild(processedHtml);
          shade = document.createElement("div");
          shade.setAttribute("style", WUJIE_SHADE_STYLE);
          processedHtml.insertBefore(shade, processedHtml.firstChild);
          shadowRoot.head = shadowRoot.querySelector("head");
          shadowRoot.body = shadowRoot.querySelector("body");
          shadowHtml = shadowRoot.firstElementChild;
          Object.defineProperties(shadowHtml, {
            // 修复 html parentNode
            parentNode: {
              enumerable: true,
              configurable: true,
              get: function get() {
                return iframeWindow.document;
              }
            },
            // 修复 html getBoundingClientRect
            getBoundingClientRect: {
              enumerable: true,
              configurable: true,
              value: function value() {
                return iframeWindow.__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__.call(iframeWindow.document, "html").getBoundingClientRect();
              }
            }
          });
          patchRenderEffect(shadowRoot, iframeWindow.__WUJIE.id, false);
        case 2:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return _renderTemplateToShadowRoot.apply(this, arguments);
}
export function createIframeContainer(id) {
  var degradeAttrs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var iframe = document.createElement("iframe");
  var defaultStyle = "height:100%;width:100%";
  setAttrsToElement(iframe, _objectSpread(_objectSpread({}, degradeAttrs), {}, _defineProperty({
    style: [defaultStyle, degradeAttrs.style].join(";")
  }, WUJIE_APP_ID, id)));
  return iframe;
}

/**
 * 将template渲染到iframe
 */
export function renderTemplateToIframe(_x6, _x7, _x8) {
  return _renderTemplateToIframe.apply(this, arguments);
}

/**
 * 清除Element所有节点
 */
function _renderTemplateToIframe() {
  _renderTemplateToIframe = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime.mark(function _callee3(renderDocument, iframeWindow, template) {
    var html, processedHtml, renderWindow;
    return _regeneratorRuntime.wrap(function (_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          // 插入template
          html = renderTemplateToHtml(iframeWindow, template); // 处理 css-before-loader 和 css-after-loader
          _context3.next = 1;
          return processCssLoaderForTemplate(iframeWindow.__WUJIE, html);
        case 1:
          processedHtml = _context3.sent;
          renderDocument.replaceChild(processedHtml, renderDocument.documentElement);

          // 修复 html parentNode
          Object.defineProperty(renderDocument.documentElement, "parentNode", {
            enumerable: true,
            configurable: true,
            get: function get() {
              return iframeWindow.document;
            }
          });

          // 降级渲染 iframe 无 src 补丁，需与 JS iframe 一样注入 base，供 img 等相对路径解析到子应用域名
          renderWindow = renderDocument.defaultView;
          if (renderWindow) {
            // 对于降级场景不需要添加 path
            initBase(renderWindow, iframeWindow.__WUJIE.url, "");
            // 降级模式内联事件运行在渲染 iframe realm，需把辅助函数注入到该 window，
            // 使编译后的 with(window.__getWujieWindow__(...)) 可调用（其内部会向 parent.document 查找沙箱 iframe）
            renderWindow.__getWujieWindow__ = window.__getWujieWindow__;
          }
          patchRenderEffect(renderDocument, iframeWindow.__WUJIE.id, true);
        case 2:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return _renderTemplateToIframe.apply(this, arguments);
}
export function clearChild(root) {
  // 清除内容
  while (root !== null && root !== void 0 && root.firstChild) {
    rawElementRemoveChild.call(root, root.firstChild);
  }
}

/**
 * 给容器添加loading
 */
export function addLoading(el, loading) {
  var container = getContainer(el);
  clearChild(container);
  // 给容器设置一些样式，防止 loading 抖动
  var containerStyles = null;
  try {
    containerStyles = window.getComputedStyle(container);
  } catch (_unused) {
    return;
  }
  if (containerStyles.position === "static") {
    container.setAttribute(CONTAINER_POSITION_DATA_FLAG, containerStyles.position);
    container.setAttribute(CONTAINER_OVERFLOW_DATA_FLAG, containerStyles.overflow === "visible" ? "" : containerStyles.overflow);
    container.style.setProperty("position", "relative");
    container.style.setProperty("overflow", "hidden");
  } else if (["relative", "sticky"].includes(containerStyles.position)) {
    container.setAttribute(CONTAINER_OVERFLOW_DATA_FLAG, containerStyles.overflow === "visible" ? "" : containerStyles.overflow);
    container.style.setProperty("overflow", "hidden");
  }
  var loadingContainer = document.createElement("div");
  loadingContainer.setAttribute(LOADING_DATA_FLAG, "");
  loadingContainer.setAttribute("style", WUJIE_LOADING_STYLE);
  if (loading) loadingContainer.appendChild(loading);else loadingContainer.innerHTML = WUJIE_LOADING_SVG;
  container.appendChild(loadingContainer);
}
/**
 * 移除loading
 */
export function removeLoading(el) {
  // 去除容器设置的样式
  var positionFlag = el.getAttribute(CONTAINER_POSITION_DATA_FLAG);
  var overflowFlag = el.getAttribute(CONTAINER_OVERFLOW_DATA_FLAG);
  if (positionFlag) el.style.removeProperty("position");
  if (overflowFlag !== null) {
    overflowFlag ? el.style.setProperty("overflow", overflowFlag) : el.style.removeProperty("overflow");
  }
  el.removeAttribute(CONTAINER_POSITION_DATA_FLAG);
  el.removeAttribute(CONTAINER_OVERFLOW_DATA_FLAG);
  var loadingContainer = el.querySelector("div[".concat(LOADING_DATA_FLAG, "]"));
  loadingContainer && el.removeChild(loadingContainer);
}
/**
 * 获取修复好的样式元素
 * 主要是针对对root样式和font-face样式
 */
export function getPatchStyleElements(rootStyleSheets) {
  var rootCssRules = [];
  var fontCssRules = [];
  var rootStyleReg = /:root/g;

  // 找出root的cssRules
  for (var i = 0; i < rootStyleSheets.length; i++) {
    var _rootStyleSheets$i$cs, _rootStyleSheets$i;
    var cssRules = (_rootStyleSheets$i$cs = (_rootStyleSheets$i = rootStyleSheets[i]) === null || _rootStyleSheets$i === void 0 ? void 0 : _rootStyleSheets$i.cssRules) !== null && _rootStyleSheets$i$cs !== void 0 ? _rootStyleSheets$i$cs : [];
    for (var j = 0; j < cssRules.length; j++) {
      var cssRuleText = cssRules[j].cssText;
      // 如果是root的cssRule
      if (rootStyleReg.test(cssRuleText)) {
        rootCssRules.push(cssRuleText.replace(rootStyleReg, function (match) {
          return cssSelectorMap[match];
        }));
      }
      // 如果是font-face的cssRule
      if (cssRules[j].type === CSSRule.FONT_FACE_RULE) {
        fontCssRules.push(cssRuleText);
      }
    }
  }
  var rootStyleSheetElement = null;
  var fontStyleSheetElement = null;

  // 复制到host上
  if (rootCssRules.length) {
    rootStyleSheetElement = window.document.createElement("style");
    rootStyleSheetElement.innerHTML = rootCssRules.join("");
  }
  if (fontCssRules.length) {
    fontStyleSheetElement = window.document.createElement("style");
    fontStyleSheetElement.innerHTML = fontCssRules.join("");
  }
  return [rootStyleSheetElement, fontStyleSheetElement];
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJXVUpJRV9BUFBfSUQiLCJXVUpJRV9JRlJBTUVfQ0xBU1MiLCJXVUpJRV9TSEFERV9TVFlMRSIsIkNPTlRBSU5FUl9QT1NJVElPTl9EQVRBX0ZMQUciLCJDT05UQUlORVJfT1ZFUkZMT1dfREFUQV9GTEFHIiwiTE9BRElOR19EQVRBX0ZMQUciLCJXVUpJRV9MT0FESU5HX1NUWUxFIiwiV1VKSUVfTE9BRElOR19TVkciLCJnZXRXdWppZUJ5SWQiLCJyYXdBcHBlbmRDaGlsZCIsInJhd0VsZW1lbnRBcHBlbmRDaGlsZCIsInJhd0VsZW1lbnRSZW1vdmVDaGlsZCIsInJlbGF0aXZlRWxlbWVudFRhZ0F0dHJNYXAiLCJnZXRFeHRlcm5hbFN0eWxlU2hlZXRzIiwiaW5pdEJhc2UiLCJwYXRjaEVsZW1lbnRFZmZlY3QiLCJwYXRjaFJlbmRlckVmZmVjdCIsImdldENzc0xvYWRlciIsImdldFByZXNldExvYWRlcnMiLCJnZXRBYnNvbHV0ZVBhdGgiLCJnZXRDb250YWluZXIiLCJnZXRDdXJVcmwiLCJpc0Z1bmN0aW9uIiwic2V0QXR0cnNUb0VsZW1lbnQiLCJjc3NTZWxlY3Rvck1hcCIsImhhbmRsZVd1amllQXBwRGlzY29ubmVjdCIsInNhbmRib3giLCJfc2FuZGJveCRpZnJhbWUiLCJpZnJhbWVXaW5kb3ciLCJpZnJhbWUiLCJjb250ZW50V2luZG93IiwiaXNSZWJ1aWxkTW9kZSIsImFsaXZlIiwiX19XVUpJRV9NT1VOVCIsImRlc3Ryb3kiLCJ1bm1vdW50IiwiZGVmaW5lV3VqaWVXZWJDb21wb25lbnQiLCJjdXN0b21FbGVtZW50cyIsIndpbmRvdyIsImdldCIsIld1amllQXBwIiwiX0hUTUxFbGVtZW50IiwiX2NsYXNzQ2FsbENoZWNrIiwiX2NhbGxTdXBlciIsImFyZ3VtZW50cyIsIl9pbmhlcml0cyIsIl9jcmVhdGVDbGFzcyIsImtleSIsInZhbHVlIiwiY29ubmVjdGVkQ2FsbGJhY2siLCJzaGFkb3dSb290IiwiYXR0YWNoU2hhZG93IiwibW9kZSIsImdldEF0dHJpYnV0ZSIsImRpc2Nvbm5lY3RlZENhbGxiYWNrIiwiX3dyYXBOYXRpdmVTdXBlciIsIkhUTUxFbGVtZW50IiwiZGVmaW5lIiwiY3JlYXRlV3VqaWVXZWJDb21wb25lbnQiLCJpZCIsImNvbnRlbnRFbGVtZW50IiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50Iiwic2V0QXR0cmlidXRlIiwiY2xhc3NMaXN0IiwiYWRkIiwicmVuZGVyRWxlbWVudFRvQ29udGFpbmVyIiwiZWxlbWVudCIsInNlbGVjdG9yT3JFbGVtZW50IiwiY29udGFpbmVyIiwiY29udGFpbnMiLCJxdWVyeVNlbGVjdG9yIiwiY29uY2F0IiwiY2xlYXJDaGlsZCIsImNhbGwiLCJpbml0UmVuZGVySWZyYW1lQW5kQ29udGFpbmVyIiwicGFyZW50IiwiZGVncmFkZUF0dHJzIiwibGVuZ3RoIiwidW5kZWZpbmVkIiwiY3JlYXRlSWZyYW1lQ29udGFpbmVyIiwiY29udGVudERvY3VtZW50Iiwib3BlbiIsIndyaXRlIiwiY2xvc2UiLCJwcm9jZXNzQ3NzTG9hZGVyRm9yVGVtcGxhdGUiLCJfeCIsIl94MiIsIl9wcm9jZXNzQ3NzTG9hZGVyRm9yVGVtcGxhdGUiLCJhcHBseSIsIl9hc3luY1RvR2VuZXJhdG9yIiwiX3JlZ2VuZXJhdG9yUnVudGltZSIsIm1hcmsiLCJfY2FsbGVlIiwiaHRtbCIsInBsdWdpbnMiLCJyZXBsYWNlIiwicHJveHlMb2NhdGlvbiIsImNzc0xvYWRlciIsImNzc0JlZm9yZUxvYWRlcnMiLCJjc3NBZnRlckxvYWRlcnMiLCJjdXJVcmwiLCJ3cmFwIiwiX2NvbnRleHQiLCJwcmV2IiwibmV4dCIsIlByb21pc2UiLCJhbGwiLCJmZXRjaCIsImxpZmVjeWNsZXMiLCJsb2FkRXJyb3IiLCJtYXAiLCJfcmVmIiwic3JjIiwiY29udGVudFByb21pc2UiLCJ0aGVuIiwiY29udGVudCIsImNvbnRlbnRMaXN0IiwiZm9yRWFjaCIsIl9yZWYyIiwic3R5bGVFbGVtZW50IiwiYXBwZW5kQ2hpbGQiLCJjcmVhdGVUZXh0Tm9kZSIsImhlYWQiLCJib2R5IiwiaW5zZXJ0QmVmb3JlIiwiZmlyc3RDaGlsZCIsIl9yZWYzIiwiX3JlZjQiLCJhYnJ1cHQiLCJzZW50Iiwic3RvcCIsInJlcGxhY2VIZWFkQW5kQm9keSIsImhlYWRFbGVtZW50IiwiYm9keUVsZW1lbnQiLCJjbG9uZU5vZGUiLCJyZW1vdmVDaGlsZCIsInBhcmVudE5vZGUiLCJyZXBsYWNlQ2hpbGQiLCJyZW5kZXJUZW1wbGF0ZVRvSHRtbCIsInRlbXBsYXRlIiwiX19XVUpJRSIsImV4ZWNGbGFnIiwicGFyc2VyIiwiRE9NUGFyc2VyIiwicGFyc2VkRG9jdW1lbnQiLCJwYXJzZUZyb21TdHJpbmciLCJwYXJzZWRIdG1sIiwiZG9jdW1lbnRFbGVtZW50Iiwic291cmNlQXR0cmlidXRlcyIsImF0dHJpYnV0ZXMiLCJpbm5lckhUTUwiLCJpIiwibmFtZSIsIkVsZW1lbnRJdGVyYXRvciIsImNyZWF0ZVRyZWVXYWxrZXIiLCJOb2RlRmlsdGVyIiwiU0hPV19FTEVNRU5UIiwibmV4dEVsZW1lbnQiLCJjdXJyZW50Tm9kZSIsInJlbGF0aXZlQXR0ciIsInRhZ05hbWUiLCJ1cmwiLCJiYXNlVVJJIiwibmV4dE5vZGUiLCJyZW5kZXJUZW1wbGF0ZVRvU2hhZG93Um9vdCIsIl94MyIsIl94NCIsIl94NSIsIl9yZW5kZXJUZW1wbGF0ZVRvU2hhZG93Um9vdCIsIl9jYWxsZWUyIiwicHJvY2Vzc2VkSHRtbCIsInNoYWRlIiwic2hhZG93SHRtbCIsIl9jb250ZXh0MiIsImZpcnN0RWxlbWVudENoaWxkIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydGllcyIsImVudW1lcmFibGUiLCJjb25maWd1cmFibGUiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJfX1dVSklFX1JBV19ET0NVTUVOVF9RVUVSWV9TRUxFQ1RPUl9fIiwiZGVmYXVsdFN0eWxlIiwiX29iamVjdFNwcmVhZCIsIl9kZWZpbmVQcm9wZXJ0eSIsInN0eWxlIiwiam9pbiIsInJlbmRlclRlbXBsYXRlVG9JZnJhbWUiLCJfeDYiLCJfeDciLCJfeDgiLCJfcmVuZGVyVGVtcGxhdGVUb0lmcmFtZSIsIl9jYWxsZWUzIiwicmVuZGVyRG9jdW1lbnQiLCJyZW5kZXJXaW5kb3ciLCJfY29udGV4dDMiLCJkZWZpbmVQcm9wZXJ0eSIsImRlZmF1bHRWaWV3IiwiX19nZXRXdWppZVdpbmRvd19fIiwicm9vdCIsImFkZExvYWRpbmciLCJlbCIsImxvYWRpbmciLCJjb250YWluZXJTdHlsZXMiLCJnZXRDb21wdXRlZFN0eWxlIiwiX3VudXNlZCIsInBvc2l0aW9uIiwib3ZlcmZsb3ciLCJzZXRQcm9wZXJ0eSIsImluY2x1ZGVzIiwibG9hZGluZ0NvbnRhaW5lciIsInJlbW92ZUxvYWRpbmciLCJwb3NpdGlvbkZsYWciLCJvdmVyZmxvd0ZsYWciLCJyZW1vdmVQcm9wZXJ0eSIsInJlbW92ZUF0dHJpYnV0ZSIsImdldFBhdGNoU3R5bGVFbGVtZW50cyIsInJvb3RTdHlsZVNoZWV0cyIsInJvb3RDc3NSdWxlcyIsImZvbnRDc3NSdWxlcyIsInJvb3RTdHlsZVJlZyIsIl9yb290U3R5bGVTaGVldHMkaSRjcyIsIl9yb290U3R5bGVTaGVldHMkaSIsImNzc1J1bGVzIiwiaiIsImNzc1J1bGVUZXh0IiwiY3NzVGV4dCIsInRlc3QiLCJwdXNoIiwibWF0Y2giLCJ0eXBlIiwiQ1NTUnVsZSIsIkZPTlRfRkFDRV9SVUxFIiwicm9vdFN0eWxlU2hlZXRFbGVtZW50IiwiZm9udFN0eWxlU2hlZXRFbGVtZW50Il0sInNvdXJjZXMiOlsiLi4vc3JjL3NoYWRvdy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBXVUpJRV9BUFBfSUQsXG4gIFdVSklFX0lGUkFNRV9DTEFTUyxcbiAgV1VKSUVfU0hBREVfU1RZTEUsXG4gIENPTlRBSU5FUl9QT1NJVElPTl9EQVRBX0ZMQUcsXG4gIENPTlRBSU5FUl9PVkVSRkxPV19EQVRBX0ZMQUcsXG4gIExPQURJTkdfREFUQV9GTEFHLFxuICBXVUpJRV9MT0FESU5HX1NUWUxFLFxuICBXVUpJRV9MT0FESU5HX1NWRyxcbn0gZnJvbSBcIi4vY29uc3RhbnRcIjtcbmltcG9ydCB7XG4gIGdldFd1amllQnlJZCxcbiAgcmF3QXBwZW5kQ2hpbGQsXG4gIHJhd0VsZW1lbnRBcHBlbmRDaGlsZCxcbiAgcmF3RWxlbWVudFJlbW92ZUNoaWxkLFxuICByZWxhdGl2ZUVsZW1lbnRUYWdBdHRyTWFwLFxufSBmcm9tIFwiLi9jb21tb25cIjtcbmltcG9ydCB7IGdldEV4dGVybmFsU3R5bGVTaGVldHMgfSBmcm9tIFwiLi9lbnRyeVwiO1xuaW1wb3J0IFd1amllIGZyb20gXCIuL3NhbmRib3hcIjtcbmltcG9ydCB7IGluaXRCYXNlLCBwYXRjaEVsZW1lbnRFZmZlY3QgfSBmcm9tIFwiLi9pZnJhbWVcIjtcbmltcG9ydCB7IHBhdGNoUmVuZGVyRWZmZWN0IH0gZnJvbSBcIi4vZWZmZWN0XCI7XG5pbXBvcnQgeyBnZXRDc3NMb2FkZXIsIGdldFByZXNldExvYWRlcnMgfSBmcm9tIFwiLi9wbHVnaW5cIjtcbmltcG9ydCB7IGdldEFic29sdXRlUGF0aCwgZ2V0Q29udGFpbmVyLCBnZXRDdXJVcmwsIGlzRnVuY3Rpb24sIHNldEF0dHJzVG9FbGVtZW50IH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuY29uc3QgY3NzU2VsZWN0b3JNYXAgPSB7XG4gIFwiOnJvb3RcIjogXCI6aG9zdFwiLFxufTtcblxuZGVjbGFyZSBnbG9iYWwge1xuICBpbnRlcmZhY2UgU2hhZG93Um9vdCB7XG4gICAgaGVhZDogSFRNTEhlYWRFbGVtZW50O1xuICAgIGJvZHk6IEhUTUxCb2R5RWxlbWVudDtcbiAgfVxufVxuXG4vKipcbiAqIOWkhOeQhiB3dWppZS1hcHAgd2ViQ29tcG9uZW50IGRpc2Nvbm5lY3Qg5pe255qE6ZSA5q+B562W55Wl77yM5oyJ6L+Q6KGM5qih5byP6Ieq5Yqo5Yaz5a6aIGRlc3Ryb3kgLyB1bm1vdW5077yaXG4gKlxuICogLSDkv53mtLvmqKHlvI/vvIhhbGl2Ze+8ie+8muS7hSB1bm1vdW5077yM5L+d55WZIHNhbmRib3ggLyBpZnJhbWXvvIzlho3mrKHov5vlhaXnm7TmjqUgYWN0aXZlIOWkjeeUqOOAglxuICogLSDljZXkvovmqKHlvI/vvIjpnZ7kv53mtLvkvYblgZrkuobnlJ/lkb3lkajmnJ/mlLnpgKDvvIzlrZjlnKggX19XVUpJRV9NT1VOVO+8ie+8muS7hSB1bm1vdW5077yMc2FuZGJveCDlpI3nlKjvvIxcbiAqICAg5YaN5qyh6L+b5YWl6LWwIHN0YXJ0QXBwIOeahCB1bm1vdW50IOKGkiBhY3RpdmUg4oaSIG1vdW50IOaXtuW6j+OAglxuICogLSDph43lu7rmqKHlvI/vvIjpnZ7kv53mtLvkuJTmnKrlgZrnlJ/lkb3lkajmnJ/mlLnpgKDvvInvvJpzYW5kYm94IOS4jeS8muiiq+WkjeeUqO+8jOS4lCB1bm1vdW50IOWvueWFtuiAjOiogOWfuuacrOaYr+epuuaTjeS9nFxuICogICDvvIjmsqHmnIkgbW91bnRGbGFnIC8gX19XVUpJRV9VTk1PVU5U77yJ77yM6Iul5LuFIHVubW91bnQg5Lya5a+86Ie0IHNhbmRib3ggLyBpZnJhbWUg6ZW/5pyf6am755WZ57Sv56ev77yMXG4gKiAgIOaVheebtOaOpSBkZXN0cm9544CCXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVXdWppZUFwcERpc2Nvbm5lY3Qoc2FuZGJveDogV3VqaWUgfCBudWxsIHwgdW5kZWZpbmVkKTogdm9pZCB7XG4gIGlmICghc2FuZGJveCkgcmV0dXJuO1xuICBjb25zdCBpZnJhbWVXaW5kb3cgPSBzYW5kYm94LmlmcmFtZT8uY29udGVudFdpbmRvdztcbiAgY29uc3QgaXNSZWJ1aWxkTW9kZSA9ICFzYW5kYm94LmFsaXZlICYmICFpc0Z1bmN0aW9uKGlmcmFtZVdpbmRvdz8uX19XVUpJRV9NT1VOVCk7XG4gIGlmIChpc1JlYnVpbGRNb2RlKSB7XG4gICAgc2FuZGJveC5kZXN0cm95KCk7XG4gIH0gZWxzZSB7XG4gICAgc2FuZGJveC51bm1vdW50KCk7XG4gIH1cbn1cblxuLyoqXG4gKiDlrprkuYkgd3VqaWUgd2ViQ29tcG9uZW5077yM5bCGc2hhZG935YyF6KO55bm26I635b6XZG9t6KOF6L295ZKM5Y246L2955qE55Sf5ZG95ZGo5pyfXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWZpbmVXdWppZVdlYkNvbXBvbmVudCgpIHtcbiAgY29uc3QgY3VzdG9tRWxlbWVudHMgPSB3aW5kb3cuY3VzdG9tRWxlbWVudHM7XG4gIGlmIChjdXN0b21FbGVtZW50cyAmJiAhY3VzdG9tRWxlbWVudHM/LmdldChcInd1amllLWFwcFwiKSkge1xuICAgIGNsYXNzIFd1amllQXBwIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICAgICAgY29ubmVjdGVkQ2FsbGJhY2soKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLnNoYWRvd1Jvb3QpIHJldHVybjtcbiAgICAgICAgY29uc3Qgc2hhZG93Um9vdCA9IHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogXCJvcGVuXCIgfSk7XG4gICAgICAgIGNvbnN0IHNhbmRib3ggPSBnZXRXdWppZUJ5SWQodGhpcy5nZXRBdHRyaWJ1dGUoV1VKSUVfQVBQX0lEKSk7XG4gICAgICAgIHBhdGNoRWxlbWVudEVmZmVjdChzaGFkb3dSb290LCBzYW5kYm94LmlmcmFtZS5jb250ZW50V2luZG93KTtcbiAgICAgICAgc2FuZGJveC5zaGFkb3dSb290ID0gc2hhZG93Um9vdDtcbiAgICAgIH1cblxuICAgICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHNhbmRib3ggPSBnZXRXdWppZUJ5SWQodGhpcy5nZXRBdHRyaWJ1dGUoV1VKSUVfQVBQX0lEKSk7XG4gICAgICAgIGhhbmRsZVd1amllQXBwRGlzY29ubmVjdChzYW5kYm94KTtcbiAgICAgIH1cbiAgICB9XG4gICAgY3VzdG9tRWxlbWVudHM/LmRlZmluZShcInd1amllLWFwcFwiLCBXdWppZUFwcCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVd1amllV2ViQ29tcG9uZW50KGlkOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IGNvbnRlbnRFbGVtZW50ID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ3dWppZS1hcHBcIik7XG4gIGNvbnRlbnRFbGVtZW50LnNldEF0dHJpYnV0ZShXVUpJRV9BUFBfSUQsIGlkKTtcbiAgY29udGVudEVsZW1lbnQuY2xhc3NMaXN0LmFkZChXVUpJRV9JRlJBTUVfQ0xBU1MpO1xuICByZXR1cm4gY29udGVudEVsZW1lbnQ7XG59XG5cbi8qKlxuICog5bCG5YeG5aSH5aW955qE5YaF5a655o+S5YWl5a655ZmoXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJFbGVtZW50VG9Db250YWluZXIoXG4gIGVsZW1lbnQ6IEVsZW1lbnQgfCBDaGlsZE5vZGUsXG4gIHNlbGVjdG9yT3JFbGVtZW50OiBzdHJpbmcgfCBIVE1MRWxlbWVudFxuKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBjb250YWluZXIgPSBnZXRDb250YWluZXIoc2VsZWN0b3JPckVsZW1lbnQpO1xuICBpZiAoY29udGFpbmVyICYmICFjb250YWluZXIuY29udGFpbnMoZWxlbWVudCkpIHtcbiAgICAvLyDmnIkgbG9hZGluZyDml6DpnIDmuIXnkIbvvIzlt7Lnu4/muIXnkIbov4fkuoZcbiAgICBpZiAoIWNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGBkaXZbJHtMT0FESU5HX0RBVEFfRkxBR31dYCkpIHtcbiAgICAgIC8vIOa4hemZpOWGheWuuVxuICAgICAgY2xlYXJDaGlsZChjb250YWluZXIpO1xuICAgIH1cbiAgICAvLyDmj5LlhaXlhYPntKBcbiAgICBpZiAoZWxlbWVudCkge1xuICAgICAgcmF3RWxlbWVudEFwcGVuZENoaWxkLmNhbGwoY29udGFpbmVyLCBlbGVtZW50KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvbnRhaW5lcjtcbn1cblxuLyoqXG4gKiDlsIbpmY3nuqfnmoRpZnJhbWXmjILlnKjliLDlrrnlmajkuIrlubbov5vooYzliJ3lp4vljJZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRSZW5kZXJJZnJhbWVBbmRDb250YWluZXIoXG4gIGlkOiBzdHJpbmcsXG4gIHBhcmVudDogc3RyaW5nIHwgSFRNTEVsZW1lbnQsXG4gIGRlZ3JhZGVBdHRyczogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IHt9XG4pOiB7IGlmcmFtZTogSFRNTElGcmFtZUVsZW1lbnQ7IGNvbnRhaW5lcjogSFRNTEVsZW1lbnQgfSB7XG4gIGNvbnN0IGlmcmFtZSA9IGNyZWF0ZUlmcmFtZUNvbnRhaW5lcihpZCwgZGVncmFkZUF0dHJzKTtcbiAgY29uc3QgY29udGFpbmVyID0gcmVuZGVyRWxlbWVudFRvQ29udGFpbmVyKGlmcmFtZSwgcGFyZW50KTtcbiAgY29uc3QgY29udGVudERvY3VtZW50ID0gaWZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQ7XG4gIGNvbnRlbnREb2N1bWVudC5vcGVuKCk7XG4gIGNvbnRlbnREb2N1bWVudC53cml0ZShcIjwhRE9DVFlQRSBodG1sPjxodG1sPjxoZWFkPjwvaGVhZD48Ym9keT48L2JvZHk+PC9odG1sPlwiKTtcbiAgY29udGVudERvY3VtZW50LmNsb3NlKCk7XG4gIHJldHVybiB7IGlmcmFtZSwgY29udGFpbmVyIH07XG59XG5cbi8qKlxuICog5aSE55CGY3NzLWJlZm9yZS1sb2FkZXIg5Lul5Y+KIGNzcy1hZnRlci1sb2FkZXJcbiAqL1xuYXN5bmMgZnVuY3Rpb24gcHJvY2Vzc0Nzc0xvYWRlckZvclRlbXBsYXRlKHNhbmRib3g6IFd1amllLCBodG1sOiBIVE1MSHRtbEVsZW1lbnQpOiBQcm9taXNlPEhUTUxIdG1sRWxlbWVudD4ge1xuICBjb25zdCBkb2N1bWVudCA9IHNhbmRib3guaWZyYW1lLmNvbnRlbnREb2N1bWVudDtcbiAgY29uc3QgeyBwbHVnaW5zLCByZXBsYWNlLCBwcm94eUxvY2F0aW9uIH0gPSBzYW5kYm94O1xuICBjb25zdCBjc3NMb2FkZXIgPSBnZXRDc3NMb2FkZXIoeyBwbHVnaW5zLCByZXBsYWNlIH0pO1xuICBjb25zdCBjc3NCZWZvcmVMb2FkZXJzID0gZ2V0UHJlc2V0TG9hZGVycyhcImNzc0JlZm9yZUxvYWRlcnNcIiwgcGx1Z2lucyk7XG4gIGNvbnN0IGNzc0FmdGVyTG9hZGVycyA9IGdldFByZXNldExvYWRlcnMoXCJjc3NBZnRlckxvYWRlcnNcIiwgcGx1Z2lucyk7XG4gIGNvbnN0IGN1clVybCA9IGdldEN1clVybChwcm94eUxvY2F0aW9uKTtcblxuICByZXR1cm4gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgIFByb21pc2UuYWxsKFxuICAgICAgZ2V0RXh0ZXJuYWxTdHlsZVNoZWV0cyhjc3NCZWZvcmVMb2FkZXJzLCBzYW5kYm94LmZldGNoLCBzYW5kYm94LmxpZmVjeWNsZXMubG9hZEVycm9yKS5tYXAoXG4gICAgICAgICh7IHNyYywgY29udGVudFByb21pc2UgfSkgPT4gY29udGVudFByb21pc2UudGhlbigoY29udGVudCkgPT4gKHsgc3JjLCBjb250ZW50IH0pKVxuICAgICAgKVxuICAgICkudGhlbigoY29udGVudExpc3QpID0+IHtcbiAgICAgIGNvbnRlbnRMaXN0LmZvckVhY2goKHsgc3JjLCBjb250ZW50IH0pID0+IHtcbiAgICAgICAgaWYgKCFjb250ZW50KSByZXR1cm47XG4gICAgICAgIGNvbnN0IHN0eWxlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICAgICAgc3R5bGVFbGVtZW50LnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJ0ZXh0L2Nzc1wiKTtcbiAgICAgICAgc3R5bGVFbGVtZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNvbnRlbnQgPyBjc3NMb2FkZXIoY29udGVudCwgc3JjLCBjdXJVcmwpIDogY29udGVudCkpO1xuICAgICAgICBjb25zdCBoZWFkID0gaHRtbC5xdWVyeVNlbGVjdG9yKFwiaGVhZFwiKTtcbiAgICAgICAgY29uc3QgYm9keSA9IGh0bWwucXVlcnlTZWxlY3RvcihcImJvZHlcIik7XG4gICAgICAgIGh0bWwuaW5zZXJ0QmVmb3JlKHN0eWxlRWxlbWVudCwgaGVhZCB8fCBib2R5IHx8IGh0bWwuZmlyc3RDaGlsZCk7XG4gICAgICB9KTtcbiAgICB9KSxcbiAgICBQcm9taXNlLmFsbChcbiAgICAgIGdldEV4dGVybmFsU3R5bGVTaGVldHMoY3NzQWZ0ZXJMb2FkZXJzLCBzYW5kYm94LmZldGNoLCBzYW5kYm94LmxpZmVjeWNsZXMubG9hZEVycm9yKS5tYXAoXG4gICAgICAgICh7IHNyYywgY29udGVudFByb21pc2UgfSkgPT4gY29udGVudFByb21pc2UudGhlbigoY29udGVudCkgPT4gKHsgc3JjLCBjb250ZW50IH0pKVxuICAgICAgKVxuICAgICkudGhlbigoY29udGVudExpc3QpID0+IHtcbiAgICAgIGNvbnRlbnRMaXN0LmZvckVhY2goKHsgc3JjLCBjb250ZW50IH0pID0+IHtcbiAgICAgICAgaWYgKCFjb250ZW50KSByZXR1cm47XG4gICAgICAgIGNvbnN0IHN0eWxlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICAgICAgc3R5bGVFbGVtZW50LnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJ0ZXh0L2Nzc1wiKTtcbiAgICAgICAgc3R5bGVFbGVtZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNvbnRlbnQgPyBjc3NMb2FkZXIoY29udGVudCwgc3JjLCBjdXJVcmwpIDogY29udGVudCkpO1xuICAgICAgICBodG1sLmFwcGVuZENoaWxkKHN0eWxlRWxlbWVudCk7XG4gICAgICB9KTtcbiAgICB9KSxcbiAgXSkudGhlbihcbiAgICAoKSA9PiBodG1sLFxuICAgICgpID0+IGh0bWxcbiAgKTtcbn1cblxuLy8g5pu/5o2iaHRtbOeahGhlYWTlkoxib2R5XG5mdW5jdGlvbiByZXBsYWNlSGVhZEFuZEJvZHkoaHRtbDogSFRNTEh0bWxFbGVtZW50LCBoZWFkOiBIVE1MSGVhZEVsZW1lbnQsIGJvZHk6IEhUTUxCb2R5RWxlbWVudCk6IEhUTUxIdG1sRWxlbWVudCB7XG4gIGNvbnN0IGhlYWRFbGVtZW50ID0gaHRtbC5xdWVyeVNlbGVjdG9yKFwiaGVhZFwiKTtcbiAgY29uc3QgYm9keUVsZW1lbnQgPSBodG1sLnF1ZXJ5U2VsZWN0b3IoXCJib2R5XCIpO1xuICBpZiAoaGVhZEVsZW1lbnQpIHtcbiAgICB3aGlsZSAoaGVhZEVsZW1lbnQuZmlyc3RDaGlsZCkge1xuICAgICAgcmF3QXBwZW5kQ2hpbGQuY2FsbChoZWFkLCBoZWFkRWxlbWVudC5maXJzdENoaWxkLmNsb25lTm9kZSh0cnVlKSk7XG4gICAgICBoZWFkRWxlbWVudC5yZW1vdmVDaGlsZChoZWFkRWxlbWVudC5maXJzdENoaWxkKTtcbiAgICB9XG4gICAgaGVhZEVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoaGVhZCwgaGVhZEVsZW1lbnQpO1xuICB9XG4gIGlmIChib2R5RWxlbWVudCkge1xuICAgIHdoaWxlIChib2R5RWxlbWVudC5maXJzdENoaWxkKSB7XG4gICAgICByYXdBcHBlbmRDaGlsZC5jYWxsKGJvZHksIGJvZHlFbGVtZW50LmZpcnN0Q2hpbGQuY2xvbmVOb2RlKHRydWUpKTtcbiAgICAgIGJvZHlFbGVtZW50LnJlbW92ZUNoaWxkKGJvZHlFbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgIH1cbiAgICBib2R5RWxlbWVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChib2R5LCBib2R5RWxlbWVudCk7XG4gIH1cbiAgcmV0dXJuIGh0bWw7XG59XG5cbi8qKlxuICog5bCGdGVtcGxhdGXmuLLmn5PmiJBodG1s5YWD57SgXG4gKi9cbmZ1bmN0aW9uIHJlbmRlclRlbXBsYXRlVG9IdG1sKGlmcmFtZVdpbmRvdzogV2luZG93LCB0ZW1wbGF0ZTogc3RyaW5nKTogSFRNTEh0bWxFbGVtZW50IHtcbiAgY29uc3Qgc2FuZGJveCA9IGlmcmFtZVdpbmRvdy5fX1dVSklFO1xuICBjb25zdCB7IGhlYWQsIGJvZHksIGFsaXZlLCBleGVjRmxhZyB9ID0gc2FuZGJveDtcbiAgY29uc3QgZG9jdW1lbnQgPSBpZnJhbWVXaW5kb3cuZG9jdW1lbnQ7XG4gIGNvbnN0IHBhcnNlciA9IG5ldyBET01QYXJzZXIoKTtcbiAgY29uc3QgcGFyc2VkRG9jdW1lbnQgPSBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKHRlbXBsYXRlLCBcInRleHQvaHRtbFwiKTtcblxuICAvLyDml6DorrogdGVtcGxhdGUg5piv5ZCm5YyF5ZCraHRtbO+8jGRvY3VtZW50RWxlbWVudCDlv4XnhLbmmK8gSFRNTEh0bWxFbGVtZW50XG4gIGNvbnN0IHBhcnNlZEh0bWwgPSBwYXJzZWREb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgYXMgSFRNTEh0bWxFbGVtZW50O1xuICBjb25zdCBzb3VyY2VBdHRyaWJ1dGVzID0gcGFyc2VkSHRtbC5hdHRyaWJ1dGVzO1xuICBsZXQgaHRtbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJodG1sXCIpO1xuICBodG1sLmlubmVySFRNTCA9IHRlbXBsYXRlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNvdXJjZUF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBodG1sLnNldEF0dHJpYnV0ZShzb3VyY2VBdHRyaWJ1dGVzW2ldLm5hbWUsIHNvdXJjZUF0dHJpYnV0ZXNbaV0udmFsdWUpO1xuICB9XG4gIC8vIOe7hOS7tuWkmuasoea4suafk++8jGhlYWTlkoxib2R55b+F6aG75LiA55u05L2/55So5ZCM5LiA5Liq5p2l5bqU5a+56KKr57yT5a2Y55qE5Zy65pmvXG4gIGlmICghYWxpdmUgJiYgZXhlY0ZsYWcpIHtcbiAgICBodG1sID0gcmVwbGFjZUhlYWRBbmRCb2R5KGh0bWwsIGhlYWQsIGJvZHkpO1xuICB9IGVsc2Uge1xuICAgIHNhbmRib3guaGVhZCA9IGh0bWwucXVlcnlTZWxlY3RvcihcImhlYWRcIik7XG4gICAgc2FuZGJveC5ib2R5ID0gaHRtbC5xdWVyeVNlbGVjdG9yKFwiYm9keVwiKTtcbiAgfVxuICBjb25zdCBFbGVtZW50SXRlcmF0b3IgPSBkb2N1bWVudC5jcmVhdGVUcmVlV2Fsa2VyKGh0bWwsIE5vZGVGaWx0ZXIuU0hPV19FTEVNRU5ULCBudWxsLCBmYWxzZSk7XG4gIGxldCBuZXh0RWxlbWVudCA9IEVsZW1lbnRJdGVyYXRvci5jdXJyZW50Tm9kZSBhcyBIVE1MRWxlbWVudDtcbiAgd2hpbGUgKG5leHRFbGVtZW50KSB7XG4gICAgcGF0Y2hFbGVtZW50RWZmZWN0KG5leHRFbGVtZW50LCBpZnJhbWVXaW5kb3cpO1xuICAgIGNvbnN0IHJlbGF0aXZlQXR0ciA9IHJlbGF0aXZlRWxlbWVudFRhZ0F0dHJNYXBbbmV4dEVsZW1lbnQudGFnTmFtZV07XG4gICAgY29uc3QgdXJsID0gbmV4dEVsZW1lbnRbcmVsYXRpdmVBdHRyXTtcbiAgICBpZiAocmVsYXRpdmVBdHRyKSBuZXh0RWxlbWVudC5zZXRBdHRyaWJ1dGUocmVsYXRpdmVBdHRyLCBnZXRBYnNvbHV0ZVBhdGgodXJsLCBuZXh0RWxlbWVudC5iYXNlVVJJIHx8IFwiXCIpKTtcbiAgICBuZXh0RWxlbWVudCA9IEVsZW1lbnRJdGVyYXRvci5uZXh0Tm9kZSgpIGFzIEhUTUxFbGVtZW50O1xuICB9XG4gIGlmICghaHRtbC5xdWVyeVNlbGVjdG9yKFwiaGVhZFwiKSkge1xuICAgIGNvbnN0IGhlYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaGVhZFwiKTtcbiAgICBodG1sLmFwcGVuZENoaWxkKGhlYWQpO1xuICB9XG4gIGlmICghaHRtbC5xdWVyeVNlbGVjdG9yKFwiYm9keVwiKSkge1xuICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYm9keVwiKTtcbiAgICBodG1sLmFwcGVuZENoaWxkKGJvZHkpO1xuICB9XG4gIHJldHVybiBodG1sO1xufVxuXG4vKipcbiAqIOWwhnRlbXBsYXRl5riy5p+T5Yiwc2hhZG93Um9vdFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyVGVtcGxhdGVUb1NoYWRvd1Jvb3QoXG4gIHNoYWRvd1Jvb3Q6IFNoYWRvd1Jvb3QsXG4gIGlmcmFtZVdpbmRvdzogV2luZG93LFxuICB0ZW1wbGF0ZTogc3RyaW5nXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgaHRtbCA9IHJlbmRlclRlbXBsYXRlVG9IdG1sKGlmcmFtZVdpbmRvdywgdGVtcGxhdGUpO1xuICAvLyDlpITnkIYgY3NzLWJlZm9yZS1sb2FkZXIg5ZKMIGNzcy1hZnRlci1sb2FkZXJcbiAgY29uc3QgcHJvY2Vzc2VkSHRtbCA9IGF3YWl0IHByb2Nlc3NDc3NMb2FkZXJGb3JUZW1wbGF0ZShpZnJhbWVXaW5kb3cuX19XVUpJRSwgaHRtbCk7XG4gIC8vIGNoYW5nZSBvd25lckRvY3VtZW50XG4gIHNoYWRvd1Jvb3QuYXBwZW5kQ2hpbGQocHJvY2Vzc2VkSHRtbCk7XG4gIGNvbnN0IHNoYWRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgc2hhZGUuc2V0QXR0cmlidXRlKFwic3R5bGVcIiwgV1VKSUVfU0hBREVfU1RZTEUpO1xuICBwcm9jZXNzZWRIdG1sLmluc2VydEJlZm9yZShzaGFkZSwgcHJvY2Vzc2VkSHRtbC5maXJzdENoaWxkKTtcbiAgc2hhZG93Um9vdC5oZWFkID0gc2hhZG93Um9vdC5xdWVyeVNlbGVjdG9yKFwiaGVhZFwiKTtcbiAgc2hhZG93Um9vdC5ib2R5ID0gc2hhZG93Um9vdC5xdWVyeVNlbGVjdG9yKFwiYm9keVwiKTtcblxuICBjb25zdCBzaGFkb3dIdG1sID0gc2hhZG93Um9vdC5maXJzdEVsZW1lbnRDaGlsZCBhcyBIVE1MRWxlbWVudDtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoc2hhZG93SHRtbCwge1xuICAgIC8vIOS/ruWkjSBodG1sIHBhcmVudE5vZGVcbiAgICBwYXJlbnROb2RlOiB7XG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZ2V0OiAoKSA9PiBpZnJhbWVXaW5kb3cuZG9jdW1lbnQsXG4gICAgfSxcblxuICAgIC8vIOS/ruWkjSBodG1sIGdldEJvdW5kaW5nQ2xpZW50UmVjdFxuICAgIGdldEJvdW5kaW5nQ2xpZW50UmVjdDoge1xuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiAoKSA9PlxuICAgICAgICBpZnJhbWVXaW5kb3cuX19XVUpJRV9SQVdfRE9DVU1FTlRfUVVFUllfU0VMRUNUT1JfXy5jYWxsKGlmcmFtZVdpbmRvdy5kb2N1bWVudCwgXCJodG1sXCIpIS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICB9LFxuICB9KTtcblxuICBwYXRjaFJlbmRlckVmZmVjdChzaGFkb3dSb290LCBpZnJhbWVXaW5kb3cuX19XVUpJRS5pZCwgZmFsc2UpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSWZyYW1lQ29udGFpbmVyKGlkOiBzdHJpbmcsIGRlZ3JhZGVBdHRyczogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IHt9KTogSFRNTElGcmFtZUVsZW1lbnQge1xuICBjb25zdCBpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaWZyYW1lXCIpO1xuICBjb25zdCBkZWZhdWx0U3R5bGUgPSBcImhlaWdodDoxMDAlO3dpZHRoOjEwMCVcIjtcbiAgc2V0QXR0cnNUb0VsZW1lbnQoaWZyYW1lLCB7XG4gICAgLi4uZGVncmFkZUF0dHJzLFxuICAgIHN0eWxlOiBbZGVmYXVsdFN0eWxlLCBkZWdyYWRlQXR0cnMuc3R5bGVdLmpvaW4oXCI7XCIpLFxuICAgIFtXVUpJRV9BUFBfSURdOiBpZCxcbiAgfSk7XG4gIHJldHVybiBpZnJhbWU7XG59XG5cbi8qKlxuICog5bCGdGVtcGxhdGXmuLLmn5PliLBpZnJhbWVcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlclRlbXBsYXRlVG9JZnJhbWUoXG4gIHJlbmRlckRvY3VtZW50OiBEb2N1bWVudCxcbiAgaWZyYW1lV2luZG93OiBXaW5kb3csXG4gIHRlbXBsYXRlOiBzdHJpbmdcbik6IFByb21pc2U8dm9pZD4ge1xuICAvLyDmj5LlhaV0ZW1wbGF0ZVxuICBjb25zdCBodG1sID0gcmVuZGVyVGVtcGxhdGVUb0h0bWwoaWZyYW1lV2luZG93LCB0ZW1wbGF0ZSk7XG4gIC8vIOWkhOeQhiBjc3MtYmVmb3JlLWxvYWRlciDlkowgY3NzLWFmdGVyLWxvYWRlclxuICBjb25zdCBwcm9jZXNzZWRIdG1sID0gYXdhaXQgcHJvY2Vzc0Nzc0xvYWRlckZvclRlbXBsYXRlKGlmcmFtZVdpbmRvdy5fX1dVSklFLCBodG1sKTtcbiAgcmVuZGVyRG9jdW1lbnQucmVwbGFjZUNoaWxkKHByb2Nlc3NlZEh0bWwsIHJlbmRlckRvY3VtZW50LmRvY3VtZW50RWxlbWVudCk7XG5cbiAgLy8g5L+u5aSNIGh0bWwgcGFyZW50Tm9kZVxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkocmVuZGVyRG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCBcInBhcmVudE5vZGVcIiwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGdldDogKCkgPT4gaWZyYW1lV2luZG93LmRvY3VtZW50LFxuICB9KTtcblxuICAvLyDpmY3nuqfmuLLmn5MgaWZyYW1lIOaXoCBzcmMg6KGl5LiB77yM6ZyA5LiOIEpTIGlmcmFtZSDkuIDmoLfms6jlhaUgYmFzZe+8jOS+myBpbWcg562J55u45a+56Lev5b6E6Kej5p6Q5Yiw5a2Q5bqU55So5Z+f5ZCNXG4gIGNvbnN0IHJlbmRlcldpbmRvdyA9IHJlbmRlckRvY3VtZW50LmRlZmF1bHRWaWV3O1xuICBpZiAocmVuZGVyV2luZG93KSB7XG4gICAgLy8g5a+55LqO6ZmN57qn5Zy65pmv5LiN6ZyA6KaB5re75YqgIHBhdGhcbiAgICBpbml0QmFzZShyZW5kZXJXaW5kb3csIGlmcmFtZVdpbmRvdy5fX1dVSklFLnVybCwgXCJcIik7XG4gICAgLy8g6ZmN57qn5qih5byP5YaF6IGU5LqL5Lu26L+Q6KGM5Zyo5riy5p+TIGlmcmFtZSByZWFsbe+8jOmcgOaKiui+heWKqeWHveaVsOazqOWFpeWIsOivpSB3aW5kb3fvvIxcbiAgICAvLyDkvb/nvJbor5HlkI7nmoQgd2l0aCh3aW5kb3cuX19nZXRXdWppZVdpbmRvd19fKC4uLikpIOWPr+iwg+eUqO+8iOWFtuWGhemDqOS8muWQkSBwYXJlbnQuZG9jdW1lbnQg5p+l5om+5rKZ566xIGlmcmFtZe+8iVxuICAgIChyZW5kZXJXaW5kb3cgYXMgYW55KS5fX2dldFd1amllV2luZG93X18gPSAod2luZG93IGFzIGFueSkuX19nZXRXdWppZVdpbmRvd19fO1xuICB9XG5cbiAgcGF0Y2hSZW5kZXJFZmZlY3QocmVuZGVyRG9jdW1lbnQsIGlmcmFtZVdpbmRvdy5fX1dVSklFLmlkLCB0cnVlKTtcbn1cblxuLyoqXG4gKiDmuIXpmaRFbGVtZW505omA5pyJ6IqC54K5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhckNoaWxkKHJvb3Q6IFNoYWRvd1Jvb3QgfCBOb2RlKTogdm9pZCB7XG4gIC8vIOa4hemZpOWGheWuuVxuICB3aGlsZSAocm9vdD8uZmlyc3RDaGlsZCkge1xuICAgIHJhd0VsZW1lbnRSZW1vdmVDaGlsZC5jYWxsKHJvb3QsIHJvb3QuZmlyc3RDaGlsZCk7XG4gIH1cbn1cblxuLyoqXG4gKiDnu5nlrrnlmajmt7vliqBsb2FkaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRMb2FkaW5nKGVsOiBzdHJpbmcgfCBIVE1MRWxlbWVudCwgbG9hZGluZzogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgY29uc3QgY29udGFpbmVyID0gZ2V0Q29udGFpbmVyKGVsKTtcbiAgY2xlYXJDaGlsZChjb250YWluZXIpO1xuICAvLyDnu5nlrrnlmajorr7nva7kuIDkupvmoLflvI/vvIzpmLLmraIgbG9hZGluZyDmipbliqhcbiAgbGV0IGNvbnRhaW5lclN0eWxlcyA9IG51bGw7XG4gIHRyeSB7XG4gICAgY29udGFpbmVyU3R5bGVzID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoY29udGFpbmVyKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChjb250YWluZXJTdHlsZXMucG9zaXRpb24gPT09IFwic3RhdGljXCIpIHtcbiAgICBjb250YWluZXIuc2V0QXR0cmlidXRlKENPTlRBSU5FUl9QT1NJVElPTl9EQVRBX0ZMQUcsIGNvbnRhaW5lclN0eWxlcy5wb3NpdGlvbik7XG4gICAgY29udGFpbmVyLnNldEF0dHJpYnV0ZShcbiAgICAgIENPTlRBSU5FUl9PVkVSRkxPV19EQVRBX0ZMQUcsXG4gICAgICBjb250YWluZXJTdHlsZXMub3ZlcmZsb3cgPT09IFwidmlzaWJsZVwiID8gXCJcIiA6IGNvbnRhaW5lclN0eWxlcy5vdmVyZmxvd1xuICAgICk7XG4gICAgY29udGFpbmVyLnN0eWxlLnNldFByb3BlcnR5KFwicG9zaXRpb25cIiwgXCJyZWxhdGl2ZVwiKTtcbiAgICBjb250YWluZXIuc3R5bGUuc2V0UHJvcGVydHkoXCJvdmVyZmxvd1wiLCBcImhpZGRlblwiKTtcbiAgfSBlbHNlIGlmIChbXCJyZWxhdGl2ZVwiLCBcInN0aWNreVwiXS5pbmNsdWRlcyhjb250YWluZXJTdHlsZXMucG9zaXRpb24pKSB7XG4gICAgY29udGFpbmVyLnNldEF0dHJpYnV0ZShcbiAgICAgIENPTlRBSU5FUl9PVkVSRkxPV19EQVRBX0ZMQUcsXG4gICAgICBjb250YWluZXJTdHlsZXMub3ZlcmZsb3cgPT09IFwidmlzaWJsZVwiID8gXCJcIiA6IGNvbnRhaW5lclN0eWxlcy5vdmVyZmxvd1xuICAgICk7XG4gICAgY29udGFpbmVyLnN0eWxlLnNldFByb3BlcnR5KFwib3ZlcmZsb3dcIiwgXCJoaWRkZW5cIik7XG4gIH1cbiAgY29uc3QgbG9hZGluZ0NvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGxvYWRpbmdDb250YWluZXIuc2V0QXR0cmlidXRlKExPQURJTkdfREFUQV9GTEFHLCBcIlwiKTtcbiAgbG9hZGluZ0NvbnRhaW5lci5zZXRBdHRyaWJ1dGUoXCJzdHlsZVwiLCBXVUpJRV9MT0FESU5HX1NUWUxFKTtcbiAgaWYgKGxvYWRpbmcpIGxvYWRpbmdDb250YWluZXIuYXBwZW5kQ2hpbGQobG9hZGluZyk7XG4gIGVsc2UgbG9hZGluZ0NvbnRhaW5lci5pbm5lckhUTUwgPSBXVUpJRV9MT0FESU5HX1NWRztcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKGxvYWRpbmdDb250YWluZXIpO1xufVxuLyoqXG4gKiDnp7vpmaRsb2FkaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVMb2FkaW5nKGVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAvLyDljrvpmaTlrrnlmajorr7nva7nmoTmoLflvI9cbiAgY29uc3QgcG9zaXRpb25GbGFnID0gZWwuZ2V0QXR0cmlidXRlKENPTlRBSU5FUl9QT1NJVElPTl9EQVRBX0ZMQUcpO1xuICBjb25zdCBvdmVyZmxvd0ZsYWcgPSBlbC5nZXRBdHRyaWJ1dGUoQ09OVEFJTkVSX09WRVJGTE9XX0RBVEFfRkxBRyk7XG4gIGlmIChwb3NpdGlvbkZsYWcpIGVsLnN0eWxlLnJlbW92ZVByb3BlcnR5KFwicG9zaXRpb25cIik7XG4gIGlmIChvdmVyZmxvd0ZsYWcgIT09IG51bGwpIHtcbiAgICBvdmVyZmxvd0ZsYWcgPyBlbC5zdHlsZS5zZXRQcm9wZXJ0eShcIm92ZXJmbG93XCIsIG92ZXJmbG93RmxhZykgOiBlbC5zdHlsZS5yZW1vdmVQcm9wZXJ0eShcIm92ZXJmbG93XCIpO1xuICB9XG4gIGVsLnJlbW92ZUF0dHJpYnV0ZShDT05UQUlORVJfUE9TSVRJT05fREFUQV9GTEFHKTtcbiAgZWwucmVtb3ZlQXR0cmlidXRlKENPTlRBSU5FUl9PVkVSRkxPV19EQVRBX0ZMQUcpO1xuICBjb25zdCBsb2FkaW5nQ29udGFpbmVyID0gZWwucXVlcnlTZWxlY3RvcihgZGl2WyR7TE9BRElOR19EQVRBX0ZMQUd9XWApO1xuICBsb2FkaW5nQ29udGFpbmVyICYmIGVsLnJlbW92ZUNoaWxkKGxvYWRpbmdDb250YWluZXIpO1xufVxuLyoqXG4gKiDojrflj5bkv67lpI3lpb3nmoTmoLflvI/lhYPntKBcbiAqIOS4u+imgeaYr+mSiOWvueWvuXJvb3TmoLflvI/lkoxmb250LWZhY2XmoLflvI9cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhdGNoU3R5bGVFbGVtZW50cyhyb290U3R5bGVTaGVldHM6IEFycmF5PENTU1N0eWxlU2hlZXQ+KTogQXJyYXk8SFRNTFN0eWxlRWxlbWVudCB8IG51bGw+IHtcbiAgY29uc3Qgcm9vdENzc1J1bGVzID0gW107XG4gIGNvbnN0IGZvbnRDc3NSdWxlcyA9IFtdO1xuICBjb25zdCByb290U3R5bGVSZWcgPSAvOnJvb3QvZztcblxuICAvLyDmib7lh7pyb29055qEY3NzUnVsZXNcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCByb290U3R5bGVTaGVldHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjc3NSdWxlcyA9IHJvb3RTdHlsZVNoZWV0c1tpXT8uY3NzUnVsZXMgPz8gW107XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBjc3NSdWxlcy5sZW5ndGg7IGorKykge1xuICAgICAgY29uc3QgY3NzUnVsZVRleHQgPSBjc3NSdWxlc1tqXS5jc3NUZXh0O1xuICAgICAgLy8g5aaC5p6c5pivcm9vdOeahGNzc1J1bGVcbiAgICAgIGlmIChyb290U3R5bGVSZWcudGVzdChjc3NSdWxlVGV4dCkpIHtcbiAgICAgICAgcm9vdENzc1J1bGVzLnB1c2goY3NzUnVsZVRleHQucmVwbGFjZShyb290U3R5bGVSZWcsIChtYXRjaCkgPT4gY3NzU2VsZWN0b3JNYXBbbWF0Y2hdKSk7XG4gICAgICB9XG4gICAgICAvLyDlpoLmnpzmmK9mb250LWZhY2XnmoRjc3NSdWxlXG4gICAgICBpZiAoY3NzUnVsZXNbal0udHlwZSA9PT0gQ1NTUnVsZS5GT05UX0ZBQ0VfUlVMRSkge1xuICAgICAgICBmb250Q3NzUnVsZXMucHVzaChjc3NSdWxlVGV4dCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbGV0IHJvb3RTdHlsZVNoZWV0RWxlbWVudCA9IG51bGw7XG4gIGxldCBmb250U3R5bGVTaGVldEVsZW1lbnQgPSBudWxsO1xuXG4gIC8vIOWkjeWItuWIsGhvc3TkuIpcbiAgaWYgKHJvb3RDc3NSdWxlcy5sZW5ndGgpIHtcbiAgICByb290U3R5bGVTaGVldEVsZW1lbnQgPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICAgIHJvb3RTdHlsZVNoZWV0RWxlbWVudC5pbm5lckhUTUwgPSByb290Q3NzUnVsZXMuam9pbihcIlwiKTtcbiAgfVxuXG4gIGlmIChmb250Q3NzUnVsZXMubGVuZ3RoKSB7XG4gICAgZm9udFN0eWxlU2hlZXRFbGVtZW50ID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICBmb250U3R5bGVTaGVldEVsZW1lbnQuaW5uZXJIVE1MID0gZm9udENzc1J1bGVzLmpvaW4oXCJcIik7XG4gIH1cblxuICByZXR1cm4gW3Jvb3RTdHlsZVNoZWV0RWxlbWVudCwgZm9udFN0eWxlU2hlZXRFbGVtZW50XTtcbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUFBLFNBQ0VBLFlBQVksRUFDWkMsa0JBQWtCLEVBQ2xCQyxpQkFBaUIsRUFDakJDLDRCQUE0QixFQUM1QkMsNEJBQTRCLEVBQzVCQyxpQkFBaUIsRUFDakJDLG1CQUFtQixFQUNuQkMsaUJBQWlCLFFBQ1osWUFBWTtBQUNuQixTQUNFQyxZQUFZLEVBQ1pDLGNBQWMsRUFDZEMscUJBQXFCLEVBQ3JCQyxxQkFBcUIsRUFDckJDLHlCQUF5QixRQUNwQixVQUFVO0FBQ2pCLFNBQVNDLHNCQUFzQixRQUFRLFNBQVM7QUFFaEQsU0FBU0MsUUFBUSxFQUFFQyxrQkFBa0IsUUFBUSxVQUFVO0FBQ3ZELFNBQVNDLGlCQUFpQixRQUFRLFVBQVU7QUFDNUMsU0FBU0MsWUFBWSxFQUFFQyxnQkFBZ0IsUUFBUSxVQUFVO0FBQ3pELFNBQVNDLGVBQWUsRUFBRUMsWUFBWSxFQUFFQyxTQUFTLEVBQUVDLFVBQVUsRUFBRUMsaUJBQWlCLFFBQVEsU0FBUztBQUVqRyxJQUFNQyxjQUFjLEdBQUc7RUFD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