/**
 * 单元测试：utils.ts 里的代理与地址辅助函数。
 */

import {
  toArray,
  isFunction,
  isHijackingTag,
  isBoundedFunction,
  isConstructable,
  checkProxyFunction,
  getTargetValue,
  setAttrsToElement,
  getAbsolutePath,
  appRouteParse,
  getCurUrl,
  compose,
  getAnchorElementQueryMap,
  anchorElementGenerator,
  defaultGetPublicPath,
} from "../../src/utils";

describe("toArray / isFunction", () => {
  it("toArray 包装单个值，数组原样返回", () => {
    const arr = [1, 2];

    expect(toArray(1)).toEqual([1]);
    expect(toArray(arr)).toBe(arr);
  });

  it("isFunction 只认函数", () => {
    expect(isFunction(() => {})).toBe(true);
    expect(isFunction({})).toBe(false);
    expect(isFunction(null)).toBe(false);
  });
});

describe("isHijackingTag", () => {
  it("只劫持 LINK / STYLE / SCRIPT / IFRAME", () => {
    ["LINK", "style", "Script", "iframe"].forEach((tag) => expect(isHijackingTag(tag)).toBe(true));
    ["div", "img", ""].forEach((tag) => expect(isHijackingTag(tag)).toBe(false));
    expect(isHijackingTag(undefined)).toBe(false);
  });
});

describe("isBoundedFunction / isConstructable", () => {
  it("isBoundedFunction 识别 bind 出来的函数", () => {
    const raw = function raw() {};
    const bound = raw.bind(null);

    expect(isBoundedFunction(bound)).toBe(true);
    expect(isBoundedFunction(raw)).toBe(false);
    // 第二次走缓存，结果必须一致
    expect(isBoundedFunction(bound)).toBe(true);
    expect(isBoundedFunction(raw)).toBe(false);
  });

  it("isConstructable 识别 class 与普通具名函数", () => {
    class Foo {}
    function Bar() {}
    const arrow = () => {};

    expect(isConstructable(Foo as any)).toBe(true);
    expect(isConstructable(Bar as any)).toBe(true);
    expect(isConstructable(arrow as any)).toBe(false);
  });
});

describe("getTargetValue / checkProxyFunction", () => {
  it("方法绑定到 target 上，并且复用同一个绑定结果", () => {
    const target = {
      value: 1,
      getValue() {
        return this.value;
      },
    };

    const fn = getTargetValue(target, "getValue");

    expect(fn()).toBe(1);
    expect(getTargetValue(target, "getValue")).toBe(fn);
  });

  it("非函数值原样返回", () => {
    expect(getTargetValue({ a: 1 }, "a")).toBe(1);
  });

  it("checkProxyFunction 登记过的函数不再绑定", () => {
    const target = {
      value: 2,
      getValue() {
        return this.value;
      },
    };
    const raw = target.getValue;

    checkProxyFunction(target as any, raw);

    expect(getTargetValue(target, "getValue")).toBe(raw);
  });
});

describe("地址相关", () => {
  it("setAttrsToElement 逐个设置属性", () => {
    const el = document.createElement("div");

    setAttrsToElement(el, { id: "x", "data-a": 1 });

    expect(el.getAttribute("id")).toBe("x");
    expect(el.getAttribute("data-a")).toBe("1");
  });

  it("getAbsolutePath 补全相对地址", () => {
    expect(getAbsolutePath("a.png", "http://localhost:8080/css/")).toBe("http://localhost:8080/css/a.png");
    expect(getAbsolutePath("", "http://localhost:8080/css/")).toBe("");
  });

  it("getAbsolutePath 在 hash 模式下保留文档内引用", () => {
    expect(getAbsolutePath("#grad", "http://localhost:8080/css/", true)).toBe("#grad");
  });

  it("appRouteParse 拆出 host 与路由，空地址抛错", () => {
    const { appHostPath, appRoutePath } = appRouteParse("http://localhost:8080/sub/a?b=1#c");

    expect(appHostPath).toBe("http://localhost:8080");
    expect(appRoutePath).toBe("/sub/a?b=1#c");
    expect(() => appRouteParse("")).toThrow();
  });

  it("getCurUrl 只保留 protocol + host + pathname", () => {
    expect(getCurUrl({ protocol: "http:", host: "localhost:8080", pathname: "/sub/", search: "?a=1" })).toBe(
      "http://localhost:8080/sub/"
    );
  });

  it("getAnchorElementQueryMap 解析查询参数，重复键取最后一个", () => {
    const anchor = anchorElementGenerator("http://localhost:8080/p?a=1&b=2&a=3");

    expect(getAnchorElementQueryMap(anchor)).toEqual({ a: "3", b: "2" });
  });

  it("defaultGetPublicPath 取 url 所在目录", () => {
    expect(defaultGetPublicPath("http://localhost:8080/sub/index.html")).toBe("http://localhost:8080/sub/");
    expect(defaultGetPublicPath({} as any)).toBe("/");
  });
});

describe("compose", () => {
  it("按顺序串联，空列表原样返回", () => {
    expect(compose([])("a")).toBe("a");
    expect(compose([(c) => `${c}1`, (c) => `${c}2`])("a")).toBe("a12");
  });

  it("跳过非函数项", () => {
    expect(compose([(c) => `${c}1`, undefined, (c) => `${c}2`])("a")).toBe("a12");
  });
});
