---
sidebarDepth: 2
---

# 微前端是什么

微前端是一种多个团队通过独立发布功能的方式来共同构建现代化 web 应用的技术手段及方法策略。

::: tip 引用
Techniques, strategies and recipes for building a modern web app with multiple teams that can ship features independently. -- [Micro Frontends](https://micro-frontends.org/)
:::

通俗来说，就是在一个`web`应用中可以独立的运行另一个`web`应用

微前端有什么使用场景呢？

::: tip 举例

- 比如制作一个企业管理平台，把已有的采购系统和财务系统统一接入这个平台；

- 比如有一个巨大的应用，为了降低开发和维护成本，分拆成多个小应用进行开发和部署，然后用一个平台将这些小应用集成起来；

- 又比如一个应用使用`vue`框架开发，其中有一个比较独立的模块，开发者想尝试使用`react`框架来开发，等模块单独开发部署完，再把这个模块应用接回去

:::

一个完善的的微前端框架应该具备哪些能力呢？

::: tip 能力

- **子应用的加载和卸载能力**

  页面需要从一个子应用切换到另一个子应用，框架必须具备加载、渲染、切换的能力

- **子应用独立运行的能力**

  子应用运行会污染全局的 window 对象，样式会污染其他应用，必须有效的隔离起来

- **子应用路由状态保持能力**

  激活子应用后，浏览器刷新、前进、后退子应用的路由都应该可以正常工作

- **应用间通信的能力**

  应用间可以方便、快捷的通信
  :::

使用微前端有什么收益呢？([@reference 乾坤](https://qiankun.umijs.org/zh/guide))

::: tip 收益

- **技术栈无关**

  主框架不限制接入应用的技术栈，微应用具备完全自主权

- **独立开发、独立部署**

  微应用仓库独立，前后端可独立开发，部署完成后主框架自动完成同步更新

- **增量升级**

  在面对各种复杂场景时，我们通常很难对一个已经存在的系统做全量的技术栈升级或重构，而微前端是一种非常好的实施渐进式重构的手段和策略

- **独立运行时**

  每个微应用之间状态隔离，运行时状态不共享
  :::

可能有人会有疑问直接使用`iframe`不就可以做到吗？

## iframe 方案

采用`iframe`的方案确实可以做到，而且优点非常明显

::: tip 优点

- 非常简单，使用没有任何心智负担
- `web`应用隔离的非常完美，无论是`js`、`css`、`dom`都完全隔离开来
  :::

由于其**隔离的太完美**导致缺点也非常明显
::: danger 缺点

- 路由状态丢失，刷新一下，`iframe`的`url`状态就丢失了
- `dom`割裂严重，弹窗只能在`iframe`内部展示，无法覆盖全局
- `web`应用之间通信非常困难
- 每次打开白屏时间太长，对于[SPA 应用](https://zh.wikipedia.org/wiki/%E5%8D%95%E9%A1%B5%E5%BA%94%E7%94%A8)来说无法接受
  :::

## single-spa 方案

[single-spa](https://zh-hans.single-spa.js.org/docs/getting-started-overview)是一个目前主流的微前端技术方案，其主要实现思路：

- 预先注册子应用(激活路由、子应用资源、生命周期函数)
- 监听路由的变化，匹配到了激活的路由则加载子应用资源，顺序调用生命周期函数并最终渲染到容器

[乾坤](https://qiankun.umijs.org/zh/guide)微前端架构则进一步对`single-spa`方案进行完善，主要的完善点：

- 子应用资源由 js 列表修改进为一个`url`，大大减轻注册子应用的复杂度
- 实现应用隔离，完成`js`隔离方案 _（`window`工厂）_ 和`css`隔离方案 _（类`vue`的`scoped`）_
- 增加资源预加载能力，预先子应用`html`、`js`、`css`资源缓存下来，加快子应用的打开速度

总结一下方案的优缺点：

::: tip 优点

- 监听路由自动的加载、卸载当前路由对应的子应用
- 完备的沙箱方案，`js`沙箱做了`SnapshotSandbox`、`LegacySandbox`、`ProxySandbox`三套渐进增强方案，`css`沙箱做了两套`strictStyleIsolation`、`experimentalStyleIsolation`两套适用不同场景的方案
- 路由保持，浏览器刷新、前进、后退，都可以作用到子应用
- 应用间通信简单，全局注入
  :::

::: danger 缺点

- 基于路由匹配，无法同时激活多个子应用，也不支持子应用保活
- 改造成本较大，从 `webpack`、代码、路由等等都要做一系列的适配
- `css` 沙箱无法绝对的隔离，`js` 沙箱在某些场景下执行性能下降严重
- 无法支持 `vite` 等 `ESM` 脚本运行
  :::

## 无界方案

在乾坤的`issue`中一个[议题](https://github.com/umijs/qiankun/issues/286)非常有意思，有个开发者提出能否利用`iframe`来实现`js`沙箱能力，这个`idea`启发了无界方案，下面详细介绍

### 应用加载机制和 js 沙箱机制

将子应用的`js`注入主应用同域的`iframe`中运行，`iframe`是一个原生的`window`沙箱，内部有完整的`history`和`location`接口，子应用实例`instance`运行在`iframe`中，路由也彻底和主应用解耦，可以直接在业务组件里面启动应用。

采用这种方式我们可以获得
::: tip 收益

- **组件方式来使用微前端**

  不用注册，不用改造路由，直接使用无界组件，化繁为简

- **一个页面可以同时激活多个子应用**

  子应用采用 iframe 的路由，不用关心路由占用的问题

- **天然 js 沙箱，不会污染主应用环境**

  不用修改主应用`window`任何属性，只在`iframe`内部进行修改

- **应用切换没有清理成本**

  由于不污染主应用，子应用销毁也无需做任何清理工作
  :::

### 路由同步机制

在`iframe`内部进行`history.pushState`，浏览器会自动的在[joint session history](https://html.spec.whatwg.org/multipage/history.html#joint-session-history)中添加`iframe`的[session-history](https://html.spec.whatwg.org/multipage/history.html#session-history)，浏览器的前进、后退在不做任何处理的情况就可以直接作用于子应用

劫持`iframe`的`history.pushState`和`history.replaceState`，就可以将子应用的`url`同步到主应用的`query`参数上，当刷新浏览器初始化`iframe`时，读回子应用的`url`并使用`iframe`的`history.replaceState`进行同步

采用这种方式我们可以获得

::: tip 收益

- **浏览器刷新、前进、后退都可以作用到子应用**
- **实现成本低，无需复杂的监听来处理同步问题**
- **多应用同时激活时也能保持路由同步**

:::

### iframe 连接机制和 css 沙箱机制

无界采用[webcomponent](https://developer.mozilla.org/en-US/docs/Web/Web_Components)来实现页面的样式隔离，无界会创建一个`wujie`自定义元素，然后将子应用的完整结构渲染在内部

子应用的实例`instance`在`iframe`内运行，`dom`在主应用容器下的`webcomponent`内，通过代理 `iframe`的`document`到`webcomponent`，可以实现两者的互联。

将`document`的查询类接口：`getElementsByTagName、getElementsByClassName、getElementsByName、getElementById、querySelector、querySelectorAll、head、body`全部代理到`webcomponent`，这样`instance`和`webcomponent`就精准的链接起来。

当子应用发生切换，`iframe`保留下来，子应用的容器可能销毁，但`webcomponent`依然可以选择保留，这样等应用切换回来将`webcomponent`再挂载回容器上，子应用可以获得类似`vue`的`keep-alive`的能力.

采用这种方式我们可以获得

::: tip 收益

- **天然 css 沙箱**

  直接物理隔离，样式隔离子应用不用做任何修改

- **天然适配弹窗问题**

  `document.body`的`appendChild`或者`insertBefore`会代理直接插入到`webcomponent`，子应用不用做任何改造

- **子应用保活**

  子应用保留`iframe`和`webcomponent`，应用内部的`state`不会丢失

- **完整的 DOM 结构**

  `webcomponent`保留了子应用完整的`html`结构，样式和结构完全对应，子应用不用做任何修改
  :::

### 通信机制

承载子应用的`iframe`和主应用是同域的，所以主、子应用天然就可以很好的进行通信，在无界我们提供三种通信方式

- **props 注入机制**

子应用通过`$wujie.props`可以轻松拿到主应用注入的数据

- **window.parent 通信机制**

子应用`iframe`沙箱和主应用同源，子应用可以直接通过`window.parent`和主应用通信

- **去中心化的通信机制**

无界提供了`EventBus`实例，注入到主应用和子应用，所有的应用可以去中心化的进行通信
### 优势

通过上面原理的阐述，我们可以得出无界微前端框架的几点优势：
::: tip 优势

- **多应用同时激活在线**

  框架具备同时激活多应用，并保持这些应用路由同步的能力

- **组件式的使用方式**

  无需注册，更无需路由适配，在组件内使用，跟随组件装载、卸载

- **应用级别的 keep-alive**

  子应用开启[保活模式](/api/startApp.html#alive)后，应用发生切换时整个子应用的状态可以保存下来不丢失，结合[预执行模式](/api/preloadApp.html#exec)可以获得类似`ssr`的打开体验

- **纯净无污染**

  - 无界利用`iframe`和`webcomponent`来搭建天然的`js`隔离沙箱和`css`隔离沙箱
  - 利用`iframe`的`history`和主应用的`history`在同一个[top-level browsing context](https://html.spec.whatwg.org/multipage/browsers.html#top-level-browsing-context)来搭建天然的路由同步机制
  - 副作用局限在沙箱内部，子应用切换无需任何清理工作，没有额外的切换成本

- **性能和体积兼具**

  - 子应用执行性能和原生一致，子应用实例`instance`运行在`iframe`的`window`上下文中，避免`with(proxyWindow){code}`这样指定代码执行上下文导致的性能下降，但是多了实例化`iframe`的一次性的开销，可以通过 [proload](/api/preloadApp.html) 提前实例化
  - 体积比较轻量，借助`iframe`和`webcomponent`来实现沙箱，有效的减小了代码量

- **开箱即用**

  不管是样式的兼容、路由的处理、弹窗的处理、热更新的加载，子应用完成接入即可开箱即用无需额外处理，应用[接入成本](./start.html#子应用改造)也极低
  :::
