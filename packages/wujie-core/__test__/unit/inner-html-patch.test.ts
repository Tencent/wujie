export {};

import { patchNodeEffect } from "../../src/iframe";

function createIframeWindow() {
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  return iframe.contentWindow as any;
}

describe("issue #1125: innerHTML parsed nodes get patched", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  test("innerHTML 解析出的子节点统一被 patch（_hasPatch=true）", () => {
    const iframeWindow = createIframeWindow();
    // patchElementEffect 会读取 __WUJIE.plugins，最小桩即可
    iframeWindow.__WUJIE = { plugins: null };
    patchNodeEffect(iframeWindow);

    const doc = iframeWindow.document;
    const host = doc.createElement("div");
    host.innerHTML = "<span>a</span><p>b</p><div><i>c</i></div>";

    const span = host.querySelector("span");
    const p = host.querySelector("p");
    const innerDiv = host.querySelector("div");
    const i = host.querySelector("i");

    expect(span._hasPatch).toBe(true);
    expect(p._hasPatch).toBe(true);
    expect(innerDiv._hasPatch).toBe(true);
    expect(i._hasPatch).toBe(true);
  });

  test("innerHTML 补丁不影响原生赋值与读取", () => {
    const iframeWindow = createIframeWindow();
    iframeWindow.__WUJIE = { plugins: null };
    patchNodeEffect(iframeWindow);

    const doc = iframeWindow.document;
    const host = doc.createElement("div");
    host.innerHTML = "<b>bold</b>";
    expect(host.innerHTML).toBe("<b>bold</b>");
  });

  test("解析节点的 ownerDocument 与 createElement 节点一致", () => {
    const iframeWindow = createIframeWindow();
    iframeWindow.__WUJIE = { plugins: null };
    patchNodeEffect(iframeWindow);

    const doc = iframeWindow.document;
    const created = doc.createElement("section");
    const host = doc.createElement("div");
    host.innerHTML = "<section></section>";
    const parsed = host.querySelector("section");

    expect(created.ownerDocument).toBe(doc);
    expect(parsed.ownerDocument).toBe(created.ownerDocument);
  });
});