/**
 * 单元测试：shadow.ts 里的 loading 挂载/还原与样式规则迁移。
 *
 * addLoading 为了「防 loading 抖动」会临时改容器的 position/overflow，
 * removeLoading 负责还原。改错或还原漏一处，用户自己的页面布局会静默变化，
 * 所以三个分支（static / relative|sticky / 其他）和还原路径都钉住。
 *
 * jsdom 没有真实排版，window.getComputedStyle 在这里既不返回布局值还会抛错，
 * 因此计算样式一律显式 stub，测的是分支逻辑本身。
 */

jest.mock("../../src/sandbox", () => ({}), { virtual: true });
jest.mock("../../src/iframe", () => ({ initBase: jest.fn(), patchElementEffect: jest.fn() }), { virtual: true });
jest.mock("../../src/effect", () => ({ patchRenderEffect: jest.fn() }), { virtual: true });
jest.mock("../../src/entry", () => ({ getExternalStyleSheets: jest.fn() }), { virtual: true });

import { addLoading, removeLoading, getPatchStyleElements } from "../../src/shadow";

const LOADING_FLAG = "data-loading-flag";

function createContainer() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  return container;
}

function stubComputedStyle(position: string, overflow: string) {
  jest.spyOn(window, "getComputedStyle").mockReturnValue({ position, overflow } as any);
}

describe("addLoading / removeLoading", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    jest.restoreAllMocks();
  });

  it("static 容器改成 relative + overflow hidden，并清空原有内容", () => {
    stubComputedStyle("static", "visible");
    const container = createContainer();
    container.appendChild(document.createElement("span"));

    addLoading(container, null);

    expect(container.style.position).toBe("relative");
    expect(container.style.overflow).toBe("hidden");
    expect(container.querySelector("span")).toBeNull();
    expect(container.querySelector(`div[${LOADING_FLAG}]`)).not.toBeNull();
  });

  it("removeLoading 还原 static 容器的样式", () => {
    stubComputedStyle("static", "visible");
    const container = createContainer();

    addLoading(container, null);
    removeLoading(container);

    expect(container.style.position).toBe("");
    expect(container.style.overflow).toBe("");
    expect(container.querySelector(`div[${LOADING_FLAG}]`)).toBeNull();
  });

  it("overflow 原本是 hidden 时还原成 hidden 而不是清空", () => {
    stubComputedStyle("static", "hidden");
    const container = createContainer();

    addLoading(container, null);
    removeLoading(container);

    expect(container.style.overflow).toBe("hidden");
  });

  it("relative 容器只改 overflow，不动 position", () => {
    stubComputedStyle("relative", "visible");
    const container = createContainer();
    container.style.position = "relative";

    addLoading(container, null);

    expect(container.style.position).toBe("relative");
    expect(container.style.overflow).toBe("hidden");

    removeLoading(container);

    expect(container.style.position).toBe("relative");
    expect(container.style.overflow).toBe("");
  });

  it("sticky 容器同样只改 overflow", () => {
    stubComputedStyle("sticky", "visible");
    const container = createContainer();
    container.style.position = "sticky";

    addLoading(container, null);

    expect(container.style.position).toBe("sticky");
    expect(container.style.overflow).toBe("hidden");
  });

  it("absolute 容器不改任何样式，但仍然插入 loading", () => {
    stubComputedStyle("absolute", "visible");
    const container = createContainer();
    container.style.position = "absolute";

    addLoading(container, null);

    expect(container.style.overflow).toBe("");
    expect(container.querySelector(`div[${LOADING_FLAG}]`)).not.toBeNull();

    removeLoading(container);

    expect(container.style.position).toBe("absolute");
  });

  it("传入的 loading 元素被包进 loading 容器", () => {
    stubComputedStyle("static", "visible");
    const container = createContainer();
    const loading = document.createElement("p");

    addLoading(container, loading);

    expect(container.querySelector(`div[${LOADING_FLAG}]`).firstElementChild).toBe(loading);
  });

  it("不传 loading 时使用内置 svg", () => {
    stubComputedStyle("static", "visible");
    const container = createContainer();

    addLoading(container, null);

    expect(container.querySelector(`div[${LOADING_FLAG}] svg`)).not.toBeNull();
  });
});

describe("getPatchStyleElements", () => {
  afterEach(() => {
    document.head.innerHTML = "";
  });

  function addStyleSheet(css: string): CSSStyleSheet {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    return style.sheet as CSSStyleSheet;
  }

  it("把 :root 改写成 :host 并保留声明", () => {
    const [rootStyle] = getPatchStyleElements([addStyleSheet(":root{color:red}")]);

    expect(rootStyle.innerHTML).toContain(":host");
    expect(rootStyle.innerHTML).toContain("color: red");
    expect(rootStyle.innerHTML).not.toContain(":root");
  });

  it("跨样式表的多个 :root 规则全部保留", () => {
    const first = addStyleSheet(":root{color:red}");
    const second = addStyleSheet(":root{color:blue}");

    const [rootStyle] = getPatchStyleElements([first, second]);

    expect(rootStyle.innerHTML.match(/:host/g)).toHaveLength(2);
    expect(rootStyle.innerHTML).toContain("color: red");
    expect(rootStyle.innerHTML).toContain("color: blue");
  });

  it("同一样式表内相邻的两条 :root 规则全部保留", () => {
    const [rootStyle] = getPatchStyleElements([addStyleSheet(":root{color:red}:root{color:blue}")]);

    expect(rootStyle.innerHTML.match(/:host/g)).toHaveLength(2);
  });

  it("没有 :root 规则时返回 null", () => {
    expect(getPatchStyleElements([addStyleSheet(".a{color:red}")])).toEqual([null, null]);
  });

  it("空样式表数组返回 null", () => {
    expect(getPatchStyleElements([])).toEqual([null, null]);
  });
});
