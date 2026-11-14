/**
 * 单元测试：sandbox.destroy() 同步移除 map、防重入，以及 destroyApp 异步契约。
 *
 * 修复刷新场景下 destroy 竞态：deleteWujieById 须在 await unmount 之前同步执行，
 * 确保 disconnectedCallback / startApp 通过 getWujieById 拿到 null。
 */

export {};

import Wujie from "../../src/sandbox";
import { addSandboxCacheWithWujie, getWujieById, idToSandboxCacheMap } from "../../src/common";
import { destroyApp } from "../../src/index";

function createMinimalDestroyableSandbox(id: string) {
  const iframe = window.document.createElement("iframe");
  window.document.body.appendChild(iframe);
  const iframeWindow: any = iframe.contentWindow;

  const inst: any = Object.create(Wujie.prototype);
  inst.id = id;
  inst.destroyed = false;
  inst.provide = null;
  inst.shadowRoot = null;
  inst.proxyLocation = null;
  inst.proxyRevoke = jest.fn();
  inst.iframe = iframe;
  inst.bus = { $destroy: jest.fn() };
  inst.eventCleanupTracker = { cleanupAll: jest.fn() };
  inst.styleSheetElements = [];
  inst.dynamicScriptElements = [];
  inst.fontStyleSheetElements = [];
  inst.deferredStyleObservers = [];
  inst.unmount = jest.fn().mockResolvedValue(undefined);

  if (iframeWindow) {
    iframeWindow.__WUJIE = { id };
    iframeWindow.$wujie = {};
  }

  return { inst, iframe };
}

describe("sandbox.destroy() 同步移除 map 与防重入", () => {
  beforeEach(() => {
    idToSandboxCacheMap.clear();
  });

  test("destroy 应在 await unmount 之前同步从 map 移除 sandbox", async () => {
    const { inst } = createMinimalDestroyableSandbox("order-test");
    let unmountResolve: () => void;
    const unmountGate = new Promise<void>((resolve) => {
      unmountResolve = resolve;
    });

    addSandboxCacheWithWujie("order-test", inst);
    expect(getWujieById("order-test")).toBe(inst);

    inst.unmount = jest.fn().mockImplementation(() => {
      expect(getWujieById("order-test")).toBe(null);
      return unmountGate;
    });

    const destroyPromise = inst.destroy();
    expect(getWujieById("order-test")).toBe(null);

    unmountResolve!();
    await destroyPromise;
  });

  test("destroy 防重入：第二次调用不应重复执行 unmount", async () => {
    const { inst } = createMinimalDestroyableSandbox("reentry-test");
    addSandboxCacheWithWujie("reentry-test", inst);

    await inst.destroy();
    await inst.destroy();

    expect(inst.unmount).toHaveBeenCalledTimes(1);
    expect(inst.destroyed).toBe(true);
  });

  test("有 setupApp options 时，destroy 同步段应只移除 wujie 实例、保留 options", async () => {
    const { inst } = createMinimalDestroyableSandbox("options-test");
    const options = { name: "options-test", url: "//example.com" };
    const { addSandboxCacheWithOptions, getOptionsById } = require("../../src/common");

    addSandboxCacheWithOptions("options-test", options);
    addSandboxCacheWithWujie("options-test", inst);

    const destroyPromise = inst.destroy();
    expect(getWujieById("options-test")).toBe(null);
    expect(getOptionsById("options-test")).toBe(options);

    await destroyPromise;
  });
});

describe("destroyApp", () => {
  beforeEach(() => {
    idToSandboxCacheMap.clear();
  });

  test("应 await sandbox.destroy 完成后再返回", async () => {
    const { inst } = createMinimalDestroyableSandbox("async-destroy-app");
    let destroyFinished = false;

    addSandboxCacheWithWujie("async-destroy-app", inst);
    inst.destroy = jest.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 10));
      destroyFinished = true;
    });

    const promise = destroyApp("async-destroy-app");
    expect(destroyFinished).toBe(false);
    await promise;
    expect(destroyFinished).toBe(true);
    expect(inst.destroy).toHaveBeenCalledTimes(1);
  });

  test("map 中无 sandbox 时应安全返回", async () => {
    await expect(destroyApp("nonexistent")).resolves.toBeUndefined();
  });
});
