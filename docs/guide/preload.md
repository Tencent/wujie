# 预加载

::: tip
预加载能力可以极大的提升子应用打开的首屏时间
:::
## 预加载

预加载指的是在应用空闲的时候`requestIdleCallback`将所需要的静态资源提前从网络中加载到内存中，详见[preloadApp](/api/preloadApp.html)

## 预执行

预执行指的是在应用空闲的时候将子应用提前渲染出来，可以进一步提升子应用打开时间

只需要在`preloadApp`中将 [exec](/api/preloadApp.html#exec) 设置为`true`即可

由于子应用提前渲染可能会导致阻塞主应用的线程，所以无界提供了类似 [react-fiber](https://github.com/acdlite/react-fiber-architecture) 方式来防止阻塞线程，详见 [fiber](/api/startApp.html#fiber)
