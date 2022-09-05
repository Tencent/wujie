import { awaitConsoleLogMessage, triggerClickByJsSelector, sleep } from "./utils";
import { reactMainAppInfoMap, vueMainAppInfoMap } from "./common";

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
  it("check react16 font-face", async () => {
    const appInfo = reactMainAppInfoMap.react16;
    const appInfoMountedPromise = awaitConsoleLogMessage(page, appInfo.mountedMessage);
    expect(await page.evaluate(() => document.fonts.check("12px t", "E07F"))).toBe(false);
    await page.click(appInfo.linkSelector);
    await appInfoMountedPromise;
    const appInfoFontMountedPromise = awaitConsoleLogMessage(page, appInfo.fontMountedMessage);
    await triggerClickByJsSelector(page, appInfo.fontNavSelector);
    await appInfoFontMountedPromise;
    // 等待字体加载
    await page.waitForResponse((response) => response.url().includes("https://tdesign.gtimg.com/icon/"));
    // 等待字体装载
    await sleep(1000);
    // 检查字体是否生效
    expect(await page.evaluate(() => document.fonts.check("12px t", "E07F"))).toBe(true);
  });
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
  it("check react16 font-face", async () => {
    const appInfo = vueMainAppInfoMap.react16;
    const appInfoMountedPromise = awaitConsoleLogMessage(page, appInfo.mountedMessage);
    expect(await page.evaluate(() => document.fonts.check("12px t", "E07F"))).toBe(false);
    await page.click(appInfo.linkSelector);
    await appInfoMountedPromise;
    const appInfoFontMountedPromise = awaitConsoleLogMessage(page, appInfo.fontMountedMessage);
    await triggerClickByJsSelector(page, appInfo.fontNavSelector);
    await appInfoFontMountedPromise;
    // 等待字体加载
    await page.waitForResponse((response) => response.url().includes("https://tdesign.gtimg.com/icon/"));
    // 等待字体装载
    await sleep(1000);
    // 检查字体是否生效
    expect(await page.evaluate(() => document.fonts.check("12px t", "E07F"))).toBe(true);
  });
});
