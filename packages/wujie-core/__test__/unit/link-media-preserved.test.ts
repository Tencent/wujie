/**
 * 单元测试：<link rel="stylesheet" media="print"> 的 media 必须一路透传到内联 <style>。
 *
 * wujie 把外链样式转成内联 <style> 塞进 shadow DOM，丢 media 会让 print / 响应式
 * 样式表**无条件生效**，表现为「屏幕上出现了本该只打印的样式」。
 */

export {};

import processTpl from "../../src/template";
import { getExternalStyleSheets, getEmbedHTML } from "../../src/entry";

const BASE = "https://sub.example.com/";

const fetchOk = (() => Promise.resolve({ text: () => Promise.resolve("body{color:red}") })) as any;

function run(html: string) {
  const { template, styles } = processTpl(html, BASE, undefined);
  const styleResults = getExternalStyleSheets(styles, fetchOk, () => {});
  return { template, styles, styleResults };
}

describe("link 的 media 透传", () => {
  it("processTpl 采集 link 上的 media", () => {
    const { styles } = run('<link rel="stylesheet" href="a.css" media="print">');

    expect(styles[0].media).toBe("print");
  });

  it("media 值带空格与括号也完整保留", () => {
    const { styles } = run('<link rel="stylesheet" href="a.css" media="(min-width: 600px)">');

    expect(styles[0].media).toBe("(min-width: 600px)");
  });

  it("单引号包裹的 media 同样能取到", () => {
    const { styles } = run("<link rel='stylesheet' href='a.css' media='print'>");

    expect(styles[0].media).toBe("print");
  });

  it("没有引号的 media 也能取到", () => {
    const { styles } = run('<link rel="stylesheet" href="a.css" media=print>');

    expect(styles[0].media).toBe("print");
  });

  it("getExternalStyleSheets 保留 media", () => {
    const { styleResults } = run('<link rel="stylesheet" href="a.css" media="print">');

    expect((styleResults[0] as any).media).toBe("print");
  });

  it("转成内联 style 时带上 media", async () => {
    const { template, styleResults } = run('<link rel="stylesheet" href="a.css" media="print">');

    const html = await getEmbedHTML(template, styleResults);

    expect(html).toContain("<style");
    expect(html).toContain('media="print"');
  });

  it("没有 media 时不额外输出属性", async () => {
    const { template, styleResults } = run('<link rel="stylesheet" href="a.css">');

    const html = await getEmbedHTML(template, styleResults);

    expect(html).not.toContain("media=");
  });
});
