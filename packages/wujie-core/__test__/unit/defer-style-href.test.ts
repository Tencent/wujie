/**
 * 关联 issue: https://github.com/Tencent/wujie/issues/224  https://github.com/Tencent/wujie/issues/974
 *
 * 场景：部分库（如 tinymce 的 StyleSheetLoader）动态插入 <link rel=stylesheet> 时，
 * 先 appendChild(link)、之后才 setAttribute('href', url)。appendChild 时 href 为空，
 * wujie 旧实现会直接用注释替换并丢弃该 link，导致样式（skin.min.css）永远加载不出来。
 *
 * deferStyleSheetByHref 通过 MutationObserver 监听 href 的后续赋值，命中后再走加载流程，
 * 并在命中 / 超时 / destroy 时统一 disconnect，避免 observer 闭包钉住已销毁的 sandbox。
 */

export {};

const { deferStyleSheetByHref } = require("../../src/effect");
const { addSandboxCacheWithWujie, deleteWujieById } = require("../../src/common");

const WUJIE_ID = "defer-style-href-app";

function createSandbox(): any {
  return { id: WUJIE_ID, deferredStyleObservers: [] };
}

function makeLink(): HTMLLinkElement {
  const link = document.createElement("link");
  link.setAttribute("rel", "stylesheet");
  return link;
}

describe("deferStyleSheetByHref / 先 append 后 setAttribute('href') 的延迟加载", () => {
  let sandbox: any;

  beforeEach(() => {
    jest.useFakeTimers();
    sandbox = createSandbox();
    addSandboxCacheWithWujie(WUJIE_ID, sandbox);
  });

  afterEach(() => {
    deleteWujieById(WUJIE_ID);
    jest.useRealTimers();
  });

  it("后续 setAttribute('href') 应触发 loadStyleSheet 并带上真实 href", async () => {
    const link = makeLink();
    const loadStyleSheet = jest.fn();

    deferStyleSheetByHref({ element: link, wujieId: WUJIE_ID, iframeWindow: window, loadStyleSheet });
    expect(sandbox.deferredStyleObservers).toHaveLength(1);

    link.setAttribute("href", "https://cdn.example.com/skin.min.css");
    // MutationObserver 回调在 microtask 中触发
    await Promise.resolve();

    expect(loadStyleSheet).toHaveBeenCalledTimes(1);
    expect(loadStyleSheet).toHaveBeenCalledWith("https://cdn.example.com/skin.min.css", link);
  });

  it("后续设置相对 href 时应传入浏览器解析后的绝对 href", async () => {
    const link = makeLink();
    const loadStyleSheet = jest.fn();

    deferStyleSheetByHref({ element: link, wujieId: WUJIE_ID, iframeWindow: window, loadStyleSheet });

    link.setAttribute("href", "./tinymce/skins/ui/oxide/skin.min.css");
    await Promise.resolve();

    expect(loadStyleSheet).toHaveBeenCalledTimes(1);
    expect(loadStyleSheet).toHaveBeenCalledWith(link.href, link);
    expect(loadStyleSheet.mock.calls[0][0]).not.toBe("./tinymce/skins/ui/oxide/skin.min.css");
  });

  it("命中后应 disconnect 并从 sandbox.deferredStyleObservers 出队", async () => {
    const link = makeLink();
    const loadStyleSheet = jest.fn();

    deferStyleSheetByHref({ element: link, wujieId: WUJIE_ID, iframeWindow: window, loadStyleSheet });
    link.setAttribute("href", "https://cdn.example.com/skin.min.css");
    await Promise.resolve();

    expect(sandbox.deferredStyleObservers).toHaveLength(0);

    // 再次改 href 不应重复加载（已 disconnect）
    link.setAttribute("href", "https://cdn.example.com/other.css");
    await Promise.resolve();
    expect(loadStyleSheet).toHaveBeenCalledTimes(1);
  });

  it("超时未拿到 href 时应放弃监听、出队并触发 error 事件", () => {
    const link = makeLink();
    const loadStyleSheet = jest.fn();
    const onerror = jest.fn();
    link.onerror = onerror;

    deferStyleSheetByHref({ element: link, wujieId: WUJIE_ID, iframeWindow: window, loadStyleSheet });
    expect(sandbox.deferredStyleObservers).toHaveLength(1);

    jest.advanceTimersByTime(5000);

    expect(loadStyleSheet).not.toHaveBeenCalled();
    expect(onerror).toHaveBeenCalledTimes(1);
    expect(sandbox.deferredStyleObservers).toHaveLength(0);
  });

  it("子应用已销毁后再赋值 href 不应执行 loadStyleSheet", async () => {
    const link = makeLink();
    const loadStyleSheet = jest.fn();

    deferStyleSheetByHref({ element: link, wujieId: WUJIE_ID, iframeWindow: window, loadStyleSheet });
    // 模拟 destroy：统一 disconnect 并移除全局缓存
    sandbox.deferredStyleObservers.forEach((o: MutationObserver) => o.disconnect());
    deleteWujieById(WUJIE_ID);

    link.setAttribute("href", "https://cdn.example.com/skin.min.css");
    await Promise.resolve();

    expect(loadStyleSheet).not.toHaveBeenCalled();
  });

  it("环境不支持 MutationObserver 时应安全跳过，不抛错也不入队", () => {
    const link = makeLink();
    const loadStyleSheet = jest.fn();
    const fakeWindow = {} as unknown as Window;

    expect(() =>
      deferStyleSheetByHref({ element: link, wujieId: WUJIE_ID, iframeWindow: fakeWindow, loadStyleSheet })
    ).not.toThrow();
    expect(sandbox.deferredStyleObservers).toHaveLength(0);
  });
});
