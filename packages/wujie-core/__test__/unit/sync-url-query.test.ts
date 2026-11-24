/**
 * 单元测试：syncUrlToWindow 拼主应用 url 的 query。
 *
 * 子应用销毁/失活后需要从主应用 url 上摘掉自己的参数；当参数表被清空时，
 * 不能在 url 末尾留下一个孤立的 `?`。
 */

import { syncUrlToWindow, pushUrlToWindow, clearInactiveAppUrl } from "../../src/sync";
import { addSandboxCacheWithWujie, deleteWujieById } from "../../src/common";

const fakeIframeWindow = (wujie: Record<string, any> = {}) =>
  ({
    __WUJIE: { sync: true, id: "app", ...wujie },
    location: { pathname: "/sub", search: "", hash: "" },
  } as any);

describe("syncUrlToWindow", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("参数被清空后不应该在主应用 url 上留下孤立的 ?", () => {
    window.history.replaceState(null, "", "/page?app=/sub");

    syncUrlToWindow(fakeIframeWindow({ sync: false }));

    expect(window.location.href.endsWith("?")).toBe(false);
    expect(window.location.href).toBe("http://localhost/page");
  });

  it("只摘掉自己的参数，保留其它参数", () => {
    window.history.replaceState(null, "", "/page?app=/sub&other=1");

    syncUrlToWindow(fakeIframeWindow({ sync: false }));

    expect(window.location.search).toBe("?other=1");
  });

  it("开启同步时把子应用路由编码后写进参数", () => {
    window.history.replaceState(null, "", "/page");

    syncUrlToWindow(fakeIframeWindow({ sync: true }));

    expect(window.location.search).toBe("?app=%2Fsub");
  });

  it("配置了 prefix 时写入短路径", () => {
    window.history.replaceState(null, "", "/page");

    syncUrlToWindow(fakeIframeWindow({ sync: true, prefix: { prod: "/sub" } }));

    expect(window.location.search).toBe("?app=%7Bprod%7D");
  });

  it("同步时主应用自己的参数保持原文（#806）", () => {
    window.history.replaceState(null, "", "/page?tk=ab+cd/ef==&flag&a=1&a=2&app=%2Fold#/main");

    syncUrlToWindow(fakeIframeWindow({ sync: true }));

    expect(window.location.search).toBe("?tk=ab+cd/ef==&flag&a=1&a=2&app=%2Fsub");
    expect(new URLSearchParams(window.location.search).get("tk")).toBe("ab cd/ef==");
    expect(window.location.hash).toBe("#/main");
  });

  it("清理时主应用自己的参数保持原文，重复的子应用参数一并删除", () => {
    window.history.replaceState(null, "", "/page?tk=ab+cd&app=%2Fa&flag&app=%2Fb");

    syncUrlToWindow(fakeIframeWindow({ sync: false }));

    expect(window.location.search).toBe("?tk=ab+cd&flag");
  });

  it("主应用参数名与原型属性同名时不受影响", () => {
    window.history.replaceState(null, "", "/page?constructor=1&toString");

    syncUrlToWindow(fakeIframeWindow({ sync: true }));

    expect(window.location.search).toBe("?constructor=1&toString&app=%2Fsub");
  });
});

describe("pushUrlToWindow", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("只改写子应用自己的参数，位置不变", () => {
    window.history.replaceState(null, "", "/page?tk=ab+cd&app=%2Fold&other=x+y");

    pushUrlToWindow("app", "http://localhost:7100/sub?q=a+b");

    expect(window.location.search).toBe("?tk=ab+cd&app=http%3A%2F%2Flocalhost%3A7100%2Fsub%3Fq%3Da%2Bb&other=x+y");
    expect(new URLSearchParams(window.location.search).get("app")).toBe("http://localhost:7100/sub?q=a+b");
  });
});

describe("clearInactiveAppUrl", () => {
  afterEach(() => {
    deleteWujieById("inactive");
    deleteWujieById("active");
    window.history.replaceState(null, "", "/");
  });

  it("只删除失活子应用的参数，其余参数保持原文", () => {
    addSandboxCacheWithWujie("inactive", { execFlag: true, sync: true, hrefFlag: false, activeFlag: false } as any);
    addSandboxCacheWithWujie("active", { execFlag: true, sync: true, hrefFlag: false, activeFlag: true } as any);
    window.history.replaceState(null, "", "/page?tk=ab+cd&inactive=%2Fa&active=%2Fb&flag");

    clearInactiveAppUrl();

    expect(window.location.search).toBe("?tk=ab+cd&active=%2Fb&flag");
  });
});
