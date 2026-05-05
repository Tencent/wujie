/**
 * 契约测试：sandbox.unmount() 必须保留 styleSheetElements / dynamicScriptElements，
 * 让 sandbox.rebuildStyleSheets() 在重新激活时能继续复用样式节点。
 *
 * 子应用的 JS 模块（webpack/vite css-loader、css-in-js、styled-components 等）
 * 只在 sandbox.start() 阶段执行一次，之后 unmount → active 反复触发 mount，
 * 模块代码不会再跑，也就不会再生成新的动态样式 / 脚本节点。这两个数组里登记
 * 的旧节点是 rebuildStyleSheets 的唯一来源。
 *
 * 典型踩坑场景：preloadApp 完成后第一次 startApp 同名应用，会先 unmount → active
 * → rebuildStyleSheets。如果 unmount 中清空了数组，rebuildStyleSheets 就没有
 * 可复用的样式节点，子应用样式全丢；刷新主应用走 newSandbox 路径不经过 unmount，
 * 又能正常显示，问题不易复现。
 */

export {};

const Sandbox = require("../../src/sandbox").default;

function buildUnmountReadySandbox(alive: boolean): any {
  const sandbox = Object.create(Sandbox.prototype);
  sandbox.alive = alive;
  sandbox.activeFlag = true;
  sandbox.mountFlag = true;
  sandbox.hrefFlag = false;
  sandbox.degrade = false;
  sandbox.lifecycles = {};
  sandbox.bus = { $clear: jest.fn() };
  // shadowRoot / head / body 用普通 div 充当，clearChild 只关心 children；
  // effect.ts removeEventListener 会读 element._cacheListeners.entries()，预置空 Map
  sandbox.shadowRoot = document.createElement("div");
  sandbox.head = Object.assign(document.createElement("div"), { _cacheListeners: new Map() });
  sandbox.body = Object.assign(document.createElement("div"), { _cacheListeners: new Map() });
  sandbox.iframe = {
    contentWindow: {
      __WUJIE_UNMOUNT: jest.fn().mockResolvedValue(undefined),
    },
  };
  sandbox.styleSheetElements = [];
  sandbox.dynamicScriptElements = [];
  return sandbox;
}

describe("sandbox.unmount() 与 rebuildStyleSheets 的复用契约", () => {
  test("非保活 sandbox.unmount() 后 styleSheetElements 应保留以供 rebuildStyleSheets 复用", async () => {
    const sandbox = buildUnmountReadySandbox(false);
    const dynamicStyle = document.createElement("style");
    dynamicStyle.textContent = ".pre { color: red }";
    sandbox.styleSheetElements.push(dynamicStyle);

    await sandbox.unmount();

    expect(sandbox.styleSheetElements).toContain(dynamicStyle);
  });

  test("非保活 sandbox.unmount() 后 dynamicScriptElements 应保留（模块只 init 一次，不会被 unmount 反复清）", async () => {
    const sandbox = buildUnmountReadySandbox(false);
    const dynamicScript = document.createElement("script");
    dynamicScript.textContent = "/* webpack chunk */";
    sandbox.dynamicScriptElements.push(dynamicScript);

    await sandbox.unmount();

    expect(sandbox.dynamicScriptElements).toContain(dynamicScript);
  });

  test("rebuildStyleSheets 在 unmount 后应能把数组中的样式节点重新 appendChild 到 shadowRoot.head", async () => {
    const sandbox = buildUnmountReadySandbox(false);
    // 构造 minimal shadowRoot：rebuildStyleSheets 走非降级分支访问 shadowRoot.head；
    // 紧跟着 patchCssRules 会查 shadowRoot.host.hasAttribute，host 用真 div 占位即可。
    const fakeShadowRoot: any = document.createElement("div");
    fakeShadowRoot.head = document.createElement("div");
    fakeShadowRoot.host = document.createElement("div");
    sandbox.shadowRoot = fakeShadowRoot;
    sandbox.iframe.contentDocument = { querySelectorAll: () => [] };

    const styleA = document.createElement("style");
    const styleB = document.createElement("style");
    sandbox.styleSheetElements.push(styleA, styleB);

    await sandbox.unmount();
    sandbox.rebuildStyleSheets();

    expect(fakeShadowRoot.head.children).toHaveLength(2);
    expect(fakeShadowRoot.head.children[0]).toBe(styleA);
    expect(fakeShadowRoot.head.children[1]).toBe(styleB);
  });
});
