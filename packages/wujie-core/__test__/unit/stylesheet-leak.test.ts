/**
 * sandbox.clearStyleSheets() 在 destroy 路径上的清理行为。
 *
 * unmount 阶段必须保留 styleSheetElements，sandbox.rebuildStyleSheets() 重新激活
 * 时要从中复用样式节点（子应用 JS 模块只 init 一次，模块代码不会再生成样式）。
 * destroy 阶段才统一清空数组并把节点从父节点 detach。
 */

export {};

const Sandbox = require("../../src/sandbox").default;

function createMinimalSandbox(): any {
  // 只挑 clear* 调用相关字段构造，避免触发完整 Wujie 构造器
  const sandbox = Object.create(Sandbox.prototype);
  sandbox.styleSheetElements = [];
  return sandbox;
}

describe("styleSheetElements destroy 时的清理", () => {
  test("Wujie.prototype.clearStyleSheets 应作为公开方法存在", () => {
    expect(typeof Sandbox.prototype.clearStyleSheets).toBe("function");
  });

  test("clearStyleSheets 应清空数组，并把已挂在父节点上的样式节点 detach 掉", () => {
    const sandbox = createMinimalSandbox();
    const parent = document.createElement("div");
    const styleA = document.createElement("style");
    const styleB = document.createElement("style");
    parent.append(styleA, styleB);
    sandbox.styleSheetElements.push(styleA, styleB);

    sandbox.clearStyleSheets();

    expect(sandbox.styleSheetElements).toEqual([]);
    expect(parent.children).toHaveLength(0);
  });

  test("clearStyleSheets 对数组中已脱离父节点的样式节点应安全跳过", () => {
    const sandbox = createMinimalSandbox();
    const orphan = document.createElement("style");
    sandbox.styleSheetElements.push(orphan);

    expect(() => sandbox.clearStyleSheets()).not.toThrow();
    expect(sandbox.styleSheetElements).toEqual([]);
  });

  test("clearStyleSheets 应保留数组引用（仅清空内容），避免外部缓存 stale 引用", () => {
    const sandbox = createMinimalSandbox();
    const arrayRef = sandbox.styleSheetElements;
    arrayRef.push(document.createElement("style"));

    sandbox.clearStyleSheets();

    expect(sandbox.styleSheetElements).toBe(arrayRef);
    expect(arrayRef.length).toBe(0);
  });
});
