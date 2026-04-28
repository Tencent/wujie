/**
 * 单元测试：styleSheetElements 在子应用反复 unmount/mount 时单调增长的问题。
 *
 * 主要面向：
 * - notes/memory-leak-investigation.md §1.2
 *   `effect.ts` rewriteAppendOrInsertChild 在 LINK / STYLE 分支
 *   `sandbox.styleSheetElements.push(stylesheetElement)`，但 sandbox.unmount()
 *   只 clearChild(head/body)，没清空 styleSheetElements 数组本身。
 *   非保活子应用反复进出页面时，rebuildStyleSheets 会持续累加旧引用，
 *   也会让被废弃的 style 节点无法 GC（被数组持有）。
 *
 * 修复目标：
 *   - 引入 Wujie.prototype.clearStyleSheetsForUnmount()
 *   - 非保活时清空数组（next mount 由子应用 __WUJIE_MOUNT 自然重建动态样式）
 *   - 保活时保留（rebuildStyleSheets 复用）
 */

export {};

const Sandbox = require("../../src/sandbox").default;

function createMinimalSandbox(alive: boolean): any {
  // 只挑 unmount 链路相关字段构造，避免触发完整 Wujie 构造器（依赖 iframe / fetch）
  const sandbox = Object.create(Sandbox.prototype);
  sandbox.alive = alive;
  sandbox.styleSheetElements = [];
  return sandbox;
}

describe("§1.2 styleSheetElements unmount 清理", () => {
  test("Wujie.prototype.clearStyleSheetsForUnmount 应被实现为公开方法", () => {
    expect(typeof Sandbox.prototype.clearStyleSheetsForUnmount).toBe("function");
  });

  test("非保活子应用 unmount 时应清空 styleSheetElements", () => {
    const sandbox = createMinimalSandbox(false);
    const fakeStyle1 = document.createElement("style");
    const fakeStyle2 = document.createElement("style");
    sandbox.styleSheetElements.push(fakeStyle1, fakeStyle2);

    sandbox.clearStyleSheetsForUnmount();

    expect(sandbox.styleSheetElements).toEqual([]);
  });

  test("保活子应用 unmount 时应保留 styleSheetElements 以便 rebuildStyleSheets", () => {
    const sandbox = createMinimalSandbox(true);
    const fakeStyle = document.createElement("style");
    sandbox.styleSheetElements.push(fakeStyle);

    sandbox.clearStyleSheetsForUnmount();

    expect(sandbox.styleSheetElements).toEqual([fakeStyle]);
  });

  test("clearStyleSheetsForUnmount 应保留数组引用（仅清空内容），避免外部缓存 stale 引用", () => {
    const sandbox = createMinimalSandbox(false);
    const arrayRef = sandbox.styleSheetElements;
    arrayRef.push(document.createElement("style"));

    sandbox.clearStyleSheetsForUnmount();

    expect(sandbox.styleSheetElements).toBe(arrayRef);
    expect(arrayRef.length).toBe(0);
  });
});
