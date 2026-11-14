/**
 * 单元测试：sandbox.destroy() 对 iframeWindow.$wujie 的清理契约。
 *
 * provide 与 iframeWindow.$wujie 指向同一对象（patchIframeVariable）。destroy 时须在
 * iframeWindow 上把 __WUJIE、$wujie 一并置 null；仅 this.provide = null 只断了 sandbox
 * 侧引用，无法释放 provide 对象及其上的 shadowRoot / location。
 */

export {};

import Wujie from "../../src/sandbox";

describe("sandbox.destroy() 对 iframeWindow.$wujie 的清理契约", () => {
  function createDestroyableSandbox() {
    const iframe = window.document.createElement("iframe");
    window.document.body.appendChild(iframe);
    const iframeWindow: any = iframe.contentWindow;

    const provide: any = { bus: {}, shadowRoot: {}, location: {} };
    iframeWindow.__WUJIE = { id: "leak-test" };
    iframeWindow.$wujie = provide;

    const proxyRevoke = jest.fn();

    const inst: any = Object.create(Wujie.prototype);
    inst.id = "leak-test";
    inst.provide = provide;
    inst.shadowRoot = null;
    inst.proxyLocation = null;
    inst.proxyRevoke = proxyRevoke;
    inst.iframe = iframe;
    inst.bus = { $destroy: jest.fn() };
    inst.eventCleanupTracker = { cleanupAll: jest.fn() };
    inst.unmount = jest.fn().mockResolvedValue(undefined);
    inst.styleSheetElements = [];
    inst.dynamicScriptElements = [];
    inst.deferredStyleObservers = [];

    return { inst, iframeWindow, proxyRevoke };
  }

  test("destroy 后 iframeWindow.$wujie 与 __WUJIE 均被断链为 null", async () => {
    const { inst, iframeWindow } = createDestroyableSandbox();

    await inst.destroy();

    expect(iframeWindow.$wujie).toBeNull();
    expect(iframeWindow.__WUJIE).toBeNull();
  });

  test("destroy 后 sandbox 自身 provide / shadowRoot / proxyLocation 也被置空", async () => {
    const { inst } = createDestroyableSandbox();

    await inst.destroy();

    expect(inst.provide).toBeNull();
    expect(inst.shadowRoot).toBeNull();
    expect(inst.proxyLocation).toBeNull();
  });

  test("destroy 后调用 proxyRevoke 释放代理闭包，并将其置空", async () => {
    const { inst, proxyRevoke } = createDestroyableSandbox();

    await inst.destroy();

    expect(proxyRevoke).toHaveBeenCalledTimes(1);
    expect(inst.proxyRevoke).toBeNull();
  });
});
