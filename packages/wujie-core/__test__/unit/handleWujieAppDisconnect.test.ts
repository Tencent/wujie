/**
 * 单元测试：handleWujieAppDisconnect 按运行模式自动决定 destroy / unmount。
 *
 * wujie-app webcomponent 的 disconnectedCallback 不再依赖业务传入的配置，而是按
 * 三种运行模式自动判定：
 *   - 保活模式（alive）：仅 unmount，保留 sandbox / iframe 复用；
 *   - 单例模式（非保活但做了生命周期改造，存在 __WUJIE_MOUNT）：仅 unmount，sandbox 复用；
 *   - 重建模式（非保活且未做生命周期改造）：直接 destroy，避免 sandbox / iframe 长期驻留累积。
 */

export {};

const shadow = require("../../src/shadow");

function createMockSandbox({ alive, hasMount }: { alive: boolean; hasMount: boolean }) {
  return {
    alive,
    iframe: {
      contentWindow: {
        __WUJIE_MOUNT: hasMount ? () => undefined : undefined,
      },
    },
    unmount: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
  } as any;
}

describe("handleWujieAppDisconnect 运行模式判定", () => {
  test("shadow 模块应导出 handleWujieAppDisconnect helper", () => {
    expect(typeof shadow.handleWujieAppDisconnect).toBe("function");
  });

  test("保活模式（alive=true）：应仅 unmount，不 destroy", () => {
    const sandbox = createMockSandbox({ alive: true, hasMount: true });
    shadow.handleWujieAppDisconnect(sandbox);
    expect(sandbox.unmount).toHaveBeenCalledTimes(1);
    expect(sandbox.destroy).not.toHaveBeenCalled();
  });

  test("单例模式（非保活 + 存在 __WUJIE_MOUNT）：应仅 unmount，不 destroy", () => {
    const sandbox = createMockSandbox({ alive: false, hasMount: true });
    shadow.handleWujieAppDisconnect(sandbox);
    expect(sandbox.unmount).toHaveBeenCalledTimes(1);
    expect(sandbox.destroy).not.toHaveBeenCalled();
  });

  test("重建模式（非保活 + 无 __WUJIE_MOUNT）：应直接 destroy，不 unmount", () => {
    const sandbox = createMockSandbox({ alive: false, hasMount: false });
    shadow.handleWujieAppDisconnect(sandbox);
    expect(sandbox.destroy).toHaveBeenCalledTimes(1);
    expect(sandbox.unmount).not.toHaveBeenCalled();
  });

  test("sandbox 为 null/undefined 时 helper 不应抛错", () => {
    expect(() => shadow.handleWujieAppDisconnect(null)).not.toThrow();
    expect(() => shadow.handleWujieAppDisconnect(undefined)).not.toThrow();
  });
});
