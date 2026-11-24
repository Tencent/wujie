/**
 * 单元测试：路由同步的读取侧（syncUrlToIframe）与几个零覆盖的小工具。
 *
 * syncUrlToIframe 与 syncUrlToWindow 是同一条数据流的两端：
 * 前者在首次渲染/刷新时把主应用 url 上的参数还原成子应用路由，
 * 后者把子应用路由写回主应用 url，两边的 encode/decode 约定必须一致。
 */

import { syncUrlToIframe } from "../../src/sync";
import { getContainer, getInlineCode, isScriptElement, setTagToScript, nextTick } from "../../src/utils";

const MAIN_HOST = "http://localhost:8080";

function fakeIframeWindow(over: Record<string, any> = {}) {
  const replaceState = jest.fn();
  return {
    __WUJIE: {
      id: "app",
      url: "http://a.com/sub/",
      sync: true,
      execFlag: false,
      prefix: {},
      inject: { mainHostPath: MAIN_HOST },
      ...over,
    },
    location: { pathname: "/sub/", search: "", hash: "" },
    history: { replaceState },
  } as any;
}

describe("syncUrlToIframe", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("主应用 url 上没有参数时回退到子应用 url，不动 iframe 地址", () => {
    window.history.replaceState(null, "", "/page");
    const iframeWindow = fakeIframeWindow();

    syncUrlToIframe(iframeWindow);

    expect(iframeWindow.history.replaceState).not.toHaveBeenCalled();
  });

  it("参数里的路由与当前地址不同时，把 iframe 地址改成参数里的路由", () => {
    window.history.replaceState(null, "", "/page?app=%2Fsub%2Fdetail");
    const iframeWindow = fakeIframeWindow();

    syncUrlToIframe(iframeWindow);

    expect(iframeWindow.history.replaceState).toHaveBeenCalledWith(null, "", `${MAIN_HOST}/sub/detail`);
  });

  it("参数里的路由与当前地址相同时不动 iframe 地址", () => {
    window.history.replaceState(null, "", "/page?app=%2Fsub%2F");
    const iframeWindow = fakeIframeWindow();

    syncUrlToIframe(iframeWindow);

    expect(iframeWindow.history.replaceState).not.toHaveBeenCalled();
  });

  it("参数是短路径占位符时先还原成真实路径", () => {
    window.history.replaceState(null, "", "/page?app=%7Bshort%7Ddetail");
    const iframeWindow = fakeIframeWindow({ prefix: { short: "/sub/" } });

    syncUrlToIframe(iframeWindow);

    expect(iframeWindow.history.replaceState).toHaveBeenCalledWith(null, "", `${MAIN_HOST}/sub/detail`);
  });

  it("sync 关闭时按子应用 url 处理，忽略参数", () => {
    window.history.replaceState(null, "", "/page?app=%2Fother");
    const iframeWindow = fakeIframeWindow({ sync: false });

    syncUrlToIframe(iframeWindow);

    expect(iframeWindow.history.replaceState).not.toHaveBeenCalled();
  });
});

describe("utils 小工具", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("getContainer 支持选择器与元素，选不中返回 null", () => {
    const div = document.createElement("div");
    div.id = "box";
    document.body.appendChild(div);

    expect(getContainer("#box")).toBe(div);
    expect(getContainer(div)).toBe(div);
    expect(getContainer("#nope")).toBeNull();
  });

  it("getInlineCode 取标签内的内容", () => {
    expect(getInlineCode("<style>a{color:red}</style>")).toBe("a{color:red}");
    expect(getInlineCode("<style></style>")).toBe("");
  });

  it("isScriptElement 只认 script", () => {
    expect(isScriptElement(document.createElement("script"))).toBe(true);
    expect(isScriptElement(document.createElement("div"))).toBe(false);
  });

  it("setTagToScript 写入指定的 tag", () => {
    const script = document.createElement("script");

    setTagToScript(script, "my-tag");

    expect(script.getAttribute("data-wujie-script-id")).toBe("my-tag");
  });

  it("setTagToScript 不传 tag 时自动生成数字 tag", () => {
    const script = document.createElement("script");

    setTagToScript(script);

    expect(script.getAttribute("data-wujie-script-id")).toMatch(/^\d+$/);
  });

  it("setTagToScript 对非 script 元素不写 tag", () => {
    const div = document.createElement("div");

    setTagToScript(div as any, "x");

    expect(div.getAttribute("data-wujie-script-id")).toBeNull();
  });

  it("nextTick 异步执行回调", async () => {
    const calls: string[] = [];

    nextTick(() => calls.push("tick"));
    calls.push("sync");

    expect(calls).toEqual(["sync"]);

    await Promise.resolve();

    expect(calls).toEqual(["sync", "tick"]);
  });
});
