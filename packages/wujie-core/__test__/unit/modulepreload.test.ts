/**
 * 子应用动态插入的 modulepreload link 应插到 iframe 的 head，
 * 让预加载进入执行 import() 的 iframe 模块表，避免主文档预加载后 iframe 再请求一次。
 */

export {};

const { patchRenderEffect } = require("../../src/effect");
const { addSandboxCacheWithWujie, deleteWujieById } = require("../../src/common");

describe("appendChild 劫持 / modulepreload 插入 iframe 的 head", () => {
  const WUJIE_ID = "modulepreload-app";
  const HREF = "https://cdn.example.com/assets/vendor.js";
  let iframe: HTMLIFrameElement;
  let appendHook: jest.Mock;

  function makeModulePreload(): HTMLLinkElement {
    const link = document.createElement("link");
    link.rel = "modulepreload";
    link.href = HREF;
    return link;
  }

  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    (iframe.contentWindow as any).__WUJIE_RAW_DOCUMENT_HEAD__ = iframe.contentDocument.head;
    appendHook = jest.fn();
    const sandbox = {
      id: WUJIE_ID,
      styleSheetElements: [],
      replace: null,
      plugins: [{ appendOrInsertElementHook: appendHook }],
      lifecycles: {},
      proxyLocation: { protocol: "https:", host: "cdn.example.com", pathname: "/", href: "https://cdn.example.com/" },
      fiber: false,
      degrade: true,
      iframe,
      fetch: jest.fn(),
    };
    (iframe.contentWindow as any).__WUJIE = sandbox;
    addSandboxCacheWithWujie(WUJIE_ID, sandbox);
    patchRenderEffect(document, WUJIE_ID, true);
  });

  afterEach(() => {
    deleteWujieById(WUJIE_ID);
    ["appendChild", "insertBefore", "removeChild", "contains"].forEach((method) => {
      delete (document.head as any)[method];
      delete (document.body as any)[method];
    });
    delete (document as any).contains;
  });

  it("head.appendChild 时插到 iframe 的 head，不留在渲染文档里", () => {
    const link = makeModulePreload();
    const res = document.head.appendChild(link);

    expect(res).toBe(link);
    expect(iframe.contentDocument.head.contains(link)).toBe(true);
    expect(document.head.querySelector('link[rel="modulepreload"]')).toBeNull();
    expect(appendHook).toHaveBeenCalledWith(link, iframe.contentWindow);
  });

  it("body.insertBefore 时同样插到 iframe 的 head", () => {
    const ref = document.createElement("div");
    document.body.appendChild(ref);
    const link = makeModulePreload();
    const res = document.body.insertBefore(link, ref);

    expect(res).toBe(link);
    expect(iframe.contentDocument.head.contains(link)).toBe(true);
    expect(document.body.contains(link)).toBe(false);
  });

  it("其他非 stylesheet 的 link 仍插在渲染文档里", () => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = "https://cdn.example.com";
    document.head.appendChild(link);

    expect(document.head.contains(link)).toBe(true);
    expect(iframe.contentDocument.head.contains(link)).toBe(false);
  });
});
