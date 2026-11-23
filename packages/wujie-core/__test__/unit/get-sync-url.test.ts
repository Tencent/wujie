/**
 * 单元测试：getSyncUrl 短路径还原。
 *
 * 主应用 url 上挂的是子应用路由，配了 prefix 时会被压缩成 `{短路径} + 剩余路径`，
 * getSyncUrl 负责把它还原成完整路径；还原不出来时必须给出可判定的结果，
 * 不能把占位符替换成字符串 undefined 拼进路径。
 */

import { getSyncUrl } from "../../src/utils";

const setQuery = (search: string) => {
  window.history.replaceState(null, "", `${window.location.pathname}${search}`);
};

describe("getSyncUrl", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("应该把短路径还原成完整路径", () => {
    setQuery("?app={prod}/hello");
    expect(getSyncUrl("app", { prod: "/example/prod" })).toBe("/example/prod/hello");
  });

  it("带 query 的短路径应该只替换占位符", () => {
    // 主应用 url 上的参数值是整段 encodeURIComponent 过的，否则 & 会被当成另一个参数
    setQuery("?app=" + encodeURIComponent("{prodId}5&age=10"));
    expect(getSyncUrl("app", { prodId: "/example/prod/debug?id=" })).toBe("/example/prod/debug?id=5&age=10");
  });

  it("找不到对应 prefix 时不应该拼出 undefined", () => {
    setQuery("?app={unknown}/hello");
    expect(getSyncUrl("app", { prod: "/example/prod" })).toBe("");
  });

  it("没有配置 prefix 时原样返回", () => {
    setQuery("?app=/hello");
    expect(getSyncUrl("app", undefined)).toBe("/hello");
  });

  it("值里没有占位符时原样返回", () => {
    setQuery("?app=/hello");
    expect(getSyncUrl("app", { prod: "/example/prod" })).toBe("/hello");
  });

  it("url 上没有该子应用的参数时返回空字符串", () => {
    setQuery("?other=1");
    expect(getSyncUrl("app", { prod: "/example/prod" })).toBe("");
  });
});
