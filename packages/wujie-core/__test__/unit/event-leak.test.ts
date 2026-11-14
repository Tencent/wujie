/**
 * 单元测试：EventBus.$destroy 与全局 appEventObjMap 的清理契约。
 *
 * 每个子应用对应 appEventObjMap 中一个 entry。sandbox.destroy() 应调用
 * EventBus.$destroy() 完成 $clear() 并从 map 中 delete entry，
 * 防止反复 setupApp/destroyApp 后 map 条目持续累积。
 */

export {};

const warnFnLeak = jest.fn();

jest.mock("../../src/utils", () => {
  return { warn: warnFnLeak };
});

const wujieEventLeakModule = require("../../src/event");
const { EventBus: EventBusForLeakTest, appEventObjMap: appEventObjMapForLeakTest } = wujieEventLeakModule;

describe("EventBus.$destroy 应从全局 appEventObjMap 中移除 entry", () => {
  test("EventBus 实例提供 $destroy 用于销毁，调用后全局 map 中应不再保留 id", () => {
    const id = "test-destroy-cleanup";
    const bus = new EventBusForLeakTest(id);
    bus.$on("ping", () => {});

    expect(appEventObjMapForLeakTest.has(id)).toBe(true);

    // 期望 EventBus 提供 $destroy（应清空事件 + 移除 map entry）
    expect(typeof bus.$destroy).toBe("function");
    bus.$destroy();

    expect(appEventObjMapForLeakTest.has(id)).toBe(false);
  });

  test("$destroy 等同于先 $clear 再删 entry，事件全清且不再触发", () => {
    const id = "test-destroy-no-trigger";
    const bus = new EventBusForLeakTest(id);
    const fn = jest.fn();
    bus.$on("ping", fn);

    bus.$destroy();

    // 即便有外部 holder 还能 emit，也不应再触发，且 map 中已无该 id
    bus.$emit("ping");
    expect(fn).not.toHaveBeenCalled();
    expect(appEventObjMapForLeakTest.has(id)).toBe(false);
  });

  test("反复 $destroy 不应抛错", () => {
    const id = "test-destroy-idempotent";
    const bus = new EventBusForLeakTest(id);
    expect(() => {
      bus.$destroy();
      bus.$destroy();
      bus.$destroy();
    }).not.toThrow();
    expect(appEventObjMapForLeakTest.has(id)).toBe(false);
  });
});
