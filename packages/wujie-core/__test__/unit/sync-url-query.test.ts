/**
 * 单元测试：syncUrlToWindow 拼主应用 url 的 query。
 *
 * 子应用销毁/失活后需要从主应用 url 上摘掉自己的参数；当参数表被清空时，
 * 不能在 url 末尾留下一个孤立的 `?`。
 */

import { syncUrlToWindow } from "../../src/sync";

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
});
