/**
 * 单元测试：processAppForHrefJump 从主应用 url 还原子应用 href。
 *
 * 主应用 url 上的参数经 URLSearchParams 读出时**已经解码一次**，
 * syncUrlToWindow / pushUrlToWindow 也都是「读出来是 decoded、写回去才 encode」的约定。
 * 所以这里拿到的 url 不能再 decode 一次：路径里带 % 会被解坏甚至抛 URIError。
 */

jest.mock("../../src/common", () => ({
  ...jest.requireActual("../../src/common"),
  getWujieById: jest.fn(),
}));
jest.mock("../../src/iframe", () => ({
  ...jest.requireActual("../../src/iframe"),
  renderIframeReplaceApp: jest.fn(),
}));

import { processAppForHrefJump } from "../../src/sync";
import { getWujieById } from "../../src/common";
import { renderIframeReplaceApp } from "../../src/iframe";

const fakeSandbox = () =>
  ({
    id: "app",
    degrade: false,
    hrefFlag: false,
    degradeAttrs: {},
    shadowRoot: { host: { parentElement: document.body } },
    iframe: { contentDocument: document },
  } as any);

describe("processAppForHrefJump", () => {
  beforeAll(() => {
    processAppForHrefJump();
  });

  beforeEach(() => {
    (getWujieById as jest.Mock).mockReturnValue(fakeSandbox());
    (renderIframeReplaceApp as jest.Mock).mockClear();
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("href 正常时把解出来的地址交给渲染函数", () => {
    window.history.replaceState(null, "", "/page?app=http%3A%2F%2Fx.com%2Fa");

    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(renderIframeReplaceApp).toHaveBeenCalledWith("http://x.com/a", document.body, {});
  });

  it("href 里带 % 时不二次解码", () => {
    window.history.replaceState(null, "", "/page?app=http%3A%2F%2Fx.com%2Fsale%2F50%25off");

    expect(() => window.dispatchEvent(new PopStateEvent("popstate"))).not.toThrow();

    expect(renderIframeReplaceApp).toHaveBeenCalledWith("http://x.com/sale/50%off", document.body, {});
  });
});
