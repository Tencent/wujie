import { awaitConsoleLogMessage, triggerClickByJsSelector } from "./utils";
import { reactMainAppInfoMap, vueMainAppInfoMap } from "./common";

const generateTest = (AppInfoMap: typeof reactMainAppInfoMap | typeof vueMainAppInfoMap) => {
  it("react16 plugin test", async () => {
    const htmlLoaderPromise = awaitConsoleLogMessage(page, "html-loader");
    const cssLoaderPromise = awaitConsoleLogMessage(page, "css-loader  img{width: 300px}...");
    const jsBeforeLoaderPromise = awaitConsoleLogMessage(page, "js-before-loader-callback react16");
    const jsLoaderPromise = awaitConsoleLogMessage(page, "js-loader http://localhost:7600/static/js/bundle.js");
    const jsAfterLoaderPromise = awaitConsoleLogMessage(page, "js-after-loader-callback react16");
    const mountPromise = awaitConsoleLogMessage(page, AppInfoMap.react16.mountedMessage);
    await page.click(AppInfoMap.react16.linkSelector);
    await Promise.all([
      htmlLoaderPromise,
      cssLoaderPromise,
      jsBeforeLoaderPromise,
      jsLoaderPromise,
      jsAfterLoaderPromise,
      mountPromise,
    ]);
    const title = await page.evaluateHandle(AppInfoMap.react16.titleJsSelector);
    expect(await title.asElement().evaluate((el) => window.getComputedStyle(el).color)).toBe("rgb(241, 107, 95)");
    const dialogMountedPromise = awaitConsoleLogMessage(page, AppInfoMap.react16.dialogMountedMessage);
    await triggerClickByJsSelector(page, AppInfoMap.react16.dialogNavSelector);
    await dialogMountedPromise;
    const dialogTitle = await page.evaluateHandle(AppInfoMap.react16.titleJsSelector);
    expect(await dialogTitle.asElement().evaluate((el) => window.getComputedStyle(el).color)).toBe("rgb(241, 107, 95)");
  });
};
describe("main react plugin", () => {
  beforeAll(async () => {
    await page.evaluateOnNewDocument(() => {
      // 关闭预加载
      localStorage.clear();
      localStorage.setItem("preload", "false");
      localStorage.setItem("degrade", "false");
    });
    await page.goto("http://localhost:7700/");
  });

  generateTest(reactMainAppInfoMap);
});

describe("main vue plugin", () => {
  beforeAll(async () => {
    await page.evaluateOnNewDocument(() => {
      // 关闭预加载
      localStorage.clear();
      localStorage.setItem("preload", "false");
      localStorage.setItem("degrade", "false");
    });
    await page.goto("http://localhost:8000/");
  });

  generateTest(vueMainAppInfoMap);
});
