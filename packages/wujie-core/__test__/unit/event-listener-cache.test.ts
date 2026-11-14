/**
 * 降级模式下节点事件监听缓存需与原生语义一致：
 * 以 type + handler + capture 识别监听；once 监听触发后不再被恢复。
 */

export {};

const { recordEventListeners, recoverEventListeners, recoverDocumentListeners } = require("../../src/iframe");

describe("recordEventListeners", () => {
  let iframeWindow: Window;
  let iframeDocument: Document;
  let sandbox: { elementEventCacheMap: WeakMap<Node, any[]> };

  beforeEach(() => {
    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    iframeWindow = iframe.contentWindow;
    iframeDocument = iframe.contentDocument;
    sandbox = { elementEventCacheMap: new WeakMap() };
    (iframeWindow as any).__WUJIE = sandbox;
    recordEventListeners(iframeWindow);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  function createButton(): HTMLElement {
    const el = iframeDocument.createElement("button");
    iframeDocument.body.appendChild(el);
    return el;
  }

  const records = (node: Node) => (sandbox.elementEventCacheMap.get(node) || []).map((r) => [r.type, r.capture]);

  it("同一 handler 的 capture 与 bubble 分别记录，重复添加不重复记录", () => {
    const el = createButton();
    const handler = jest.fn();
    el.addEventListener("click", handler);
    el.addEventListener("click", handler, true);
    el.addEventListener("click", handler, { capture: true });
    el.addEventListener("click", handler, false);
    expect(records(el)).toEqual([
      ["click", false],
      ["click", true],
    ]);
  });

  it("移除 capture 监听只删除 capture 记录", () => {
    const el = createButton();
    const handler = jest.fn();
    el.addEventListener("click", handler);
    el.addEventListener("click", handler, true);
    el.removeEventListener("click", handler, { capture: true });
    expect(records(el)).toEqual([["click", false]]);
    el.removeEventListener("click", handler);
    expect(sandbox.elementEventCacheMap.has(el)).toBe(false);
  });

  it("once 监听触发后删除记录，恢复后不会再次触发", () => {
    const el = createButton();
    const handler = jest.fn();
    el.addEventListener("click", handler, { once: true });
    el.click();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(sandbox.elementEventCacheMap.has(el)).toBe(false);

    recoverEventListeners(iframeDocument.documentElement, iframeWindow);
    el.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("once 监听触发前被移除时，同时移除内部清理监听", () => {
    const el = createButton();
    const handler = jest.fn();
    el.addEventListener("click", handler, { once: true });
    el.removeEventListener("click", handler);
    expect(sandbox.elementEventCacheMap.has(el)).toBe(false);

    const other = jest.fn();
    el.addEventListener("click", other);
    el.click();
    expect(handler).not.toHaveBeenCalled();
    expect(records(el)).toEqual([["click", false]]);
  });

  it("once 监听被更早的 stopImmediatePropagation 拦截时保留记录", () => {
    const el = createButton();
    const handler = jest.fn();
    let block = true;
    el.addEventListener("click", (e) => block && e.stopImmediatePropagation());
    el.addEventListener("click", handler, { once: true });
    el.click();
    expect(handler).not.toHaveBeenCalled();
    expect(records(el)).toEqual([
      ["click", false],
      ["click", false],
    ]);

    block = false;
    el.click();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(records(el)).toEqual([["click", false]]);
  });

  it("恢复到新根节点后，once 监听触发时清理新节点上的记录", () => {
    const oldRoot = iframeDocument.documentElement;
    const newRoot = iframeDocument.createElement("html");
    const handler = jest.fn();
    oldRoot.addEventListener("click", handler, { once: true });

    recoverDocumentListeners(oldRoot, newRoot, iframeWindow);
    expect(records(newRoot)).toEqual([["click", false]]);

    newRoot.dispatchEvent(new (iframeWindow as any).Event("click"));
    newRoot.dispatchEvent(new (iframeWindow as any).Event("click"));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(sandbox.elementEventCacheMap.has(newRoot)).toBe(false);
  });
});
