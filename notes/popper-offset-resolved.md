弹出层偏移问题

# Popper / Floating UI 在无界 Shadow DOM 中的定位问题

## 背景

在无界 `webcomponent + shadowRoot` 模式下，子应用 DOM 被渲染到主应用页面中的 `shadowRoot` 内。此时浏览器真实 DOM 树、子应用感知到的 `window/document`、滚动容器、弹层挂载容器不再完全等价于普通页面。

这会影响依赖 DOM 几何信息的弹层库。典型表现包括：

- 弹层初始位置存在固定偏移。
- 页面或容器滚动后，弹层不跟随触发元素。
- 同一套代码在普通页面、fixed 弹窗、内部滚动容器、外部滚动容器中表现不同。
- 标准 Popper/Floating UI 能正常工作，但组件库二次封装的弹层仍然异常。

问题的核心不是单一 API 返回错，而是多个坐标系之间的语义不一致：

- `getBoundingClientRect()` 返回 viewport 坐标。
- `position: absolute` 的 `top/left` 依赖 containing block。
- `position: fixed` 依赖 viewport 或 fixed 上下文。
- `documentElement/body/window` 在无界中经过代理。
- 弹层库可能把弹层 append 到 `document.body`，但 reference 位于 shadowRoot 内的其他滚动上下文。

## 原理：为什么标准弹层库会出现偏移

无界为了让子应用在 shadowRoot 中仍然保留类似普通 document 的访问语义，会将子应用的 `document.documentElement` 代理到 shadowRoot 内部的 `<html>`：

```ts
document.documentElement -> shadowRoot.firstElementChild
```

这个 `<html>` 并不是浏览器原生顶层 document 的 `<html>`，而是一个真实存在于主应用 DOM 中的 shadow 子树节点。因此它的 `getBoundingClientRect()` 会包含宿主容器相对 viewport 的偏移。

标准 Popper/Floating UI 在计算弹层位置时，通常会读取类似链路：

```ts
reference.ownerDocument.documentElement.getBoundingClientRect();
```

或通过 `ownerDocument`、`defaultView`、`documentElement`、`offsetParent` 等 API 推导 viewport、clipping root、offset parent。

如果 `documentElement.getBoundingClientRect()` 返回了带宿主偏移的 rect，弹层库会把这个偏移当成 document/viewport 的一部分参与计算，最终表现为弹层整体偏移。

## 方案一：替换 documentElement / scrollingElement

曾尝试在 document 代理层直接返回 iframe 原生 document：

```ts
if (propKey === "documentElement") return iframe.contentDocument.documentElement;
if (propKey === "scrollingElement") return iframe.contentDocument.scrollingElement;
```

这个方案希望从源头上让弹层库拿到 0 基准的原生 documentElement。

它解决的问题：

- 理论上可以消除 `documentElement.getBoundingClientRect()` 中的宿主偏移。

它带来的问题：

- 破坏了无界现有 document 代理语义。
- `document.documentElement` 不再指向 shadowRoot 内真实渲染的 `<html>`。
- 路由、DOM 查询、样式、滚动等依赖 documentElement 的逻辑可能出现异常。
- 实际验证中出现过页面死循环。

结论：

不推荐。`documentElement` 这个对象本身是无界运行模型的一部分，不能为了弹层库整体替换。

## 方案二：只修正 shadowRoot 内 html 的几何读数

更窄的方案是保持：

```ts
document.documentElement === shadowRoot.firstElementChild;
```

只修正这个 `<html>` 的 `getBoundingClientRect()`：

```ts
Object.defineProperty(shadowRoot.firstElementChild, "getBoundingClientRect", {
  enumerable: true,
  configurable: true,
  value: () =>
    iframeWindow.__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__.call(iframeWindow.document, "html").getBoundingClientRect(),
});
```

这个方案的思路是：

- 不替换 `documentElement` 对象。
- 不破坏无界对 shadowRoot 内 `<html>` 的代理语义。
- 只让弹层库读取 `documentElement.getBoundingClientRect()` 时拿到一个接近普通 document 的 0 基准 rect。

它解决的问题：

- 修复标准 Popper/Floating UI 因 documentElement rect 带宿主偏移导致的初始定位偏移。
- 对依赖 `getBoundingClientRect()` 计算 viewport/document 基准的库较有效。
- 对 fixed 弹窗场景也更稳定，因为不再用宿主 shadow `<html>` 的偏移参与计算。

它没有解决的问题：

- 不改变 `position: absolute` 的 containing block。
- 不改变弹层 append 到哪里。
- 不保证滚动时组件库一定会重新计算位置。
- 对只写 `top/left` 且不正确 update 的老组件库，仍然可能在滚动时失效。

结论：

这是目前比较安全的 core 窄补丁，适合解决“计算基准偏移”问题，但不是所有弹层滚动问题的通用解。

## 方案三：取消几何补丁，给 body 添加 position: relative

这个方案的现象是：如果不修正 `getBoundingClientRect()`，同时让 shadowRoot 内的 body 成为 `position: relative`，普通页面中的 `absolute top/left` 可能看起来是对的。

原因是：

- 弹层库计算时拿到了带宿主偏移的坐标。
- 弹层实际又相对带偏移的 body 定位。
- 两个偏移在普通页面中可能互相抵消。

它解决的问题：

- 某些只使用 `position: absolute; top/left` 的老弹层，在普通页面场景中可能恢复正确位置。

它带来的问题：

- 这是“误差抵消”，不是坐标系真正统一。
- fixed 弹窗场景会再次出错，因为 reference 处于 fixed 坐标系，而 popper 仍相对 body。
- 内部滚动容器、外部滚动容器、嵌套弹层等场景都可能出现新的偏移。
- 给 body 添加 `position` 会改变所有 absolute 子节点的 containing block，影响面过大。

结论：

不推荐作为 core 通用方案。它只能覆盖部分普通页面场景，会在 fixed/dialog 等场景中制造新的坐标系不一致。

## 方案四：滚动事件桥接

另一个思路是：弹层初始位置已经正确，但滚动后不更新，说明库没有监听到真正发生滚动的节点。可以尝试将实际滚动容器上的 scroll 事件桥接给子应用的 `window/document`。

它想解决的问题：

- 某些弹层库监听的是 `window.addEventListener("scroll", update)`。
- 实际滚动发生在 shadowRoot 内部节点或主应用外层容器。
- 组件库没收到 scroll，因此没有调用 update。

它可以解决的情况：

- 组件库本身具备 update 能力。
- 组件库只是监听错了 scroll target。
- 框架能够准确找到真实滚动容器并转发事件。

它不能解决的情况：

- 组件库初始化后根本不在滚动时 update。
- 组件库 update 后仍然只写相对错误 containing block 的 `top/left`。
- 弹层 append 目标和 reference 所在滚动上下文本身不一致。

结论：

滚动桥接只能解决“没收到滚动事件”的问题，不能解决 `absolute top/left` 的 containing block 问题。它可以作为补充，但不是完整方案。

## Element UI 老 Popper 的特殊问题

Element UI 的 `element-ui/lib/utils/popper.js` 不是现代 `popper.js@1.16.1` 的完整实现，而是 Element UI 内置/改造过的老版本。

它的默认配置关闭了 transform：

```js
popperOptions: {
  default() {
    return {
      gpuAcceleration: false
    };
  }
}
```

因此它通常只写：

```css
position: absolute;
top: ...;
left: ...;
```

而不是：

```css
transform: translate3d(...);
```

这带来两个后果：

- 弹层位置强依赖 `absolute` 的 containing block。
- 如果滚动后没有重新计算，视觉位置不会像 transform update 那样刷新。

Element UI 还常见以下组合：

- `appendToBody: true`
- 弹层挂到 `document.body`
- `gpuAcceleration: false`
- 自己封装 scroll parent 发现逻辑
- 使用 `top/left` 写入最终位置

在普通 document 中，这组假设通常成立。但在无界 shadowRoot 中：

- `document.body` 是代理后的 shadow body。
- `documentElement` 是 shadowRoot 内 `<html>`。
- `window`、`document`、真实滚动容器不一定是同一个坐标体系。
- reference 和 popper 可能不在同一个滚动/定位上下文。

因此 Element UI 的问题不是单纯的“Popper 不支持 shadowRoot”，而是它的老封装把普通 document 的滚动和定位假设写死了。

## 标准 Popper / Floating UI 为什么更容易正常

标准 Popper.js 2.x 和 Floating UI 的实现更现代，通常会：

- 更准确地查找 scroll parent。
- 在滚动或 resize 时主动 update。
- 使用 middleware / modifier 重新计算位置。
- 通过 `transform: translate3d(...)` 写入最终位置。

这类库只要计算基准正确，滚动时重新计算也正确，就能在无界 shadowRoot 中正常工作。

但这不代表所有基于 Popper 的组件库封装都能正常。组件库可能改掉默认配置、关闭 transform、改变 append 目标、屏蔽 update，导致行为和原始库不同。

## 推荐解决办法

### Core 层

推荐保留窄补丁：

- 只修正 `shadowRoot.firstElementChild.getBoundingClientRect()`。
- 不替换 `documentElement` 对象。
- 不全局修改 `body position`。
- 不全局改写 `offsetParent` 或 absolute 定位规则。

这个补丁解决的是“documentElement 几何基准偏移”，适合标准 Popper/Floating UI。

### 组件库适配层

对于 Element UI 这类老封装，优先从组件库配置入手。

如果组件支持关闭 append 到 body：

```vue
<el-select :popper-append-to-body="false" />
```

如果组件支持传入 popper options，尽量开启 transform：

```js
{
  gpuAcceleration: true;
}
```

如果组件支持自定义弹层挂载容器，优先挂到触发器所在的滚动容器或弹窗容器内，而不是全局 `document.body`。

如果业务中必须使用 `appendToBody + gpuAcceleration:false + absolute top/left`，需要接受它在 shadowRoot 微前端环境中无法完全透明兼容的风险。

## 总结

无界中弹层问题可以拆成两类：

1. 计算基准问题：`documentElement.getBoundingClientRect()` 带宿主偏移。  
   适合用 `shadowRoot.firstElementChild.getBoundingClientRect` 窄补丁修复。

2. 定位和滚动语义问题：`absolute top/left` 的 containing block、append target、scroll target 不一致。  
   这类问题不能只靠修 rect 解决，需要组件库配置或业务适配。

最稳的整体策略是：

- Core 修标准库依赖的几何基准。
- 业务侧适配老组件库弹层策略。
- 不在 core 中做大范围 document/body/offsetParent 魔改，避免在普通页面、fixed 弹窗、内部滚动、外部滚动之间互相破坏。

# Popper / Floating UI 在无界 Shadow DOM 中的支持排查记录

## 背景

本次排查目标是确认无界 `webcomponent + shadowRoot` 场景下，常见弹层库的定位表现：

- `Popper.js 1.x`
- `Popper.js 2.x / @popperjs/core`
- `Floating UI`
- Element UI 内部封装的 `element-ui/lib/utils/popper.js`

调试页面包含两类环境：

- 主应用独立页面：内容被 Web Component 包裹，运行在原生 `shadowRoot` 内。
- Vue2 子应用页面：不额外套 Web Component，直接在无界子应用的 `shadowRoot` 内渲染普通 Vue 内容。

页面和 dialog 场景都做了对比，并尽量移除了会干扰定位调试的 `position: relative`。

## 标准 Popper / Floating UI 的偏移问题

初始现象：

- 主应用 Web Component 中定位正常。
- 无界 Vue2 子应用中，`Popper.js 1.x`、`Popper.js 2.x`、`Floating UI` 都出现过弹层偏移。
- dialog 场景中表现更容易正常，因为 fixed 容器改变了定位参照。

根因链路：

- 无界中 `document.documentElement` 被代理为 `shadowRoot.firstElementChild`。
- 这个 `<html>` 真实存在于主应用 DOM 的 shadowRoot 内。
- 它的 `getBoundingClientRect()` 会带上宿主容器相对 viewport 的偏移。
- Popper/Floating 会读取 `element.ownerDocument.documentElement.getBoundingClientRect()` 作为计算基准。
- 因此拿到的 documentElement rect 本身带偏移，导致最终弹层坐标偏移。

## 可行的 Core 窄补丁

不要替换 `document.documentElement` 返回的对象，否则会破坏无界现有 document 代理语义。

不推荐：

```ts
if (propKey === "documentElement") return iframe.contentDocument.documentElement;
if (propKey === "scrollingElement") return iframe.contentDocument.scrollingElement;
```

这个方向验证时会导致页面死循环或路由/查询链路异常。

更安全的补丁是在 `packages/wujie-core/src/shadow.ts` 中，仅修正 `shadowRoot.firstElementChild` 的几何读数：

```ts
Object.defineProperty(shadowRoot.firstElementChild, "getBoundingClientRect", {
  enumerable: true,
  configurable: true,
  value: () =>
    iframeWindow.__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__.call(iframeWindow.document, "html").getBoundingClientRect(),
});
```

这个补丁保持：

- `document.documentElement === shadowRoot.firstElementChild`
- `document.documentElement` 仍然是无界 shadowRoot 内的 `<html>`
- 只有 `documentElement.getBoundingClientRect()` 改为使用 iframe 原生空白文档 `<html>` 的 0 基准 rect

验证结果：

- `Popper.js 1.x` 初始定位正常。
- `Popper.js 2.x / @popperjs/core` 初始定位正常。
- `Floating UI` 初始定位正常。
- dialog 场景正常。
- 如果库本身会监听滚动并 update，滚动时也正常。

## 不稳定的方案

### 直接替换 documentElement / scrollingElement

直接在 `proxy.ts` 中返回 iframe 原生 `documentElement` 或 `scrollingElement` 会破坏无界内部对 document 的代理假设，验证时出现过页面死循环。

### 取消 getBoundingClientRect 补丁并给 body 加 position: relative

这个方案在普通页面中可能看起来可行：

- `absolute top/left` 相对 shadow body。
- body 自身带有宿主偏移。
- 计算偏移和 body 偏移互相抵消。

但 fixed dialog 场景会再次失败：

- reference 在 fixed 坐标系。
- popper 仍相对 body。
- 两者坐标系不同，位置会算不准。

因此它只是局部抵消，不是稳定修复。

## Element UI 封装的特殊问题

Element UI 使用的 `element-ui/lib/utils/popper.js` 不是项目中 `popper.js@1.16.1` 的现代源码，而是 Element UI 内置/改造过的老 Popper 实现。

关键差异之一是 Element UI 默认关闭 GPU transform：

```js
popperOptions: {
  default() {
    return {
      gpuAcceleration: false
    };
  }
}
```

因此它通常只写：

```css
position: absolute;
top: ...;
left: ...;
```

不会写：

```css
transform: translate3d(...);
```

这让它高度依赖普通 document 中的 `absolute + body/document` 滚动语义。

在无界 shadowRoot 中，`document.body`、`document.documentElement`、`window`、真实滚动容器、弹层 append 目标之间存在代理关系，不一定等价于浏览器原生 document。于是 Element UI 这种组合很容易出现：

- 初始位置能算对。
- 滚动后不更新。
- 或者更新了但相对的 containing block 不符合预期。

## 滚动问题的判断

标准 Popper/Floating demo 正常滚动，并不代表 Element UI 一定正常，因为 demo 中通常满足至少一个条件：

- 库自己会监听正确的 scroll parent。
- 库会持续 update。
- 库使用 `transform: translate3d(...)` 写入位置。
- 调试代码里手动监听了滚动并调用 update。

Element UI 的老封装则常见组合是：

- `appendToBody: true`
- `gpuAcceleration: false`
- `position: absolute`
- `top/left`
- 自己封装的 scroll parent 发现逻辑

这组组合在无界 shadowRoot 内很难做到完全透明兼容。

## 推荐落地策略

### Core 层

可以保留 `shadowRoot.firstElementChild.getBoundingClientRect` 的窄补丁，用于修复标准 Popper/Floating 读取 `documentElement.getBoundingClientRect()` 时拿到宿主偏移的问题。

不建议继续在 core 中全局改：

- `documentElement` 的返回对象
- `scrollingElement` 的返回对象
- `body` 的 `position`
- 通用 `offsetParent`
- 全局 absolute 坐标规则

这些补丁很容易在普通页面、dialog、内部滚动、外部滚动之间互相冲突。

### 业务 / 组件库适配层

对于 Element UI 这类老组件库，优先使用业务侧配置规避：

```vue
<el-select :popper-append-to-body="false" />
```

或在支持 `popper-options` 的组件中开启 transform：

```js
{
  gpuAcceleration: true;
}
```

如果组件支持自定义弹层容器，优先把弹层挂到触发器所在的滚动容器或 dialog 容器内，而不是全局 `document.body`。

## 结论

无界 core 可以稳定修复的是标准库依赖 `documentElement.getBoundingClientRect()` 导致的初始坐标偏移。

但 Element UI 老 Popper 的 `appendToBody + gpuAcceleration:false + absolute top/left` 组合，本质依赖普通 document 的滚动和 containing block 语义。在 shadowRoot 微前端环境中，很难由框架层做到 100% 透明兼容。

推荐结论：

- Core 保留最窄几何补丁。
- 标准 Popper/Floating 走框架兼容。
- Element UI 老封装走业务侧配置或组件库适配。
