/**
 * 关联 issue: https://github.com/Tencent/wujie/issues/1111
 *
 * 场景：同一子应用并发触发两次 startApp（典型：React 18/19 StrictMode 在 dev 下
 * effect 挂载→卸载→再挂载，两次间隔极短），第二次调用在首次 importHTML 尚未完成时
 * 命中「已初始化，快速渲染」分支。该分支调用 sandbox.active 时未传 template，
 * active 内 this.template = template ?? this.template 回退为 undefined，随后
 * renderTemplateToShadowRoot / renderTemplateToIframe 对 undefined 模板执行
 * parseFromString(undefined) → 强转成字面量 "undefined"，子应用容器闪现 undefined 文本。
 *
 * 修复：两个渲染入口对空模板提前 return，等真实模板到达后再渲染。
 */

export {};

// shadow.ts 依赖的模块逐个 stub 成空，保证模块可加载；空模板路径不触碰这些依赖。
jest.mock("../../src/constant", () => ({}), { virtual: true });
jest.mock(
  "../../src/common",
  () => ({
    getWujieById: () => null,
    rawAppendChild: (a: any, b: any) => a.appendChild(b),
    rawElementAppendChild: (a: any, b: any) => a.appendChild(b),
    rawElementRemoveChild: (a: any, b: any) => a.removeChild(b),
    relativeElementTagAttrMap: {},
  }),
  { virtual: true }
);
jest.mock("../../src/entry", () => ({ getExternalStyleSheets: () => [] }), { virtual: true });
jest.mock("../../src/sandbox", () => ({ default: class {} }), { virtual: true });
jest.mock("../../src/iframe", () => ({ initBase: () => {}, patchElementEffect: () => {} }), { virtual: true });
jest.mock("../../src/effect", () => ({ patchRenderEffect: () => {} }), { virtual: true });
jest.mock("../../src/plugin", () => ({ getCssLoader: () => null, getPresetLoaders: () => [] }), { virtual: true });
jest.mock(
  "../../src/utils",
  () => ({
    getAbsolutePath: (u: string) => u,
    getContainer: (e: any) => e,
    getCurUrl: () => "",
    isFunction: (f: any) => typeof f === "function",
    setAttrsToElement: () => {},
    warn: () => {},
  }),
  { virtual: true }
);

const { renderTemplateToShadowRoot, renderTemplateToIframe } = require("../../src/shadow");

describe("renderTemplateToShadowRoot / renderTemplateToIframe 对空模板的防御（issue #1111）", () => {
  test("renderTemplateToShadowRoot 传空模板时直接返回，不向 shadowRoot 添加 undefined 文本", async () => {
    const host = document.createElement("div");
    const shadowRoot = host.attachShadow({ mode: "open" });
    const iframeWindow = { __WUJIE: {} } as any;

    // undefined 模板（并发 startApp 时的实际形态）
    await expect(renderTemplateToShadowRoot(shadowRoot, iframeWindow, undefined as any)).resolves.toBeUndefined();
    // 空字符串模板同样跳过
    await expect(renderTemplateToShadowRoot(shadowRoot, iframeWindow, "")).resolves.toBeUndefined();

    // 容器里不应出现任何子节点（没有 "undefined" 文本、没有 html 节点）
    expect(shadowRoot.childNodes.length).toBe(0);
    expect(shadowRoot.textContent).toBe("");
  });

  test("renderTemplateToIframe 传空模板时 resolve 且不污染渲染文档", async () => {
    const renderDocument = document.implementation.createHTMLDocument();
    const iframeWindow = { __WUJI: {} } as any;

    await expect(renderTemplateToIframe(renderDocument, iframeWindow, undefined as any)).resolves.toBeUndefined();
    await expect(renderTemplateToIframe(renderDocument, iframeWindow, "")).resolves.toBeUndefined();

    // documentElement 应保持原样，没有被替换成 "undefined" 文本
    expect(renderDocument.documentElement.textContent).toBe("");
    expect(renderDocument.body.childNodes.length).toBe(0);
  });
});
