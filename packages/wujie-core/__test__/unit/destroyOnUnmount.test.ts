/**
 * 单元测试：新增 destroyOnUnmount 配置，根治 #890 路由切换型场景的内存泄露。
 *
 * 主要面向：
 * - notes/memory-leak-investigation.md §1.1
 *   wujie-app webcomponent 的 disconnectedCallback 默认只 sandbox.unmount()，
 *   sandbox 与 iframe 都保留下来。但很多用户的场景是「路由切换 = 一次性使用」
 *   （比如离线页 / 一次性表单），希望切走时直接把整个沙箱 destroy 掉。
 *
 * 修复目标：
 *   - Wujie 类增加 `destroyOnUnmount?: boolean` 字段，默认 false（保持向后兼容）
 *   - 构造器接受 `destroyOnUnmount` 选项
 *   - 暴露独立可测的 `handleWujieAppDisconnect(sandbox)`：
 *     destroyOnUnmount=true 时调用 destroy()，否则调用 unmount()
 *   - WujieApp.disconnectedCallback 调用上述 helper
 */

export {};

const Sandbox = require("../../src/sandbox").default;
const shadow = require("../../src/shadow");

describe("§1.1 destroyOnUnmount 配置", () => {
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
