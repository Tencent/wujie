/**
 * 内置补丁函数单元测试
 *
 * 参照 instanceof 的 _hasPatch 模式：所有补丁函数均通过
 * Object.prototype.hasOwnProperty 检测自有标记防止重复 patch，
 * 确保 sandbox 销毁时无内存残留。
 */

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/** 构造模拟 iframeWindow 所需的最小沙箱结构 */
function createMockSandbox(overrides: Record<string, any> = {}) {
  const docEl = {
    requestFullscreen: jest.fn(),
    mozRequestFullScreen: jest.fn(),
    webkitRequestFullscreen: jest.fn(),
    msRequestFullscreen: jest.fn(),
  };
  // 通过 defineProperty 定义可替换的 cancel 方法，确保 hasSetter 检查通过
  const doc: Record<string, any> = {
    documentElement: docEl,
    fullscreenElement: null,
    webkitFullscreenElement: null,
    mozFullScreenElement: null,
    msFullscreenElement: null,
    fullscreenEnabled: true,
    webkitFullscreenEnabled: true,
    mozFullScreenEnabled: true,
    msFullscreenEnabled: true,
  };
  ["mozCancelFullScreen", "webkitCancelFullScreen", "msExitFullscreen"].forEach((name) => {
    let fn: Function = jest.fn();
    Object.defineProperty(doc, name, {
      configurable: true,
      enumerable: true,
      get: () => fn,
      set: (v: Function) => {
        fn = v;
      },
    });
  });

  const proxy = new Proxy(
    { document: doc },
    {
      get(target, p) {
        if (p === "document") return target.document;
        if (p === "location") return { href: "http://test.local/" };
        return target[p as keyof typeof target];
      },
      set(target, p, v) {
        (target as any)[p] = v;
        return true;
      },
    }
  );

  return {
    proxy,
    proxyDocument: proxy.document,
    plugins: [],
    ...overrides,
  };
}

function createMockIframeWindow(sandboxOverrides: Record<string, any> = {}) {
  const sandbox = createMockSandbox(sandboxOverrides);
  return {
    __WUJIE: sandbox,
    parent: {
      document: {
        documentElement: {
          requestFullscreen: jest.fn(),
          mozRequestFullScreen: jest.fn(),
          webkitRequestFullscreen: jest.fn(),
          msRequestFullscreen: jest.fn(),
        },
        mozCancelFullScreen: jest.fn(),
        webkitCancelFullScreen: jest.fn(),
        msExitFullscreen: jest.fn(),
        fullscreenElement: null,
        webkitFullscreenElement: null,
        mozFullScreenElement: null,
        msFullscreenElement: null,
        fullscreenEnabled: true,
        webkitFullscreenEnabled: true,
        mozFullScreenEnabled: true,
        msFullscreenEnabled: true,
      },
    },
    Object,
    document: {
      documentElement: {
        requestFullscreen: jest.fn(),
        mozRequestFullScreen: jest.fn(),
        webkitRequestFullscreen: jest.fn(),
        msRequestFullscreen: jest.fn(),
      },
    },
  } as unknown as Window;
}

// Mock 外部依赖
const mockWarn = jest.fn();
jest.mock("../../src/utils", () => {
  const actual = jest.requireActual("../../src/utils");
  return {
    ...actual,
    warn: mockWarn,
    isFunction: (fn: unknown): fn is Function => typeof fn === "function",
    execHooks: jest.fn(),
  };
});

import { patchWindowGetterEffect, patchFullscreenEffect } from "../../src/iframe";

// ---------------------------------------------------------------------------
// patchWindowGetterEffect
// ---------------------------------------------------------------------------

describe("patchWindowGetterEffect", () => {
  test("should wrap __WUJIE.proxy so that window/self returns proxy itself", () => {
    const win = createMockIframeWindow();
    const originalProxy = win.__WUJIE.proxy;
    expect(win.__WUJIE.proxy).toBe(originalProxy);

    patchWindowGetterEffect(win);

    // proxy 已被替换
    expect(win.__WUJIE.proxy).not.toBe(originalProxy);

    // 新 proxy 上的 window/self 应返回 proxy 自身
    const newProxy = win.__WUJIE.proxy;
    expect((newProxy as any).window).toBe(newProxy);
    expect((newProxy as any).self).toBe(newProxy);
  });

  test("should forward non-window/self get to original proxy", () => {
    const win = createMockIframeWindow({ extraProp: "test-value" });
    const originalProxy = win.__WUJIE.proxy;
    // 先在原始 proxy 上设置属性
    (originalProxy as any).extraProp = "test-value";

    patchWindowGetterEffect(win);

    const newProxy = win.__WUJIE.proxy;
    expect((newProxy as any).extraProp).toBe("test-value");
  });

  test("should forward set trap to original proxy", () => {
    const win = createMockIframeWindow();
    patchWindowGetterEffect(win);

    const newProxy = win.__WUJIE.proxy as any;
    newProxy.someProp = "new-value";
    // 原始 proxy 也应收到变更（通过 Reflect.set 转发）
    expect(newProxy.someProp).toBe("new-value");
  });

  test("should set __windowGetterPatched__ marker to prevent double-patch", () => {
    const win = createMockIframeWindow();

    patchWindowGetterEffect(win);
    const firstProxy = win.__WUJIE.proxy;

    // 第二次调用不应替换 proxy
    patchWindowGetterEffect(win);
    expect(win.__WUJIE.proxy).toBe(firstProxy);
  });

  test("should use hasOwnProperty for marker check (own property, not inherited)", () => {
    const win = createMockIframeWindow();

    // 首次调用前不应有标记
    expect(Object.prototype.hasOwnProperty.call(win.__WUJIE, "__windowGetterPatched__")).toBe(false);

    patchWindowGetterEffect(win);

    // 调用后标记应为自身属性
    expect(Object.prototype.hasOwnProperty.call(win.__WUJIE, "__windowGetterPatched__")).toBe(true);
    expect((win.__WUJIE as any).__windowGetterPatched__).toBe(true);
  });

  test("should handle Symbol property get on wrapper proxy", () => {
    const win = createMockIframeWindow();
    patchWindowGetterEffect(win);

    const sym = Symbol("test");
    // Symbol 属性不应匹配 window/self 正则
    (win.__WUJIE.proxy as any)[sym] = "symbol-value";
    expect((win.__WUJIE.proxy as any)[sym]).toBe("symbol-value");
  });

  test("should use optional chaining for __WUJIE access in get trap", () => {
    const win = createMockIframeWindow();
    patchWindowGetterEffect(win);

    const newProxy = win.__WUJIE.proxy as any;
    // 正常情况 window 返回 proxy
    expect(newProxy.window).toBe(newProxy);

    // 模拟 destroy 后 __WUJIE 变为 null —— 不应抛错
    (win as any).__WUJIE = null;
    expect(() => newProxy.window).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// patchFullscreenEffect
// ---------------------------------------------------------------------------

describe("patchFullscreenEffect", () => {
  test("should delegate requestFullscreen to main window document", () => {
    const win = createMockIframeWindow();
    const mainDocEl = win.parent.document.documentElement as any;

    patchFullscreenEffect(win);

    const appDocEl = win.__WUJIE.proxy.document.documentElement as any;
    appDocEl.requestFullscreen();

    expect(mainDocEl.requestFullscreen).toHaveBeenCalled();
  });

  test("should delegate vendor-prefixed requestFullscreen methods", () => {
    const win = createMockIframeWindow();
    const mainDocEl = win.parent.document.documentElement as any;

    patchFullscreenEffect(win);

    const appDocEl = win.__WUJIE.proxy.document.documentElement as any;
    appDocEl.mozRequestFullScreen();
    appDocEl.webkitRequestFullscreen();

    expect(mainDocEl.mozRequestFullScreen).toHaveBeenCalled();
    expect(mainDocEl.webkitRequestFullscreen).toHaveBeenCalled();
  });

  test("should delegate exitFullscreen methods to main window document", () => {
    const win = createMockIframeWindow();
    const mainDoc = win.parent.document as any;

    // appDoc 需要这些方法才可代理
    (win.__WUJIE.proxy.document as any).mozCancelFullScreen = function () {};
    (win.__WUJIE.proxy.document as any).webkitCancelFullScreen = function () {};
    (win.__WUJIE.proxy.document as any).msExitFullscreen = function () {};

    patchFullscreenEffect(win);

    const appDoc = win.__WUJIE.proxy.document as any;
    appDoc.mozCancelFullScreen();
    appDoc.webkitCancelFullScreen();

    expect(mainDoc.mozCancelFullScreen).toHaveBeenCalled();
    expect(mainDoc.webkitCancelFullScreen).toHaveBeenCalled();
  });

  test("should delegate fullscreenElement/fullscreenEnabled properties", () => {
    const win = createMockIframeWindow();

    patchFullscreenEffect(win);

    const appDoc = win.__WUJIE.proxy.document as any;
    expect(appDoc.fullscreenEnabled).toBe(true);
    expect(appDoc.webkitFullscreenEnabled).toBe(true);
    expect(appDoc.fullscreenElement).toBe(null);
  });

  test("should set __fullscreenPatched__ marker to prevent double-patch", () => {
    const win = createMockIframeWindow();
    const mainDocEl = win.parent.document.documentElement as any;

    patchFullscreenEffect(win);
    const countBefore = mainDocEl.requestFullscreen.mock.calls.length;

    // 第二次调用不应再次替换
    patchFullscreenEffect(win);

    const appDocEl = win.__WUJIE.proxy.document.documentElement as any;
    appDocEl.requestFullscreen();
    expect(mainDocEl.requestFullscreen).toHaveBeenCalledTimes(countBefore + 1);
  });

  test("should use hasOwnProperty for marker check", () => {
    const win = createMockIframeWindow();

    expect(Object.prototype.hasOwnProperty.call(win.__WUJIE, "__fullscreenPatched__")).toBe(false);

    patchFullscreenEffect(win);

    expect(Object.prototype.hasOwnProperty.call(win.__WUJIE, "__fullscreenPatched__")).toBe(true);
  });

  test("should not throw when appDoc property is undefined", () => {
    const win = createMockIframeWindow();
    // 移除 appDoc 上的 fullscreen 属性
    const appDoc = win.__WUJIE.proxy.document as any;
    delete appDoc.fullscreenElement;
    delete appDoc.fullscreenEnabled;

    expect(() => patchFullscreenEffect(win)).not.toThrow();
  });
});
