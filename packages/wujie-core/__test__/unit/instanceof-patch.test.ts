export {};

import * as iframeModule from "../../src/iframe";

function createIframeWindow() {
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  return iframe.contentWindow as any;
}

describe("patchInstanceofAcrossRealms", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  test("让主应用 realm 的元素和事件通过子应用构造函数的 instanceof 判断", () => {
    const iframeWindow = createIframeWindow();
    const patchInstanceofAcrossRealms = (iframeModule as any).patchInstanceofAcrossRealms;

    expect(typeof patchInstanceofAcrossRealms).toBe("function");

    const mainElement = document.createElement("div");
    const mainMouseEvent = new MouseEvent("click");

    expect(mainElement instanceof iframeWindow.HTMLDivElement).toBe(false);
    expect(mainMouseEvent instanceof iframeWindow.MouseEvent).toBe(false);

    patchInstanceofAcrossRealms(iframeWindow);

    expect(mainElement instanceof iframeWindow.HTMLDivElement).toBe(true);
    expect(mainElement instanceof iframeWindow.HTMLElement).toBe(true);
    expect(mainMouseEvent instanceof iframeWindow.MouseEvent).toBe(true);
    expect(mainMouseEvent instanceof iframeWindow.Event).toBe(true);
  });

  test("保留子应用 realm 原有 instanceof 判断", () => {
    const iframeWindow = createIframeWindow();
    const patchInstanceofAcrossRealms = (iframeModule as any).patchInstanceofAcrossRealms;
    const childElement = iframeWindow.document.createElement("div");
    const childMouseEvent = new iframeWindow.MouseEvent("click");

    patchInstanceofAcrossRealms(iframeWindow);

    expect(childElement instanceof iframeWindow.HTMLDivElement).toBe(true);
    expect(childMouseEvent instanceof iframeWindow.MouseEvent).toBe(true);
  });

  test("重复 patch 时应保持幂等，避免 hasInstance 闭包堆叠", () => {
    const iframeWindow = createIframeWindow();
    const patchInstanceofAcrossRealms = (iframeModule as any).patchInstanceofAcrossRealms;

    patchInstanceofAcrossRealms(iframeWindow);
    const patchedHasInstance = iframeWindow.HTMLDivElement[Symbol.hasInstance];

    patchInstanceofAcrossRealms(iframeWindow);

    expect((iframeWindow.HTMLDivElement as any)._hasPatch).toBe(true);
    expect(iframeWindow.HTMLDivElement[Symbol.hasInstance]).toBe(patchedHasInstance);
  });
});
