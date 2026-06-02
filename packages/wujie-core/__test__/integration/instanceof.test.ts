import { vueMainAppInfoMap } from "./common";
import { awaitConsoleLogMessage } from "./utils";

describe("main vue instanceof patch", () => {
  beforeAll(async () => {
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      localStorage.setItem("preload", "false");
      localStorage.setItem("degrade", "false");
    });
    await page.goto("http://localhost:8000/");
  });

  it("example 子应用中主应用 realm 的元素和事件应通过子应用构造函数的 instanceof 判断", async () => {
    const appInfo = vueMainAppInfoMap.vue3;
    const appInfoMountedPromise = awaitConsoleLogMessage(page, appInfo.mountedMessage);
    await page.click(appInfo.linkSelector);
    await appInfoMountedPromise;

    const result = await page.evaluate((childName) => {
      const childWindow = (window.frames as any)[childName];
      const childProxyWindow = childWindow.__WUJIE.proxy;
      const mainElement = document.createElement("div");
      const mainMouseEvent = new MouseEvent("click");
      const childElement = childWindow.document.createElement("div");

      return {
        mainElementIsChildDiv: mainElement instanceof childProxyWindow.HTMLDivElement,
        mainElementIsChildHTMLElement: mainElement instanceof childProxyWindow.HTMLElement,
        mainEventIsChildMouseEvent: mainMouseEvent instanceof childProxyWindow.MouseEvent,
        mainEventIsChildEvent: mainMouseEvent instanceof childProxyWindow.Event,
        childElementStillWorks: childElement instanceof childProxyWindow.HTMLDivElement,
        hasPatchMark: childProxyWindow.HTMLDivElement._hasPatch === true,
      };
    }, appInfo.name);

    expect(result).toEqual({
      mainElementIsChildDiv: true,
      mainElementIsChildHTMLElement: true,
      mainEventIsChildMouseEvent: true,
      mainEventIsChildEvent: true,
      childElementStillWorks: true,
      hasPatchMark: true,
    });
  });
});
