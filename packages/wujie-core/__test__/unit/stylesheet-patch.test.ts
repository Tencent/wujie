/**
 * 关联 issue: https://github.com/Tencent/wujie/issues/1059
 *
 * 场景描述（vite dev server 的真实行为）：
 *   第一个 css 通过 document.head.appendChild 插入；
 *   后续每个 css 通过 lastInsertedStyle.insertAdjacentElement("afterend", style) 插入；
 *   hot update 时直接 style.textContent = newContent。
 *
 * 之前实现里，被 insertAdjacentElement 插入的 style 只是触发了一次
 * handleStylesheetElementPatch（提取 host/font 到 shadowRoot 外），
 * 但 style 自身的 innerHTML / textContent / appendChild / sheet.insertRule
 * 都未被劫持，导致：
 *   1) 首次插入的 css 文本没有走 cssLoader（资源相对路径未转绝对）；
 *   2) 后续 hot update 修改 textContent 时既不走 cssLoader 也不重新提取 font-face；
 *   3) 如果再用该 style 链式 insertAdjacentElement，下游 style 直接走原生实现，
 *      整条链路彻底脱离 wujie 接管。
 *
 * 本套用例用最小化 mock 覆盖以上 3 点，确保链式插入的每个 style 都获得
 * 与第一个 style 完全一致的劫持能力。
 */

import { patchStylesheetElement } from "../../src/effect";

interface FakeSandbox {
  styleSheetElements: HTMLStyleElement[];
  shadowRoot: { head: HTMLElement; host: HTMLElement };
  degrade: boolean;
}

function createSandbox(): FakeSandbox {
  return {
    styleSheetElements: [],
    shadowRoot: {
      head: document.createElement("div"),
      host: document.createElement("div"),
    },
    degrade: false,
  };
}

const CUR_URL = "http://child-app.example.com/";

describe("patchStylesheetElement / vite multi-style chain", () => {
  let sandbox: FakeSandbox;
  let cssLoader: jest.Mock;
  let firstStyle: HTMLStyleElement;

  beforeEach(() => {
    document.head.innerHTML = "";
    sandbox = createSandbox();
    cssLoader = jest.fn((code: string) => `/* loaded */${code}`);
    firstStyle = document.createElement("style");
    document.head.appendChild(firstStyle);
    patchStylesheetElement(firstStyle as any, cssLoader, sandbox as any, CUR_URL);
  });

  it("第二个 style 通过 insertAdjacentElement 插入时，其 innerHTML 必须经 cssLoader 改写", () => {
    const second = document.createElement("style");
    second.innerHTML = "@font-face{font-family:'t';src:url(./t.woff)}";

    cssLoader.mockClear();
    firstStyle.insertAdjacentElement("afterend", second);

    expect(cssLoader).toHaveBeenCalledWith(
      "@font-face{font-family:'t';src:url(./t.woff)}",
      "",
      CUR_URL
    );
    expect(sandbox.styleSheetElements).toContain(second);
  });

  it("第二个 style 后续 textContent 更新（vite hot update）应仍走 cssLoader", () => {
    const second = document.createElement("style");
    second.innerHTML = "body{color:red}";
    firstStyle.insertAdjacentElement("afterend", second);

    cssLoader.mockClear();
    second.textContent = "@font-face{src:url(./b.woff)}";

    expect(cssLoader).toHaveBeenCalledWith(
      "@font-face{src:url(./b.woff)}",
      "",
      CUR_URL
    );
  });

  it("第二个 style 后续 innerHTML 更新应仍走 cssLoader", () => {
    const second = document.createElement("style");
    second.innerHTML = "body{color:red}";
    firstStyle.insertAdjacentElement("afterend", second);

    cssLoader.mockClear();
    second.innerHTML = "body{background:url(./bg.png)}";

    expect(cssLoader).toHaveBeenCalledWith(
      "body{background:url(./bg.png)}",
      "",
      CUR_URL
    );
  });

  it("链式 insertAdjacentElement (second → third) 应递归保持劫持", () => {
    const second = document.createElement("style");
    second.innerHTML = "/* 2nd */";
    firstStyle.insertAdjacentElement("afterend", second);

    const third = document.createElement("style");
    third.innerHTML = "@font-face{src:url(./c.woff)}";

    cssLoader.mockClear();
    second.insertAdjacentElement("afterend", third);

    expect(cssLoader).toHaveBeenCalledWith(
      "@font-face{src:url(./c.woff)}",
      "",
      CUR_URL
    );
    expect(sandbox.styleSheetElements).toContain(third);

    // 第三个 style 的后续更新也必须被劫持
    cssLoader.mockClear();
    third.textContent = "/* 3rd updated */";
    expect(cssLoader).toHaveBeenCalledWith("/* 3rd updated */", "", CUR_URL);
  });

  it("非 STYLE 节点走 insertAdjacentElement 不应进入劫持分支", () => {
    const link = document.createElement("link");

    cssLoader.mockClear();
    firstStyle.insertAdjacentElement("afterend", link);

    expect(cssLoader).not.toHaveBeenCalled();
    expect(sandbox.styleSheetElements).not.toContain(link as any);
  });
});
