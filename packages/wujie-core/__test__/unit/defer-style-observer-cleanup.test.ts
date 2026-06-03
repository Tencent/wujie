/**
 * sandbox.clearDeferredStyleObservers() 在 destroy 路径上的清理行为。
 *
 * 动态 <link> 以空 href 插入时（如 tinymce），effect.ts 会注册 MutationObserver 监听
 * href 赋值并登记到 sandbox.deferredStyleObservers。若子应用在 href 赋值前被销毁，
 * destroy 必须统一 disconnect 这些 observer，否则游离 link → registered observer →
 * 回调闭包链路会把已销毁的 sandbox 钉在内存中。
 */

export {};

const Sandbox = require("../../src/sandbox").default;

function createMinimalSandbox(): any {
  const sandbox = Object.create(Sandbox.prototype);
  sandbox.deferredStyleObservers = [];
  return sandbox;
}

describe("deferredStyleObservers destroy 时的清理", () => {
  test("Wujie.prototype.clearDeferredStyleObservers 应作为公开方法存在", () => {
    expect(typeof Sandbox.prototype.clearDeferredStyleObservers).toBe("function");
  });

  test("clearDeferredStyleObservers 应 disconnect 全部 observer 并清空数组", () => {
    const sandbox = createMinimalSandbox();
    const o1 = { disconnect: jest.fn() };
    const o2 = { disconnect: jest.fn() };
    sandbox.deferredStyleObservers.push(o1, o2);

    sandbox.clearDeferredStyleObservers();

    expect(o1.disconnect).toHaveBeenCalledTimes(1);
    expect(o2.disconnect).toHaveBeenCalledTimes(1);
    expect(sandbox.deferredStyleObservers).toEqual([]);
  });

  test("某个 observer.disconnect 抛错不应中断后续清理", () => {
    const sandbox = createMinimalSandbox();
    const bad = {
      disconnect: jest.fn(() => {
        throw new Error("boom");
      }),
    };
    const good = { disconnect: jest.fn() };
    sandbox.deferredStyleObservers.push(bad, good);

    expect(() => sandbox.clearDeferredStyleObservers()).not.toThrow();
    expect(good.disconnect).toHaveBeenCalledTimes(1);
    expect(sandbox.deferredStyleObservers).toEqual([]);
  });

  test("clearDeferredStyleObservers 应保留数组引用（仅清空内容）", () => {
    const sandbox = createMinimalSandbox();
    const arrayRef = sandbox.deferredStyleObservers;
    arrayRef.push({ disconnect: jest.fn() });

    sandbox.clearDeferredStyleObservers();

    expect(sandbox.deferredStyleObservers).toBe(arrayRef);
    expect(arrayRef.length).toBe(0);
  });
});
