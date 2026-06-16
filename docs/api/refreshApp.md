# refreshApp

- **类型：** `Function`

- **参数：** `startOptions`（与 [startApp](/api/startApp.html) 相同）

- **返回值：** `Promise<Function | void>`

主动刷新子应用：先调用 [destroyApp](/api/destroyApp.html) 销毁当前实例，再以传入配置调用 [startApp](/api/startApp.html) 全量重建。内部会等待 `destroyApp` 完成后再 `startApp`，避免销毁未结束就重启导致的竞态问题。

等价于手动串联 `destroyApp(name)` + `startApp(startOptions)`，由框架保证调用顺序。

::: tip 使用场景

- 子应用处于 [重建模式](/guide/mode.html#重建模式)，需要强制全量重建以清空状态、重新加载资源
- 子应用代码或静态资源已更新，需要销毁旧实例后重新拉取
- 使用 Vue / React 组件封装时，也可通过组件 ref 调用 [refresh()](/pack/#refresh)，**无需传参**，自动复用组件当前 props 全量重建

:::

::: warning 注意

- 刷新会销毁当前子应用实例，承载子应用的 `iframe` 和 `shadowRoot` 都会被销毁，过程中可能出现短暂白屏
- `name`、`replace`、`fetch`、`alive`、`degrade` 等参数须与首次 `startApp` 保持一致，否则渲染可能出现异常
- 若子应用后续还会被打开，一般无需主动刷新；仅在需要强制重建时使用

:::

## 示例

```javascript
import { refreshApp } from "wujie";

await refreshApp({
  name: "vue3",
  url: "https://xxx.com/",
  el: document.querySelector("#container"),
});
```

使用 Vue / React 组件封装时：

```javascript
// 静态方法 refreshApp，参数与 startApp 相同
import WujieVue from "wujie-vue3";
await WujieVue.refreshApp({ name: "vue3", url: "...", el: "..." });

// 组件实例方法 refresh()，无需传参，自动复用组件当前 props 全量重建
await this.$refs.wujie.refresh();
```
