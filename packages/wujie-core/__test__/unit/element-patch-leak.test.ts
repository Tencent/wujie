/**
 * 准集成测试：patchElementEffect 跨边界闭包持有 sandbox / iframeWindow。
 *
 * 背景（详见 notes/memory-leak-investigation.md §10）：
 *  patchElementEffect 给子应用元素打了 baseURI、ownerDocument 两个 getter，闭包里
 *  分别强持 proxyLocation 和 iframeWindow。如果业务把这种 element 移到主应用 DOM
 *  下（subAppHost.appendChild(subAppEl) 这种 portal/拖拽/弹窗常见写法），就算 sandbox
 *  destroy 把 iframe.parentNode.removeChild、清空 sandbox.proxyLocation 后，element 依
 *  然挂在主 document 上，getter 闭包仍 dereference iframeWindow / proxyLocation，
 *  整个子应用上下文 GC 不掉。
 *
 * 修复目标：getter 内部用 WeakRef 间接持有 iframeWindow / sandbox，destroy 后即便
 * element 还在主 DOM，getter 也能 deref 失败/读到 null 时安全降级，不阻碍 GC。
 *
 * 验收点：
 *  1) 正常路径（sandbox 还在）：baseURI / ownerDocument 行为不变。
 *  2) sandbox.destroy() 后再访问 baseURI / ownerDocument 不抛错，且不会再返回原
 *     iframeWindow / proxyLocation 引用（getter 应做安全降级）。
 *  3) 用一个 fake destroyed sandbox（proxyLocation = null, iframeWindow.__WUJIE = null）
 *     模拟 destroy 后状态，element getter 不应再触达原 sandbox。
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

describe("§10 patchElementEffect 跨边界闭包不应阻碍 sandbox GC", () => {
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

    // 修复后：getter 通过 WeakRef.deref() 拿不到有效 sandbox，应降级返回主 document，
    // 这样即便 element 还活着，也不会让 iframeWindow / sandbox 通过闭包持有而无法 GC。
    expect(el.ownerDocument).toBe(document);
  });
});
