import Wujie from "./sandbox";

// 全部无界实例存储map
export const idToSandboxMap = window.__POWERED_BY_WUJIE__
  ? window.__WUJIE.inject.idToSandboxMap
  : new Map<String, Wujie>();

export function getSandboxById(id: String): Wujie | null {
  return idToSandboxMap.get(id) || null;
}

export function addSandboxIdMap(id: string, sandbox: Wujie) {
  idToSandboxMap.set(id, sandbox);
}

export function deleteSandboxIdMap(id: string) {
  idToSandboxMap.delete(id);
}

// 分类document上需要处理的属性，不同类型会进入不同的处理逻辑
export const documentProxyProperties = {
  // 降级场景下需要本地特殊处理的属性
  modifyLocalProperties: ["createElement", "createTextNode", "documentURI", "URL", "getElementsByTagName"],

  // 子应用需要手动修正的属性方法
  modifyProperties: [
    "createElement",
    "createTextNode",
    "documentURI",
    "URL",
    "getElementsByTagName",
    "getElementsByClassName",
    "getElementsByName",
    "getElementById",
    "querySelector",
    "querySelectorAll",
    "documentElement",
    "scrollingElement",
    "forms",
    "images",
    "links",
  ],

  // 需要从shadowRoot中获取的属性
  shadowProperties: [
    "activeElement",
    "childElementCount",
    "children",
    "firstElementChild",
    "firstChild",
    "fullscreenElement",
    "lastElementChild",
    "pictureInPictureElement",
    "pointerLockElement",
    "styleSheets",
  ],

  // 需要从shadowRoot中获取的方法
  shadowMethods: [
    "append",
    "contains",
    "getSelection",
    "elementFromPoint",
    "elementsFromPoint",
    "getAnimations",
    "replaceChildren",
  ],

  // 需要从主应用document中获取的属性
  documentProperties: [
    "characterSet",
    "compatMode",
    "contentType",
    "designMode",
    "dir",
    "doctype",
    "embeds",
    "fullscreenEnabled",
    "hidden",
    "implementation",
    "lastModified",
    "pictureInPictureEnabled",
    "plugins",
    "readyState",
    "referrer",
    "visibilityState",
    "fonts",
  ],

  // 需要从主应用document中获取的方法
  documentMethods: [
    "execCommand",
    "createRange",
    "exitFullscreen",
    "exitPictureInPicture",
    "getElementsByTagNameNS",
    "hasFocus",
    "prepend",
  ],

  // 需要从主应用document中获取的事件
  documentEvents: [
    "onreadystatechange",
    "onpointerlockchange",
    "onpointerlockerror",
    "onbeforecopy",
    "onbeforecut",
    "onbeforepaste",
    "onfreeze",
    "onresume",
    "onsearch",
    "onfullscreenchange",
    "onfullscreenerror",
    "onsecuritypolicyviolation",
    "onvisibilitychange",
  ],

  // 无需修改原型的属性
  ownerProperties: ["head", "body"],
};

// 需要挂载到主应用document上的事件
export const documentAddEventListenerEvents = [
  "DOMContentLoaded",
  "fullscreenchange",
  "fullscreenerror",
  "readystatechange",
  "scroll",
  "selectionchange",
  "visibilitychange",
  "wheel",
];

// 需要同时挂载到主应用document和shadow上的事件（互斥）
export const rootAddEventListenerEvents = ["gotpointercapture", "lostpointercapture"];

export const iframeAddEventListenerEvents = ["hashchange", "popstate"];

// 相对路径问题元素的tag和attr的map
export const relativeElementTagAttrMap = {
  IMG: "src",
  A: "href",
  SOURCE: "src",
};

// 需要单独处理的window属性
export const windowProxyProperties = ["getComputedStyle", "visualViewport", "matchMedia", "DOMParser"];

// window白名单
export const windowRegWhiteList = [
  /animationFrame$/i,
  /resizeObserver$|mutationObserver$|intersectionObserver$/i,
  /height$|width$|left$/i,
  /^screen/i,
  /X$|Y$/,
];

// 保存原型方法
export const rawElementAppendChild = HTMLElement.prototype.appendChild;
export const rawElementRemoveChild = HTMLElement.prototype.removeChild;
export const rawHeadInsertBefore = HTMLHeadElement.prototype.insertBefore;
export const rawBodyInsertBefore = HTMLBodyElement.prototype.insertBefore;
export const rawAddEventListener = EventTarget.prototype.addEventListener;
export const rawRemoveEventListener = EventTarget.prototype.removeEventListener;
export const rawAppendChild = Node.prototype.appendChild;
export const rawDocumentQuerySelector = window.__POWERED_BY_WUJIE__
  ? window.__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__
  : Document.prototype.querySelector;
