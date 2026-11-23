/**
 * 单元测试：子应用里 <iframe src> 的相对地址必须改写到子应用域名。
 *
 * 元素渲染在主应用的 shadow DOM 里，浏览器按主应用文档的 base 解析相对地址：
 * 不改写的话 <iframe src="/page"> 会在子应用里嵌进**主应用的**页面。
 */

export {};

import { fixElementCtrSrcOrHref, fixInnerHTMLRelativeSrc } from "../../src/utils";

const APP_BASE = "https://sub.example.com/app/";

function setupIframe(): any {
  document.body.innerHTML = "";
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  const iframeWindow: any = iframe.contentWindow;
  const base = iframeWindow.document.createElement("base");
  base.setAttribute("href", APP_BASE);
  iframeWindow.document.head.appendChild(base);
  iframeWindow.__WUJIE = { id: "app", degrade: false, shadowRoot: document.createElement("div") };
  // 与 iframe.ts 中 initBase 的接线保持一致
  fixElementCtrSrcOrHref(iframeWindow, iframeWindow.HTMLIFrameElement, "src");
  fixInnerHTMLRelativeSrc(iframeWindow);
  return iframeWindow;
}

describe("iframe 的 src 相对地址", () => {
  it("iframe.src 属性赋值改写成子应用域名", () => {
    const iframeWindow = setupIframe();
    const inner = iframeWindow.document.createElement("iframe");

    inner.src = "/page";

    // 根相对路径按原生语义落在 origin 根，不属于子应用 base 之下
    expect(inner.getAttribute("src")).toBe("https://sub.example.com/page");
  });

  it("iframe 的 setAttribute('src') 改写成子应用域名", () => {
    const iframeWindow = setupIframe();
    const inner = iframeWindow.document.createElement("iframe");

    inner.setAttribute("src", "./detail");

    expect(inner.getAttribute("src")).toBe(`${APP_BASE}detail`);
  });

  it("innerHTML 里的 <iframe src> 改写成子应用域名", () => {
    const iframeWindow = setupIframe();
    const box = iframeWindow.document.createElement("div");

    box.innerHTML = '<iframe src="/embed"></iframe>';

    expect(box.querySelector("iframe").getAttribute("src")).toBe("https://sub.example.com/embed");
  });

  it("上级目录相对地址按原生语义解析", () => {
    const iframeWindow = setupIframe();
    const inner = iframeWindow.document.createElement("iframe");

    inner.setAttribute("src", "../up");

    expect(inner.getAttribute("src")).toBe("https://sub.example.com/up");
  });

  it("绝对地址不受影响", () => {
    const iframeWindow = setupIframe();
    const inner = iframeWindow.document.createElement("iframe");

    inner.src = "https://other.example.com/x";

    expect(inner.getAttribute("src")).toBe("https://other.example.com/x");
  });
});
