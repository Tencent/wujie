---
sidebarDepth: 2
collapsable: false
---

# 运行模式

![无界流程图.jpeg](https://vfiles.gtimg.cn/wuji_dashboard/xy/test_wuji_damy/F0NYfpHl.jpeg)

在微前端框架中，子应用放置在主应用页面中随着主应用页面的打开和关闭反复的激活和销毁，而在无界微前端框架中子应用是否保活以及是否进行生命周期的改造会进入完全不同的处理流程

## 保活模式

子应用的 [alive](/api/startApp.html#alive) 设置为`true`时进入保活模式，内部的数据和路由的状态不会随着页面切换而丢失。

在保活模式下，子应用只会进行一次渲染，页面发生切换时承载子应用`dom`的`webcomponent`会保留在内存中，当子应用重新激活时无界会将内存中的`webcomponent`从新挂载到容器上

保活模式下改变 [url](/api/startApp.html#url) 子应用的路由不会发生变化，需要采用 [通信](/guide/communication.html) 的方式对子应用路由进行跳转

::: warning 注意

保活的子应用的实例不会销毁，子应用被切走了也可以响应 bus 事件，非保活的子应用切走了监听的事件也会全部销毁，需要等下次重新 mount 后重新监听。

:::

## 单例模式

子应用的`alive`为`false`且进行了[生命周期改造](/guide/start.html#生命周期改造)时进入单例模式。

子应用页面如果切走，会调用`window.__WUJIE_UNMOUNT`销毁子应用当前实例，子应用页面如果切换回来,会调用`window.__WUJIE_MOUNT`渲染子应用新的子应用实例

在单例式下，改变 [url](/api/startApp.html#url) 子应用的路由会发生跳转到对应路由

如果主应用上有多个菜单栏用到了子应用的不同页面，在每个页面启动该子应用的时候将`name`设置为同一个，这样可以共享一个`wujie`实例，承载子应用`js`的`iframe`也实现了共享，不同页面子应用的`url`不同，切换这个子应用的过程相当于：销毁当前应用实例 => 同步新路由 => 创建新应用实例

## 重建模式

子应既没有设置为保活模式，也没有进行生命周期的改造则进入了重建模式，每次页面切换不仅会销毁承载子应用`dom`的`webcomponent`，还会销毁承载子应用`js`的`iframe`，相应的`wujie`实例和子应用实例都会被销毁

重建模式下改变 [url](/api/startApp.html#url) 子应用的路由会跳转对应路由，但是在 [路由同步](/guide/sync.html) 场景并且子应用的路由同步参数已经同步到主应用`url`上时则无法生效，因为改变`url`后会导致子应用销毁重新渲染，此时如果有同步参数则同步参数的优先级最高