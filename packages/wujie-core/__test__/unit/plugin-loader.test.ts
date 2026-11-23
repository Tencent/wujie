/**
 * 单元测试：plugin.ts 的 loader 组合与默认 cssLoader。
 *
 * 默认 cssLoader 负责把子应用 css 里的相对地址补成绝对地址。
 * 注意区分三类「不是地址」的写法：
 * - data: 内联内容（base64 图片等），改了就失效；
 * - #id 文档内引用（SVG gradient / filter / clip-path），改了就指到别的资源上；
 * - 已经是绝对地址的，原样保留。
 */

import defaultPlugin, {
  getCssLoader,
  getEffectLoaders,
  getJsLoader,
  getPlugins,
  getPresetLoaders,
  isMatchUrl,
} from "../../src/plugin";

const BASE = "http://localhost:8080/css/";
const cssLoader = getCssLoader({ plugins: [defaultPlugin], replace: (code) => code });

describe("getCssLoader", () => {
  it("相对地址补成绝对地址", () => {
    expect(cssLoader("background:url(a.png)", "", BASE)).toBe(`background:url(${BASE}a.png)`);
  });

  it("带引号的相对地址保留引号", () => {
    expect(cssLoader('background:url("a.png")', "", BASE)).toBe(`background:url("${BASE}a.png")`);
  });

  it("url(#id) 是文档内引用，不应该被改写", () => {
    expect(cssLoader(".a{fill:url(#grad)}", "", BASE)).toBe(".a{fill:url(#grad)}");
    expect(cssLoader(".b{filter:url(#blur)}", "", BASE)).toBe(".b{filter:url(#blur)}");
  });

  it("data: 内联内容不改写", () => {
    const code = ".a{background:url(data:image/png;base64,AAAA)}";
    expect(cssLoader(code, "", BASE)).toBe(code);
  });

  it("绝对地址原样保留", () => {
    const code = ".a{background:url(https://cdn.example.com/a.png)}";
    expect(cssLoader(code, "", BASE)).toBe(code);
  });

  it("有 src 时按 src 解析相对地址", () => {
    expect(cssLoader("background:url(a.png)", `${BASE}sub/app.css`, BASE)).toBe(`background:url(${BASE}sub/a.png)`);
  });

  it("应用用户的 cssLoader 插件", () => {
    const upper = { cssLoader: (code: string) => code.toUpperCase() };
    const loader = getCssLoader({ plugins: [defaultPlugin, upper], replace: (code) => code });

    expect(loader("a{color:red}", "", BASE)).toBe("A{COLOR:RED}");
  });

  it("replace 先于插件执行", () => {
    const loader = getCssLoader({ plugins: [defaultPlugin], replace: (code) => code.replace("RED", "blue") });

    expect(loader("a{color:RED}", "", BASE)).toBe("a{color:blue}");
  });
});

describe("getJsLoader", () => {
  it("没有 jsLoader 插件时原样返回", () => {
    const loader = getJsLoader({ plugins: [defaultPlugin], replace: (code) => code });

    expect(loader("var a = 1", "", BASE)).toBe("var a = 1");
  });

  it("按插件顺序依次处理", () => {
    const first = { jsLoader: (code: string) => `${code}//first` };
    const second = { jsLoader: (code: string) => `${code}//second` };
    const loader = getJsLoader({ plugins: [first, second], replace: (code) => code });

    expect(loader("var a = 1", "", BASE)).toBe("var a = 1//first//second");
  });
});

describe("插件集合处理", () => {
  it("getPlugins 总是带上默认插件", () => {
    expect(getPlugins([])).toHaveLength(1);
    expect(getPlugins([])[0]).toBe(defaultPlugin);
    expect(getPlugins([{}, {}])).toHaveLength(3);
  });

  it("getEffectLoaders 合并并忽略空值", () => {
    const plugins = [{ jsIgnores: ["a.js"] }, {}, { jsIgnores: [/b\.js/] }] as any;

    expect(getEffectLoaders("jsIgnores", plugins)).toEqual(["a.js", /b\.js/]);
  });

  it("isMatchUrl 支持字符串与正则", () => {
    expect(isMatchUrl("a.js", ["a.js"])).toBe(true);
    expect(isMatchUrl("a.js", ["b.js"])).toBe(false);
    expect(isMatchUrl("a.js", [/^a\./])).toBe(true);
  });

  it("getPresetLoaders 合并各插件的预置脚本", () => {
    const plugins = [{ jsBeforeLoaders: [{ content: "1" }] }, { jsBeforeLoaders: [{ content: "2" }] }] as any;

    expect(getPresetLoaders("jsBeforeLoaders", plugins)).toEqual([{ content: "1" }, { content: "2" }]);
  });
});
