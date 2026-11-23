/**
 * 单元测试：processTpl 解析子应用 html 模板。
 *
 * 约定（来自实现与文档）：
 * - 外链 script/style 被抽到 scripts/styles，模板里留注释占位；
 * - 相对地址按 baseURI 补全成绝对地址；
 * - 带 ignore 的资源不处理，交给子应用自己请求；
 * - 没有 entry 标记时，最后一个 script 作为 entry。
 */

import processTpl from "../../src/template";

const BASE = "http://localhost:8080/app/";

describe("processTpl", () => {
  it("抽取外链 script 并把相对地址补成绝对地址", () => {
    const { template, scripts } = processTpl('<div id="app"></div><script src="/main.js"></script>', BASE);

    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toBe("http://localhost:8080/main.js");
    expect(template).not.toContain("<script");
    expect(template).toContain("replaced by wujie");
  });

  it("没有 entry 标记时，最后一个 script 作为 entry", () => {
    const { entry } = processTpl('<script src="/a.js"></script><script src="/b.js"></script>', BASE);

    expect((entry as any).src).toBe("http://localhost:8080/b.js");
  });

  it("带 entry 标记的 script 作为 entry", () => {
    const { entry } = processTpl('<script src="/a.js" entry></script><script src="/b.js"></script>', BASE);

    expect(entry).toBe("http://localhost:8080/a.js");
  });

  it("带 ignore 的 script 交给子应用自己请求", () => {
    const { template, scripts } = processTpl('<script src="/x.js" ignore></script>', BASE);

    expect(scripts).toHaveLength(0);
    expect(template).toContain("ignore asset");
  });

  it("async 与 defer 分别落到脚本对象上", () => {
    const asyncRes = processTpl('<script src="/a.js" async></script>', BASE);
    const deferRes = processTpl('<script src="/a.js" defer></script>', BASE);

    expect(asyncRes.scripts[0].async).toBe(true);
    expect(asyncRes.scripts[0].defer).toBe(false);
    expect(deferRes.scripts[0].defer).toBe(true);
  });

  it("内联 script 的内容被原文保留", () => {
    const { scripts } = processTpl('<script>console.log("inline")</script>', BASE);

    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toBe("");
    expect(scripts[0].content).toBe('console.log("inline")');
  });

  it("整段都是注释的内联 script 被丢弃", () => {
    const { scripts } = processTpl("<script>// nothing\n// here</script><script src='/a.js'></script>", BASE);

    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toBe("http://localhost:8080/a.js");
  });

  it("抽取外链样式并把相对地址补成绝对地址", () => {
    const { template, styles } = processTpl('<link rel="stylesheet" href="/a.css">', BASE);

    expect(styles).toHaveLength(1);
    expect(styles[0].src).toBe("http://localhost:8080/a.css");
    expect(template).not.toContain("<link");
  });

  it("内联样式按下标留占位", () => {
    const { template, styles } = processTpl("<style>body{color:red}</style>", BASE);

    expect(styles).toHaveLength(1);
    expect(styles[0].content).toBe("body{color:red}");
    expect(template).toContain("inline-style-0");
  });

  it("html 注释被清掉", () => {
    const { template } = processTpl("<!-- top --><div></div>", BASE);

    expect(template).not.toContain("<!-- top");
    expect(template).toContain("<div></div>");
  });

  it("带 ignore 的样式与 script 一样交给子应用自己请求", () => {
    const styleRes = processTpl("<style ignore>body{color:red}</style>", BASE);
    const linkRes = processTpl('<link rel="stylesheet" href="/a.css" ignore>', BASE);

    expect(styleRes.styles).toHaveLength(0);
    expect(styleRes.template).toContain("ignore asset");
    expect(linkRes.styles).toHaveLength(0);
    expect(linkRes.template).toContain("ignore asset");
  });

  it("多个内联样式按顺序编号", () => {
    const { template, styles } = processTpl("<style>a{color:red}</style><style>b{color:blue}</style>", BASE);

    expect(styles).toHaveLength(2);
    expect(template).toContain("inline-style-0");
    expect(template).toContain("inline-style-1");
  });

  it("绝对地址的外链资源不做拼接", () => {
    const { scripts } = processTpl('<script src="https://cdn.example.com/a.js"></script>', BASE);

    expect(scripts[0].src).toBe("https://cdn.example.com/a.js");
  });

  it("publicPath 为空时不应该抛错", () => {
    // defaultGetPublicPath 解析失败时返回 ""，模板解析应能容错而不是抛错
    expect(() => processTpl('<script src="/a.js"></script><link rel="stylesheet" href="/a.css">', "")).not.toThrow();
  });

  it("非 javascript 类型的 script 原样保留", () => {
    const { template, scripts } = processTpl('<script type="text/template"><div></div></script>', BASE);

    expect(scripts).toHaveLength(0);
    expect(template).toContain("text/template");
  });
});
