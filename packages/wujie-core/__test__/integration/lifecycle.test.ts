import { awaitConsoleLogMessage } from "./utils";
import { reactMainAppInfoMap, vueMainAppInfoMap } from "./common";

const generateTest = (AppInfoMap: typeof reactMainAppInfoMap | typeof vueMainAppInfoMap) => {
  it(`react16 entry lifecycles`, async () => {
    const lifecyclePromiseList = reactMainAppInfoMap.react16.entryLifecycles.map((lifecycle) =>
      awaitConsoleLogMessage(page, lifecycle)
    );
    await page.click(AppInfoMap.react16.linkSelector);
    await Promise.all(lifecyclePromiseList);
  });
  it(`react17 entry lifecycles`, async () => {
    const lifecyclePromiseList = AppInfoMap.react16.leaveLifecycles
      .concat(AppInfoMap.react17.entryLifecycles)
      .map((lifecycle) => awaitConsoleLogMessage(page, lifecycle));
    await page.click(AppInfoMap.react17.linkSelector);
    await Promise.all(lifecyclePromiseList);
  });
  it(`vue2 entry lifecycles`, async () => {
    const lifecyclePromiseList = AppInfoMap.react17.leaveLifecycles
      .concat(AppInfoMap.vue2.entryLifecycles)
      .map((lifecycle) => awaitConsoleLogMessage(page, lifecycle));
    await page.click(AppInfoMap.vue2.linkSelector);
    await Promise.all(lifecyclePromiseList);
  });
  it(`vue3 entry lifecycles`, async () => {
    const lifecyclePromiseList = AppInfoMap.vue2.leaveLifecycles
      .concat(AppInfoMap.vue3.entryLifecycles)
      .map((lifecycle) => awaitConsoleLogMessage(page, lifecycle));
    await page.click(AppInfoMap.vue3.linkSelector);
    await Promise.all(lifecyclePromiseList);
  });

  it(`vite entry lifecycles`, async () => {
    const lifecyclePromiseList = AppInfoMap.vue3.leaveLifecycles
      .concat(AppInfoMap.vite.entryLifecycles)
      .map((lifecycle) => awaitConsoleLogMessage(page, lifecycle));
    await page.click(AppInfoMap.vite.linkSelector);
    await Promise.all(lifecyclePromiseList);
  });
  it(`angular12 entry lifecycles`, async () => {
    const lifecyclePromiseList = AppInfoMap.vite.leaveLifecycles
      .concat(AppInfoMap.angular12.entryLifecycles)
      .map((lifecycle) => awaitConsoleLogMessage(page, lifecycle));
    await page.click(AppInfoMap.angular12.linkSelector);
    await Promise.all(lifecyclePromiseList);
  });

  it(`react16 entry again lifecycles`, async () => {
    const lifecyclePromiseList = AppInfoMap.angular12.leaveLifecycles
      .concat(AppInfoMap.react16.entryLifecycles.slice(1))
      .map((lifecycle) => awaitConsoleLogMessage(page, lifecycle));
    await page.click(AppInfoMap.react16.linkSelector);
    await Promise.all(lifecyclePromiseList);
  });
  it(`react17 entry again lifecycles`, async () => {
    const lifecyclePromiseList = AppInfoMap.react16.leaveLifecycles
      .concat(AppInfoMap.react17.entryLifecycles.slice(1))
      .map((lifecycle) => awaitConsoleLogMessage(page, lifecycle));
    await page.click(AppInfoMap.react17.linkSelector);
    await Promise.all(lifecyclePromiseList);
  });
  it(`vue2 entry again lifecycles`, async () => {
    const lifecyclePromiseList = AppInfoMap.react17.leaveLifecycles
      .concat(AppInfoMap.vue2.entryLifecycles.slice(1))
      .map((lifecycle) => awaitConsoleLogMessage(page, lifecycle));
    await page.click(AppInfoMap.vue2.linkSelector);
    await Promise.all(lifecyclePromiseList);
  });
  it(`vue3 entry again lifecycles`, async () => {
    const lifecyclePromiseList = AppInfoMap.vue2.leaveLifecycles
      .concat(AppInfoMap.vue3.entryLifecycles.slice(1))
      .map((lifecycle) => awaitConsoleLogMessage(page, lifecycle));
    await page.click(AppInfoMap.vue3.linkSelector);
    await Promise.all(lifecyclePromiseList);
  });

  it(`vite entry again lifecycles`, async () => {
    const lifecyclePromiseList = AppInfoMap.vue3.leaveLifecycles
      .concat(AppInfoMap.vite.entryLifecycles.slice(1))
      .map((lifecycle) => awaitConsoleLogMessage(page, lifecycle));
    await page.click(AppInfoMap.vite.linkSelector);
    await Promise.all(lifecyclePromiseList);
  });
  it(`angular12 entry again lifecycles`, async () => {
    const lifecyclePromiseList = AppInfoMap.vite.leaveLifecycles
      .concat(AppInfoMap.angular12.entryLifecycles.slice(1))
      .map((lifecycle) => awaitConsoleLogMessage(page, lifecycle));
    await page.click(AppInfoMap.angular12.linkSelector);
    await Promise.all(lifecyclePromiseList);
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
