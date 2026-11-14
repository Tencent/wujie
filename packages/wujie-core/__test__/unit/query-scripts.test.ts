/**
 * 子应用的脚本在 js iframe 中执行，document.querySelectorAll("script") 应从 js iframe 获取，
 * 与 getElementsByTagName("script") 保持一致；其他选择器行为不变。
 */

export {};

const { proxyGenerator, localGenerator } = require("../../src/proxy");

function createJsIframe(): HTMLIFrameElement {
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  const iframeWindow = iframe.contentWindow as any;
  const iframeDocument = iframe.contentDocument;
  iframeWindow.__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__ = iframeWindow.Document.prototype.querySelector;
  iframeWindow.__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR_ALL__ = iframeWindow.Document.prototype.querySelectorAll;
  iframeWindow.__WUJIE_RAW_DOCUMENT_HEAD__ = iframeDocument.head;
  ["app-a", "app-b"].forEach((id) => {
    const script = iframeDocument.createElement("script");
    script.id = id;
    script.type = "text/plain";
    iframeDocument.head.appendChild(script);
  });
  return iframe;
}

/** 渲染 DOM：包含一个不会执行的模板 script、一个业务节点 */
const RENDER_HTML =
  '<head><script type="text/x-template" id="tpl"></script></head><body><span class="s">s</span></body>';

const urlElement = Object.assign(document.createElement("a"), { href: "https://sub.example.com/app/" });

afterEach(() => {
  document.body.innerHTML = "";
});

describe("非降级 proxyDocument", () => {
  let iframe: HTMLIFrameElement;
  let proxyDocument: Document;
  let shadowRoot: ShadowRoot;

  beforeEach(() => {
    iframe = createJsIframe();
    const host = document.createElement("div");
    document.body.appendChild(host);
    shadowRoot = host.attachShadow({ mode: "open" });
    const html = document.createElement("html");
    html.innerHTML = RENDER_HTML;
    shadowRoot.appendChild(html);
    (iframe.contentWindow as any).__WUJIE = { shadowRoot, proxyLocation: {} };
    proxyDocument = proxyGenerator(
      iframe,
      urlElement,
      "https://main.example.com",
      "https://sub.example.com"
    ).proxyDocument;
  });

  const call = (method: "querySelector" | "querySelectorAll", selector: string) =>
    proxyDocument[method].call(iframe.contentDocument, selector);

  it("querySelectorAll('script') 返回 js iframe 中的脚本，且是可 forEach 的 NodeList", () => {
    const res = call("querySelectorAll", "script");
    expect(res).toBeInstanceOf((iframe.contentWindow as any).NodeList);
    const ids = [];
    res.forEach((s) => ids.push(s.id));
    expect(ids).toEqual(["app-a", "app-b"]);
  });

  it("选择器大小写与首尾空格不影响", () => {
    expect(call("querySelectorAll", " SCRIPT ").length).toBe(2);
  });

  it("其他选择器仍从 shadowRoot 获取", () => {
    expect(call("querySelectorAll", ".s")[0]).toBe(shadowRoot.querySelector(".s"));
    expect(call("querySelectorAll", "script[type='text/x-template']")[0].id).toBe("tpl");
  });

  it("querySelectorAll('base') 在 shadowRoot 中查不到时返回空 NodeList", () => {
    const res = call("querySelectorAll", "base");
    expect(res.length).toBe(0);
    expect(typeof res.forEach).toBe("function");
  });

  it("querySelector 行为不变：优先 shadowRoot", () => {
    expect(call("querySelector", "script").id).toBe("tpl");
  });

  it("非 iframe document 调用时不做处理", () => {
    const res = proxyDocument.querySelectorAll.call(shadowRoot, "script");
    expect(res[0].id).toBe("tpl");
  });
});

describe("降级 proxyDocument", () => {
  let iframe: HTMLIFrameElement;
  let proxyDocument: any;
  let renderDocument: Document;

  beforeEach(() => {
    iframe = createJsIframe();
    const renderIframe = document.createElement("iframe");
    document.body.appendChild(renderIframe);
    renderDocument = renderIframe.contentDocument;
    renderDocument.documentElement.innerHTML = RENDER_HTML;
    (iframe.contentWindow as any).__WUJIE = { document: renderDocument, proxyLocation: {} };
    proxyDocument = localGenerator(
      iframe,
      urlElement,
      "https://main.example.com",
      "https://sub.example.com"
    ).proxyDocument;
  });

  it("querySelectorAll('script') 返回 js iframe 中的脚本", () => {
    const res = proxyDocument.querySelectorAll("script");
    expect(res).toBeInstanceOf((iframe.contentWindow as any).NodeList);
    expect(Array.from(res).map((s: HTMLScriptElement) => s.id)).toEqual(["app-a", "app-b"]);
  });

  it("querySelector('script') 返回 js iframe 中的第一个脚本", () => {
    expect(proxyDocument.querySelector("script").id).toBe("app-a");
  });

  it("其他选择器仍从渲染 document 获取", () => {
    expect(proxyDocument.querySelector(".s")).toBe(renderDocument.querySelector(".s"));
    expect(proxyDocument.querySelectorAll(".s").length).toBe(1);
    expect(proxyDocument.querySelector("#tpl")).toBe(renderDocument.querySelector("#tpl"));
  });
});
