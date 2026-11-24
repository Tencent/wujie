import { initBase, patchRelativeUrlEffect, patchSetAttribute } from "../../src/iframe";
import { relativeUrlAttrMap } from "../../src/common";
import { getAbsoluteSrcset } from "../../src/utils";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const APP_BASE = "http://localhost:7600/app/";

const htmlEntries: [string, string][] = [];
Object.keys(relativeUrlAttrMap)
  .filter((localName) => localName !== "image")
  .forEach((localName) =>
    Object.keys(relativeUrlAttrMap[localName]).forEach((attr) => htmlEntries.push([localName, attr]))
  );

const relativeValue = (attr: string): string => (attr === "srcset" ? "a.png 1x, /b.png 2x" : "logo.png");
const absoluteValue = (attr: string): string =>
  attr === "srcset" ? `${APP_BASE}a.png 1x, http://localhost:7600/b.png 2x` : `${APP_BASE}logo.png`;

function createAppWindow(): { iframe: HTMLIFrameElement; win: Window } {
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  const win = iframe.contentWindow as Window;
  win.document.open();
  win.document.write("<!DOCTYPE html><html><head></head><body></body></html>");
  win.document.close();
  initBase(win, "http://localhost:7600/", "/app/");
  patchRelativeUrlEffect(win);
  return { iframe, win };
}

describe("相对地址修正", () => {
  let iframe: HTMLIFrameElement;
  let win: Window;

  beforeEach(() => {
    ({ iframe, win } = createAppWindow());
  });

  afterEach(() => {
    document.body.removeChild(iframe);
  });

  it.each(htmlEntries)("setAttribute 补全 %s[%s]", (localName, attr) => {
    const element = win.document.createElement(localName);
    element.setAttribute(attr, relativeValue(attr));
    expect(element.getAttribute(attr)).toBe(absoluteValue(attr));
  });

  it.each(htmlEntries)("属性赋值补全 %s.%s", (localName, attr) => {
    const element = win.document.createElement(localName);
    element[attr] = relativeValue(attr);
    expect(element.getAttribute(attr)).toBe(absoluteValue(attr));
  });

  it("补全 svg image 的 href 与 xlink:href", () => {
    const image = win.document.createElementNS(SVG_NS, "image");
    image.setAttribute("href", "a.png");
    image.setAttributeNS(XLINK_NS, "xlink:href", "b.png");
    expect(image.getAttribute("href")).toBe(`${APP_BASE}a.png`);
    expect(image.getAttribute("xlink:href")).toBe(`${APP_BASE}b.png`);
  });

  it("innerHTML 补全表中所有元素属性，包括 a 的 href", () => {
    const div = win.document.createElement("div");
    div.innerHTML = [
      ...htmlEntries.map(([localName, attr]) => `<${localName} ${attr}="${relativeValue(attr)}"></${localName}>`),
      '<svg><image href="a.png"></image><image xlink:href="b.png"></image></svg>',
    ].join("");
    htmlEntries.forEach(([localName, attr]) => {
      expect(div.querySelector(`${localName}[${attr}]`)?.getAttribute(attr)).toBe(absoluteValue(attr));
    });
    const images = div.querySelectorAll("image");
    expect(images[0].getAttribute("href")).toBe(`${APP_BASE}a.png`);
    expect(images[1].getAttribute("xlink:href")).toBe(`${APP_BASE}b.png`);
  });

  it("innerHTML 修正 Vue 静态字符串化经 template.innerHTML 插入的节点", () => {
    const template = win.document.createElement("template");
    template.innerHTML = '<img src="/assets/a.png">'.repeat(6);
    const srcList = Array.from(template.content.querySelectorAll("img")).map((img) => img.getAttribute("src"));
    expect(srcList).toEqual(new Array(6).fill("http://localhost:7600/assets/a.png"));
  });

  it("已挂载节点的 innerHTML 先补全再写入，保持原有解析上下文", async () => {
    const div = win.document.createElement("div");
    win.document.body.appendChild(div);
    const records: MutationRecord[] = [];
    const observer = new MutationObserver((list) => records.push(...list));
    observer.observe(div, { childList: true });
    div.innerHTML = '<video poster="cover.png"></video><iframe src="a.html"></iframe><span>text</span>';
    expect(div.querySelector("video")?.getAttribute("poster")).toBe(`${APP_BASE}cover.png`);
    expect(div.querySelector("iframe")?.getAttribute("src")).toBe(`${APP_BASE}a.html`);
    expect(div.querySelector("span")?.textContent).toBe("text");
    await Promise.resolve();
    expect(records).toHaveLength(1);
    observer.disconnect();

    const table = win.document.createElement("table");
    const tbody = win.document.createElement("tbody");
    table.appendChild(tbody);
    win.document.body.appendChild(table);
    tbody.innerHTML = '<tr><td><img src="a.png"></td></tr>';
    expect(tbody.querySelector("tr td img")?.getAttribute("src")).toBe(`${APP_BASE}a.png`);

    const svg = win.document.createElementNS(SVG_NS, "svg");
    win.document.body.appendChild(svg);
    svg.innerHTML = '<image href="a.png"></image>';
    expect(svg.firstElementChild?.namespaceURI).toBe(SVG_NS);
    expect(svg.firstElementChild?.getAttribute("href")).toBe(`${APP_BASE}a.png`);
  });

  it("识别紧跟在引号或斜杠后的属性名", () => {
    const div = win.document.createElement("div");
    div.innerHTML = '<img alt="x"src="a.png"><img/src="b.png">';
    const images = div.querySelectorAll("img");
    expect(images[0].getAttribute("src")).toBe(`${APP_BASE}a.png`);
    expect(images[1].getAttribute("src")).toBe(`${APP_BASE}b.png`);
  });

  it("同一元素的多个地址属性互不覆盖", () => {
    const img = win.document.createElement("img");
    img.setAttribute("src", "a.png");
    img.setAttribute("srcset", "b.png 2x");
    const video = win.document.createElement("video");
    video.setAttribute("src", "a.mp4");
    video.setAttribute("poster", "cover.png");
    expect(img.getAttribute("src")).toBe(`${APP_BASE}a.png`);
    expect(img.getAttribute("srcset")).toBe(`${APP_BASE}b.png 2x`);
    expect(video.getAttribute("src")).toBe(`${APP_BASE}a.mp4`);
    expect(video.getAttribute("poster")).toBe(`${APP_BASE}cover.png`);
  });

  it("属性名大小写不敏感", () => {
    const img = win.document.createElement("img");
    img.setAttribute("SRC", "a.png");
    expect(img.getAttribute("src")).toBe(`${APP_BASE}a.png`);
  });

  it("不改写 hash、绝对地址、data 地址和表外属性", () => {
    const div = win.document.createElement("div");
    div.innerHTML =
      '<a href="#top">a</a><a href="mailto:a@b.com">b</a><img src="https://cdn.example.com/a.png">' +
      '<img src="data:image/png;base64,AAAA"><img data-src="/lazy.png"><div title="a.png"></div>';
    const links = div.querySelectorAll("a");
    const images = div.querySelectorAll("img");
    expect(links[0].getAttribute("href")).toBe("#top");
    expect(links[1].getAttribute("href")).toBe("mailto:a@b.com");
    expect(images[0].getAttribute("src")).toBe("https://cdn.example.com/a.png");
    expect(images[1].getAttribute("src")).toBe("data:image/png;base64,AAAA");
    expect(images[2].getAttribute("data-src")).toBe("/lazy.png");
    expect(div.querySelector("div")?.getAttribute("title")).toBe("a.png");
  });

  it("与内联事件编译叠加时两者都生效", () => {
    (win as any).__WUJIE = { id: "app" };
    patchSetAttribute(win);
    const img = win.document.createElement("img");
    img.setAttribute("src", "a.png");
    img.setAttribute("onerror", "handleError()");
    expect(img.getAttribute("src")).toBe(`${APP_BASE}a.png`);
    expect(img.getAttribute("onerror")).toContain('"app"');
    expect(img.getAttribute("onerror")).toContain("handleError()");
  });

  it("沙箱存在时按 proxyLocation 补全", () => {
    (win as any).__WUJIE = { proxyLocation: new URL("http://localhost:7600/app/detail/1") };
    const img = win.document.createElement("img");
    img.src = "a.png";
    expect(img.getAttribute("src")).toBe("http://localhost:7600/app/detail/a.png");
  });

  it("保持原生 innerHTML 读写行为", () => {
    const div = win.document.createElement("div");
    div.innerHTML = "<b>bold</b>";
    expect(div.innerHTML).toBe("<b>bold</b>");
    div.innerHTML = "";
    expect(div.childNodes).toHaveLength(0);
  });
});

describe("getAbsoluteSrcset", () => {
  it.each([
    ["a.png 1x,b.png 2x", `${APP_BASE}a.png 1x,${APP_BASE}b.png 2x`],
    ["a.png, b.png 2x", `${APP_BASE}a.png, ${APP_BASE}b.png 2x`],
    ["  a.png  100w ,\n b.png 200w", `  ${APP_BASE}a.png  100w ,\n ${APP_BASE}b.png 200w`],
    ["data:image/png;base64,AA 1x, c.png 2x", `data:image/png;base64,AA 1x, ${APP_BASE}c.png 2x`],
    ["https://cdn.example.com/a.png 1x", "https://cdn.example.com/a.png 1x"],
    ["a\u3000b.png 1x", `${APP_BASE}a%E3%80%80b.png 1x`],
    ["", ""],
  ])("%j", (srcset, expected) => {
    expect(getAbsoluteSrcset(srcset, APP_BASE)).toBe(expected);
  });
});
