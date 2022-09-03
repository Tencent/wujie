import { awaitConsoleLogMessage, getTextContentByJsSelector } from "./utils";
import { reactMainAppInfoList, vueMainAppInfoList } from "./common";

describe("main react startApp", () => {
  beforeAll(async () => {
    await page.evaluateOnNewDocument(() => {
      // 关闭预加载
      localStorage.clear();
      localStorage.setItem("preload", "false");
      localStorage.setItem("degrade", "false");
    });
    await page.goto("http://localhost:7700/");
  });

  reactMainAppInfoList.forEach((appInfo) =>
    it(`${appInfo.name} startApp`, async () => {
      const appInfoMountedPromise = awaitConsoleLogMessage(page, appInfo.mountedMessage);
      await page.click(appInfo.linkSelector);
      await appInfoMountedPromise;
      expect(await getTextContentByJsSelector(page, appInfo.titleJsSelector)).toBe(appInfo.titleText);
    })
  );
});

describe("main vue startApp", () => {
  beforeAll(async () => {
    await page.evaluateOnNewDocument(() => {
      // 关闭预加载
      localStorage.clear();
      localStorage.setItem("preload", "false");
      localStorage.setItem("degrade", "false");
    });
    await page.goto("http://localhost:8000/");
  });

  vueMainAppInfoList.forEach((appInfo) =>
    it(`${appInfo.name} startApp`, async () => {
      const appInfoMountedPromise = awaitConsoleLogMessage(page, appInfo.mountedMessage);
      await page.click(appInfo.linkSelector);
      await appInfoMountedPromise;
      expect(await getTextContentByJsSelector(page, appInfo.titleJsSelector)).toBe(appInfo.titleText);
    })
  );
});
