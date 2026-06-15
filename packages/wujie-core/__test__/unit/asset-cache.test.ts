/**
 * 单元测试：clearAssetsCache(host?) 公共 API。
 *
 * entry.ts 顶层的 styleCache / scriptCache / embedHTMLCache 是 fetch 结果缓存，
 * 不传 host 时清全部；传 host 或数组时按 url 前缀清，用于热更新或多 host 切换
 * 场景的主动失效。
 */

export {};

const { styleCache, scriptCache, embedHTMLCache } = require("../../src/entry");
const wujie = require("../../src/index");

describe("clearAssetsCache 资源缓存清理 API", () => {
  beforeEach(() => {
    Object.keys(styleCache).forEach((k) => delete styleCache[k]);
    Object.keys(scriptCache).forEach((k) => delete scriptCache[k]);
    Object.keys(embedHTMLCache).forEach((k) => delete embedHTMLCache[k]);
  });

  test("公共入口 wujie.clearAssetsCache 应被导出", () => {
    expect(typeof wujie.clearAssetsCache).toBe("function");
  });

  test("clearAssetsCache() 不传参时应清空所有 styleCache/scriptCache/embedHTMLCache", () => {
    styleCache["http://a.com/a.css"] = Promise.resolve("a");
    scriptCache["http://b.com/b.js"] = Promise.resolve("b");
    embedHTMLCache["http://a.com/index"] = Promise.resolve("html");

    wujie.clearAssetsCache();

    expect(Object.keys(styleCache)).toHaveLength(0);
    expect(Object.keys(scriptCache)).toHaveLength(0);
    expect(Object.keys(embedHTMLCache)).toHaveLength(0);
  });

  test("clearAssetsCache(host) 应只清空匹配 host 前缀的 entry", () => {
    styleCache["http://a.com/a.css"] = Promise.resolve("a");
    styleCache["http://b.com/b.css"] = Promise.resolve("b");
    scriptCache["http://a.com/a.js"] = Promise.resolve("a");
    scriptCache["http://b.com/b.js"] = Promise.resolve("b");
    embedHTMLCache["http://a.com/index"] = Promise.resolve("html-a");
    embedHTMLCache["http://b.com/index"] = Promise.resolve("html-b");

    wujie.clearAssetsCache("http://a.com");

    expect(styleCache["http://a.com/a.css"]).toBeUndefined();
    expect(styleCache["http://b.com/b.css"]).toBeDefined();
    expect(scriptCache["http://a.com/a.js"]).toBeUndefined();
    expect(scriptCache["http://b.com/b.js"]).toBeDefined();
    expect(embedHTMLCache["http://a.com/index"]).toBeUndefined();
    expect(embedHTMLCache["http://b.com/index"]).toBeDefined();
  });

  test("clearAssetsCache([h1, h2]) 应支持批量 host", () => {
    styleCache["http://a.com/a.css"] = "a";
    styleCache["http://b.com/b.css"] = "b";
    styleCache["http://c.com/c.css"] = "c";

    wujie.clearAssetsCache(["http://a.com", "http://c.com"]);

    expect(styleCache["http://a.com/a.css"]).toBeUndefined();
    expect(styleCache["http://b.com/b.css"]).toBe("b");
    expect(styleCache["http://c.com/c.css"]).toBeUndefined();
  });
});
