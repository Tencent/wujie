
# 生命周期

::: tip 提示
无界提供一整套的生命周期钩子供开发者调用
:::

::: warning 警告
如果子应用没有做[生命周期的改造](/guide/start.html#生命周期改造)，那么 beforeMount、afterMount、beforeUnmount、afterUnmount 这四个生命周期将不会调用
:::

## beforeLoad

- 类型： `type lifecycle = (appWindow: Window) => any;`

子应用开始加载静态资源前触发

## beforeMount

- 类型： `type lifecycle = (appWindow: Window) => any;`

子应用渲染（调用`window.__WUJIE_MOUNT`）前触发

## afterMount

- 类型： `type lifecycle = (appWindow: Window) => any;`

子应用渲染（调用`window.__WUJIE_MOUNT`）后触发

## beforeUnmount

- 类型： `type lifecycle = (appWindow: Window) => any;`

子应用卸载（调用`window.__WUJIE_UNMOUNT`）前触发

## afterUnmount

- 类型： `type lifecycle = (appWindow: Window) => any;`

子应用卸载（调用`window.__WUJIE_UNMOUNT`）后触发

## activated

- 类型： `type lifecycle = (appWindow: Window) => any;`

子应用[保活模式](/api/startApp.html#alive)下，进入时触发

## deactivated

- 类型： `type lifecycle = (appWindow: Window) => any;`

子应用[保活模式](/api/startApp.html#alive)下，离开时触发

## loadError

- 类型： `type loadErrorHandler = (url: string, e: Error) => any;`

子应用加载资源失败后触发
