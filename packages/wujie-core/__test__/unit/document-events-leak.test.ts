/**
 * 准集成测试：patchDocumentEffect 中 documentEvents 分支（fullscreenchange / pointerlockchange 等）
 * 的多重内存泄露 bug。
 *
 * 主要面向：
 * - notes/memory-leak-investigation.md §9（原作者已在源码里标 // TODO 内存泄露）
 *   1) addEventListener 与 handlerCallbackMap.set 各自调用一次 handler.bind()，得到两个不同的
 *      bound 函数引用；下一次 set 时 removeEventListener 用 map 里的 bound（B），但实际
 *      注册在 main document 上的是另一个 bound（A），永远删不掉，反复重赋值会累加 listener。
 *   2) addEventListener 直接调原生 `window.document.addEventListener`，绕开了批 B 加的
 *      `Document.prototype.addEventListener` 劫持，因此没经过 eventCleanupTracker 登记，
 *      destroy 时不会被反向解绑。
 *   3) handler.bind(iframeWindow.document) 闭包持有 iframeWindow.document，
 *      listener 永久挂在主 document 上 → iframeWindow GC 不掉。
 *   4) `handler = null` 这个常见的清除写法没有特殊处理。
 *
 * 修复目标：每个 propKey 只允许一个 active listener；setter 内部用同一份 bound 引用做
 * add / remove / track；接入 sandbox.eventCleanupTracker，destroy 时反向解绑。
 */

export {};

import { patchDocumentEffect } from "../../src/iframe";
import { EventCleanupTracker } from "../../src/effect-cleanup";

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

/** 数 main window.document 上某个事件被 dispatch 时实际触发的 listener 次数 */
function countListenersByDispatch(type: string, dispatchTimes = 1): number {
  let count = 0;
  const probe = () => {
    count++;
  };
  // 先把 probe 装上，自身是 1 次
  window.document.addEventListener(type, probe);
  for (let i = 0; i < dispatchTimes; i++) {
    window.document.dispatchEvent(new Event(type));
  }
  window.document.removeEventListener(type, probe);
  // 减去 probe 自己每次贡献的 1
  return count - dispatchTimes;
}

describe("§9 documentEvents setter 多重 bug", () => {
  let iframe: HTMLIFrameElement;
  let iframeWindow: any;
  let sandbox: any;

  beforeEach(() => {
    document.body.innerHTML = "";
    iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    iframeWindow = iframe.contentWindow;
    sandbox = createSandboxStub("e2e-doc-events");
    iframeWindow.__WUJIE = sandbox;
    patchDocumentEffect(iframeWindow);
  });

  afterEach(() => {
    iframe.remove();
  });

  test("反复重赋值 document.onfullscreenchange = fn 不应在主 document 上累加 listener", () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    iframeWindow.document.onfullscreenchange = handler1;
    iframeWindow.document.onfullscreenchange = handler2;
    iframeWindow.document.onfullscreenchange = handler1;

    // 触发一次 main document 上的 fullscreenchange，应只有最后被赋值的 handler1 触发一次
    handler1.mockClear();
    handler2.mockClear();
    window.document.dispatchEvent(new Event("fullscreenchange"));
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).not.toHaveBeenCalled();
  });

  test("赋值 null 应能解除已注册的 listener", () => {
    const handler = jest.fn();
    iframeWindow.document.onfullscreenchange = handler;
    iframeWindow.document.onfullscreenchange = null;

    handler.mockClear();
    window.document.dispatchEvent(new Event("fullscreenchange"));
    expect(handler).not.toHaveBeenCalled();
  });

  test("destroy 阶段 eventCleanupTracker.cleanupAll() 应反向解绑 documentEvents 注册的 listener", () => {
    const handler = jest.fn();
    iframeWindow.document.onfullscreenchange = handler;

    // 验证 listener 当前生效
    handler.mockClear();
    window.document.dispatchEvent(new Event("fullscreenchange"));
    expect(handler).toHaveBeenCalledTimes(1);

    sandbox.eventCleanupTracker.cleanupAll();

    handler.mockClear();
    window.document.dispatchEvent(new Event("fullscreenchange"));
    expect(handler).not.toHaveBeenCalled();
  });

  test("反复重赋值不同 handler N 次后，main document 上 listener 数应保持为 0 或 1（不能 N）", () => {
    const baseline = countListenersByDispatch("visibilitychange");
    expect(baseline).toBe(0);

    for (let i = 0; i < 10; i++) {
      iframeWindow.document.onvisibilitychange = jest.fn();
    }

    const after = countListenersByDispatch("visibilitychange");
    expect(after).toBeLessThanOrEqual(1);
  });
});
