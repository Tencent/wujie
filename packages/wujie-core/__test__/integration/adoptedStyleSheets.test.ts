import { awaitConsoleLogMessage } from "./utils";
import { reactMainAppInfoMap, vueMainAppInfoMap, vueMainAppNameList, reactMainAppNameList } from "./common";

const generateTest = (
  AppInfoMap: typeof reactMainAppInfoMap | typeof vueMainAppInfoMap,
  AppNameList: typeof vueMainAppNameList | typeof reactMainAppNameList,
) => {
  AppNameList.slice(0, 1).forEach((appName) => {
    it("adoptedStyleSheets proxy test", async () => {
      const childApplicationMountedPromise = awaitConsoleLogMessage(page, AppInfoMap[appName].mountedMessage);
      await page.click(AppInfoMap[appName].linkSelector);
      await childApplicationMountedPromise;

      const result = await page.evaluate((childName) => {
        const childWindowCollection = [window[0], window[1], window[2], window[3], window[4], window[5]];
        const childWindow: any = childWindowCollection.find((itemWindow) => itemWindow.name === childName);
        const sandbox = childWindow.__WUJIE;

        if (sandbox.degrade) {
          return { skipped: true, reason: "degrade mode" };
        }

        const shadowRoot = sandbox.shadowRoot as ShadowRoot;
        const iframeDocument = childWindow.document;

        const sheet = new childWindow.CSSStyleSheet();
        sheet.replaceSync("body { --test-var: 1; }");

        iframeDocument.adoptedStyleSheets = [sheet];

        const isSameReference = iframeDocument.adoptedStyleSheets === shadowRoot.adoptedStyleSheets;
        const hasSheet = shadowRoot.adoptedStyleSheets.length === 1;

        iframeDocument.adoptedStyleSheets = [];
        const isCleared = shadowRoot.adoptedStyleSheets.length === 0;

        return {
          skipped: false,
          isSameReference,
          hasSheet,
          isCleared,
        };
      }, appName);

      if (result.skipped) {
        console.log(`Skipped: ${result.reason}`);
        return;
      }

      expect(result.isSameReference).toBe(true);
      expect(result.hasSheet).toBe(true);
      expect(result.isCleared).toBe(true);
    });
  });
};

describe("main react adoptedStyleSheets", () => {
  beforeAll(async () => {
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      localStorage.setItem("preload", "false");
      localStorage.setItem("degrade", "false");
    });
    await page.goto("http://localhost:7700/");
  });

  generateTest(reactMainAppInfoMap, reactMainAppNameList);
});

describe("main vue adoptedStyleSheets", () => {
  beforeAll(async () => {
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      localStorage.setItem("preload", "false");
      localStorage.setItem("degrade", "false");
    });
    await page.goto("http://localhost:8000/");
  });

  generateTest(vueMainAppInfoMap, vueMainAppNameList);
});
