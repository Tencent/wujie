---
sidebarDepth: 2
collapsable: false
---

## 主应用

### 引入

```javascript
import { bus, preloadApp, startApp, destroyApp } from "wujie";
```

::: tip 提示
如果主应用是`vue`框架可直接使用 [wujie-vue](/pack/)，`react`框架可直接使用 [wujie-react](/pack/react.html)
:::

### 预加载

```javascript
preloadApp({ name: "唯一id", url: "子应用地址", exec: true });
```

### 启动子应用

```javascript
startApp({ name: "唯一id", url: "子应用地址", el: "容器", sync: true }
```

## 子应用改造

无界对子应用的侵入非常小，在满足跨域条件下子应用可以不用改造。

### 前提

子应用的资源和接口的请求都在主域名发起，所以会有跨域问题，子应用必须做[cors 设置](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)

```javascript
app.use((req, res, next) => {
  // 路径判断等等
  res.set({
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Headers": "X-Requested-With,Content-Type",
    "Access-Control-Allow-Methods": "PUT,POST,GET,DELETE,OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  });
  // 其他操作
});
```

### 生命周期改造

::: tip 提示

[`startApp`](/api/startApp)如果使用[保活模式](/api/startApp.html#alive)，子应用不需要进行生命周期改造

:::

改造入口函数：

- 将实例的创建渲染挂载到`window.__WUJIE_MOUNT`函数上
- 将实例的销毁挂载到`window.__WUJIE_UNMOUNT`上

如果子应用的实例化是在异步函数中进行的，在定义完生命周期函数后，请务必主动调用无界的渲染函数 `window.__WUJIE.mount()`（见 vite 示例）

具体操作可以参考下面示例

:::: tabs
::: tab vue2

```javascript
if (window.__POWERED_BY_WUJIE__) {
  let instance;
  window.__WUJIE_MOUNT = () => {
    instance = new Vue({ router, render: (h) => h(App) }).$mount("#app");
  };
  window.__WUJIE_UNMOUNT = () => {
    instance.$destroy();
  };
} else {
  new Vue({ router, render: (h) => h(App) }).$mount("#app");
}
```

:::
::: tab vue3

```javascript
if (window.__POWERED_BY_WUJIE__) {
  let instance;
  window.__WUJIE_MOUNT = () => {
    instance = createApp(App);
    instance.use(router);
    instance.mount("#app");
    /*
      vue-router 4.x版本会保留之前路径，需要重置到当前路径
      各个业务需要自行处理，包括查询参数等等
    */
    router.replace({ path: "/xxx" });
  };
  window.__WUJIE_UNMOUNT = () => {
    instance.unmount();
  };
} else {
  createApp(App).use(router).mount("#app");
}
```

:::
::: tab vite

```javascript
declare global {
  interface Window {
    // 是否存在无界
    __POWERED_BY_WUJIE__?: boolean;
    // 子应用mount函数
    __WUJIE_MOUNT: () => void;
    // 子应用unmount函数
    __WUJIE_UNMOUNT: () => void;
    // 子应用无界实例
    __WUJIE: { mount: () => void };
  }
}

if (window.__POWERED_BY_WUJIE__) {
  let instance: any;
  window.__WUJIE_MOUNT = () => {
    instance = createApp(App)
    instance.use(router);
    instance.mount("#app");
    /*
      vue-router 4.x版本会保留之前路径，需要重置到当前路径
      各个业务需要自行处理，包括查询参数等等
    */
    router.replace({path: '/xxx'});
  };
  window.__WUJIE_UNMOUNT = () => {
    instance.unmount();
  };
  /*
    由于vite是异步加载，而无界可能采用fiber执行机制
    所以mount的调用时机无法确认，框架调用时可能vite
    还没有加载回来，这里采用主动调用防止用没有mount
    无界mount函数内置标记，不用担心重复mount
  */
  window.__WUJIE.mount()
} else {
  createApp(App).use(router).mount("#app");
}

```

:::
::: tab react

```javascript
if (window.__POWERED_BY_WUJIE__) {
  window.__WUJIE_MOUNT = () => {
    ReactDOM.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
      document.getElementById("root")
    );
  };
  window.__WUJIE_UNMOUNT = () => {
    ReactDOM.unmountComponentAtNode(document.getElementById("root"));
  };
} else {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById("root")
  );
}
```

:::
::: tab angular

```typescript
declare global {
  interface Window {
    // 是否存在无界
    __POWERED_BY_WUJIE__?: boolean;
    // 子应用mount函数
    __WUJIE_MOUNT: () => void;
    // 子应用unmount函数
    __WUJIE_UNMOUNT: () => void;
  }
}

if (window.__POWERED_BY_WUJIE__) {
  let instance: any;
  window.__WUJIE_MOUNT = async () => {
    instance = await platformBrowserDynamic().bootstrapModule(AppModule);
  };
  window.__WUJIE_UNMOUNT = () => {
    instance.destroy?.();
  };
} else {
  platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));
}
```

:::
::::

### 其他

对于非`webpack`打包的老项目，无需做任何改造但是子应用切换可能出现白屏问题

::: warning 注意

- [`startApp`](/api/startApp.html)请尽量使用`alive`模式，不使用`alive`应用切换时会出现白屏时间
  :::
