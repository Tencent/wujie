/**
 * 单元测试：idToSandboxCacheMap 增删逻辑。
 *
 * deleteWujieById 必须区分两种场景：有 setupApp 缓存 options 时只移除 sandbox 实例引用、
 * 保留 options 供下次快速启动；无 options 时整体删除 entry。
 */

export {};

jest.mock("../../src/sandbox", () => ({}), { virtual: true });
jest.mock("../../src/index", () => ({}), { virtual: true });

const {
  idToSandboxCacheMap,
  addSandboxCacheWithWujie,
  addSandboxCacheWithOptions,
  deleteWujieById,
  getWujieById,
  getOptionsById,
} = require("../../src/common");

describe("common: deleteWujieById", () => {
  beforeEach(() => {
    idToSandboxCacheMap.clear();
  });

  test("无 setupApp 缓存时，destroy 应彻底删除 entry", () => {
    const fakeSandbox = { id: "no-options-app" } as any;
    addSandboxCacheWithWujie("no-options-app", fakeSandbox);
    expect(getWujieById("no-options-app")).toBe(fakeSandbox);

    deleteWujieById("no-options-app");

    expect(getWujieById("no-options-app")).toBe(null);
    expect(getOptionsById("no-options-app")).toBe(null);
    expect(idToSandboxCacheMap.has("no-options-app")).toBe(false);
  });

  test("有 setupApp 缓存时，destroy 后应保留 options 用于下次快速启动", () => {
    const fakeSandbox = { id: "has-options-app" } as any;
    const options = { name: "has-options-app", url: "//example.com" };
    addSandboxCacheWithOptions("has-options-app", options as any);
    addSandboxCacheWithWujie("has-options-app", fakeSandbox);

    expect(getWujieById("has-options-app")).toBe(fakeSandbox);
    expect(getOptionsById("has-options-app")).toBe(options);

    deleteWujieById("has-options-app");

    // sandbox 必须清掉
    expect(getWujieById("has-options-app")).toBe(null);
    // options 必须保留：这是 setupApp 的设计意图
    expect(getOptionsById("has-options-app")).toBe(options);
    expect(idToSandboxCacheMap.has("has-options-app")).toBe(true);
  });

  test("有 options 时反复 destroy 不应丢失 options", () => {
    const options = { name: "repeat-app", url: "//example.com" };
    addSandboxCacheWithOptions("repeat-app", options as any);
    addSandboxCacheWithWujie("repeat-app", { id: "repeat-app" } as any);

    deleteWujieById("repeat-app");
    deleteWujieById("repeat-app");
    deleteWujieById("repeat-app");

    expect(getOptionsById("repeat-app")).toBe(options);
  });
});
