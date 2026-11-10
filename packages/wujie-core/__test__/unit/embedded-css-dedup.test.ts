/**
 * 关联 issue: https://github.com/Tencent/wujie/issues/1108
 *
 * 场景：Vite 8 生产构建的子应用，入口 HTML 里既有静态 <link rel=stylesheet>，
 * 异步 chunk 的 __vite__mapDeps 又会把同一份 CSS 再 preload 一次。
 *
 *   1. wujie 解析入口 HTML 时把该 <link> 转成 <style>（getEmbedHTML）；
 *   2. Vite 的 __vitePreload 去重只看 document 里的 link[rel=stylesheet][href]，
 *      认不出已经被转成 <style> 的节点，于是再次 document.createElement('link') 插入同一 href；
 *   3. wujie 再把第二个 link 转成 <style> —— 同一份 CSS 出现两层，后一层会盖住前一层
 *      已经生效的层叠顺序（默认宽高盖住原子类）。
 *
 * 修复：getEmbedHTML 给嵌入的 <style> 打 data-wujie-css-href；loadStyleSheet 按该属性
 * （以及 data-wujie-css-href 占位节点）去重，命中时不再插入，但仍然派发 load 事件，
 * 保证 Vite 的 preload promise 能 resolve。
 */

export {};

const { patchRenderEffect } = require("../../src/effect");
const { addSandboxCacheWithWujie, deleteWujieById } = require("../../src/common");

const ID = "embedded-css-dedup";
const CUR_URL = "http://child-app.example.com/";
const CSS_HREF = CUR_URL + "assets/app.css";

function createSandbox(iframeDocument: Document) {
  return {
    id: ID,
    degrade: true,
    fiber: false,
    plugins: [],
    replace: undefined,
    lifecycles: {},
    styleSheetElements: [] as HTMLStyleElement[],
    proxyLocation: new URL(CUR_URL),
    shadowRoot: null,
    iframe: { contentDocument: iframeDocument, contentWindow: iframeDocument.defaultView },
    fetch: jest.fn(async () => ({ status: 200, text: async () => ".box{width:100%;height:100%}" })),
  };
}

function createRenderDocument(): Document {
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  return iframe.contentDocument as Document;
}

function createLink(href: string): HTMLLinkElement {
  const link = document.createElement("link");
  link.setAttribute("rel", "stylesheet");
  link.setAttribute("href", href);
  return link;
}

function stylesFor(renderDocument: Document, href: string): HTMLStyleElement[] {
  return Array.from(renderDocument.querySelectorAll("style")).filter(
    (styleElement) => styleElement.getAttribute("data-wujie-css-href") === href
  ) as HTMLStyleElement[];
}

describe("loadStyleSheet / 入口 HTML 已嵌入的 CSS 不应被动态 link 再插一层", () => {
  let renderDocument: Document;
  let sandbox: any;

  beforeEach(() => {
    renderDocument = createRenderDocument();
    sandbox = createSandbox(renderDocument);
    addSandboxCacheWithWujie(ID, sandbox);
    patchRenderEffect(renderDocument, ID, true);
  });

  afterEach(() => {
    deleteWujieById(ID);
    renderDocument.defaultView?.frameElement?.remove();
  });

  it("同一 href 已由入口 HTML 嵌入时，动态 link 不再插入第二份 style", async () => {
    const embedded = document.createElement("style");
    embedded.setAttribute("data-wujie-css-href", CSS_HREF);
    embedded.textContent = ".box{width:100%;height:100%}";
    renderDocument.head.appendChild(embedded);

    const link = createLink("/assets/app.css");
    const onload = jest.fn();
    link.addEventListener("load", onload);
    renderDocument.head.appendChild(link);
    // load 事件在 nextTick 派发，给 Vite 的 preload promise 留出注册监听的时间
    await Promise.resolve();
    await Promise.resolve();

    const inserted = stylesFor(renderDocument, CSS_HREF);
    expect(inserted).toHaveLength(1);
    // 命中的是入口 HTML 嵌入的那一份，没有新增副本
    expect(inserted[0]).toBe(embedded);
    expect(sandbox.styleSheetElements).toHaveLength(1);
    // load 事件仍要派发，Vite 的 preload promise 依赖它
    expect(onload).toHaveBeenCalledTimes(1);
  });

  it("入口 HTML 没有该 href 时，动态 link 正常插入一份带 data-wujie-css-href 的 style", async () => {
    const link = createLink("/assets/app.css");
    const onload = jest.fn();
    link.addEventListener("load", onload);
    renderDocument.head.appendChild(link);
    await new Promise((resolve) => setTimeout(resolve, 20));

    const inserted = stylesFor(renderDocument, CSS_HREF);
    expect(inserted).toHaveLength(1);
    expect(onload).toHaveBeenCalledTimes(1);
    expect(sandbox.styleSheetElements).toContain(inserted[0]);
  });

  it("同一 href 的两个动态 link 只插入一份 style", async () => {
    const first = createLink("/assets/app.css");
    const second = createLink("/assets/app.css");
    renderDocument.head.appendChild(first);
    renderDocument.head.appendChild(second);
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(stylesFor(renderDocument, CSS_HREF)).toHaveLength(1);
  });
});
