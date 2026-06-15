import { awaitConsoleLogMessage, triggerClickByJsSelector, sleep } from "./utils";
import { reactMainAppInfoMap, vueMainAppInfoMap } from "./common";

const generateTest = (AppInfoMap: typeof reactMainAppInfoMap | typeof vueMainAppInfoMap) => {
  it("css root to host test", async () => {
    // vue2
    const vue2MountedPromise = awaitConsoleLogMessage(page, AppInfoMap.vue2.mountedMessage);
    await page.click(AppInfoMap.vue2.linkSelector);
    await vue2MountedPromise;
    let vue2HomeTitle = await page.evaluateHandle(AppInfoMap.vue2.titleJsSelector);
    await sleep(100);
    expect(await vue2HomeTitle.asElement().evaluate((el) => window.getComputedStyle(el).color)).toBe(
      "rgb(241, 107, 95)"
    );
    const vue2DialogMountedPromise = awaitConsoleLogMessage(page, AppInfoMap.vue2.dialogMountedMessage);
    await triggerClickByJsSelector(page, AppInfoMap.vue2.dialogNavSelector);
    await vue2DialogMountedPromise;
    const vue2DialogTitle = await page.evaluateHandle(AppInfoMap.vue2.titleJsSelector);
    await sleep(100);
    expect(await vue2DialogTitle.asElement().evaluate((el) => window.getComputedStyle(el).color)).toBe(
      "rgb(2, 57, 208)"
    );
    // vue3
    let vue3MountedPromise = awaitConsoleLogMessage(page, AppInfoMap.vue3.mountedMessage);
    await page.click(AppInfoMap.vue3.linkSelector);
    await vue3MountedPromise;
    let vue3HomeTitle = await page.evaluateHandle(AppInfoMap.vue3.titleJsSelector);
    await sleep(100);
    expect(await vue3HomeTitle.asElement().evaluate((el) => window.getComputedStyle(el).color)).toBe(
      "rgb(241, 107, 95)"
    );
    let vue3DialogMountedPromise = awaitConsoleLogMessage(page, AppInfoMap.vue3.dialogMountedMessage);
    await triggerClickByJsSelector(page, AppInfoMap.vue3.dialogNavSelector);
    await vue3DialogMountedPromise;
    let vue3DialogTitle = await page.evaluateHandle(AppInfoMap.vue3.titleJsSelector);
    await sleep(100);
    expect(await vue3DialogTitle.asElement().evaluate((el) => window.getComputedStyle(el).color)).toBe(
      "rgb(2, 57, 208)"
    );
    // vite
    let viteMountedPromise = awaitConsoleLogMessage(page, AppInfoMap.vite.mountedMessage);
    await page.click(AppInfoMap.vite.linkSelector);
    await viteMountedPromise;
    let viteHomeTitle = await page.evaluateHandle(AppInfoMap.vite.titleJsSelector);
    await sleep(100);
    expect(await viteHomeTitle.asElement().evaluate((el) => window.getComputedStyle(el).color)).toBe(
      "rgb(241, 107, 95)"
    );
    let viteDialogMountedPromise = awaitConsoleLogMessage(page, AppInfoMap.vite.dialogMountedMessage);
    await triggerClickByJsSelector(page, AppInfoMap.vite.dialogNavSelector);
    await viteDialogMountedPromise;
    let viteDialogTitle = await page.evaluateHandle(AppInfoMap.vite.titleJsSelector);
    await sleep(100);
    expect(await viteDialogTitle.asElement().evaluate((el) => window.getComputedStyle(el).color)).toBe(
      "rgb(2, 57, 208)"
    );
    // back to vue2
    const vue2HomeMountPromise = awaitConsoleLogMessage(page, AppInfoMap.vue2.mountedMessage);
    await page.click(AppInfoMap.vue2.linkSelector);
    await vue2HomeMountPromise;
    vue2HomeTitle = await page.evaluateHandle(AppInfoMap.vue2.titleJsSelector);
    await sleep(100);
    expect(await vue2HomeTitle.asElement().evaluate((el) => window.getComputedStyle(el).color)).toBe("rgb(2, 57, 208)");
    // back to vue3
    vue3MountedPromise = awaitConsoleLogMessage(page, AppInfoMap.vue3.mountedMessage);
    await page.click(AppInfoMap.vue3.linkSelector);
    await vue3MountedPromise;
    vue3DialogTitle = await page.evaluateHandle(AppInfoMap.vue3.titleJsSelector);
    await sleep(100);
    expect(await vue3DialogTitle.asElement().evaluate((el) => window.getComputedStyle(el).color)).toBe(
      "rgb(2, 57, 208)"
    );
    // back to vite
    viteMountedPromise = awaitConsoleLogMessage(page, AppInfoMap.vite.mountedMessage);
    await page.click(AppInfoMap.vite.linkSelector);
    await viteMountedPromise;
    viteDialogTitle = await page.evaluateHandle(AppInfoMap.vite.titleJsSelector);
    await sleep(100);
    expect(await viteDialogTitle.asElement().evaluate((el) => window.getComputedStyle(el).color)).toBe(
      "rgb(2, 57, 208)"
    );
  });
};

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
  generateTest(reactMainAppInfoMap);
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
  generateTest(vueMainAppInfoMap);
});
