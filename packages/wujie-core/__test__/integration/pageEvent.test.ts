// 子应用页面事件
import { awaitConsoleLogMessage } from "./utils";
import { reactMainAppInfoMap, vueMainAppInfoMap } from "./common";

const pageLiftEventConsoleLogList = [
  "vue2 document DOMContentLoaded trigger",
  "vue2 window DOMContentLoaded trigger",
  "vue2 document onreadystatechange trigger",
  "vue2 document readystatechange trigger",
  "vue2 window onload trigger",
  "vue2 window load trigger",
];

describe("main react pageEvent", () => {
  beforeAll(async () => {
    await page.evaluateOnNewDocument(() => {
      // 关闭预加载
      localStorage.clear();
      localStorage.setItem("preload", "false");
      localStorage.setItem("degrade", "false");
    });
    await page.goto("http://localhost:7700/");
  });

  const vue2 = reactMainAppInfoMap.vue2;
  it(`${vue2.name} pageEvent trigger`, async () => {
    // vue2
    const vue2MountedPromise = awaitConsoleLogMessage(page, vue2.mountedMessage);
    await page.click(vue2.linkSelector);
    const pageLiftEventConsoleLogListPromise = pageLiftEventConsoleLogList.map((message) =>
      awaitConsoleLogMessage(page, message)
    );
    await vue2MountedPromise;
    await Promise.all(pageLiftEventConsoleLogListPromise);
  });
});

describe("main vue pageEvent", () => {
  beforeAll(async () => {
    await page.evaluateOnNewDocument(() => {
      // 关闭预加载
      localStorage.clear();
      localStorage.setItem("preload", "false");
      localStorage.setItem("degrade", "false");
    });
    await page.goto("http://localhost:8000/");
  });

  const vue2 = vueMainAppInfoMap.vue2;
  it(`${vue2.name} pageEvent trigger`, async () => {
    // vue2
    const vue2MountedPromise = awaitConsoleLogMessage(page, vue2.mountedMessage);
    await page.click(vue2.linkSelector);
    const pageLiftEventConsoleLogListPromise = pageLiftEventConsoleLogList.map((message) =>
      awaitConsoleLogMessage(page, message)
    );
    await vue2MountedPromise;
    await Promise.all(pageLiftEventConsoleLogListPromise);
  });
});
