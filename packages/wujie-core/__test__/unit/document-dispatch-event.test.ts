/**
 * 子应用 document.dispatchEvent 与 addEventListener 的转发保持对称：
 * 监听注册在哪里，事件就派发到哪里。
 */

export {};

import { patchDocumentEffect } from "../../src/iframe";
import { EventCleanupTracker } from "../../src/tracker";

function createSandboxStub(overrides: Record<string, any> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return {
    id: "dispatch-event",
    degrade: false,
    plugins: [],
    shadowRoot: host.attachShadow({ mode: "open" }),
    proxyDocument: {},
    iframeOnEvents: [],
    eventCleanupTracker: new EventCleanupTracker(),
    ...overrides,
  };
}

describe("patchDocumentEffect dispatchEvent", () => {
  let iframe: HTMLIFrameElement;
  let iframeWindow: any;

  function setup(overrides: Record<string, any> = {}) {
    iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    iframeWindow = iframe.contentWindow;
    iframeWindow.__WUJIE = createSandboxStub(overrides);
    patchDocumentEffect(iframeWindow);
    return iframeWindow.__WUJIE;
  }

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("自定义事件能被 document 上的监听收到，this 仍为子应用 document", () => {
    setup();
    const doc = iframeWindow.document;
    const handler = jest.fn(function (this: Document, event: CustomEvent) {
      expect(this).toBe(doc);
      expect(event.detail).toBe(1);
    });
    doc.addEventListener("custom-event", handler);
    doc.dispatchEvent(new CustomEvent("custom-event", { detail: 1 }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test("移除监听后不再触发", () => {
    setup();
    const doc = iframeWindow.document;
    const handler = jest.fn();
    doc.addEventListener("custom-event", handler);
    doc.removeEventListener("custom-event", handler);
    doc.dispatchEvent(new CustomEvent("custom-event"));
    expect(handler).not.toHaveBeenCalled();
  });

  test("DOMContentLoaded 仍在子应用 document 上原生派发", () => {
    const sandbox = setup();
    const doc = iframeWindow.document;
    const handler = jest.fn();
    const shadowHandler = jest.fn();
    doc.addEventListener("DOMContentLoaded", handler);
    sandbox.shadowRoot.addEventListener("DOMContentLoaded", shadowHandler);
    doc.dispatchEvent(new CustomEvent("DOMContentLoaded"));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(shadowHandler).not.toHaveBeenCalled();
  });

  test("主应用 document 上监听的事件派发到主应用 document", () => {
    setup();
    const doc = iframeWindow.document;
    const handler = jest.fn();
    doc.addEventListener("visibilitychange", handler);
    doc.dispatchEvent(new Event("visibilitychange"));
    expect(handler).toHaveBeenCalledTimes(1);
    doc.removeEventListener("visibilitychange", handler);
  });

  test("降级模式派发到渲染 document", () => {
    const renderIframe = document.createElement("iframe");
    document.body.appendChild(renderIframe);
    setup({ degrade: true, document: renderIframe.contentDocument });
    const doc = iframeWindow.document;
    const handler = jest.fn();
    doc.addEventListener("custom-event", handler);
    doc.dispatchEvent(new CustomEvent("custom-event"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test("shadowRoot 尚未创建时回退到原生派发", () => {
    setup({ shadowRoot: null });
    const doc = iframeWindow.document;
    const handler = jest.fn();
    iframeWindow.EventTarget.prototype.addEventListener.call(doc, "custom-event", handler);
    expect(doc.dispatchEvent(new CustomEvent("custom-event"))).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
