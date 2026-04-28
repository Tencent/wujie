/**
 * 单元测试：覆盖 wujie-core/src/common.ts 中的 idToSandboxCacheMap 增删逻辑。
 *
 * 主要面向：
 * - notes/memory-leak-investigation.md §6
 *   `deleteWujieById` 实现 bug：本意是 destroy 后保留 `setupApp` 缓存的 options，
 *   实际上第二行 set 之后第三行又 delete，options 一并被删，导致 #732 链路。
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
