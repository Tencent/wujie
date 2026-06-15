import { awaitConsoleLogMessage, triggerClickByJsSelector } from "./utils";
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
    // 等待字体装载到 FontFaceSet（拿到 response 后浏览器还要 parse + register，
    // 注册时机受主进程繁忙程度影响，CI 上常见 > 1s，因此用 waitForFunction
    // 替代固定 sleep，避免 flaky）
    await page.waitForFunction(() => document.fonts.check("12px t", "E07F"), { timeout: 5000 });
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
    // 等待字体装载到 FontFaceSet（拿到 response 后浏览器还要 parse + register，
    // 注册时机受主进程繁忙程度影响，CI 上常见 > 1s，因此用 waitForFunction
    // 替代固定 sleep，避免 flaky）
    await page.waitForFunction(() => document.fonts.check("12px t", "E07F"), { timeout: 5000 });
    expect(await page.evaluate(() => document.fonts.check("12px t", "E07F"))).toBe(true);
  });
});
