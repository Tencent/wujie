# preloadApp

- **类型：** `Function`

- **参数：** `preOption`

```typescript
type lifecycle = (appWindow: Window) => any;
type loadErrorHandler = (url: string, e: Error) => any;

type preOptions  {
  /** 唯一性用户必须保证 */
  name: string;
  /** 需要渲染的url */
  url: string;
  /** 注入给子应用的数据 */
  props?: { [key: string]: any };
  /** 自定义iframe属性 */
  attrs?: { [key: string]: any };
  /** 代码替换钩子 */
  replace?: (code: string) => string;
  /** 自定义fetch，资源和接口 */
  fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  /** 子应用保活模式，state不会丢失 */
  alive?: boolean;
  /** 预执行模式 */
  exec?: boolean;
  /** js采用fiber模式执行 */
  fiber?: boolean;
  /** 子应用采用降级iframe方案 */
  degrade?: boolean;
  /** 子应插件 */
  plugins: Array<plugin>;
  /** 子应用生命周期 */
  beforeLoad?: lifecycle;
  /** 没有做生命周期改造的子应用不会调用 */
  beforeMount?: lifecycle;
  afterMount?: lifecycle;
  beforeUnmount?: lifecycle;
  afterUnmount?: lifecycle;
  /** 非保活应用不会调用 */
  activated?: lifecycle;
  deactivated?: lifecycle;
  /** 子应用资源加载失败后调用 */
  loadError?: loadErrorHandler
};

```

- **详情：** 预加载可以极大的提升子应用首次打开速度

  ::: warning 警告

  - 资源的预加载会占用主应用的网络线程池
  - 资源的预执行会阻塞主应用的渲染线程
  - `name`、`replace`、`fetch`、`alive`、`degrade`这五个参数在`preloadApp`和`startApp`中须保持严格一致，否则子应用的渲染可能出现异常
    :::

## name

- **类型：** `String`

- **详情：** 子应用唯一标识符

  ::: tip 技巧
  如果主应用上有多个菜单栏用到了子应用的不同页面，在每个页面启动该子应用的时候建议将 name 设置为同一个，这样可以共享一个实例
  :::

## url

- **类型：** `String`

- **详情：** 子应用的路径地址

## props

- **类型：** `{ [key: string]: any }`

- **详情：** 注入给子应用的数据

  ::: warning 警告
  `exec`为`true`此时子应用代码会预执行，如果子应用运行依赖`props`的数据则须传入`props`或者子应用做好兼容`props`不存在，否则子应用运行可能报错
  :::

## attrs

- **类型：** `{ [key: string]: any }`

- **详情：** 自定义`iframe`属性，子应用运行在`iframe`内，`attrs`可以允许用户自定义`iframe`的属性

## replace

- **类型：** `(codeText: string) => string`

- **详情：** 全局代码替换钩子

  ::: tip 技巧
  `replace`函数可以在运行时处理子应用的代码，如果子应用不方便修改代码，可以在这里进行代码替换，子应用的`html`、`js`、`css`代码均会做替换
  :::

## fetch

- **类型：** `(input: RequestInfo, init?: RequestInit) => Promise<Response>`

- **详情：**
  自定义 fetch，添加自定义`fetch`后，子应用的静态资源请求和采用了 `fetch` 的接口请求全部会走自定义`fetch`

  ::: tip 技巧
  对于需要携带 cookie 的请求，可以采用自定义 `fetch` 方式实现：`(url, options) => window.fetch(url, { ...options, credentials: "include" })`
  :::

## alive

- **默认值：** `false`

- **类型：** `Boolean`

- **详情：**

  保活模式，子应用实例`instance`和`webcomponent`都不会销毁，子应用的状态和路由都不会丢失，切换子应用只是对`webcomponent`和容器的热插拔

  如果子应用不想做生命周期改造，子应用切换又不想有白屏时间，可以采用保活模式

  如果主应用上有多个菜单栏跳转到子应用的不同页面，此时不建议采用保活模式。因为子应用在保活状态下`startApp`无法更改子应用路由，不同菜单栏无法跳转到指定子应用路由，推荐[单例模式](/guide/mode.html#单例模式)

  ::: tip 技巧
  [预执行模式](/api/preloadApp.html#exec)结合保活模式可以实现类似`ssr`的效果，包括页面数据的请求和渲染全部提前完成，用户可以瞬间打开子应用
  :::

## exec

- **默认值：** `false`

- **类型：** `Boolean`

- **详情：** 预执行模式，为`false`时只会预加载子应用的资源，为`true`时会预执行子应用代码，极大的加快子应用打开速度

## fiber

- **默认值：** `true`

- **类型：** `Boolean`

- **详情：**

  js 的执行模式，由于子应用的执行会阻塞主应用的渲染线程，当设置为`true`时`js`采取类似`react fiber`的模式方式间断执行，每个 js 文件的执行都包裹在`requestidlecallback`中，每执行一个`js`可以返回响应外部的输入，但是这个颗粒度是`js`文件，如果子应用单个`js`文件过大，可以通过拆包的方式降低达到`fiber`模式效益最大化

  ::: tip 技巧

  - 打开主应用就需要加载的子应用可以将`fiber`设置为`false`来加快加载速度

  - 其他场景建议采用默认值

  :::

## degrade

- **默认值：** `false`

- **类型：** `Boolean`

- **详情：**

  主动降级设置，无界方案采用了`proxy`和`webcomponent`等技术，在有些浏览器上可能出现不兼容的情况，此时无界会自动进行降级，采用一个的`iframe`替换`webcomponent`，用`Object.defineProperty`替换`proxy`，理论上可以兼容到 IE 9，但是用户也可以将`degrade`设置为`true`来主动降级

  ::: warning 警告
  一旦采用降级方案，弹窗由于在 iframe 内部将无法覆盖整个应用
  :::

## plugins

- **类型：** `Array<plugin>`

```typescript
interface ScriptObjectLoader {
  /** 脚本地址，内联为空 */
  src?: string;
  /** 脚本是否为module模块 */
  module?: boolean;
  /** 脚本是否为async执行 */
  async?: boolean;
  /** 脚本是否设置crossorigin */
  crossorigin?: boolean;
  /** 脚本crossorigin的类型 */
  crossoriginType?: "anonymous" | "use-credentials" | "";
  /** 内联script的代码 */
  content?: string;
  /** 执行回调钩子 */
  callback?: (appWindow: Window) => any;
}

interface StyleObjectLoader {
  /** 样式地址， 内联为空 */
  src?: string;
  /** 样式代码 */
  content?: string;
}

type eventListenerHook = (
  iframeWindow: Window,
  type: string,
  handler: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
) => void;

interface plugin {
  /** 处理html的loader */
  htmlLoader?: (code: string) => string;
  /** js排除列表 */
  jsExcludes?: Array<string | RegExp>;
  /** js忽略列表 */
  jsIgnores?: Array<string | RegExp>;
  /** 处理js加载前的loader */
  jsBeforeLoaders?: Array<ScriptObjectLoader>;
  /** 处理js的loader */
  jsLoader?: (code: string, url: string, base: string) => string;
  /** 处理js加载后的loader */
  jsAfterLoaders?: Array<ScriptObjectLoader>;
  /** css排除列表 */
  cssExcludes?: Array<string | RegExp>;
  /** css忽略列表 */
  cssIgnores?: Array<string | RegExp>;
  /** 处理css加载前的loader */
  cssBeforeLoaders?: Array<StyleObject>;
  /** 处理css的loader */
  cssLoader?: (code: string, url: string, base: string) => string;
  /** 处理css加载后的loader */
  cssAfterLoaders?: Array<StyleObject>;
  /** 子应用 window addEventListener 钩子回调 */
  windowAddEventListenerHook?: eventListenerHook;
  /** 子应用 window removeEventListener 钩子回调 */
  windowRemoveEventListenerHook?: eventListenerHook;
  /** 子应用 document addEventListener 钩子回调 */
  documentAddEventListenerHook?: eventListenerHook;
  /** 子应用 document removeEventListener 钩子回调 */
  documentRemoveEventListenerHook?: eventListenerHook;
  /** 用户自定义覆盖子应用 window 属性 */
  windowPropertyOverride?: (iframeWindow: Window) => void;
  /** 用户自定义覆盖子应用 document 属性 */
  documentPropertyOverride?: (iframeWindow: Window) => void;
}
```

- **详情：** 无界插件，在运行时动态的修改子应用代理，具体使用详见 [示例](/guide/plugin.html)

## beforeLoad

- **类型：** `(appWindow: Window) => any`

- **详情：** 生命周期钩子，加载子应用前调用

## beforeMount

- **类型：** `(appWindow: Window) => any`

- **详情：** 生命周期钩子，子应用 mount 之前调用

## afterMount

- **类型：** `(appWindow: Window) => any`

- **详情：** 生命周期钩子，子应用 mount 之后调用

## beforeUnmount

- **类型：** `(appWindow: Window) => any`

- **详情：** 生命周期钩子，子应用 unmount 之前调用

## afterUnmount

- **类型：** `(appWindow: Window) => any`

- **详情：** 生命周期钩子，子应用 unmount 之后调用

## activated

- **类型：** `(appWindow: Window) => any`

- **详情：** 生命周期钩子，保活子应用进入时触发

## deactivated

- **类型：** `(appWindow: Window) => any`

- **详情：** 生命周期钩子，保活子应用离开时触发

## loadError

- **类型：** `(url: string, e: Error) => any`

- **详情：** 生命周期钩子，子应用加载资源失败后触发

::: warning 注意
如果子应用没有做[生命周期改造](/guide/start.html#%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E6%94%B9%E9%80%A0)，beforeMount、afterMount、beforeUnmount、afterUnmount 这四个生命周期都不会调用，非保活子应用 activated、deactivated 这两个生命周期不会调用
:::
