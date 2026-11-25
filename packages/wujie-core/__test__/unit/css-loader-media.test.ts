/**
 * 单元测试：cssBeforeLoaders / cssAfterLoaders 插入的 <style> 要保留 media。
 *
 * 入口 HTML 那条链路（processTpl -> getExternalStyleSheets -> getEmbedHTML）已经
 * 会透传 media，插件 loader 这条链路在解构 { src, contentPromise } 时把它丢了 ——
 * 表现与 #1159 一样：print / 响应式样式表无条件生效。
 */

export {};

import { processCssLoaderForTemplate } from "../../src/shadow";
import { getExternalStyleSheets } from "../../src/entry";

const APP_URL = "https://sub.example.com/app/";

const fetchOk = (() => Promise.resolve({ text: () => Promise.resolve("body{color:red}") })) as any;

function makeSandbox(plugins: any[]): any {
  document.body.innerHTML = "";
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  return {
    iframe: { contentDocument: iframe.contentDocument },
    plugins,
    replace: undefined,
    proxyLocation: { href: APP_URL },
    fetch: fetchOk,
    lifecycles: { loadError: () => {} },
  };
}

function styleElements(html: HTMLElement): HTMLStyleElement[] {
  return Array.from(html.querySelectorAll("style")) as HTMLStyleElement[];
}

describe("插件 css loader 的 media 透传", () => {
  it("cssAfterLoaders 的外链样式保留 media", async () => {
    const sandbox = makeSandbox([{ cssAfterLoaders: [{ src: "print.css", media: "print" }] }]);
    const html = sandbox.iframe.contentDocument.documentElement;

    await processCssLoaderForTemplate(sandbox, html);

    const styles = styleElements(html);
    expect(styles.length).toBe(1);
    expect(styles[0].getAttribute("media")).toBe("print");
  });

  it("cssAfterLoaders 的内联样式保留 media", async () => {
    const sandbox = makeSandbox([{ cssAfterLoaders: [{ content: "body{margin:0}", media: "print" }] }]);
    const html = sandbox.iframe.contentDocument.documentElement;

    await processCssLoaderForTemplate(sandbox, html);

    expect(styleElements(html)[0].getAttribute("media")).toBe("print");
  });

  it("cssBeforeLoaders 同样保留 media", async () => {
    const sandbox = makeSandbox([{ cssBeforeLoaders: [{ content: "body{padding:0}", media: "screen" }] }]);
    const html = sandbox.iframe.contentDocument.documentElement;

    await processCssLoaderForTemplate(sandbox, html);

    expect(styleElements(html)[0].getAttribute("media")).toBe("screen");
  });

  it("没有 media 时不输出该属性", async () => {
    const sandbox = makeSandbox([{ cssAfterLoaders: [{ content: "body{margin:0}" }] }]);
    const html = sandbox.iframe.contentDocument.documentElement;

    await processCssLoaderForTemplate(sandbox, html);

    expect(styleElements(html)[0].hasAttribute("media")).toBe(false);
  });

  it("getExternalStyleSheets 的内联分支也带上 media", () => {
    const [result] = getExternalStyleSheets([{ content: "body{margin:0}", media: "print" }], fetchOk, () => {});

    expect((result as any).media).toBe("print");
  });
});
