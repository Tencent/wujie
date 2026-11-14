/**
 * 被接管的 script / link 原位置只留注释节点，元素本身游离。
 * 以注释节点为锚点，parentNode、removeChild、remove、contains 的结果应相互一致并贴近原生。
 */

export {};

const { patchRenderEffect } = require("../../src/effect");
const { addSandboxCacheWithWujie, deleteWujieById } = require("../../src/common");
const { WUJIE_SCRIPT_ID } = require("../../src/constant");

describe("被接管元素的 parentNode / removeChild / remove / contains", () => {
  const WUJIE_ID = "hijacked-parent-app";
  let iframe: HTMLIFrameElement;
  let uid = 0;

  function makeScript(): HTMLScriptElement {
    const script = document.createElement("script");
    script.src = `https://cdn.example.com/plugin-${++uid}.js`;
    return script;
  }

  function makeStyleLink(): HTMLLinkElement {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://cdn.example.com/style-${++uid}.css`;
    return link;
  }

  /** 模拟脚本已在 js iframe 中执行：iframe head 中存在同标记的 script */
  function mockExecutedScript(script: HTMLScriptElement): HTMLScriptElement {
    const executed = iframe.contentDocument.createElement("script");
    executed.setAttribute(WUJIE_SCRIPT_ID, script.getAttribute(WUJIE_SCRIPT_ID));
    iframe.contentDocument.head.appendChild(executed);
    return executed;
  }

  const comments = (container: Node) =>
    Array.from(container.childNodes).filter((node) => node.nodeType === Node.COMMENT_NODE);

  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    (iframe.contentWindow as any).__WUJIE_RAW_DOCUMENT_HEAD__ = iframe.contentDocument.head;
    const sandbox = {
      id: WUJIE_ID,
      styleSheetElements: [],
      replace: null,
      plugins: [],
      lifecycles: {},
      proxyLocation: { protocol: "https:", host: "cdn.example.com", pathname: "/", href: "https://cdn.example.com/" },
      fiber: false,
      degrade: true,
      iframe,
      execQueue: [],
      fetch: jest.fn(() => new Promise(() => {})),
    };
    (iframe.contentWindow as any).__WUJIE = sandbox;
    addSandboxCacheWithWujie(WUJIE_ID, sandbox);
    patchRenderEffect(document, WUJIE_ID, true);
  });

  afterEach(() => {
    deleteWujieById(WUJIE_ID);
    ["appendChild", "insertBefore", "removeChild", "contains"].forEach((method) => {
      delete (document.head as any)[method];
      delete (document.body as any)[method];
    });
    delete (document as any).contains;
  });

  it("parentNode / parentElement 指向插入时的容器，contains 返回 true", () => {
    const script = makeScript();
    document.body.appendChild(script);

    expect(script.parentNode).toBe(document.body);
    expect(script.parentElement).toBe(document.body);
    expect(document.body.contains(script)).toBe(true);
    expect(document.head.contains(script)).toBe(false);
  });

  it("parentNode.removeChild 移除 iframe 中的脚本和注释节点，之后 parentNode 为 null", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const script = makeScript();
    document.body.appendChild(script);
    const executed = mockExecutedScript(script);

    expect(() => script.parentNode.removeChild(script)).not.toThrow();
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
    expect(executed.isConnected).toBe(false);
    expect(comments(document.body)).toHaveLength(0);
    expect(script.parentNode).toBeNull();
    expect(document.body.contains(script)).toBe(false);
  });

  it("remove() 与 removeChild 走同一套逻辑", () => {
    const script = makeScript();
    document.head.appendChild(script);
    const executed = mockExecutedScript(script);

    script.remove();
    expect(executed.isConnected).toBe(false);
    expect(comments(document.head)).toHaveLength(0);
    expect(script.parentNode).toBeNull();
  });

  it("样式 link 移除时不抛错，只移除注释节点", () => {
    const link = makeStyleLink();
    document.head.appendChild(link);
    expect(link.parentNode).toBe(document.head);
    expect(document.head.contains(link)).toBe(true);

    expect(document.head.removeChild(link)).toBe(link);
    expect(comments(document.head)).toHaveLength(0);
    expect(link.parentNode).toBeNull();
    expect(document.head.contains(link)).toBe(false);
  });

  it("注释节点被外部清除后，元素视为已移除", () => {
    const link = makeStyleLink();
    document.head.appendChild(link);
    comments(document.head).forEach((node) => node.parentNode.removeChild(node));

    expect(link.parentNode).toBeNull();
    expect(document.head.contains(link)).toBe(false);
  });

  it("从非插入容器移除时给出提示，不移除注释节点", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const script = makeScript();
    document.head.appendChild(script);

    document.body.removeChild(script);
    expect(warnSpy.mock.calls.some((args) => String(args[0]).includes("不在当前容器中"))).toBe(true);
    expect(script.parentNode).toBe(document.head);
    warnSpy.mockRestore();
  });

  it("移除后可以再次插入", () => {
    const link = makeStyleLink();
    document.head.appendChild(link);
    link.remove();
    document.body.appendChild(link);

    expect(link.parentNode).toBe(document.body);
    expect(document.body.contains(link)).toBe(true);
  });

  it("未被接管的元素保持原生行为", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    expect(div.parentNode).toBe(document.body);
    expect(document.body.contains(div)).toBe(true);
    document.body.removeChild(div);
    expect(div.parentNode).toBeNull();
    expect(Object.getOwnPropertyDescriptor(div, "parentNode")).toBeUndefined();
  });
});
