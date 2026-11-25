/**
 * 单元测试：入口 HTML 里内联 <style media="print"> 的 media 必须保留。
 *
 * 这是 media 透传的第四个入口：<link> 走 getEmbedHTML、插件 loader 走
 * processCssLoaderForTemplate、动态 <link> 走 setAttrsToElement，都已经覆盖；
 * 内联 <style> 在 processTpl 里被收成 { src: "", content }，media 直接丢了。
 */

export {};

import processTpl from "../../src/template";
import { getEmbedHTML } from "../../src/entry";

const BASE = "https://sub.example.com/app/";

describe("内联 <style> 的 media 透传", () => {
  it("processTpl 采集 <style> 上的 media", () => {
    const { styles } = processTpl('<style media="print">body{color:red}</style>', BASE, undefined);

    expect(styles[0].media).toBe("print");
  });

  it("processTpl 采集单引号包裹的 media", () => {
    const { styles } = processTpl("<style media='print'>body{}</style>", BASE, undefined);

    expect(styles[0].media).toBe("print");
  });

  it("processTpl 采集带空格括号的 media", () => {
    const { styles } = processTpl('<style media="(max-width: 600px)">body{}</style>', BASE, undefined);

    expect(styles[0].media).toBe("(max-width: 600px)");
  });

  it("生成的内联 style 带上 media", async () => {
    const { template, styles } = processTpl('<style media="print">body{color:red}</style>', BASE, undefined);

    const html = await getEmbedHTML(
      template,
      styles.map((style) => ({ src: "", contentPromise: Promise.resolve(style.content) })) as any
    );

    expect(html).toContain('media="print"');
    expect(html).toContain("body{color:red}");
  });

  it("没有 media 时不输出该属性", async () => {
    const { template, styles } = processTpl("<style>body{margin:0}</style>", BASE, undefined);

    const html = await getEmbedHTML(
      template,
      styles.map((style) => ({ src: "", contentPromise: Promise.resolve(style.content) })) as any
    );

    expect(html).toContain("body{margin:0}");
    expect(html).not.toContain("media=");
  });
});
