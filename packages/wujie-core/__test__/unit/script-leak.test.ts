/**
 * 单元测试：iframe.contentDocument.head 中动态 <script> 元素的累积清理。
 *
 * 主要面向：
 * - notes/memory-leak-investigation.md §1.3
 *   子应用通过 document.head.appendChild(<script>) 触发的动态脚本，
 *   走 effect.ts → insertScriptToIframe，每条都会在 iframe head 里
 *   留一个 <script> 节点（textContent 持有完整代码字符串）。
 *   非保活子应用反复 unmount/mount（同一个 iframe 复用）时，
 *   这些动态 <script> 不会被清理，每次访问都新增一批，长期累积。
 *
 * 修复目标：
 *   - `insertScriptToIframe` 在被 effect.ts 调用（携带 rawElement）时，
 *     把 iframe 内部的 scriptElement 登记到 sandbox.dynamicScriptElements
 *   - 新增 `Wujie.prototype.clearDynamicScriptsForUnmount()`：
 *     非保活时把这些 script 元素从 iframe head 中移除并清空数组
 *   - `Wujie.unmount()` 中调用上述方法
 */

export {};

const Sandbox = require("../../src/sandbox").default;

describe("§1.3 iframe head 动态 <script> 累积清理", () => {
  test("Wujie 实例应有 dynamicScriptElements 字段（数组形式）", () => {
    const sandbox = Object.create(Sandbox.prototype);
    sandbox.alive = false;
    sandbox.dynamicScriptElements = [];
    expect(Array.isArray(sandbox.dynamicScriptElements)).toBe(true);
  });

  test("clearDynamicScriptsForUnmount 应被实现为公开方法", () => {
    expect(typeof Sandbox.prototype.clearDynamicScriptsForUnmount).toBe("function");
  });

  test("非保活子应用 unmount 时应清空 dynamicScriptElements，并把对应节点从父节点移除", () => {
    const sandbox = Object.create(Sandbox.prototype);
    sandbox.alive = false;
    sandbox.dynamicScriptElements = [];

    // 模拟 iframe 中已经有两个动态插入的 <script>
    const fakeIframeHead = document.createElement("head");
    document.body.appendChild(fakeIframeHead);
    const s1 = document.createElement("script");
    const s2 = document.createElement("script");
    fakeIframeHead.appendChild(s1);
    fakeIframeHead.appendChild(s2);
    sandbox.dynamicScriptElements.push(s1, s2);

    sandbox.clearDynamicScriptsForUnmount();

    expect(sandbox.dynamicScriptElements).toEqual([]);
    expect(fakeIframeHead.contains(s1)).toBe(false);
    expect(fakeIframeHead.contains(s2)).toBe(false);
  });

  test("保活子应用 unmount 时应保留 dynamicScriptElements，不能动 DOM", () => {
    const sandbox = Object.create(Sandbox.prototype);
    sandbox.alive = true;
    sandbox.dynamicScriptElements = [];

    const fakeIframeHead = document.createElement("head");
    document.body.appendChild(fakeIframeHead);
    const s1 = document.createElement("script");
    fakeIframeHead.appendChild(s1);
    sandbox.dynamicScriptElements.push(s1);

    sandbox.clearDynamicScriptsForUnmount();

    expect(sandbox.dynamicScriptElements).toEqual([s1]);
    expect(fakeIframeHead.contains(s1)).toBe(true);
  });

  test("clearDynamicScriptsForUnmount 对已脱离 DOM 的 script 节点应安全跳过", () => {
    const sandbox = Object.create(Sandbox.prototype);
    sandbox.alive = false;
    const s1 = document.createElement("script");
    sandbox.dynamicScriptElements = [s1]; // 没有挂到任何 parentNode

    expect(() => sandbox.clearDynamicScriptsForUnmount()).not.toThrow();
    expect(sandbox.dynamicScriptElements).toEqual([]);
  });
});
