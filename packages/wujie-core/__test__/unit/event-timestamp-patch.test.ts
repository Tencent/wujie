/**
 * 单元测试：patchEventTimeStamp 必须可重复调用。
 *
 * 同一个 render iframe 在子应用切走再切回时会被复用（sync.ts 的
 * renderIframeReplaceApp 路径），patch 会第二次打到同一个 Event.prototype 上。
 * defineProperty 不给 configurable 时，第二次直接抛 Cannot redefine property。
 */

export {};

import { patchEventTimeStamp } from "../../src/iframe";

// 用独立的 iframe realm 作为被 patch 的 target，避免污染主 window 的 Event.prototype
function makeTarget(): any {
  document.body.innerHTML = "";
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  return iframe.contentWindow;
}

// 借 createEvent 的返回值把 timeStamp 做成可辨认的值，验证 getter 指向哪个 window
function fakeSource(timeStamp: number): any {
  return { document: { createEvent: () => ({ timeStamp }) } };
}

// 每次调用 createEvent 都递增，用来观察 getter 是否在每次读取时都重新取值
function countingSource(): any {
  let n = 0;
  return { document: { createEvent: () => ({ timeStamp: ++n }) } };
}

describe("patchEventTimeStamp 读取稳定性", () => {
  it("同一个事件的 timeStamp 在多次读取之间保持不变", () => {
    const target = makeTarget();
    patchEventTimeStamp(target, countingSource());
    const event = new target.Event("x");

    const first = event.timeStamp;
    const second = event.timeStamp;

    expect(second).toBe(first);
  });

  it("不同事件各自取值，互不影响", () => {
    const target = makeTarget();
    patchEventTimeStamp(target, countingSource());

    const firstEventValue = new target.Event("a").timeStamp;
    const secondEventValue = new target.Event("b").timeStamp;

    expect(secondEventValue).toBe(firstEventValue + 1);
  });
});

describe("patchEventTimeStamp 可重复调用", () => {
  it("首次 patch 后 timeStamp 来自传入的 window", () => {
    const target = makeTarget();

    patchEventTimeStamp(target, fakeSource(123));

    expect(new target.Event("x").timeStamp).toBe(123);
  });

  it("重复 patch 同一个 Event.prototype 不抛错", () => {
    const target = makeTarget();
    patchEventTimeStamp(target, fakeSource(1));

    expect(() => patchEventTimeStamp(target, fakeSource(2))).not.toThrow();
  });

  it("重复 patch 后 getter 指向最新的 window", () => {
    const target = makeTarget();
    patchEventTimeStamp(target, fakeSource(1));
    patchEventTimeStamp(target, fakeSource(2));

    expect(new target.Event("x").timeStamp).toBe(2);
  });

  it("属性描述符保持 configurable", () => {
    const target = makeTarget();
    patchEventTimeStamp(target, fakeSource(1));

    expect(Object.getOwnPropertyDescriptor(target.Event.prototype, "timeStamp").configurable).toBe(true);
  });
});
