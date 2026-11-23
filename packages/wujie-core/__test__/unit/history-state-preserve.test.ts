/**
 * 单元测试：路由同步不应该破坏主应用的 history.state。
 *
 * main 应用的 replaceState 第 1 个参数就是新的 history.state。
 * 传 null 会把主应用存进去的数据清掉 —— Vue Router 把 back/current/forward/
 * position/scroll 全放在这里，清掉之后 router.back() 的位置恢复、
 * scrollBehavior 的 savedPosition 都会失效。
 */

jest.mock("../../src/common", () => ({
  ...jest.requireActual("../../src/common"),
  getWujieById: jest.fn(),
}));

import { syncUrlToWindow, clearInactiveAppUrl, pushUrlToWindow } from "../../src/sync";
import { getWujieById } from "../../src/common";

const fakeIframeWindow = (wujie: Record<string, any> = {}) =>
  ({
    __WUJIE: { sync: true, id: "app", ...wujie },
    location: { pathname: "/sub", search: "", hash: "" },
  } as any);

describe("路由同步保留主应用 history.state", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("syncUrlToWindow 改写 url 时保留 state", () => {
    window.history.replaceState({ keep: 1 }, "", "/page?app=/sub");

    syncUrlToWindow(fakeIframeWindow({ sync: false }));

    expect(window.location.search).toBe("");
    expect(window.history.state).toEqual({ keep: 1 });
  });

  it("clearInactiveAppUrl 清理失活参数时保留 state", () => {
    (getWujieById as jest.Mock).mockReturnValue({
      id: "app",
      execFlag: true,
      sync: true,
      hrefFlag: false,
      activeFlag: false,
    });
    window.history.replaceState({ keep: 2 }, "", "/page?app=/sub");

    clearInactiveAppUrl();

    expect(window.location.search).toBe("");
    expect(window.history.state).toEqual({ keep: 2 });
  });

  it("pushUrlToWindow 的 replace 模式保留 state", () => {
    window.history.replaceState({ keep: 3 }, "", "/page");

    pushUrlToWindow("app", "/sub", true);

    expect(window.location.search).toBe("?app=%2Fsub");
    expect(window.history.state).toEqual({ keep: 3 });
  });
});
