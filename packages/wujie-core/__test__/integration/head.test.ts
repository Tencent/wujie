import { awaitConsoleLogMessage, triggerClickByJsSelector } from "./utils";
import { reactMainAppInfoMap, vueMainAppInfoMap } from "./common";

const generateTest = (AppInfoMap: typeof reactMainAppInfoMap | typeof vueMainAppInfoMap, homeSelector: string) => {
  it("test head without cache", async () => {
    // 跳转vue home
    const vue2MountedPromise = awaitConsoleLogMessage(page, AppInfoMap.vue2.mountedMessage);
    await page.click(AppInfoMap.vue2.linkSelector);
    await vue2MountedPromise;

    // 跳转首页
    await page.click(homeSelector);

    // 跳转vue home
    const vue2MountedPromiseAgain = awaitConsoleLogMessage(page, AppInfoMap.vue2.mountedMessage);
    await page.click(AppInfoMap.vue2.linkSelector);
    await vue2MountedPromiseAgain;
    let vue2HomeTitle = await page.evaluateHandle(AppInfoMap.vue2.titleJsSelector);
    expect(await vue2HomeTitle.asElement().evaluate((el) => window.getComputedStyle(el).color)).toBe(
      "rgb(241, 107, 95)"
    );

    // 跳转vue dialog
    const vue2DialogMountedPromise = awaitConsoleLogMessage(page, AppInfoMap.vue2.dialogMountedMessage);
    await triggerClickByJsSelector(page, AppInfoMap.vue2.dialogNavSelector);
    await vue2DialogMountedPromise;
    const vue2DialogTitle = await page.evaluateHandle(AppInfoMap.vue2.titleJsSelector);
    expect(await vue2DialogTitle.asElement().evaluate((el) => window.getComputedStyle(el).color)).toBe(
      "rgb(2, 57, 208)"
    );
  });
};
describe("main react head test", () => {
  beforeAll(async () => {
    await page.evaluateOnNewDocument(() => {
      // 关闭预加载
      localStorage.clear();
      localStorage.setItem("preload", "false");
      localStorage.setItem("degrade", "false");
    });
    await page.goto("http://localhost:7700/");
  });
  generateTest(reactMainAppInfoMap, "a[href='#/home']");
});
describe("main vue head test", () => {
  beforeAll(async () => {
    await page.evaluateOnNewDocument(() => {
      // 关闭预加载
      localStorage.clear();
      localStorage.setItem("preload", "false");
      localStorage.setItem("degrade", "false");
    });
    await page.goto("http://localhost:8000/");
  });
  generateTest(vueMainAppInfoMap, "a[href='/home']");
});
