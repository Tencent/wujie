import {
  WUJIE_DATA_ID,
  WUJIE_IFRAME_CLASS,
  WUJIE_SHADE_STYLE,
  CONTAINER_POSITION_DATA_FLAG,
  CONTAINER_OVERFLOW_DATA_FLAG,
  LOADING_DATA_FLAG,
  WUJIE_LOADING_STYLE,
  WUJIE_LOADING_SVG,
} from "./constant";
import {
  getWujieById,
  rawAppendChild,
  rawElementAppendChild,
  rawElementRemoveChild,
  relativeElementTagAttrMap,
} from "./common";
import { getExternalStyleSheets } from "./entry";
import Wujie from "./sandbox";
import { patchElementEffect } from "./iframe";
import { patchRenderEffect } from "./effect";
import { getCssLoader, getPresetLoaders } from "./plugin";
import { getAbsolutePath, getContainer, getCurUrl } from "./utils";

const cssSelectorMap = {
  ":root": ":host",
};

declare global {
  interface ShadowRoot {
    head: HTMLHeadElement;
    body: HTMLBodyElement;
  }
}

/**
 * 制作webComponent沙箱
 */
class WujieApp extends HTMLElement {
  connectedCallback(): void {
    if (this.shadowRoot) return;
    const shadowRoot = this.attachShadow({ mode: "open" });
    const sandbox = getWujieById(this.getAttribute(WUJIE_DATA_ID));
    patchElementEffect(shadowRoot, sandbox.iframe.contentWindow);
    sandbox.shadowRoot = shadowRoot;
  }

  disconnectedCallback(): void {
    const sandbox = getWujieById(this.getAttribute(WUJIE_DATA_ID));
    sandbox?.unmount();
  }
}

/**
 * 定义 wujie webComponent，将shadow包裹并获得dom装载和卸载的生命周期
 */
export function defineWujieWebComponent() {
  if (!customElements.get("wujie-app")) {
    customElements.define("wujie-app", WujieApp);
  }
}

export function createWujieWebComponent(id: string): HTMLElement {
  const contentElement = window.document.createElement("wujie-app");
  contentElement.setAttribute(WUJIE_DATA_ID, id);
  contentElement.classList.add(WUJIE_IFRAME_CLASS);
  return contentElement;
}

/**
 * 将准备好的内容插入容器
 */
export function renderElementToContainer(element: Element, selectorOrElement: string | HTMLElement): HTMLElement {
  const container = getContainer(selectorOrElement);
  if (container && !container.contains(element)) {
    // 有 loading 无需清理，已经清理过了
    if (!container.querySelector(`div[${LOADING_DATA_FLAG}]`)) {
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
 * 处理css-before-loader 以及 css-after-loader
 */
async function processCssLoaderForTemplate(sandbox: Wujie, html: HTMLHtmlElement): Promise<HTMLHtmlElement> {
  const document = sandbox.iframe.contentDocument;
  const { plugins, replace, proxyLocation } = sandbox;
  const cssLoader = getCssLoader({ plugins, replace });
  const cssBeforeLoaders = getPresetLoaders("cssBeforeLoaders", plugins);
  const cssAfterLoaders = getPresetLoaders("cssAfterLoaders", plugins);
  const curUrl = getCurUrl(proxyLocation);

  return await Promise.all([
    Promise.all(
      getExternalStyleSheets(cssBeforeLoaders, sandbox.fetch, sandbox.lifecycles.loadError).map(
        ({ src, contentPromise }) => contentPromise.then((content) => ({ src, content }))
      )
    ).then((contentList) => {
      contentList.forEach(({ src, content }) => {
        if (!content) return;
        const styleElement = document.createElement("style");
        styleElement.setAttribute("type", "text/css");
        styleElement.appendChild(document.createTextNode(content ? cssLoader(content, src, curUrl) : content));
        const head = html.querySelector("head");
        const body = html.querySelector("body");
        html.insertBefore(styleElement, head || body || html.firstChild);
      });
    }),
    Promise.all(
      getExternalStyleSheets(cssAfterLoaders, sandbox.fetch, sandbox.lifecycles.loadError).map(
        ({ src, contentPromise }) => contentPromise.then((content) => ({ src, content }))
      )
    ).then((contentList) => {
      contentList.forEach(({ src, content }) => {
        if (!content) return;
        const styleElement = document.createElement("style");
        styleElement.setAttribute("type", "text/css");
        styleElement.appendChild(document.createTextNode(content ? cssLoader(content, src, curUrl) : content));
        html.appendChild(styleElement);
      });
    }),
  ]).then(
    () => html,
    () => html
  );
}

// 替换html的head和body
function replaceHeadAndBody(html: HTMLHtmlElement, head: HTMLHeadElement, body: HTMLBodyElement): HTMLHtmlElement {
  const headElement = html.querySelector("head");
  const bodyElement = html.querySelector("body");
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
function renderTemplateToHtml(iframeWindow: Window, template: string): HTMLHtmlElement {
  const sandbox = iframeWindow.__WUJIE;
  const { head, body, alive, execFlag } = sandbox;
  const document = iframeWindow.document;
  let html = document.createElement("html");
  html.innerHTML = template;
  // 组件多次渲染，head和body必须一直使用同一个来应对被缓存的场景
  if (!alive && execFlag) {
    html = replaceHeadAndBody(html, head, body);
  } else {
    sandbox.head = html.querySelector("head");
    sandbox.body = html.querySelector("body");
  }
  const ElementIterator = document.createTreeWalker(html, NodeFilter.SHOW_ELEMENT);
  let nextElement = ElementIterator.currentNode as HTMLElement;
  while (nextElement) {
    patchElementEffect(nextElement, iframeWindow);
    const relativeAttr = relativeElementTagAttrMap[nextElement.tagName];
    const url = nextElement[relativeAttr];
    if (relativeAttr) nextElement.setAttribute(relativeAttr, getAbsolutePath(url, nextElement.baseURI || ""));
    nextElement = ElementIterator.nextNode() as HTMLElement;
  }
  if (!html.querySelector("head")) {
    const head = document.createElement("head");
    html.appendChild(head);
  }
  if (!html.querySelector("body")) {
    const body = document.createElement("body");
    html.appendChild(body);
  }
  return html;
}

/**
 * 将template渲染到shadowRoot
 */
export async function renderTemplateToShadowRoot(
  shadowRoot: ShadowRoot,
  iframeWindow: Window,
  template: string
): Promise<void> {
  const html = renderTemplateToHtml(iframeWindow, template);
  // 处理 css-before-loader 和 css-after-loader
  const processedHtml = await processCssLoaderForTemplate(iframeWindow.__WUJIE, html);
  // change ownerDocument
  shadowRoot.appendChild(processedHtml);
  const shade = document.createElement("div");
  shade.setAttribute("style", WUJIE_SHADE_STYLE);
  processedHtml.insertBefore(shade, processedHtml.firstChild);
  shadowRoot.head = shadowRoot.querySelector("head");
  shadowRoot.body = shadowRoot.querySelector("body");

  // 修复 html parentNode
  Object.defineProperty(shadowRoot.firstChild, "parentNode", {
    enumerable: true,
    configurable: true,
    get: () => iframeWindow.document,
  });

  patchRenderEffect(shadowRoot, iframeWindow.__WUJIE.id, false);
}

export function createIframeContainer(id: string): HTMLIFrameElement {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("style", "width: 100%; height:100%");
  iframe.setAttribute(WUJIE_DATA_ID, id);
  return iframe;
}

/**
 * 将template渲染到iframe
 */
export async function renderTemplateToIframe(
  renderDocument: Document,
  iframeWindow: Window,
  template: string
): Promise<void> {
  // 清除iframe
  clearChild(renderDocument);
  // 插入template
  const html = renderTemplateToHtml(iframeWindow, template);
  // 处理 css-before-loader 和 css-after-loader
  const processedHtml = await processCssLoaderForTemplate(iframeWindow.__WUJIE, html);
  renderDocument.appendChild(processedHtml);

  // 修复 html parentNode
  Object.defineProperty(renderDocument.firstElementChild, "parentNode", {
    enumerable: true,
    configurable: true,
    get: () => iframeWindow.document,
  });

  patchRenderEffect(renderDocument, iframeWindow.__WUJIE.id, true);
}

/**
 * 清除Element所有节点
 */
export function clearChild(root: ShadowRoot | Node): void {
  // 清除内容
  while (root?.firstChild) {
    rawElementRemoveChild.call(root, root.firstChild);
  }
}

/**
 * 给容器添加loading
 */
export function addLoading(el: string | HTMLElement, loading: HTMLElement): void {
  const container = getContainer(el);
  clearChild(container);
  // 给容器设置一些样式，防止 loading 抖动
  const containerStyles = window.getComputedStyle(container);
  if (containerStyles.position === "static") {
    container.setAttribute(CONTAINER_POSITION_DATA_FLAG, containerStyles.position);
    container.setAttribute(
      CONTAINER_OVERFLOW_DATA_FLAG,
      containerStyles.overflow === "visible" ? "" : containerStyles.overflow
    );
    container.style.setProperty("position", "relative");
    container.style.setProperty("overflow", "hidden");
  } else if (["relative", "sticky"].includes(containerStyles.position)) {
    container.setAttribute(
      CONTAINER_OVERFLOW_DATA_FLAG,
      containerStyles.overflow === "visible" ? "" : containerStyles.overflow
    );
    container.style.setProperty("overflow", "hidden");
  }
  const loadingContainer = document.createElement("div");
  loadingContainer.setAttribute(LOADING_DATA_FLAG, "");
  loadingContainer.setAttribute("style", WUJIE_LOADING_STYLE);
  if (loading) loadingContainer.appendChild(loading);
  else loadingContainer.innerHTML = WUJIE_LOADING_SVG;
  container.appendChild(loadingContainer);
}
/**
 * 移除loading
 */
export function removeLoading(el: HTMLElement): void {
  // 去除容器设置的样式
  const positionFlag = el.getAttribute(CONTAINER_POSITION_DATA_FLAG);
  const overflowFlag = el.getAttribute(CONTAINER_OVERFLOW_DATA_FLAG);
  if (positionFlag) el.style.removeProperty("position");
  if (overflowFlag !== null) {
    overflowFlag ? el.style.setProperty("overflow", overflowFlag) : el.style.removeProperty("overflow");
  }
  el.removeAttribute(CONTAINER_POSITION_DATA_FLAG);
  el.removeAttribute(CONTAINER_OVERFLOW_DATA_FLAG);
  const loadingContainer = el.querySelector(`div[${LOADING_DATA_FLAG}]`);
  loadingContainer && el.removeChild(loadingContainer);
}
/**
 * 获取修复好的样式元素
 * 主要是针对对root样式和font-face样式
 */
export function getPatchStyleElements(rootStyleSheets: Array<CSSStyleSheet>): Array<HTMLStyleElement | null> {
  const rootCssRules = [];
  const fontCssRules = [];
  const rootStyleReg = /:root/g;

  // 找出root的cssRules
  for (let i = 0; i < rootStyleSheets.length; i++) {
    const cssRules = rootStyleSheets[i]?.cssRules ?? [];
    for (let j = 0; j < cssRules.length; j++) {
      const cssRuleText = cssRules[j].cssText;
      // 如果是root的cssRule
      if (rootStyleReg.test(cssRuleText)) {
        rootCssRules.push(cssRuleText.replace(rootStyleReg, (match) => cssSelectorMap[match]));
      }
      // 如果是font-face的cssRule
      if (cssRules[j].type === CSSRule.FONT_FACE_RULE) {
        fontCssRules.push(cssRuleText);
      }
    }
  }

  let rootStyleSheetElement = null;
  let fontStyleSheetElement = null;

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
