import {
  awaitConsoleLogMessage,
  getUrlSearchObject,
  triggerClickByJsSelector,
  getClassListByJsSelector,
} from "./utils";
import { reactMainAppInfoMap, reactMainAppInfoList, vueMainAppInfoMap, vueMainAppInfoList } from "./common";

const generateReactAppMountedPromiseList = () =>
  reactMainAppInfoList.map((appInfo) => awaitConsoleLogMessage(page, appInfo.mountedMessage));

const generateVueAppMountedPromiseList = () =>
  vueMainAppInfoList.map((appInfo) => awaitConsoleLogMessage(page, appInfo.mountedMessage));

const generateTest = (
  AppInfoMap: typeof reactMainAppInfoMap | typeof vueMainAppInfoMap,
  getMountedPromiseList: typeof generateReactAppMountedPromiseList | typeof generateVueAppMountedPromiseList,
  allLinkSelector: string
) => {
  it(`test sync init`, async () => {
    let mountedPromiseList = getMountedPromiseList();
    // 点击 all 侧边栏
    await page.click(allLinkSelector);
    // 所有预加载完成加载
    await Promise.all(mountedPromiseList);
    const searchMap = getUrlSearchObject(page.url());
    // 查看当前路由
    expect(searchMap.react16).toBe(AppInfoMap.react16.homeQueryParam);
    expect(searchMap.react17).toBe(AppInfoMap.react17.homeQueryParam);
    expect(searchMap.vue2).toBe(AppInfoMap.vue2.homeQueryParam);
    expect(searchMap.vue3).toBe(AppInfoMap.vue3.homeQueryParam);
    expect(searchMap.vite).toBe("%2Fhome");
    expect(searchMap.angular12).toBe("%2F");
    // 跳转
    const react16DialogMountedPromise = awaitConsoleLogMessage(page, AppInfoMap.react16.dialogMountedMessage);
    await triggerClickByJsSelector(page, AppInfoMap.react16.dialogNavSelectorInAll);
    await react16DialogMountedPromise;
    expect(getUrlSearchObject(page.url()).react16).toBe(AppInfoMap.react16.dialogQueryParam);
    const react17DialogMountedPromise = awaitConsoleLogMessage(page, AppInfoMap.react17.dialogMountedMessage);
    await triggerClickByJsSelector(page, AppInfoMap.react17.dialogNavSelectorInAll);
    await react17DialogMountedPromise;
    expect(getUrlSearchObject(page.url()).react17).toBe(AppInfoMap.react17.dialogQueryParam);
    const vue2DialogMountedPromise = awaitConsoleLogMessage(page, AppInfoMap.vue2.dialogMountedMessage);
    await triggerClickByJsSelector(page, AppInfoMap.vue2.dialogNavSelectorInAll);
    await vue2DialogMountedPromise;
    expect(getUrlSearchObject(page.url()).vue2).toBe(AppInfoMap.vue2.dialogQueryParam);
    const vue3DialogMountedPromise = awaitConsoleLogMessage(page, AppInfoMap.vue3.dialogMountedMessage);
    await triggerClickByJsSelector(page, AppInfoMap.vue3.dialogNavSelectorInAll);
    await vue3DialogMountedPromise;
    expect(getUrlSearchObject(page.url()).vue3).toBe(AppInfoMap.vue3.dialogQueryParam);

    // 回退
    await page.goBack();
    expect(searchMap.vue3).toBe(AppInfoMap.vue3.homeQueryParam);
    await page.goBack();
    expect(searchMap.vue2).toBe(AppInfoMap.vue2.homeQueryParam);
    await page.goBack();
    expect(searchMap.react17).toBe(AppInfoMap.react17.homeQueryParam);
    await page.goBack();
    expect(searchMap.react16).toBe(AppInfoMap.react16.homeQueryParam);

    // 前进
    await page.goForward();
    expect(getUrlSearchObject(page.url()).react16).toBe(AppInfoMap.react16.dialogQueryParam);
    await page.goForward();
    expect(getUrlSearchObject(page.url()).react17).toBe(AppInfoMap.react17.dialogQueryParam);
    await page.goForward();
    expect(getUrlSearchObject(page.url()).vue2).toBe(AppInfoMap.vue2.dialogQueryParam);
    await page.goForward();
    expect(getUrlSearchObject(page.url()).vue3).toBe(AppInfoMap.vue3.dialogQueryParam);
    let newMountedPromiseList = generateReactAppMountedPromiseList();
    // 刷新
    await page.reload();
    await Promise.all(newMountedPromiseList);
    const newSearchMap = getUrlSearchObject(page.url());
    // 查看当前路由
    expect(newSearchMap.react16).toBe(AppInfoMap.react16.dialogQueryParam);
    expect(newSearchMap.react17).toBe(AppInfoMap.react17.dialogQueryParam);
    expect(newSearchMap.vue2).toBe(AppInfoMap.vue2.dialogQueryParam);
    expect(newSearchMap.vue3).toBe(AppInfoMap.vue3.dialogQueryParam);
    expect(newSearchMap.vite).toBe("%2Fhome");
    expect(newSearchMap.angular12).toBe("%2F");
  });
};

describe("main react sync", () => {
  beforeAll(async () => {
    await page.evaluateOnNewDocument(() => {
      // 关闭预加载
      localStorage.clear();
      localStorage.setItem("preload", "false");
      localStorage.setItem("degrade", "false");
    });
    await page.goto("http://localhost:7700/");
  });

  generateTest(reactMainAppInfoMap, generateReactAppMountedPromiseList, "a[href='#/all']");

  it(`test url share`, async () => {
    let mountedPromiseList = generateReactAppMountedPromiseList();
    await page.goto(
      "http://localhost:7700/?react16=%7Bprefix-dialog%7D&react17=%2Fdialog&vite=%2Fhome&vue2=%2F%23%2Fdialog&vue3=%2Fdialog&angular12=%2F#/all"
    );
    await Promise.all([
      ...mountedPromiseList,
      awaitConsoleLogMessage(page, reactMainAppInfoMap.vue2.dialogMountedMessage),
      awaitConsoleLogMessage(page, reactMainAppInfoMap.vue3.dialogMountedMessage),
    ]);
    expect(await getClassListByJsSelector(page, reactMainAppInfoMap.react16.dialogNavSelectorInAll)).toContain(
      "active"
    );
    expect(await getClassListByJsSelector(page, reactMainAppInfoMap.react17.dialogNavSelectorInAll)).toContain(
      "active"
    );
    expect(await getClassListByJsSelector(page, reactMainAppInfoMap.vue2.dialogNavSelectorInAll)).toContain(
      "router-link-exact-active"
    );
    expect(await getClassListByJsSelector(page, reactMainAppInfoMap.vue3.dialogNavSelectorInAll)).toContain(
      "router-link-exact-active"
    );
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

  generateTest(vueMainAppInfoMap, generateVueAppMountedPromiseList, "a[href='/all']");

  it(`test url share`, async () => {
    let mountedPromiseList = generateReactAppMountedPromiseList();
    await page.goto(
      "http://localhost:8000/all?react16=%7Bprefix-dialog%7D&react17=%2Fdialog&vue2=%2F%23%2Fdialog&vite=%2Fhome&vue3=%2Fdialog&angular12=%2F"
    );
    await Promise.all([
      ...mountedPromiseList,
      awaitConsoleLogMessage(page, vueMainAppInfoMap.vue2.dialogMountedMessage),
      awaitConsoleLogMessage(page, vueMainAppInfoMap.vue3.dialogMountedMessage),
    ]);
    expect(await getClassListByJsSelector(page, vueMainAppInfoMap.react16.dialogNavSelectorInAll)).toContain("active");
    expect(await getClassListByJsSelector(page, vueMainAppInfoMap.react17.dialogNavSelectorInAll)).toContain("active");
    expect(await getClassListByJsSelector(page, vueMainAppInfoMap.vue2.dialogNavSelectorInAll)).toContain(
      "router-link-exact-active"
    );
    expect(await getClassListByJsSelector(page, vueMainAppInfoMap.vue3.dialogNavSelectorInAll)).toContain(
      "router-link-exact-active"
    );
  });
});
