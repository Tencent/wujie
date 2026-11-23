/**
 * 单元测试：getExternalScripts 的取内容策略。
 *
 * 约定：
 * - 普通外链脚本由 wujie 拉取后执行；
 * - ignore 的脚本交给子应用自己请求，wujie 不拉取；
 * - module 脚本在 iframe 内自行请求，这里只占位。
 *
 * 注意：fetchAssets 有模块级缓存（键是 src），每个用例用不同的 src。
 */

import { getExternalScripts } from "../../src/entry";

const mockFetch = (body = "code") =>
  jest.fn(() => Promise.resolve({ status: 200, text: () => Promise.resolve(body) })) as any;

const noop = () => {};

describe("getExternalScripts", () => {
  it("普通外链脚本由 wujie 拉取", async () => {
    const fetch = mockFetch('console.log("a")');
    const res = getExternalScripts([{ src: "http://example.com/normal.js" }], fetch, noop, false);

    await expect(res[0].contentPromise).resolves.toBe('console.log("a")');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("内联脚本直接使用模板里的内容", async () => {
    const fetch = mockFetch();
    const res = getExternalScripts([{ src: "", content: "inline()" }], fetch, noop, false);

    await expect(res[0].contentPromise).resolves.toBe("inline()");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("ignore 的脚本不由 wujie 拉取", async () => {
    const fetch = mockFetch();
    const res = getExternalScripts([{ src: "http://example.com/ignored.js", ignore: true }], fetch, noop, false);

    await expect(res[0].contentPromise).resolves.toBe("");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("同时带 async 和 ignore 时，ignore 优先", async () => {
    const fetch = mockFetch();
    const res = getExternalScripts(
      [{ src: "http://example.com/async-ignored.js", async: true, ignore: true }],
      fetch,
      noop,
      false
    );

    await expect(res[0].contentPromise).resolves.toBe("");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("同时带 defer 和 ignore 时，ignore 优先", async () => {
    const fetch = mockFetch();
    const res = getExternalScripts(
      [{ src: "http://example.com/defer-ignored.js", defer: true, ignore: true }],
      fetch,
      noop,
      false
    );

    await expect(res[0].contentPromise).resolves.toBe("");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("module 脚本在 iframe 内请求，并标记为 defer", async () => {
    const fetch = mockFetch();
    const res = getExternalScripts([{ src: "http://example.com/mod.js", module: true }], fetch, noop, false);

    await expect(res[0].contentPromise).resolves.toBe("");
    expect(fetch).not.toHaveBeenCalled();
    expect(res[0].defer).toBe(true);
  });
});
