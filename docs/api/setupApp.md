# setupApp

- **类型：** `Function`

- **参数：** `cacheOptions`

- **返回值：**`void`

```typescript
type lifecycle = (appWindow: Window) => any;
type loadErrorHandler = (url: string, e: Error) => any;

type baseOptions = {
  /** 唯一性用户必须保证 */
  name: string;
  /** 需要渲染的url */
  url: string;
  /** 需要渲染的html, 如果用户已有则无需从url请求 */
  html?: string;
  /** 代码替换钩子 */
  replace?: (code: string) => string;
  /** 自定义fetch */
  fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  /** 注入给子应用的属性 */
  props?: { [key: string]: any };
  /** 自定义运行iframe的属性 */
  attrs?: { [key: string]: any };
  /** 自定义降级渲染iframe的属性 */
  degradeAttrs?: { [key: string]: any };
  /** 子应用采用fiber模式执行 */
  fiber?: boolean;
  /** 子应用保活，state不会丢失 */
  alive?: boolean;
  /** 子应用采用降级iframe方案 */
  degrade?: boolean;
  /** 子应用插件 */
  plugins?: Array<plugin>;
  /** 子应用生命周期 */
  beforeLoad?: lifecycle;
  beforeMount?: lifecycle;
  afterMount?: lifecycle;
  beforeUnmount?: lifecycle;
  afterUnmount?: lifecycle;
  activated?: lifecycle;
  deactivated?: lifecycle;
  loadError?: loadErrorHandler;
};

type preOptions = baseOptions & {
  /** 预执行 */
  exec?: boolean;
};

type startOptions = baseOptions & {
  /** 渲染的容器 */
  el: HTMLElement | string;
  /**
   * 路由同步开关
   * 如果false，子应用跳转主应用路由无变化，但是主应用的history还是会增加
   * https://html.spec.whatwg.org/multipage/history.html#the-history-interface
   */
  sync?: boolean;
  /** 子应用短路径替换，路由同步时生效 */
  prefix?: { [key: string]: string };
  /** 子应用加载时loading元素 */
  loading?: HTMLElement;
};

type optionProperty = "url" | "el";

/**
 * 合并 preOptions 和 startOptions，并且将 url 和 el 变成可选
 */
type cacheOptions = Omit<preOptions & startOptions, optionProperty> &
  Partial<Pick<startOptions, optionProperty>>;

```

- **详情：** `setupApp`设置子应用默认属性，非必须。[startApp](/api/startApp.html)、[preloadApp](/api/preloadApp.html) 会从这里获取子应用默认属性，如果有相同的属性则会直接覆盖

