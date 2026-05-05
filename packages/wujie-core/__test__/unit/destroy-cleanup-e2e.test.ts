/**
 * 准集成测试：用 jsdom 真 iframe 走 patchDocumentEffect / patchWindowEffect 全链路，
 * 验证 sandbox 销毁能彻底反向解绑主应用 window / document 上的副作用。
 *
 * 选择 jsdom 而非 puppeteer：这两个 patch 的逻辑均为 DOM 标准 API，jsdom 已能复现，
 * 跑得更快；puppeteer 端到端基准另行覆盖。
 */

export {};

const realWarnE2E = jest.fn();
jest.mock("../../src/utils", () => {
  const actual = jest.requireActual("../../src/utils");
  return { ...actual, warn: realWarnE2E };
});

const { patchDocumentEffect, patchWindowEffect } = require("../../src/iframe");
const { EventCleanupTracker } = require("../../src/effect-cleanup");

function createSandboxStub(id: string) {
  return {
    id,
    degrade: false,
    plugins: [],
    shadowRoot: document.createElement("div"),
    proxyDocument: {},
    iframeOnEvents: [],
    eventCleanupTracker: new EventCleanupTracker(),
  };
}

describe("E2E: patchDocumentEffect 端到端反向解绑", () => {
  let iframe: HTMLIFrameElement;
  let iframeWindow: any;
  let sandbox: any;

  beforeEach(() => {
    document.body.innerHTML = "";
    iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    iframeWindow = iframe.contentWindow;
    sandbox = createSandboxStub("e2e-doc");
    iframeWindow.__WUJIE = sandbox;
  });

  afterEach(() => {
    iframe.remove();
  });

  test("子应用 document.addEventListener('keydown', fn) 被转发到主 document，destroy 后反向解绑", () => {
    patchDocumentEffect(iframeWindow);

    const handler = jest.fn();
    iframeWindow.document.addEventListener("keydown", handler);

    window.document.dispatchEvent(new Event("keydown"));
    expect(handler).toHaveBeenCalledTimes(1);

    // 模拟 destroy 阶段调用
    sandbox.eventCleanupTracker.cleanupAll();

    handler.mockClear();
    window.document.dispatchEvent(new Event("keydown"));
    expect(handler).not.toHaveBeenCalled();
  });

  test("子应用主动 removeEventListener 后再 cleanupAll 不应抛错", () => {
    patchDocumentEffect(iframeWindow);

    const handler = jest.fn();
    iframeWindow.document.addEventListener("keydown", handler);
    iframeWindow.document.removeEventListener("keydown", handler);

    expect(() => sandbox.eventCleanupTracker.cleanupAll()).not.toThrow();
    handler.mockClear();
    window.document.dispatchEvent(new Event("keydown"));
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("E2E: patchWindowEffect 端到端 onXXX 还原", () => {
  let iframe: HTMLIFrameElement;
  let iframeWindow: any;
  let sandbox: any;
  let originalOnResize: any;

  beforeEach(() => {
    document.body.innerHTML = "";
    iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    iframeWindow = iframe.contentWindow;
    sandbox = createSandboxStub("e2e-win");
    iframeWindow.__WUJIE = sandbox;
    originalOnResize = (window as any).onresize;
  });

  afterEach(() => {
    iframe.remove();
    (window as any).onresize = originalOnResize;
  });

  test("子应用 window.onresize = fn 写入主 window，destroy 后不再触发 handler", () => {
    patchWindowEffect(iframeWindow);

    const handler = jest.fn();
    iframeWindow.onresize = handler;

    // 触发主 window 的 resize 事件，handler 应被调用
    window.dispatchEvent(new Event("resize"));
    expect(handler).toHaveBeenCalledTimes(1);

    sandbox.eventCleanupTracker.cleanupAll();

    // 销毁后再触发，handler 不应再被调用（dangling handler 已清除）
    handler.mockClear();
    window.dispatchEvent(new Event("resize"));
    expect(handler).not.toHaveBeenCalled();
  });
});
