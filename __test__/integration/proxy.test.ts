import { awaitConsoleLogMessage } from "./utils";
import { reactMainAppInfoMap, vueMainAppInfoMap, vueMainAppNameList, reactMainAppNameList } from "./common";

const generateTest = (
  AppInfoMap: typeof reactMainAppInfoMap | typeof vueMainAppInfoMap,
  AppNameList: typeof vueMainAppNameList | typeof reactMainAppNameList
) => {
  AppNameList.slice(0, 5).forEach((appName) => {
    it("proxy test", async () => {
      const childApplicationMountedPromise = awaitConsoleLogMessage(page, AppInfoMap[appName].mountedMessage);
      await page.click(AppInfoMap[appName].linkSelector);
      await childApplicationMountedPromise;

      // 测试boundValue缓存，及作用域
      const { targetCurrentAttribute, isSameBoundFn } = await page.evaluate((childName) => {
        const childWindowCollection = [window[0], window[1], window[2], window[3], window[4], window[5]];
        const childWindow: any = childWindowCollection.find((itemWindow) => itemWindow.name === childName);
        const currentObject: any = {};
        const childProxyWindow = childWindow.__WUJIE.proxy;
        childProxyWindow.addAttributeToObject = function addAttributeToObject() {
          this.currentAttribute = "Add attribute";
        };
        childProxyWindow.addAttributeToObject.call(currentObject);
        return {
          targetCurrentAttribute: currentObject.currentAttribute,
          isSameBoundFn: childProxyWindow.setTimeout === childProxyWindow.setTimeout,
        };
      }, appName);

      expect(targetCurrentAttribute).toBe("Add attribute");
      expect(isSameBoundFn).toBe(true);
    });
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

  generateTest(reactMainAppInfoMap, reactMainAppNameList);
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

  generateTest(vueMainAppInfoMap, vueMainAppNameList);
});
