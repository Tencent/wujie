无界支持应用嵌套，嵌套的应用和正常应用一致，支持预加载、保活、路由同步、通信等能力

[bus](/api/bus.html#bus) 可以在所有应用（包括嵌套子应用）中进行去中心化的通信，[destroyApp](/api/destroyApp.html#destroyapp) 可以销毁任何子应用（包括嵌套子应用）

::: warning 警告
嵌套的应用的 name 原则上也应该保持唯一性，除非用户想复用已经渲染的子应用
:::
