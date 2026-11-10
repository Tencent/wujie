/**
 * 关联 issue: https://github.com/Tencent/wujie/issues/1111
 *
 * 场景：同一子应用并发调用 startApp（典型触发：React 18/19 <StrictMode> 在 dev 下把 effect
 * 跑两次，挂载 → 卸载 → 再挂载）。首次调用还在 importHTML 时，sandbox 已经在构造时登记到缓存，
 * 第二次调用直接命中「已经初始化过的应用，快速渲染」分支，而该分支拿不到 template：
 *
 *   1. sandbox.active 里 `this.template = template ?? this.template` 依旧是 undefined；
 *   2. renderTemplateToHtml 里 `parser.parseFromString(undefined, "text/html")` 和
 *      `html.innerHTML = undefined` 会把参数强转成字符串，容器里出现字面量 "undefined"；
 *   3. 首次调用的真实模板到达时，因为 shadowRoot 已经存在（保活分支提前 return）不再重渲染，
 *      结果是容器一直停在 "undefined"，子应用挂载时拿不到节点（getElementById 为 null）。
 *
 * 修复：startApp 按 name 串行（后一次等前一次渲染完成）；
 * renderTemplateToShadowRoot / renderTemplateToIframe 对空 template 提前 return。
 */

export {};

const { startApp } = require("../../src/index");
const { addSandboxCacheWithWujie, deleteWujieById } = require("../../src/common");
const { renderTemplateToShadowRoot, renderTemplateToIframe } = require("../../src/shadow");

const NAME = "concurrent-start-app";

function createSandbox() {
  const timeline: string[] = [];
  const sandbox: any = {
    alive: true,
    execFlag: true,
    iframe: { contentWindow: {} },
    lifecycles: {},
    active: jest.fn(async () => {
      timeline.push("active:start");
      await new Promise((resolve) => setTimeout(resolve, 30));
      timeline.push("active:end");
    }),
    destroy: jest.fn(async () => {}),
  };
  return { sandbox, timeline };
}

function startOptions() {
  return { name: NAME, url: "http://localhost:3001", el: document.createElement("div"), alive: true };
}

describe("startApp 并发启动 / 空模板渲染", () => {
  afterEach(() => {
    deleteWujieById(NAME);
  });

  it("同名子应用并发 startApp 应串行执行 sandbox.active，不能交错", async () => {
    const { sandbox, timeline } = createSandbox();
    addSandboxCacheWithWujie(NAME, sandbox);

    // 模拟 StrictMode 双挂载：两次调用几乎同时发生
    await Promise.all([startApp(startOptions()), startApp(startOptions())]);

    expect(sandbox.active).toHaveBeenCalledTimes(2);
    // 交错的话会得到 start/start/end/end
    expect(timeline).toEqual(["active:start", "active:end", "active:start", "active:end"]);
  });

  it("前一次启动失败不应阻塞后一次启动", async () => {
    const { sandbox } = createSandbox();
    sandbox.active.mockImplementationOnce(async () => {
      throw new Error("boom");
    });
    addSandboxCacheWithWujie(NAME, sandbox);

    const first = startApp(startOptions());
    const second = startApp(startOptions());

    await expect(first).rejects.toThrow("boom");
    await expect(second).resolves.toBeInstanceOf(Function);
    expect(sandbox.active).toHaveBeenCalledTimes(2);
  });

  it("template 为空时不应把字面量 undefined 渲染进 shadowRoot", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const shadowRoot = host.attachShadow({ mode: "open" });

    await renderTemplateToShadowRoot(shadowRoot, window as any, undefined as any);
    expect(shadowRoot.textContent).toBe("");

    await renderTemplateToShadowRoot(shadowRoot, window as any, "");
    expect(shadowRoot.textContent).toBe("");

    host.remove();
  });

  it("template 为空时不应渲染降级 iframe 文档", async () => {
    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    const renderDocument = iframe.contentDocument as Document;
    const before = renderDocument.documentElement.outerHTML;

    await renderTemplateToIframe(renderDocument, iframe.contentWindow as any, undefined as any);

    expect(renderDocument.documentElement.outerHTML).toBe(before);
    iframe.remove();
  });
});
