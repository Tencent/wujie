# wujie-core 内存泄露专项排查报告

> 本文针对 `Tencent/wujie` 主仓库 `packages/wujie-core` 的源码（HEAD），系统盘点导致内存泄露 / 不释放的代码点位，并把每个点位与社区已知 issue 一一对应，便于后续修复或在评论区作为线索贴出。
>
> 涉及 issue：
> [#529](https://github.com/Tencent/wujie/issues/529)、
> [#581](https://github.com/Tencent/wujie/issues/581)、
> [#593](https://github.com/Tencent/wujie/issues/593)、
> [#700](https://github.com/Tencent/wujie/issues/700)、
> [#732](https://github.com/Tencent/wujie/issues/732)、
> [#880](https://github.com/Tencent/wujie/issues/880)、
> [#881](https://github.com/Tencent/wujie/issues/881)、
> [#890](https://github.com/Tencent/wujie/issues/890)。

---

## TL;DR

1. 默认链路下，**子应用切换不会自动 `destroy`，只会 `unmount`**——iframe / shadowRoot / Proxy / 各类缓存全部按设计保留。这是「内存不下降」的最常见原因。
2. 即使用户 **主动调用 `destroyApp`**，仍然有以下三条链路把子应用上下文牢牢钉在主应用堆上，导致 contentWindow 永远 GC 不掉：
    - 子应用通过 `document.addEventListener` 注册的事件被转发到 **主应用 `window.document`**，`destroy()` **没有反向解绑**。
    - 子应用 `window.onXXX = handler` 的 setter 被改写成「直接写到主应用 `window` 上」，`destroy()` 也没有还原。
    - `embedHTMLCache / scriptCache / styleCache / appEventObjMap` 是模块级常驻 Map，没有失效策略，也没有清理 API。
3. 保活 (`alive: true`) 模式从设计上就 **完全不释放任何资源**，子应用内部的 `<video>`、WebGL、`setInterval` 仍在运行，是 #700 / #880 / #881 等"长时间累积"的根因。
4. `deleteWujieById` 实现存在 bug：本意是 destroy 后保留 `setupApp` 的缓存 options，结果两行代码相互抵消，options 一并被删；该 bug 与 #732 现象密切相关。
5. 源码内已有两处 `// TODO 内存泄露` / `// this may lead memory leak risk` 注释，与本文点位 §2 一致——属于已知未修。

---

## 1. 默认 unmount 不销毁 iframe 与 shadow（命中 #890 #581）

### 触发链

WebComponent 的 `disconnectedCallback` 只触发 `unmount`，并且 `unmount` 内部仅清空 `head/body` 子节点，不释放 iframe 自身：

```43:54:packages/wujie-core/src/shadow.ts
class WujieApp extends HTMLElement {
  connectedCallback(): void {
    if (this.shadowRoot) return;
    const shadowRoot = this.attachShadow({ mode: "open" });
    const sandbox = getWujieById(this.getAttribute(WUJIE_APP_ID));
    patchElementEffect(shadowRoot, sandbox.iframe.contentWindow);
    sandbox.shadowRoot = shadowRoot;
  }

  disconnectedCallback(): void {
    const sandbox = getWujieById(this.getAttribute(WUJIE_APP_ID));
    sandbox?.unmount();
  }
}
```

```370:394:packages/wujie-core/src/sandbox.ts
public async unmount(): Promise<void> {
  this.activeFlag = false;
  clearInactiveAppUrl();
  if (this.alive) {
    this.lifecycles?.deactivated?.(this.iframe.contentWindow);
  }
  if (!this.mountFlag) return;
  if (isFunction(this.iframe.contentWindow.__WUJIE_UNMOUNT) && !this.alive && !this.hrefFlag) {
    this.lifecycles?.beforeUnmount?.(this.iframe.contentWindow);
    await this.iframe.contentWindow.__WUJIE_UNMOUNT();
    this.lifecycles?.afterUnmount?.(this.iframe.contentWindow);
    this.mountFlag = false;
    this.bus?.$clear();
    if (!this.degrade) {
      clearChild(this.shadowRoot);
      removeEventListener(this.head);
      removeEventListener(this.body);
    }
    clearChild(this.head);
    clearChild(this.body);
  }
}
```

注意：`unmount` 完成后 **`iframe`、`shadowRoot`、`proxy*`、`styleSheetElements`、`__WUJIE_EVENTLISTENER__`、`elementToSandboxMap`、`appEventObjMap` 中的条目** 全部 **原样保留**。这是设计上的「快速复用」策略。

### 与 issue 的对应

- **#890**：路由切换→ WujieVue 卸载 → `disconnectedCallback` → `unmount`。框架按设计不释放 iframe，所以子应用 contentWindow 内部的 V8 堆完全不下降。
- **#581**：单例/重建模式下，开发者在 chrome memory profile 里看到 `shadow` 对象长期不释放——同上。

### 为什么 DOM 节点也会增长（而不仅仅是堆不下降）

读 unmount 流程，shadowRoot 内的 html / head / body 子节点会被 `clearChild` 清掉。理论上同名 sandbox 复用时 DOM 不应增长。但实测仍然增长，主要来自以下几个会"留尾巴"的位置：

1. **多个 `name` 不同的子应用**：每个 `name` 都会 `iframeGenerator()` 创建一个新的 `<iframe display:none>` 并 `appendChild` 到 `window.document.body`，且永远不被移除（`unmount` 不删 iframe，只有 `destroy` 才删）。这直接体现为主应用 document 的 `<iframe>` 节点单调递增。
2. **iframe.contentDocument.head 内的 `<script>` 持续累积**：每次 `start()` 都会向 iframe 的 head 注入大量 `scriptElement` 与一个"shift execQueue"的 `nextScriptElement`，并且 `unmount` 不清理 iframe 自身的 head。
   ```789:870:packages/wujie-core/src/iframe.ts
   export function insertScriptToIframe(...) {
     ...
     const container = rawDocumentQuerySelector.call(iframeWindow.document, "head");
     ...
     container.appendChild(scriptElement);
     ...
   }
   ```
   非 alive 模式下，框架的复用走的是 `__WUJIE_MOUNT()` 而不是再次 `start()`，所以单一 sandbox **正常情况下不会重复 `start`**；但只要触发了下方第 6 节的 "deleteWujieById bug → 必须新建 sandbox → 老 iframe 没删 + 新 iframe 又来一份" 链路，DOM 就会以子应用启动数 × 子应用模板规模的速率累积。
3. **`styleSheetElements` 数组永不出栈**：动态插入的 `<style>` / `<link>` 都会 `push` 进数组：
   ```256:268:packages/wujie-core/src/effect.ts
   case "STYLE": {
     const stylesheetElement: HTMLStyleElement = newChild as any;
     styleSheetElements.push(stylesheetElement);
     ...
   }
   ```
   `unmount` 不会清空数组，`rebuildStyleSheets` 直接整体重新挂回 `shadowRoot.head`。如果子应用每次 mount 都会**新建** `<style>` 节点（典型场景：CSS-in-JS、scoped style 哈希变化、或动态主题），数组会单调增长，shadowRoot.head 内的 `<style>` 数也跟着累积。
4. **新老 sandbox 同时存在的中间态**：详见第 6 节 deleteWujieById bug。

### 修复方向

- 给 `WujieVue / WujieReact` 容器组件提供 `destroyOnUnmount` 配置，让用户能选择 disconnected 时直接 `destroy` 而不是仅 `unmount`。
- 若维持当前默认行为，应至少在 `unmount` 时 `splice` 掉非缓存模板的 `styleSheetElements`，并对 iframe.contentDocument.head 做受控清理。

---

## 2. `destroy()` 残留：`window.document` 上的 listener 永不解绑（命中 #529 #593）

### 触发链

子应用通过 `document.addEventListener('keydown', ...)` 这类事件，被 `patchDocumentEffect` 转发到主应用 `window.document`：

```432:438:packages/wujie-core/src/iframe.ts
if (mainDocumentAddEventListenerEvents.includes(type))
  return window.document.addEventListener(type, callback, options);
if (mainAndAppAddEventListenerEvents.includes(type)) {
  window.document.addEventListener(type, callback, options);
  sandbox.shadowRoot.addEventListener(type, callback, options);
  return;
}
```

```161:174:packages/wujie-core/src/common.ts
export const mainDocumentAddEventListenerEvents = [
  "fullscreenchange", "fullscreenerror", "selectionchange", "visibilitychange",
  "wheel", "keydown", "keypress", "keyup",
];

// 需要同时挂载到主应用document和shadow上的事件（互斥）
export const mainAndAppAddEventListenerEvents = ["gotpointercapture", "lostpointercapture"];
```

`destroy()` 只清理了 `iframe.contentWindow.__WUJIE_EVENTLISTENER__`（即 `iframeWindow.addEventListener` 走的那条），**没有任何一段代码** 清理 `window.document.addEventListener` 注册的回调：

```432:441:packages/wujie-core/src/sandbox.ts
if (this.iframe) {
  const iframeWindow = this.iframe.contentWindow;
  if (iframeWindow?.__WUJIE_EVENTLISTENER__) {
    iframeWindow.__WUJIE_EVENTLISTENER__.forEach((o) => {
      iframeWindow.removeEventListener(o.type, o.listener, o.options);
    });
  }
  this.iframe.parentNode?.removeChild(this.iframe);
  this.iframe = null;
}
```

并且这些 callback 都是 `handler.bind(this)` 后再注册的，闭包内 `this === iframeWindow.document`，**会死死拽住整个 iframeWindow 不可回收**——即便 iframe 节点已经被 removeChild。

源码自己也明确标注了：

```221:227:packages/wujie-core/src/sandbox.ts
/*
 document.addEventListener was transfer to shadowRoot.addEventListener
 react 16 SyntheticEvent will remember document event for avoid repeat listen
 shadowRoot have to dispatchEvent for react 16 so can't be destroyed
 this may lead memory leak risk
*/
```

```529:531:packages/wujie-core/src/iframe.ts
// 处理document专属事件
// TODO 内存泄露
documentEvents.forEach((propKey) => {
```

### 与 issue 的对应

- **#529** "destroyApp 后 DOM 删了但 jsVm/堆不下降"——经典案例。
- **#593** 同上。
- **#732** "DOM 没了但内存仍占用"——同上。

### 修复方向

在 `patchDocumentEffect` 内额外维护一张 `mainDocumentListeners: Set<{type, callback, options}>`，destroy 时 `window.document.removeEventListener` 全部反向解绑；`mainAndAppAddEventListenerEvents` 同时清理 shadowRoot 那份。

---

## 3. `destroy()` 残留：`window.onXXX` 被持续污染（命中 #881 长时间累积）

```272:286:packages/wujie-core/src/iframe.ts
Object.defineProperty(iframeWindow, e, {
  enumerable: descriptor.enumerable,
  configurable: true,
  get: () => window[e],
  set:
    descriptor.writable || descriptor.set
      ? (handler) => {
          window[e] = typeof handler === "function" ? handler.bind(iframeWindow) : handler;
        }
      : undefined,
});
```

子应用一旦写 `window.onresize = ...` / `window.onbeforeunload = ...` 等，会被直接写到 **主应用 `window` 上**，handler 闭包内持有 `iframeWindow`。`destroy()` 没有反向 `delete window[e]` 或还原 patch 前的 descriptor。

每销毁一个子应用，主应用 `window` 上就会留一条引用着旧 iframeWindow 的 handler；同名子应用再启动会覆盖旧 handler，旧 handler 的 GC 链才被断开——但前一段时间内已经持有完整的 contentWindow。在 #881 这种"几十个子应用、一晚上不动"的场景下，这条链路放大效果非常显著。

### 修复方向

- 在 `patchWindowEffect` 内以 `Set<string>` 记录被 set 过的 onEvent；
- destroy 时遍历该 set 并 `delete window[key]` 或还原 descriptor；
- 同时建议 README 加一条说明：禁止主应用同名 onEvent，避免相互覆盖。

---

## 4. 模块级缓存只增不减（命中 #631 #881）

```39:41:packages/wujie-core/src/entry.ts
const styleCache = {};
const scriptCache = {};
const embedHTMLCache = {};
```

```108:140:packages/wujie-core/src/entry.ts
const fetchAssets = (
  src: string,
  cache: Object,
  ...
) =>
  cache[src] ||
  (cache[src] = fetch(src)
    .then((response) => { ... return response.text(); })
    ...);
```

- 全是按 URL 字符串做 key，**没有 LRU、没有 TTL、没有 destroy 时的清理**。
- `scriptCache` 缓存的是 **整段源代码字符串**，几十个子应用 + N 个 chunk 的场景，量级容易上百 MB。
- 副作用包括 **#631「修改后的代码不生效」**——命中了 `embedHTMLCache[url]`。
- 直接关联 **#881** 的"几十个子应用一晚上 3.5G"。

### 修复方向

暴露 `clearAssetsCache(opts?)` 和 `setAssetsCacheStrategy({ maxEntries?, maxBytes?, ttl? })`；至少在 `destroyApp(name)` 时清掉 host 维度匹配的条目。

---

## 5. `appEventObjMap` 条目永久驻留（命中 #881）

```22:29:packages/wujie-core/src/event.ts
constructor(id: string) {
  this.id = id;
  this.$clear();
  if (!appEventObjMap.get(this.id)) {
    appEventObjMap.set(this.id, {});
  }
  this.eventObj = appEventObjMap.get(this.id);
}
```

`$clear` 只清 `events` 内容，`destroy()` 也只调用了 `bus.$clear()`，**没有 `appEventObjMap.delete(id)`**。每个 `setupApp` 都会落 1 个条目，且条目里的回调闭包会持续持有引用。setup 上百个子应用的场景下，这是不可忽视的常驻内存。

### 修复方向

`Sandbox.destroy()` 末尾增加 `appEventObjMap.delete(this.id)`。

---

## 6. `deleteWujieById` 写错了（命中 #732）

```37:41:packages/wujie-core/src/common.ts
export function deleteWujieById(id: string) {
  const wujieCache = idToSandboxCacheMap.get(id);
  if (wujieCache?.options) idToSandboxCacheMap.set(id, { options: wujieCache.options });
  idToSandboxCacheMap.delete(id);
}
```

第二行刚把 `{ options }` 重新塞回去，第三行又 `delete` 整个 entry，**第二行实际上无效**。本意是 destroy 后让 `setupApp` 缓存的 options 仍然可用，结果 options 也被一并删掉。

### 与 issue 的对应

- **#732**：第一次 `startApp` → `destroyApp` → 第二次 `startApp` 时 `getOptionsById` 拿不到原 options，必须新建 sandbox；新 sandbox 走完整 active+start，老 sandbox 上残留的 1/2/3 节描述的引用都还活着，进一步放大泄露。

### 修复方向

```ts
export function deleteWujieById(id: string) {
  const wujieCache = idToSandboxCacheMap.get(id);
  if (wujieCache?.options) {
    idToSandboxCacheMap.set(id, { options: wujieCache.options });
  } else {
    idToSandboxCacheMap.delete(id);
  }
}
```

---

## 7. 保活模式从设计上就不释放任何资源（命中 #700 #880 #881）

```370:394:packages/wujie-core/src/sandbox.ts
public async unmount(): Promise<void> {
  ...
  if (this.alive) {
    this.lifecycles?.deactivated?.(this.iframe.contentWindow);
  }
  if (!this.mountFlag) return;
  if (isFunction(this.iframe.contentWindow.__WUJIE_UNMOUNT) && !this.alive && !this.hrefFlag) {
    // ...真正的清理逻辑都包在 !this.alive 里
  }
}
```

保活下 unmount 仅触发 `deactivated`，DOM / iframe / 定时器 / 视频元素等 **完全不动**。

- **#700 视频**：`<video>` 元素留在 shadowRoot 里，video 解码缓冲与 media element 仍在播放/缓冲。
- **#880 cesium**：WebGL context 与显存对象在 iframe contentWindow 内未销毁。
- **#881 几十个子应用 alive**：每个子应用的 `setInterval` / `Worker` / `addEventListener` 全部活着，时间一长内存指数增长。

### 修复方向

- 文档明确"保活 = 永不释放，使用方需自行 pause 高耗资源"；
- 在 `deactivated` 钩子的官方建议代码中给出 `pause()` / `cancelAnimationFrame` / 关闭 WebSocket 的样板；
- 提供"半保活"模式：alive + 长时间不可见 N 秒后自动降级到 unmount。

---

## 8. 轻微风险

| 位置 | 描述 |
|---|---|
| `effect.ts:65-81` `handleStylesheetElementPatch` 内 `setTimeout(patcher, 50)` | unmount 时未清；50 ms 内 sandbox 闭包不可回收，量级很小。 |
| `iframe.ts:720` `setTimeout(runTrick, 5e3)` | srcdoc 安全网；destroy 后 5 秒内 iframeWindow 仍被 timer 闭包持有。 |
| `effect.ts:168` 模块级 `dynamicScriptExecStack = Promise.resolve()` 永远 `.then` 链增长 | Promise 完成后节点应可回收，但属常驻链路。 |
| 所有 `window.addEventListener("popstate", ...)` 之类模块级监听 | 不随 sandbox 释放，但匹配不到时 `.filter` 掉，不直接泄露；高频触发对性能有影响。 |

---

## 与 issue 的总览映射

| Issue | 主要关联条目 | 推荐立刻关注的修复 |
|---|---|---|
| #890 路由切换 DOM/内存持续增加 | §1 + §4 | `destroyOnUnmount` 配置、styleSheetElements 清理 |
| #581 单例/重建模式 shadow 不释放 | §1 + §2 + §3 | §2 §3 |
| #529 / #593 destroyApp 后内存不下降 | §2 + §3 + §5 + §6 | §2 §3 §5 §6 |
| #732 start→destroy→start 后 dom 没了内存不下来 | §6 + §2 + §3 | §6 优先 |
| #700 子应用播放视频泄露 | §7 | 文档 + deactivated 样板 |
| #880 Cesium 子应用切换崩溃 | §7 + WebGL 上下文未释放 | §7 |
| #881 几十个子应用一晚上翻一倍 | §7 + §4 + §3 + §5 | §4 §5 §7 |
| #631 子应用资源被缓存不更新 | §4 | `clearAssetsCache` API |

---

## 建议补充的回归测试

- `__test__/integration/memory.test.ts`：起 5 次 `startApp` / `destroyApp`，调用 `Memory.getDOMCounters` 验证 `nodes` 与 `jsHeapSize` 应回到基线 ±N% 之内；可作为回归基准。
- `__test__/unit/common.test.ts`：补 `deleteWujieById` 应在有 options 时保留条目、无 options 时整体删除的双向用例。

---

> 本文为代码审计结论，未在最新仓库上跑 puppeteer 量化复测；建议结合 `notes/memory-leak-investigation.md` 同时新增一份 integration 测试做实测对照。

---

## 修复进度（TDD 推进中）

### ✅ 批 A · 纯逻辑 bug

| 项 | 测试 | 修复点 | 修复前 | 修复后 |
|---|---|---|---|---|
| §6 `deleteWujieById` | `__test__/unit/common.test.ts` (3 cases) | `src/common.ts` | destroy 后 `setupApp` 缓存的 options 被同步删除，下一次 startApp 必须新建 sandbox | options 在有 `setupApp` 时正确保留，sandbox 引用清除；无 setupApp 时整体删除 entry |
| §5 `appEventObjMap.delete` | `__test__/unit/event-leak.test.ts` (3 cases) | `src/event.ts` + `src/sandbox.ts` | EventBus 没有 `$destroy`，`sandbox.destroy()` 仅 `$clear()`，map entry 永久驻留 | 新增 `EventBus.$destroy()`，`sandbox.destroy()` 调用，map 条目随 destroy 释放 |

测试结果：单元测试由 22 → 28 通过（+6 项新增，全部 GREEN）。

### ✅ 批 B · 销毁链路补全

| 项 | 测试 | 修复点 | 修复前 | 修复后 |
|---|---|---|---|---|
| §2 `window.document` listener 残留 | `__test__/unit/destroy-cleanup.test.ts` (3 cases) + `destroy-cleanup-e2e.test.ts` (2 cases) | 新增 `src/effect-cleanup.ts`, 改 `src/iframe.ts` `patchDocumentEffect` + `src/sandbox.ts` `destroy()` | `patchDocumentEffect` 把 `mainDocument` 类事件转发到主 `window.document`，destroy 时仅清 iframe 自身 listener，主 document 上的转发 listener 永驻 → 闭包持有 iframeWindow，sandbox GC 失败 | sandbox 实例持有 `EventCleanupTracker`，每次转发同步登记，`destroy()` 末尾 `cleanupAll()` 反向 `removeEventListener`；`removeEventListener` 同步从 tracker 解除，避免 destroy 时重复解绑 |
| §3 `window.onXXX` 污染未还原 | `__test__/unit/destroy-cleanup.test.ts` (3 cases) + `destroy-cleanup-e2e.test.ts` (1 case) | `src/iframe.ts` `patchWindowEffect` + `src/effect-cleanup.ts` | `patchWindowEffect` 内部 `window[e] = handler.bind(iframeWindow)`，destroy 不还原；每销毁一个子应用就在主 window 上留一个 dangling handler | 在 setter 内首次记录主 `window[e]` 原值与 `hadOwnProperty`，`destroy()` 时通过 setter 写回原值（accessor 不能用 defineProperty descriptor 还原），原本无 own property 的 key 还会 delete，确保无残留 |

附带：
- `src/iframe.ts`：将 `patchDocumentEffect` / `patchWindowEffect` 由 module-private 改为 `export`，便于"准集成"测试与外部 plugin 复用。
- `src/sandbox.ts`：`destroy()` 末尾调用 `this.eventCleanupTracker.cleanupAll()`。

测试结果：6 suites / 37 tests，全部 GREEN。

### ✅ 批 C · 资源缓存与动态资源清理

| 项 | 测试 | 修复点 | 修复前 | 修复后 |
|---|---|---|---|---|
| §4 模块级缓存永驻 | `__test__/unit/asset-cache.test.ts` (4 cases) | `src/entry.ts` 暴露 `clearAssetsCache(host?)` 并从 `src/index.ts` re-export | `styleCache / scriptCache / embedHTMLCache` 是 module-private 普通对象，destroyApp 不会清；多 host 子应用切换或热更新场景持续累积 | 公共 API：`clearAssetsCache()` 全清 / `clearAssetsCache(host)` 按 url 前缀清 / 支持数组批量。`src/entry.ts` 同时把三个 cache 改为 `export`，便于上层做 telemetry |
| §1.2 styleSheetElements 单调增长 | `__test__/unit/stylesheet-leak.test.ts` (4 cases) | `src/sandbox.ts` 新增 `clearStyleSheetsForUnmount()` + `unmount()` 调用 | unmount 只 clearChild(head/body)，`styleSheetElements` 数组不清；非保活子应用反复进出，rebuildStyleSheets 时旧引用一并 reattach，DOM 中 style 节点 N 倍累积，废弃 style 节点也无法被 GC | 非保活时 `styleSheetElements.length = 0`（保留数组引用），保活时保持原值用于 rebuildStyleSheets。next mount 由子应用 `__WUJIE_MOUNT` 自然重建 |
| §1.3 iframe head 动态 script 累积 | `__test__/unit/script-leak.test.ts` (5 cases) | `src/sandbox.ts` 新增 `dynamicScriptElements` 字段 + `clearDynamicScriptsForUnmount()`，`src/iframe.ts insertScriptToIframe` 在带 rawElement 时登记 | 子应用 `document.head.appendChild(<script>)` 触发的脚本，每个保留完整 textContent（数 KB ~ 几十 KB）；非保活反复 mount/unmount 在同一 iframe 上累积，体积持续上涨 | 仅登记 effect.ts 转发的动态脚本（带 rawElement），unmount（非保活）时从 iframe head 安全 removeChild 并清空数组；初始 sandbox.start 的脚本不登记，避免误删 |

测试结果：9 suites / 50 tests，全部 GREEN。

### ✅ 批 D · 根治路由切换型场景：disconnect 按运行模式自动判定 destroy / unmount

> 早期方案曾引入 `destroyOnUnmount` 配置，让业务在 `setupApp/startApp` 显式传 `true` 才在 disconnect 时 destroy。但「重建模式本就该销毁」这件事属于框架职责，不应外包给业务配置；已废弃该配置，改为按运行模式自动判定。

| 项 | 测试 | 修复点 | 修复前 | 修复后 |
|---|---|---|---|---|
| §1.1 disconnect 仅 unmount 累积 sandbox | `__test__/unit/handleWujieAppDisconnect.test.ts` (5 cases) | `src/shadow.ts` | wujie-app webcomponent 的 `disconnectedCallback` 无论何种模式都只 `unmount`；对**重建模式**（非保活、未做生命周期改造）而言 `unmount()` 因没有 `mountFlag` / `__WUJIE_UNMOUNT` 基本是空操作，sandbox / iframe / iframeWindow 一直驻留累积（#890） | `shadow.ts` 抽出独立可测的 `handleWujieAppDisconnect(sandbox)` helper，按运行模式自动判定（与 `startApp` 复用分支同一信号）：① 保活（`alive`）→ `unmount`；② 单例（非保活 + 存在 `__WUJIE_MOUNT`，做了生命周期改造）→ `unmount`；③ 重建（非保活 + 无 `__WUJIE_MOUNT`）→ 直接 `destroy`。`WujieApp.disconnectedCallback` 调用该 helper，无需任何业务配置 |

> 注：该批一度涉及 `src/sandbox.ts`、`src/index.ts`、`src/utils.ts`、`packages/wujie-vue2,3/index.js`、`packages/wujie-react/index.js,.d.ts` 透传 `destroyOnUnmount`；废弃配置后这些透传已全部回收，最终落点只剩 `src/shadow.ts` 一处。

测试结果：10 suites / 55 tests，全部 GREEN。

### ✅ 批 E · `Object.defineProperty` 隐患（§9 §10）

| 项 | 测试 | 修复点 | 修复前 | 修复后 |
|---|---|---|---|---|
| §9 `documentEvents` setter 多重 bug | `__test__/unit/document-events-leak.test.ts` (4 cases) | `src/iframe.ts patchDocumentEffect` | 1) `addEventListener` 与 `handlerCallbackMap.set` 各自独立 `handler.bind()` → 两个不同 bound，下次 set 永远 remove 不掉真正注册的；2) 直接调原生 `document.addEventListener`，绕开批 B 的 `eventCleanupTracker`，destroy 不解绑；3) `handler = null` 进入 `.bind()` 直接抛 `TypeError`；4) bound 闭包持有 `iframeWindow.document`，永久挂在主 document 上 → iframeWindow GC 不掉 | 维护 `propKeyToActiveListener: Map<propKey, bound>`，每次 set 时先按 propKey 取出旧 bound 解绑、untrack，再生成新 bound 并接入 `eventCleanupTracker.trackMainDocumentListener`；handler 为 null/非函数时只解绑不重绑（与原生 onXXX = null 语义一致）；事件名由 `propKey.slice(2)` 推导避免再次绕过劫持 |
| §10 `patchElementEffect` 跨边界闭包持有 sandbox | `__test__/unit/element-patch-leak.test.ts` (3 cases) | `src/iframe.ts patchElementEffect`, `src/sandbox.ts destroy()` | 1) `proxyLocation` 在函数开头从 `iframeWindow.__WUJIE.proxyLocation` 抽取为闭包变量 → element 永久强持 proxyLocation 对象；2) `ownerDocument` getter 直接闭包持有 `iframeWindow`，element 一旦被 portal/弹窗/拖拽搬到主应用 DOM 下，destroy 之后仍把 iframeWindow 钉死；3) destroy 流程不解链 `iframeWindow.__WUJIE`，残留 element 通过 getter 仍可拿到 sandbox | 1) 用 `WeakRef<Window>` 间接持有 iframeWindow，闭包不再有强引用；2) baseURI / ownerDocument getter 通过 `weakRef.deref()?.__WUJIE?.proxyLocation` 动态访问，拿不到时降级到主 `document.baseURI` / 主 `document`；3) `sandbox.destroy()` 在 removeChild iframe 之前主动 `iframeWindow.__WUJIE = null`，让残留 getter 立即降级；同时旧环境无 `WeakRef` 时降级为强引用，保持兼容 |

附带：
- `src/sandbox.ts:575`：`window.__WUJIE.inject` 加显式 `as Wujie["inject"]` 类型断言，绕开 TS incremental 把 `__WUJIE_INJECT` spread 字面量推断错误传染到 `__WUJIE.inject` 的预先存在编译错（与本批改动无直接因果，但触发 cache 重新编译时暴露，顺手修掉）。

测试结果：12 suites / 62 tests，全部 GREEN。

---

## 总览（批 A → 批 E）

| 维度 | 批 A | 批 B | 批 C | 批 D | 批 E | 累计 |
|---|---|---|---|---|---|---|
| 修复 src 文件数 | 3 | 4 | 4 | 1 | 2 | 9 (去重) |
| 新增 unit 测试文件 | 2 | 2 | 3 | 1 | 2 | 10 |
| 新增 unit 用例数 | +6 | +9 | +13 | +5 | +7 | +40 |
| 总用例数（22 → 62） | 28 | 37 | 50 | 55 | 62 | 62/62 GREEN |
| 关联 issue | #732 #881 | #715 #890 | #732 #715 #890 | #890 | — | — |

> 后续：在 puppeteer 集成测试里加一份 `memory.benchmark.ts`，循环 `startApp/destroyApp` N 轮，量化对比 `Page.evaluate(() => performance.memory)` + `document.querySelectorAll("*").length`，得到一份「修复前/修复后」对照表。该步骤需要重新构建 esm 并启动 8 个 example dev server，建议放在最终验收时单独跑一次。

