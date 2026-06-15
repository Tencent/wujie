/**
 * sandbox.clearDynamicScripts() 在 destroy 路径上的清理行为。
 *
 * 子应用 JS 模块只在 sandbox.start() 阶段 init 一次，反复 unmount 不会再次 push
 * dynamic script，数组只在 destroy 阶段需要随 sandbox 一起释放。
 */

export {};

const Sandbox = require("../../src/sandbox").default;

function createMinimalSandbox(): any {
  const sandbox = Object.create(Sandbox.prototype);
  sandbox.dynamicScriptElements = [];
  return sandbox;
}

describe("dynamicScriptElements destroy 时的清理", () => {
  test("Wujie 实例应有 dynamicScriptElements 字段（数组形式）", () => {
    const sandbox = createMinimalSandbox();
    expect(Array.isArray(sandbox.dynamicScriptElements)).toBe(true);
  });

  test("Wujie.prototype.clearDynamicScripts 应作为公开方法存在", () => {
    expect(typeof Sandbox.prototype.clearDynamicScripts).toBe("function");
  });

  test("clearDynamicScripts 应清空数组并把已挂在父节点上的 <script> 节点移除", () => {
    const sandbox = createMinimalSandbox();
    const head = document.createElement("div");
    const s1 = document.createElement("script");
    const s2 = document.createElement("script");
    head.append(s1, s2);
    sandbox.dynamicScriptElements.push(s1, s2);

    sandbox.clearDynamicScripts();

    expect(sandbox.dynamicScriptElements).toEqual([]);
    expect(head.children).toHaveLength(0);
  });

  test("clearDynamicScripts 对已脱离 DOM 的 script 节点应安全跳过", () => {
    const sandbox = createMinimalSandbox();
    const orphan = document.createElement("script");
    sandbox.dynamicScriptElements.push(orphan);

    expect(() => sandbox.clearDynamicScripts()).not.toThrow();
    expect(sandbox.dynamicScriptElements).toEqual([]);
  });
});
