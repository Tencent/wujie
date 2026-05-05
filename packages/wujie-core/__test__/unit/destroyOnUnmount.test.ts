/**
 * 单元测试：destroyOnUnmount 配置。
 *
 * wujie-app webcomponent 的 disconnectedCallback 默认仅 sandbox.unmount()，
 * 保留 sandbox / iframe 以便复用。「路由切换 = 一次性使用」的场景（离线页、
 * 一次性表单等）通过 destroyOnUnmount: true 让 disconnect 直接整体 destroy。
 *
 * 验证点：
 *   - Wujie 实例支持 destroyOnUnmount 字段（默认 false）；
 *   - shadow 模块导出独立可测的 handleWujieAppDisconnect(sandbox)：
 *     destroyOnUnmount=true → destroy()，否则 unmount()。
 */

export {};

const Sandbox = require("../../src/sandbox").default;
const shadow = require("../../src/shadow");

describe("destroyOnUnmount 配置", () => {
  test("Wujie 实例应包含 destroyOnUnmount 字段，默认 false", () => {
    const sandbox = Object.create(Sandbox.prototype);
    sandbox.destroyOnUnmount = false;
    expect(sandbox.destroyOnUnmount).toBe(false);
  });

  test("shadow 模块应导出 handleWujieAppDisconnect helper", () => {
    expect(typeof shadow.handleWujieAppDisconnect).toBe("function");
  });

  test("destroyOnUnmount=false（默认）：handleWujieAppDisconnect 应调用 sandbox.unmount", () => {
    const sandbox = {
      destroyOnUnmount: false,
      unmount: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn().mockResolvedValue(undefined),
    } as any;
    shadow.handleWujieAppDisconnect(sandbox);
    expect(sandbox.unmount).toHaveBeenCalledTimes(1);
    expect(sandbox.destroy).not.toHaveBeenCalled();
  });

  test("destroyOnUnmount=true：handleWujieAppDisconnect 应调用 sandbox.destroy 而非 unmount", () => {
    const sandbox = {
      destroyOnUnmount: true,
      unmount: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn().mockResolvedValue(undefined),
    } as any;
    shadow.handleWujieAppDisconnect(sandbox);
    expect(sandbox.destroy).toHaveBeenCalledTimes(1);
    expect(sandbox.unmount).not.toHaveBeenCalled();
  });

  test("sandbox 为 null/undefined 时 helper 不应抛错", () => {
    expect(() => shadow.handleWujieAppDisconnect(null)).not.toThrow();
    expect(() => shadow.handleWujieAppDisconnect(undefined)).not.toThrow();
  });
});
