/**
 * 内联事件属性（onclick / onchange / ...）的内置劫持
 *
 * 关联 issue: https://github.com/Tencent/wujie/issues/1072
 *
 * 背景：HTML 模板里的 `<button onclick="someFn()">` 由浏览器原生编译，
 * 函数体里自由变量在 ownerDocument.defaultView（即 *主 window*）上查找，
 * 永远不会去子应用的 sandbox proxy 上找。结果开发者必须把方法手动挂在
 * 主 window 命名空间下才能让 inline handler 工作。
 *
 * 内置方案：
 *   1) 模板渲染时，扫描每个元素的 on* 属性，把原代码搬到
 *      data-wujie-on-${type} 上保存，把属性本身改写为对主 window 上
 *      __WUJIE_INLINE_HANDLER__ dispatcher 的调用，并把所属 sandboxId
 *      作为参数烧入。
 *   2) dispatcher 收到 event 时，按 sandboxId 找回 sandbox.proxy，把原
 *      代码用 `with(proxy)` 在 proxy 作用域内执行——子应用代码里挂在
 *      sandbox proxy 上的方法此时即可被自然解析。
 *
 * 不在本期范围（用 setAttribute("onclick", str) 这种 JS 运行时改写
 * inline handler 的场景属于另一个边界，单独评估）。
 */

import { idToSandboxCacheMap } from "./common";

export const INLINE_HANDLER_NAME = "__WUJIE_INLINE_HANDLER__";
export const INLINE_EVENT_DATA_PREFIX = "data-wujie-on-";

/**
 * 把元素上所有 on* 属性改写为 dispatcher 调用，原代码保存到
 * data-wujie-on-${type} 属性上。已经处理过的属性（再次扫描时）
 * 因为属性值已变成 dispatcher 调用，不会重复迁移。
 */
export function rewriteInlineEventOnElement(element: Element, sandboxId: string): void {
  const attrs = element.attributes;
  if (!attrs || !attrs.length) return;
  // 收集后再修改，避免 NamedNodeMap 在迭代时被原地改动带来下标错乱
  const inlineEventNames: string[] = [];
  for (let i = 0; i < attrs.length; i++) {
    const name = attrs[i].name;
    if (name.length > 2 && name[0] === "o" && name[1] === "n") {
      // 已经被改写过的属性值含 dispatcher 名，跳过避免二次包装
      if (attrs[i].value.indexOf(INLINE_HANDLER_NAME) !== -1) continue;
      inlineEventNames.push(name);
    }
  }
  for (const name of inlineEventNames) {
    const code = element.getAttribute(name);
    if (code == null) continue;
    const eventType = name.slice(2);
    element.setAttribute(INLINE_EVENT_DATA_PREFIX + eventType, code);
    // sandboxId 在模板编译时就已确定，烧入到字符串里避免 dispatcher
    // 运行时再做归属反查（shadowRoot/degrade 模式下反查方式不一致）
    // 显式 `return`：浏览器把 inline handler 字符串编译为 `function(event){ ${str} }`，
    // 通过返回值判断 preventDefault（比如 onsubmit="return false"）。不写 return
    // 的话原生语义里 `return false` 这类控制就丢了
    element.setAttribute(
      name,
      `return window.${INLINE_HANDLER_NAME} && window.${INLINE_HANDLER_NAME}.call(this, event, ${JSON.stringify(
        sandboxId
      )})`
    );
  }
}

/**
 * 把 dispatcher 幂等地挂到指定 window 上。同一 window 多次调用安全。
 * 必须在子应用模板渲染前完成挂载。
 */
export function installInlineEventDispatcher(targetWindow: Window): void {
  if ((targetWindow as any)[INLINE_HANDLER_NAME]) return;
  (targetWindow as any)[INLINE_HANDLER_NAME] = function dispatchInlineEvent(
    this: Element,
    event: Event,
    sandboxId: string
  ): unknown {
    const cache = idToSandboxCacheMap.get(sandboxId);
    const sandbox = cache?.wujie;
    if (!sandbox || !sandbox.proxy) return undefined;
    const code = this.getAttribute(INLINE_EVENT_DATA_PREFIX + event.type);
    if (!code) return undefined;
    try {
      // 用 with 在 sandbox.proxy 作用域内执行原代码：
      //   - 自由变量先在 proxy 上查找（子应用挂在 window/proxy 的方法可达）
      //   - 找不到时 fallback 到 Function 全局（主 window，console / setTimeout 等仍可用）
      //   - this 通过 .call(this, ...) 仍指向触发事件的元素，保留标准 inline handler 语义
      const handler = new Function("__wujieProxy__", "event", `with(__wujieProxy__){${code}}`);
      return handler.call(this, sandbox.proxy, event);
    } catch (error) {
      // 子应用 inline handler 报错不应阻断框架本身，但开发期需要可见
      // eslint-disable-next-line no-console
      console.error(`[wujie] inline event handler error:`, error);
      return undefined;
    }
  };
}
