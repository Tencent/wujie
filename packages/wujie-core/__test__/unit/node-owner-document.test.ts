/**
 * 未打实例补丁的子应用节点（cloneNode、innerHTML 等产生）的 ownerDocument / baseURI
 * 应与 createElement 创建的节点一致：指向子应用 document / 子应用地址。
 */

export {};

const { patchNodeOwnerDocument, patchElementEffect } = require("../../src/iframe");

describe("patchNodeOwnerDocument", () => {
  let iframe: HTMLIFrameElement;
  let iframeWindow: Window;
  let iframeDocument: Document;

  function setup(sandbox: Record<string, any>) {
    iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    iframeWindow = iframe.contentWindow;
    iframeDocument = iframe.contentDocument;
    (iframeWindow as any).__WUJIE = {
      plugins: [],
      proxyLocation: { protocol: "https:", host: "sub.example.com", pathname: "/app/index.html" },
      ...sandbox,
    };
    patchNodeOwnerDocument(iframeWindow);
  }

  /** 在 iframe realm 中创建节点并挂到 host 文档，模拟子应用节点渲染进 shadowRoot */
  function createAdoptedTree(host: Document = document): HTMLElement {
    const el = iframeDocument.createElement("div");
    el.innerHTML = "<p><b>x</b></p>";
    host.body.appendChild(el);
    return el;
  }

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("挂到主文档的子应用节点指向子应用 document 和子应用地址", () => {
    setup({ degrade: false });
    const el = createAdoptedTree();
    expect(el.ownerDocument).toBe(iframeDocument);
    expect(el.querySelector("b").ownerDocument).toBe(iframeDocument);
    expect(el.baseURI).toBe("https://sub.example.com/app/index.html");
  });

  // jsdom 按节点所在文档决定克隆结果的 realm，因此在 iframe 文档中克隆后再挂到主文档来构造同样的状态
  it("cloneNode 产生的节点及其后代同样修正", () => {
    setup({ degrade: false });
    const source = iframeDocument.createElement("div");
    source.innerHTML = "<p><b>x</b></p>";
    const shallow = source.cloneNode(false) as HTMLElement;
    const deep = source.cloneNode(true) as HTMLElement;
    document.body.append(shallow, deep);
    expect(shallow.ownerDocument).toBe(iframeDocument);
    expect(deep.ownerDocument).toBe(iframeDocument);
    expect(deep.querySelector("b").ownerDocument).toBe(iframeDocument);
    expect(deep.querySelector("b").baseURI).toBe("https://sub.example.com/app/index.html");
  });

  it("仍在 iframe 自身文档中的节点保持原生值", () => {
    setup({ degrade: false });
    const el = iframeDocument.createElement("span");
    iframeDocument.body.appendChild(el);
    expect(el.ownerDocument).toBe(iframeDocument);
    expect(el.baseURI).toBe(iframeDocument.baseURI);
  });

  it("template 惰性文档中的节点保持原生值", () => {
    setup({ degrade: false });
    const tpl = iframeDocument.createElement("template");
    tpl.innerHTML = "<i>t</i>";
    const inner = tpl.content.firstChild;
    expect(inner.ownerDocument).not.toBe(iframeDocument);
    expect(inner.ownerDocument).not.toBe(document);
  });

  it("主应用 realm 的节点不受影响", () => {
    setup({ degrade: false });
    const el = document.createElement("div");
    document.body.appendChild(el);
    expect(el.ownerDocument).toBe(document);
  });

  it("已打实例补丁的节点以实例补丁为准，不重复定义报错", () => {
    setup({ degrade: false });
    const el = createAdoptedTree();
    const clone = el.cloneNode(true) as HTMLElement;
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    patchElementEffect(clone, iframeWindow);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
    expect(Object.prototype.hasOwnProperty.call(clone, "ownerDocument")).toBe(true);
    expect(clone.ownerDocument).toBe(iframeDocument);
  });

  it("降级模式：挂到渲染 iframe 的节点指向渲染 document", () => {
    const renderIframe = document.createElement("iframe");
    document.body.appendChild(renderIframe);
    const renderDocument = renderIframe.contentDocument;
    setup({ degrade: true, document: renderDocument });
    const el = createAdoptedTree(renderDocument);
    const source = iframeDocument.createElement("div");
    source.innerHTML = "<p><b>x</b></p>";
    const clone = source.cloneNode(true) as HTMLElement;
    renderDocument.body.appendChild(clone);
    expect(el.ownerDocument).toBe(renderDocument);
    expect(clone.querySelector("b").ownerDocument).toBe(renderDocument);
    expect(clone.baseURI).toBe("https://sub.example.com/app/index.html");
  });

  it("沙箱销毁后回退到原生值", () => {
    setup({ degrade: false });
    const el = createAdoptedTree();
    (iframeWindow as any).__WUJIE = null;
    expect(el.ownerDocument).toBe(document);
    expect(el.baseURI).toBe(document.baseURI);
  });
});
