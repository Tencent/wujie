/**
 * 入口 HTML 已将 CSS 转成 style 后，动态再插入同 href 的 link 不应再生成第二份 style。
 * 仍需对原 link 派发 load，避免 Vite preload 一直等待。
 */

export {};

const { findStyleByCssHref, dispatchStyleSheetLoadAsync } = require("../../src/effect");

const HREF = "https://cdn.example.com/assets/shared.css";
const CSS = ".box{width:100%;height:100%}";

describe("findStyleByCssHref / 入口 HTML 与动态 preload 同 href 去重", () => {
  afterEach(() => {
    document.head.innerHTML = "";
  });

  it("能匹配带 data-wujie-css-href 的入口 style", () => {
    document.head.innerHTML = `<style data-wujie-css-href="${HREF}">/* ${HREF} */${CSS}</style>`;
    const found = findStyleByCssHref(document, HREF);
    expect(found).not.toBeNull();
    expect(found.getAttribute("data-wujie-css-href")).toBe(HREF);
  });

  it("没有属性时能匹配注释开头的旧入口 style", () => {
    document.head.innerHTML = `<style>/* ${HREF} */${CSS}</style>`;
    const found = findStyleByCssHref(document, HREF);
    expect(found).not.toBeNull();
    expect(found.textContent.indexOf(`/* ${HREF} */`)).toBe(0);
  });

  it("不同 href 不应命中", () => {
    document.head.innerHTML = `<style data-wujie-css-href="${HREF}">/* ${HREF} */${CSS}</style>`;
    expect(findStyleByCssHref(document, "https://cdn.example.com/assets/other.css")).toBeNull();
  });
});

describe("命中去重后的 load 派发 / 消费方监听注册晚于 appendChild", () => {
  function makeLink(): HTMLLinkElement {
    const link = document.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("href", HREF);
    return link;
  }

  it("监听在派发之后才注册时仍能收到 load（Vite preload 的顺序）", async () => {
    const link = makeLink();
    let loaded = 0;

    // 对应运行时：劫持的 appendChild 内部命中去重后补发 load
    dispatchStyleSheetLoadAsync(link);
    // Vite preload 是在 appendChild 返回之后才 addEventListener("load")
    const loadPromise = new Promise<void>((resolve) => {
      link.addEventListener("load", () => {
        loaded += 1;
        resolve();
      });
    });

    await expect(loadPromise).resolves.toBeUndefined();
    expect(loaded).toBe(1);
  });

  it("不在调用栈内同步派发", async () => {
    const link = makeLink();
    const onLoad = jest.fn();
    link.addEventListener("load", onLoad);

    dispatchStyleSheetLoadAsync(link);
    expect(onLoad).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onLoad).toHaveBeenCalledTimes(1);
  });
});
