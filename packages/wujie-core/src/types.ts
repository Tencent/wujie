export type lifecycle = (appWindow: Window) => any;

export type loadErrorHandler = (url: string, e: Error) => any;

export interface ScriptObjectLoader {
  /** 脚本地址，内联为空 */
  src?: string;
  /** 脚本是否为module模块 */
  module?: boolean;
  /** 脚本是否设置crossorigin */
  crossorigin?: boolean;
  /** 脚本crossorigin的类型 */
  crossoriginType?: "anonymous" | "use-credentials" | "";
  /** 内联script的代码 */
  content?: string;
  /** 执行回调钩子 */
  callback?: (appWindow: Window) => any;
}

/** 样式对象 */
export interface StyleObject {
  /** 样式地址， 内联为空 */
  src?: string;
  /** 样式代码 */
  content?: string;
  /** 忽略，子应用自行请求 */
  ignore?: boolean;
}

export interface plugin {
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

export type baseOptions = {
  /** 唯一性用户必须保证 */
  name: string;
  /** 需要渲染的url */
  url: string;
  /** 代码替换钩子 */
  replace?: (code: string) => string;
  /** 自定义fetch */
  fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  /** 注入给子应用的属性 */
  props?: { [key: string]: any };
  /** 自定义iframe属性 */
  attrs?: { [key: string]: any };
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

type eventListenerHook = (
  iframeWindow: Window,
  type: string,
  handler: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
) => void;
