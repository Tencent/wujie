# 降级处理

无界提供无感知的降级方案

在非降级场景下，子应用的`dom`在`webcomponent`中，运行环境在`iframe`中，`iframe`对`dom`的操作通过`proxy`来代理到`webcomponent`上，而`webcomponent`和`proxy` `IE`都无法支持，这里采用另一个的`iframe`替换`webcomponent`，用`Object.defineProperty`替换`proxy`来做代理的方案

::: warning 注意

无界并没有对 es6 代码进行 polyfill，因为每个用户对浏览器的兼容程度是不一样的引入的 polyfill 也不一致，如果需要在较低版本的浏览器中运行，需要用户自行 通过 babel 来添加 polyfill。

:::
## 优点

1. 降级的行为由框架判断，当浏览器不支持时自动降级

2. 降级后，应用之间也保证了绝对的隔离度

3. 代码无需做任何改动，之前的预加载、保活还有通信的代码都生效，用户不需要为了降级做额外的代码改动导致降级前后运行的代码不一致

4. 用户也可以强制降级，比如说当前浏览器对 webcomponent 和 proxy 是支持的，但是用户还是想将 dom 运行在 iframe 中，就可以将 [degrade](/api/startApp.html#degrade) 设置为 true

## 缺点

1. 弹窗只能在子应用内部

2. 由于无法使用`proxy`，无法劫持子应用的`location`，导致访问`window.location.host`的时候拿到的是主应用的`host`，子应用可以从 [$wujie.location](/api/wujie.html#wujie-location) 中拿到子应用正确的`host`
