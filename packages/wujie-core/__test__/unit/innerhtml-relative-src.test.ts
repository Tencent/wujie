import { initBase } from "../../src/iframe";
import { fixInnerHTMLRelativeSrc } from "../../src/utils";

function createAppWindow(): { iframe: HTMLIFrameElement; win: Window } {
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  const win = iframe.contentWindow as Window;
  win.document.open();
  win.document.write("<!DOCTYPE html><html><head></head><body></body></html>");
  win.document.close();
  initBase(win, "http://localhost:7600/", "/app/");
  fixInnerHTMLRelativeSrc(win);
  return { iframe, win };
}

describe("innerHTML 相对地址修正", () => {
  let iframe: HTMLIFrameElement;
  let win: Window;

  beforeEach(() => {
    ({ iframe, win } = createAppWindow());
  });

  afterEach(() => {
    document.body.removeChild(iframe);
  });

  it("修正 Vue 静态字符串化经 template.innerHTML 插入的 img", () => {
    const template = win.document.createElement("template");
    template.innerHTML = '<img src="/assets/a.png">'.repeat(6);
    const srcList = Array.from(template.content.querySelectorAll("img")).map((img) => img.getAttribute("src"));
    expect(srcList).toEqual(new Array(6).fill("http://localhost:7600/assets/a.png"));
  });

  it("修正普通元素 innerHTML 中的 img 与 source，相对路径按子应用地址补全", () => {
    const div = win.document.createElement("div");
    div.innerHTML = '<p><img src="logo.png"></p><picture><source src="./b.webp"></picture>';
    expect(div.querySelector("img")?.getAttribute("src")).toBe("http://localhost:7600/app/logo.png");
    expect(div.querySelector("source")?.getAttribute("src")).toBe("http://localhost:7600/app/b.webp");
  });

  it("不改写绝对地址、data 地址和其他元素属性", () => {
    const div = win.document.createElement("div");
    div.innerHTML =
      '<img src="https://cdn.example.com/a.png"><img src="data:image/png;base64,AAAA"><a href="/foo">a</a><img data-src="/lazy.png">';
    const images = div.querySelectorAll("img");
    expect(images[0].getAttribute("src")).toBe("https://cdn.example.com/a.png");
    expect(images[1].getAttribute("src")).toBe("data:image/png;base64,AAAA");
    expect(images[2].getAttribute("data-src")).toBe("/lazy.png");
    expect(div.querySelector("a")?.getAttribute("href")).toBe("/foo");
  });

  it("保持原生 innerHTML 读写行为", () => {
    const div = win.document.createElement("div");
    div.innerHTML = "<b>bold</b>";
    expect(div.innerHTML).toBe("<b>bold</b>");
    div.innerHTML = "";
    expect(div.childNodes).toHaveLength(0);
  });
});
