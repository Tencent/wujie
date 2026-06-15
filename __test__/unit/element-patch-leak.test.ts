/**
 * 准集成测试：patchElementEffect 给元素打的 baseURI / ownerDocument getter
 * 不应阻碍 sandbox / iframeWindow GC。
 *
 * 业务把子应用 element 移到主应用 DOM 下（portal / 弹窗 / 拖拽等）后，即使
 * sandbox.destroy() 已经把 iframe 移出 DOM，element 仍然挂在主 document 上。
 * getter 必须通过 WeakRef + 动态 __WUJIE 访问安全降级，不能强持 sandbox。
 */

export {};

import { patchElementEffect } from "../../src/iframe";

function createIframeWithSandbox() {
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  const iframeWindow: any = iframe.contentWindow;
  const sandbox: any = {
    id: "elem-patch-test",
    plugins: [],
    proxyLocation: {
      protocol: "http:",
      host: "child.example.com",
      pathname: "/sub/",
    },
  };
  iframeWindow.__WUJIE = sandbox;
  return { iframe, iframeWindow, sandbox };
}

describe("patchElementEffect 跨边界闭包不应阻碍 sandbox GC", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  test("正常路径：baseURI / ownerDocument 应反映 proxyLocation 与 iframeWindow.document", () => {
    const { iframeWindow, sandbox } = createIframeWithSandbox();
    const el = iframeWindow.document.createElement("div");
    patchElementEffect(el, iframeWindow);

    expect(el.baseURI).toBe("http://child.example.com/sub/");
    expect(el.ownerDocument).toBe(iframeWindow.document);

    void sandbox; // 避免 unused
  });

  test("destroy 模拟：sandbox.proxyLocation 被置 null 后，baseURI 应安全降级而非抛错", () => {
    const { iframeWindow, sandbox } = createIframeWithSandbox();
    const el = iframeWindow.document.createElement("div");
    patchElementEffect(el, iframeWindow);

    // 模拟 sandbox.destroy() 中 sandbox.proxyLocation = null 且 iframeWindow.__WUJIE = null
    sandbox.proxyLocation = null;
    iframeWindow.__WUJIE = null;

    expect(() => el.baseURI).not.toThrow();
    expect(() => el.ownerDocument).not.toThrow();
    // 安全降级值：不应再回 iframeWindow / proxyLocation 的真值
    expect(el.baseURI).not.toBe("http://child.example.com/sub/");
  });

  test("destroy 模拟：iframeWindow.__WUJIE 被置 null 后，ownerDocument 应降级为主 document", () => {
    const { iframeWindow, sandbox } = createIframeWithSandbox();
    const el = iframeWindow.document.createElement("div");
    patchElementEffect(el, iframeWindow);

    // 把 element 移到主 document 下，模拟 portal / 弹窗挂载到主应用 DOM 的场景
    document.body.appendChild(el as any);

    sandbox.proxyLocation = null;
    iframeWindow.__WUJIE = null;

    // getter 通过动态 __WUJIE 查不到有效 sandbox，应降级返回主 document，
    // 不让 element 通过闭包把 iframeWindow / sandbox 钉在内存中。
    expect(el.ownerDocument).toBe(document);
  });
});
