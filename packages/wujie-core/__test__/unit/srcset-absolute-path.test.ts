/**
 * 单元测试：子应用里 img / source 的 srcset 与 video 的 poster，相对地址必须改写到子应用域名。
 *
 * 元素最终渲染在主应用的 shadow DOM 里，浏览器解析相对地址用的是**主应用文档**的 base，
 * 所以 src 一直被 fixElementCtrSrcOrHref / fixInnerHTMLRelativeSrc 改写成绝对地址；
 * 但 srcset（<picture> 的唯一用法）和 poster 从来没有被处理过。
 */

export {};

import { fixElementCtrSrcOrHref, fixInnerHTMLRelativeSrc, getAbsoluteSrcset } from "../../src/utils";

const APP_BASE = "https://sub.example.com/app/";

function setupIframe(): any {
  document.body.innerHTML = "";
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  const iframeWindow: any = iframe.contentWindow;
  // baseURI 取子应用地址，模拟子应用已被 wujie 接管
  const base = iframeWindow.document.createElement("base");
  base.setAttribute("href", APP_BASE);
  iframeWindow.document.head.appendChild(base);
  iframeWindow.__WUJIE = { id: "app", degrade: false, shadowRoot: document.createElement("div") };
  // 与 iframe.ts 中 initBase 的接线保持一致
  fixElementCtrSrcOrHref(iframeWindow, iframeWindow.HTMLImageElement, "src");
  fixElementCtrSrcOrHref(iframeWindow, iframeWindow.HTMLImageElement, "srcset", getAbsoluteSrcset);
  fixElementCtrSrcOrHref(iframeWindow, iframeWindow.HTMLSourceElement, "src");
  fixElementCtrSrcOrHref(iframeWindow, iframeWindow.HTMLSourceElement, "srcset", getAbsoluteSrcset);
  fixElementCtrSrcOrHref(iframeWindow, iframeWindow.HTMLVideoElement, "poster");
  fixInnerHTMLRelativeSrc(iframeWindow);
  return iframeWindow;
}

describe("getAbsoluteSrcset", () => {
  const base = APP_BASE;

  it("单个候选没有描述符", () => {
    expect(getAbsoluteSrcset("a.png", base)).toBe(`${base}a.png`);
  });

  it("多个候选带描述符", () => {
    expect(getAbsoluteSrcset("a.png 1x, b.png 2x", base)).toBe(`${base}a.png 1x, ${base}b.png 2x`);
  });

  it("逗号后没有空格也能拆开", () => {
    expect(getAbsoluteSrcset("a.png,b.png 2x", base)).toBe(`${base}a.png, ${base}b.png 2x`);
  });

  it("绝对地址原样保留", () => {
    expect(getAbsoluteSrcset("https://cdn.example.com/a.png 2x", base)).toBe("https://cdn.example.com/a.png 2x");
  });

  it("data: URI 里的逗号不当作候选分隔符", () => {
    const dataUri = "data:image/png;base64,AAAA";
    expect(getAbsoluteSrcset(`${dataUri} 1x, b.png 2x`, base)).toBe(`${dataUri} 1x, ${base}b.png 2x`);
  });

  it("空值与多余逗号", () => {
    expect(getAbsoluteSrcset("", base)).toBe("");
    expect(getAbsoluteSrcset(" , ", base)).toBe("");
    expect(getAbsoluteSrcset("a.png,", base)).toBe(`${base}a.png`);
  });
});

describe("srcset 相对地址", () => {
  it("img.setAttribute('srcset') 改写成子应用域名", () => {
    const iframeWindow = setupIframe();
    const img = iframeWindow.document.createElement("img");

    img.setAttribute("srcset", "a.png 1x, b.png 2x");

    expect(img.getAttribute("srcset")).toBe(`${APP_BASE}a.png 1x, ${APP_BASE}b.png 2x`);
  });

  it("innerHTML 里的 <source srcset> 改写成子应用域名", () => {
    const iframeWindow = setupIframe();
    const box = iframeWindow.document.createElement("div");

    box.innerHTML = '<picture><source srcset="a.webp 1x"><img src="a.png"></picture>';

    const source = box.querySelector("source");
    expect(source.getAttribute("srcset")).toBe(`${APP_BASE}a.webp 1x`);
  });

  it("没有 src 只有 srcset 的 html 也要处理", () => {
    const iframeWindow = setupIframe();
    const box = iframeWindow.document.createElement("div");

    box.innerHTML = '<img srcset="only.png 2x">';

    expect(box.querySelector("img").getAttribute("srcset")).toBe(`${APP_BASE}only.png 2x`);
  });

  it("img.srcset 属性赋值改写成子应用域名", () => {
    const iframeWindow = setupIframe();
    const img = iframeWindow.document.createElement("img");

    img.srcset = "c.png 1x, d.png 2x";

    expect(img.getAttribute("srcset")).toBe(`${APP_BASE}c.png 1x, ${APP_BASE}d.png 2x`);
  });

  it("video.poster 属性赋值改写成子应用域名", () => {
    const iframeWindow = setupIframe();
    const video = iframeWindow.document.createElement("video");

    video.poster = "cover.jpg";

    expect(video.getAttribute("poster")).toBe(`${APP_BASE}cover.jpg`);
  });

  it("video 的 poster 改写成子应用域名", () => {
    const iframeWindow = setupIframe();
    const box = iframeWindow.document.createElement("div");

    box.innerHTML = '<video poster="cover.jpg"></video>';

    expect(box.querySelector("video").getAttribute("poster")).toBe(`${APP_BASE}cover.jpg`);
  });
});
