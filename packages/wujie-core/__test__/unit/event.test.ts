interface Window {
  __POWERED_BY_WUJIE__?: boolean;
  __WUJIE: { inject: { appEventObjMap: Map<String, { [event: string]: Array<Function> }> } };
}

const warn = jest.fn();

jest.mock("../../src/utils", () => {
  return { warn };
});

const wujieEvent = require("../../src/event");
const { EventBus } = wujieEvent;

describe("event bus test", () => {
  test("bus event on and off", () => {
    const bus = new EventBus("test-on-and-emit");
    const mockFn = jest.fn();
    bus.$on("test", mockFn);
    bus.$emit("test");
    expect(mockFn).toHaveBeenCalled();
    expect(mockFn).toHaveBeenCalledTimes(1);
    bus.$off("test", mockFn);
    bus.$emit("test");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledTimes(1);
    bus.$clear();
  });

  test("bus event on repeat", () => {
    const bus = new EventBus("test-on-repeat");
    const mockFn = jest.fn();
    const mockTmpFn = jest.fn();
    bus.$on("test", mockFn);
    bus.$on("test", mockFn);
    bus.$on("test", mockTmpFn);
    bus.$emit("test");
    bus.$emit("tmp");
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockTmpFn).toHaveBeenCalledTimes(1);
    bus.$clear();
  });

  test("bus event on when emit arguments", () => {
    const bus = new EventBus("test-emit-arguments");
    const args = ["arg1", "arg2"];
    const mockFn = jest.fn();
    bus.$on("test", mockFn);
    bus.$emit("test", ...args);
    expect(mockFn).toHaveBeenCalledWith(...args);
    bus.$clear();
  });

  test("bus event off empty", () => {
    const bus = new EventBus("test-off-empty");
    bus.$off("test", () => {});
    expect(warn).toHaveBeenCalledTimes(1);
  });

  test("bus event onAll and emit arguments", () => {
    const bus = new EventBus("test-on-all");
    const args = ["arg1", "arg2"];
    const events = ["event1", "event2"];
    const mockFn = jest.fn();
    bus.$onAll(mockFn);
    events.forEach((event, index) => {
      bus.$emit(event, ...args);
      expect(mockFn).toHaveBeenCalledWith(event, ...args);
      expect(mockFn).toHaveBeenCalledTimes(index + 1);
    });
    bus.$clear();
  });

  test("bus event offAll when onAll", () => {
    const bus = new EventBus("test-off-all");
    const mockFn = jest.fn();
    bus.$onAll(mockFn);
    bus.$emit("test");
    expect(mockFn).toHaveBeenCalledTimes(1);
    bus.$offAll(mockFn);
    bus.$emit("test");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledTimes(1);
    bus.$clear();
  });

  test("bus event on and onAll concurrent", () => {
    const bus = new EventBus("test-on-and-onAll");
    const mockOnFn = jest.fn();
    const mockOnAllFn = jest.fn();
    bus.$on("test", mockOnFn);
    bus.$onAll(mockOnAllFn);
    bus.$emit("test");
    expect(mockOnFn).toHaveBeenCalled();
    expect(mockOnAllFn).toHaveBeenCalled();
    bus.$clear();
  });

  test("bus event once", () => {
    const bus = new EventBus("test-once");
    const mockFn = jest.fn();
    bus.$once("test", mockFn);
    bus.$emit("test");
    expect(mockFn).toHaveBeenCalled();
    expect(mockFn).toHaveBeenCalledTimes(1);
    bus.$emit("test");
    expect(mockFn).toHaveBeenCalledTimes(1);
    bus.$clear();
  });

  test("bus event clear", () => {
    const bus = new EventBus("test-clear");
    const mockOnFn = jest.fn();
    const mockOnAllFn = jest.fn();
    bus.$on("test", mockOnFn);
    bus.$onAll(mockOnAllFn);
    bus.$emit("test");
    expect(mockOnFn).toHaveBeenCalledTimes(1);
    expect(mockOnAllFn).toHaveBeenCalledTimes(1);
    bus.$clear();
    bus.$emit("test");
    expect(mockOnFn).toHaveBeenCalledTimes(1);
    expect(mockOnAllFn).toHaveBeenCalledTimes(1);
    bus.$clear();
  });

  test("bus event clear when renew", () => {
    let bus = new EventBus("test-clear-renew");
    const mockOnFn = jest.fn();
    bus.$on("test", mockOnFn);
    bus.$emit("test");
    expect(mockOnFn).toHaveBeenCalledTimes(1);
    bus = new EventBus("test-clear-renew");
    bus.$emit("test");
    expect(mockOnFn).toHaveBeenCalledTimes(1);
    bus.$clear();
  });

  test("bus event on an onAll when cross instance", () => {
    const bus = new EventBus("test-on-and-onAll-cross");
    const tmp = new EventBus("test-on-and-onAll-cross-tmp");
    const mockOnFn = jest.fn();
    const mockOnAllFn = jest.fn();
    bus.$on("test", mockOnFn);
    bus.$onAll(mockOnAllFn);
    tmp.$emit("test");
    expect(mockOnFn).toHaveBeenCalledTimes(1);
    expect(mockOnAllFn).toHaveBeenCalledTimes(1);
    bus.$clear();
    tmp.$clear();
  });
});
