/**
 * 单元测试：模块级资源缓存（styleCache/scriptCache/embedHTMLCache）的清理 API。
 *
 * 主要面向：
 * - notes/memory-leak-investigation.md §4
 *   `entry.ts` 顶层 `styleCache / scriptCache / embedHTMLCache` 始终持有
 *   每个 url 的 fetch 内容/Promise，destroyApp 不会清，热更新场景或
 *   多 host 子应用切换会持续累积，长时间运行后内存上涨。
 *
 * 修复目标：
 *   - 暴露 `clearAssetsCache(host?: string | string[])` 公共 API
 *   - 不传参时清全部；传 host 时按 url 前缀清 styleCache + scriptCache + embedHTMLCache
 */

export {};

const { styleCache, scriptCache, embedHTMLCache } = require("../../src/entry");
const wujie = require("../../src/index");

describe("clearAssetsCache: §4 资源缓存清理 API", () => {
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
