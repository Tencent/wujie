/**
 * 关联 issue: https://github.com/Tencent/wujie/issues/1072
 *
 * 场景描述：
 *   子应用 HTML 模板中常出现 `<button onclick="someFn()">` 这类内联事件属性。
 *   按 HTML5 规范，浏览器把 onclick 属性字符串编译成函数后，函数体内自由变量
 *   的查找走的是元素 ownerDocument.defaultView——shadowRoot 不会创建新 document，
 *   所以最终 fallback 到 *主 window*，永远不会去子应用的 sandbox proxy 上找。
 *
 *   结果：子应用代码即使把 someFn 挂在自己的 window/proxy 上，inline handler
 *   还是 ReferenceError；用户被迫退化成 `window.__YOUR_NAMESPACE.someFn()`
 *   这种全局命名空间挂载的写法。
 *
 * wujie 内置方案：
 *   在模板渲染阶段（shadow.ts 的 ElementIterator 走每个元素时）扫描 `on*`
 *   属性，把原代码搬到 `data-wujie-on-${type}` 上保存，把属性本身改写为对
 *   主 window 上 dispatcher 的调用。dispatcher 收到 event 后，按
 *   sandboxId 找回 sandbox.proxy，再把原代码用 `with(proxy)` 在 proxy
 *   作用域内执行——`someFn` 自然解析到 sandbox.proxy.someFn。
 */

import {
  rewriteInlineEventOnElement,
  installInlineEventDispatcher,
  INLINE_HANDLER_NAME,
  INLINE_EVENT_DATA_PREFIX,
} from "../../src/inline-event";
import { idToSandboxCacheMap } from "../../src/common";

describe("inline event handler 内置劫持", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    delete (window as any)[INLINE_HANDLER_NAME];
    idToSandboxCacheMap.clear();
  });

  it("应将元素 on* 属性改写为 dispatcher 调用，并把原代码保存到 data-wujie-on-*", () => {
    const button = document.createElement("button");
    button.setAttribute("onclick", "testFn(this.value)");

    rewriteInlineEventOnElement(button, "face-crm");

    expect(button.getAttribute(INLINE_EVENT_DATA_PREFIX + "click")).toBe("testFn(this.value)");
    const rewritten = button.getAttribute("onclick");
    expect(rewritten).toContain(INLINE_HANDLER_NAME);
    expect(rewritten).toContain("face-crm");
  });

  it("应同时改写多个 on* 属性，且互不影响", () => {
    const input = document.createElement("input");
    input.setAttribute("onchange", "handleChange()");
    input.setAttribute("oninput", "handleInput()");

    rewriteInlineEventOnElement(input, "face-crm");

    expect(input.getAttribute(INLINE_EVENT_DATA_PREFIX + "change")).toBe("handleChange()");
    expect(input.getAttribute(INLINE_EVENT_DATA_PREFIX + "input")).toBe("handleInput()");
    expect(input.getAttribute("onchange")).toContain(INLINE_HANDLER_NAME);
    expect(input.getAttribute("oninput")).toContain(INLINE_HANDLER_NAME);
  });

  it("不应动 class / id / data-* 等非 on* 属性", () => {
    const div = document.createElement("div");
    div.setAttribute("class", "foo");
    div.setAttribute("id", "baz");
    div.setAttribute("data-x", "bar");

    rewriteInlineEventOnElement(div, "face-crm");

    expect(div.getAttribute("class")).toBe("foo");
    expect(div.getAttribute("id")).toBe("baz");
    expect(div.getAttribute("data-x")).toBe("bar");
  });

  it("没有任何 on* 属性的元素应保持原样不被改写", () => {
    const span = document.createElement("span");
    span.setAttribute("title", "hello");
    rewriteInlineEventOnElement(span, "face-crm");
    expect(span.attributes.length).toBe(1);
    expect(span.getAttribute("title")).toBe("hello");
  });

  it("dispatcher 应根据 sandboxId 在对应 sandbox.proxy 作用域内执行原代码", () => {
    const handleClick = jest.fn();
    const proxy: any = { handleClick };
    idToSandboxCacheMap.set("face-crm", { wujie: { proxy } as any });
    installInlineEventDispatcher(window);

    const btn = document.createElement("button");
    btn.setAttribute("onclick", "handleClick()");
    rewriteInlineEventOnElement(btn, "face-crm");
    document.body.appendChild(btn);

    btn.click();

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("dispatcher 内 `this` 应指向触发事件的元素（保留 inline handler 标准语义）", () => {
    const seen: any[] = [];
    const proxy: any = {
      record: (v: unknown) => seen.push(v),
    };
    idToSandboxCacheMap.set("face-crm", { wujie: { proxy } as any });
    installInlineEventDispatcher(window);

    const input = document.createElement("input");
    input.value = "hello";
    input.setAttribute("oninput", "record(this.value)");
    rewriteInlineEventOnElement(input, "face-crm");
    document.body.appendChild(input);

    input.dispatchEvent(new Event("input"));

    expect(seen).toEqual(["hello"]);
  });

  it("找不到 sandbox 时 dispatcher 应静默返回，不影响外层", () => {
    installInlineEventDispatcher(window);
    const btn = document.createElement("button");
    btn.setAttribute("onclick", "willNotRun()");
    rewriteInlineEventOnElement(btn, "ghost-id");
    document.body.appendChild(btn);
    expect(() => btn.click()).not.toThrow();
  });

  it("inline handler 的 return 值应被透传——浏览器据此判断是否 preventDefault", () => {
    // 原生 inline handler 形如 onsubmit="return validate()"，返回 false 时
    // 浏览器会阻止表单提交。改写后必须保留这一语义，否则诸如
    // onsubmit="return false" / onclick="return confirm(...)" 等场景全部失效。
    const proxy: any = { validate: () => false };
    idToSandboxCacheMap.set("face-crm", { wujie: { proxy } as any });
    installInlineEventDispatcher(window);

    const form = document.createElement("form");
    form.setAttribute("onsubmit", "return validate()");
    rewriteInlineEventOnElement(form, "face-crm");
    document.body.appendChild(form);

    // 直接评估改写后的 onsubmit 字符串模拟浏览器编译为函数的过程：
    // 浏览器会把字符串包成 `function(event) { ${str} }` 然后看返回值
    const compiled = new Function("event", form.getAttribute("onsubmit") as string);
    const ret = compiled.call(form, new Event("submit"));
    expect(ret).toBe(false);
  });

  it("installInlineEventDispatcher 重复调用应保持幂等", () => {
    installInlineEventDispatcher(window);
    const first = (window as any)[INLINE_HANDLER_NAME];
    installInlineEventDispatcher(window);
    expect((window as any)[INLINE_HANDLER_NAME]).toBe(first);
  });
});
