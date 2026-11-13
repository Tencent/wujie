/**
 * 入口 HTML 已将 CSS 转成 style 后，动态再插入同 href 的 link 不应再生成第二份 style。
 * 仍需对原 link 派发 load，避免 Vite preload 一直等待。
 */

export {};

const { findStyleByCssHref, dispatchStyleSheetLoadAsync, canonicalCssHref } = require("../../src/effect");

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

  it("属性值经过 HTML 转义后仍能按原 href 命中", () => {
    const href = 'https://cdn.example.com/assets/shared.css?q="a"&b=1';
    const style = document.createElement("style");
    style.setAttribute("data-wujie-css-href", canonicalCssHref(href));
    style.textContent = `/* ${href} */${CSS}`;
    document.head.appendChild(style);
    document.head.innerHTML = document.head.innerHTML;

    const found = findStyleByCssHref(document, href);
    expect(found).not.toBeNull();
    expect(found.getAttribute("data-wujie-css-href")).toBe(canonicalCssHref(href));
  });

  it("查询串编码不同的同一绝对地址仍能命中", () => {
    const stored = "https://cdn.example.com/assets/shared.css?v=a%20b";
    const lookup = "https://cdn.example.com/assets/shared.css?v=a b";
    document.head.innerHTML = `<style data-wujie-css-href="${stored}">/* ${stored} */${CSS}</style>`;
    expect(findStyleByCssHref(document, lookup)).not.toBeNull();
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

  it("显式 error 时不派发 load", async () => {
    const link = makeLink();
    const onLoad = jest.fn();
    const onError = jest.fn();
    link.addEventListener("load", onLoad);
    link.addEventListener("error", onError);

    dispatchStyleSheetLoadAsync(link, "error");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onLoad).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe("appendChild 劫持 / 同 href 去重的派发时机", () => {
  const { patchRenderEffect } = require("../../src/effect");
  const { addSandboxCacheWithWujie, deleteWujieById } = require("../../src/common");
  const { clearAssetsCache } = require("../../src/entry");

  const WUJIE_ID = "css-href-dedupe-app";
  const HREF = "https://cdn.example.com/assets/shared.css";
  let fetchGate: { resolve: (value: string) => void; reject: (reason?: unknown) => void };
  let sandbox: any;

  function makeLink(): HTMLLinkElement {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = HREF;
    return link;
  }

  function eventOf(link: HTMLLinkElement, type: "load" | "error"): Promise<void> {
    return new Promise((resolve) => link.addEventListener(type, () => resolve()));
  }

  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    clearAssetsCache();
    let resolveFetch: (value: string) => void;
    let rejectFetch: (reason?: unknown) => void;
    const pending = new Promise<string>((resolve, reject) => {
      resolveFetch = resolve;
      rejectFetch = reject;
    });
    fetchGate = { resolve: resolveFetch, reject: rejectFetch };
    sandbox = {
      id: WUJIE_ID,
      styleSheetElements: [],
      replace: null,
      plugins: [],
      lifecycles: {},
      proxyLocation: { protocol: "https:", host: "cdn.example.com", pathname: "/", href: "https://cdn.example.com/" },
      fiber: false,
      degrade: true,
      iframe: { contentDocument: document, contentWindow: window },
      fetch: jest.fn(() => pending.then((text) => ({ status: 200, text: () => Promise.resolve(text) }))),
    };
    addSandboxCacheWithWujie(WUJIE_ID, sandbox);
    patchRenderEffect(document, WUJIE_ID, true);
  });

  afterEach(() => {
    deleteWujieById(WUJIE_ID);
    clearAssetsCache();
  });

  it("占位还在拉取时，第二份 link 要等原来的请求结束才收到 load", async () => {
    const first = makeLink();
    const second = makeLink();
    const firstLoad = eventOf(first, "load");
    const secondLoad = eventOf(second, "load");
    let secondLoaded = false;
    second.addEventListener("load", () => {
      secondLoaded = true;
    });

    document.head.appendChild(first);
    document.head.appendChild(second);
    await Promise.resolve();

    expect(document.head.querySelectorAll("style")).toHaveLength(1);
    expect(document.head.querySelector("style").hasAttribute("data-wujie-css-pending")).toBe(true);
    expect(secondLoaded).toBe(false);

    fetchGate.resolve(".box{width:100%}");
    await firstLoad;
    await secondLoad;
    expect(document.head.querySelector("style").getAttribute("data-wujie-css-state")).toBe("loaded");
    expect(document.head.querySelector("style").textContent).toContain(".box{width:100%}");
  });

  it("请求成功但内容为空时，后来的 link 收到 load 而不是 error", async () => {
    const first = makeLink();
    document.head.appendChild(first);
    fetchGate.resolve("");
    await eventOf(first, "load");

    const style = document.head.querySelector("style");
    expect(style.textContent).toBe("");
    expect(style.getAttribute("data-wujie-css-state")).toBe("loaded");

    const second = makeLink();
    const secondLoad = eventOf(second, "load");
    const onError = jest.fn();
    second.addEventListener("error", onError);
    document.head.appendChild(second);
    await secondLoad;

    expect(onError).not.toHaveBeenCalled();
    expect(document.head.querySelectorAll("style")).toHaveLength(1);
  });

  it("入口失败留下的空 style 让后来的 link 收到 error", async () => {
    const failed = document.createElement("style");
    failed.setAttribute("data-wujie-css-href", HREF);
    failed.setAttribute("data-wujie-css-state", "error");
    document.head.appendChild(failed);

    const link = makeLink();
    const onError = eventOf(link, "error");
    const onLoad = jest.fn();
    link.addEventListener("load", onLoad);
    document.head.appendChild(link);
    await onError;

    expect(onLoad).not.toHaveBeenCalled();
    expect(document.head.querySelectorAll("style")).toHaveLength(1);
  });
});
