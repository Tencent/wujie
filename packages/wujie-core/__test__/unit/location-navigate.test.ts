/**
 * 子应用 location.href 赋值、location.assign、location.replace 与原生语义保持一致：
 * - 相对地址基于子应用当前地址解析；
 * - 只改变 hash 时在 js iframe 内完成同文档跳转；
 * - 其余情况渲染新的 iframe 替换子应用并同步到主应用 url，replace 不新增历史记录。
 */

export {};

jest.mock("../../src/iframe", () => ({
  ...jest.requireActual("../../src/iframe"),
  renderIframeReplaceApp: jest.fn(),
}));
jest.mock("../../src/sync", () => ({
  ...jest.requireActual("../../src/sync"),
  pushUrlToWindow: jest.fn(),
}));

const { proxyGenerator, localGenerator } = require("../../src/proxy");
const { renderIframeReplaceApp } = require("../../src/iframe");
const { pushUrlToWindow } = require("../../src/sync");

const MAIN_HOST = "https://main.example.com";
const APP_HOST = "https://sub.example.com";
const IFRAME_URL = `${MAIN_HOST}/app/page1?x=1`;
const APP_URL = `${APP_HOST}/app/page1?x=1`;

function createFakeIframe() {
  const container = document.createElement("div");
  const host = document.createElement("div");
  container.appendChild(host);
  const location = {
    href: IFRAME_URL,
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  };
  const sandbox = { id: "app", degrade: false, shadowRoot: { host }, degradeAttrs: {}, hrefFlag: false };
  const iframe = { contentWindow: { location, __WUJIE: sandbox } } as any;
  return { iframe, location, sandbox, container };
}

const urlElement = Object.assign(document.createElement("a"), { href: `${APP_HOST}/app/` });

const generators = {
  非降级: (iframe) => proxyGenerator(iframe, urlElement, MAIN_HOST, APP_HOST).proxyLocation,
  降级: (iframe) => localGenerator(iframe, urlElement, MAIN_HOST, APP_HOST).proxyLocation,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe.each(Object.entries(generators))("%s proxyLocation 跳转", (_name, generate) => {
  let fake: ReturnType<typeof createFakeIframe>;
  let proxyLocation: any;

  beforeEach(() => {
    fake = createFakeIframe();
    proxyLocation = generate(fake.iframe);
  });

  it("replace 到外部站点：渲染新 iframe，替换主应用当前历史记录，保留 sandbox 供后退恢复", () => {
    proxyLocation.replace("https://other.example.com/x");
    expect(renderIframeReplaceApp).toHaveBeenCalledWith("https://other.example.com/x", fake.container, {});
    expect(pushUrlToWindow).toHaveBeenCalledWith("app", "https://other.example.com/x", true);
    expect(fake.sandbox.hrefFlag).toBe(true);
    expect(fake.location.replace).not.toHaveBeenCalled();
  });

  it("replace 到子应用其他路径：不再让 js iframe 跳到主应用域名下", () => {
    proxyLocation.replace(`${APP_HOST}/app/page2`);
    expect(renderIframeReplaceApp).toHaveBeenCalledWith(`${APP_HOST}/app/page2`, fake.container, {});
    expect(fake.location.replace).not.toHaveBeenCalled();
  });

  it("assign 相对地址：基于子应用当前地址解析，并新增主应用历史记录", () => {
    proxyLocation.assign("./page2?y=1");
    expect(renderIframeReplaceApp).toHaveBeenCalledWith(`${APP_HOST}/app/page2?y=1`, fake.container, {});
    expect(pushUrlToWindow).toHaveBeenCalledWith("app", `${APP_HOST}/app/page2?y=1`, false);
    expect(fake.location.assign).not.toHaveBeenCalled();
  });

  it("assign 支持 URL 对象", () => {
    proxyLocation.assign(new URL("/other", APP_URL));
    expect(renderIframeReplaceApp).toHaveBeenCalledWith(`${APP_HOST}/other`, fake.container, {});
  });

  it("href 赋值相对路径：基于子应用当前地址解析，而不是主应用地址", () => {
    proxyLocation.href = "/page3";
    expect(renderIframeReplaceApp).toHaveBeenCalledWith(`${APP_HOST}/page3`, fake.container, {});
    expect(pushUrlToWindow).toHaveBeenCalledWith("app", `${APP_HOST}/page3`, false);
  });

  it("href 只改 hash：在 js iframe 内同文档跳转，不渲染新 iframe", () => {
    proxyLocation.href = "#/a";
    expect(fake.location.assign).toHaveBeenCalledWith(`${IFRAME_URL}#/a`);
    expect(renderIframeReplaceApp).not.toHaveBeenCalled();
    expect(pushUrlToWindow).not.toHaveBeenCalled();
    expect(fake.sandbox.hrefFlag).toBe(false);
  });

  it("replace 只改 hash：在 js iframe 内替换，不渲染新 iframe", () => {
    proxyLocation.replace(`${APP_URL}#/b`);
    expect(fake.location.replace).toHaveBeenCalledWith(`${IFRAME_URL}#/b`);
    expect(renderIframeReplaceApp).not.toHaveBeenCalled();
  });

  it("assign 只改 hash：在 js iframe 内同文档跳转", () => {
    proxyLocation.assign("#/c");
    expect(fake.location.assign).toHaveBeenCalledWith(`${IFRAME_URL}#/c`);
    expect(renderIframeReplaceApp).not.toHaveBeenCalled();
  });

  it("origin 返回子应用的源", () => {
    expect(proxyLocation.origin).toBe(APP_HOST);
  });
});

describe("pushUrlToWindow", () => {
  const { pushUrlToWindow: realPushUrlToWindow } = jest.requireActual("../../src/sync");

  it("replace 为 true 时替换当前历史记录，否则新增", () => {
    const length = window.history.length;
    realPushUrlToWindow("app", `${APP_HOST}/a`, true);
    expect(window.history.length).toBe(length);
    expect(new URLSearchParams(window.location.search).get("app")).toBe(`${APP_HOST}/a`);
    realPushUrlToWindow("app", `${APP_HOST}/b`);
    expect(window.history.length).toBe(length + 1);
    expect(new URLSearchParams(window.location.search).get("app")).toBe(`${APP_HOST}/b`);
  });
});
