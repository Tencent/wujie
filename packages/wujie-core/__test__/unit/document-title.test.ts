/**
 * 单元测试：子应用里 `document.title = ...` 必须生效在**可见的那份 document** 上。
 *
 * 非降级模式下子应用渲染在主应用的 shadow DOM 里，js iframe 的 document 是不可见的，
 * 所以标题要写到主应用 document；proxyDocument 只实现了 get 而没有 set，
 * 写入会落到代理的空目标对象上，任何地方都看不到效果。
 */

export {};

import { proxyGenerator } from "../../src/proxy";

const MAIN_HOST = "https://main.example.com";
const APP_HOST = "https://sub.example.com";

function setup(): any {
  document.body.innerHTML = "";
  document.title = "主应用标题";
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  const iframeWindow: any = iframe.contentWindow;
  iframeWindow.__WUJIE = { id: "app", degrade: false, shadowRoot: document.createElement("div") };
  const urlElement = Object.assign(document.createElement("a"), { href: `${APP_HOST}/app/` });
  return proxyGenerator(iframe, urlElement, MAIN_HOST, APP_HOST).proxyDocument;
}

describe("proxyDocument 的 title 写入", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    document.title = "";
  });

  it("写入 title 生效到主应用 document", () => {
    const proxyDocument = setup();

    proxyDocument.title = "子应用标题";

    expect(document.title).toBe("子应用标题");
  });

  it("写入非字符串 title 时按原生语义转成字符串", () => {
    const proxyDocument = setup();

    proxyDocument.title = 123;

    expect(document.title).toBe("123");
  });

  it("写入其他自定义属性不污染主应用 document", () => {
    const proxyDocument = setup();

    proxyDocument.__customFlag = 1;

    expect((document as any).__customFlag).toBeUndefined();
  });
});
