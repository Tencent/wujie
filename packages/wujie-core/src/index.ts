import importHTML, { processCssLoader } from "./entry";
import { StyleObject } from "./template";
import WuJie, { lifecycle } from "./sandbox";
import { defineWujieWebComponent, addLoading } from "./shadow";
import { processAppForHrefJump } from "./sync";
import { getPlugins } from "./plugin";
import { wujieSupport, mergeOptions, isFunction, requestIdleCallback, isMatchSyncQueryById, warn } from "./utils";
import { getWujieById, getOptionsById, addSandboxCacheWithOptions } from "./common";
import { EventBus } from "./event";
import { WUJIE_TIPS_STOP_APP, WUJIE_TIPS_NOT_SUPPORTED } from "./constant";

export const bus = new EventBus(Date.now().toString());

export interface ScriptObjectLoader {
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

type eventListenerHook = (
  iframeWindow: Window,
  type: string,
  handler: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
) => void;

export type loadErrorHandler = (url: string, e: Error) => any;

type baseOptions = {
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

export type preOptions = baseOptions & {
  /** 预执行 */
  exec?: boolean;
};

export type startOptions = baseOptions & {
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

export type cacheOptions = baseOptions & {
  /** 预执行 */
  exec?: boolean;
  /** 渲染的容器 */
  el?: HTMLElement | string;
  /** 路由同步开关 */
  sync?: boolean;
  /** 子应用短路径替换，路由同步时生效 */
  prefix?: { [key: string]: string };
  /** 子应用加载时loading元素 */
  loading?: HTMLElement;
};

/**
 * 强制中断主应用运行
 * wujie.__WUJIE 如果为true说明当前运行环境是子应用
 * window.__POWERED_BY_WUJIE__ 如果为false说明子应用还没初始化完成
 * 上述条件同时成立说明主应用代码在iframe的loading阶段混入进来了，必须中断执行
 */
if (window.__WUJIE && !window.__POWERED_BY_WUJIE__) {
  warn(WUJIE_TIPS_STOP_APP);
  throw new Error(WUJIE_TIPS_STOP_APP);
}

// 处理子应用链接跳转
processAppForHrefJump();

// 定义webComponent容器
defineWujieWebComponent();

// 如果不支持则告警
if (!wujieSupport) warn(WUJIE_TIPS_NOT_SUPPORTED);

/**
 * 缓存子应用配置
 */
export function setupApp(options: cacheOptions): void {
  if (options.name) addSandboxCacheWithOptions(options.name, options);
}

/**
 * 运行无界app
 */
export async function startApp(startOptions: startOptions): Promise<Function | void> {
  const sandbox = getWujieById(startOptions.name);
  const cacheOptions = getOptionsById(startOptions.name);
  // 合并缓存配置
  const options = mergeOptions(startOptions, cacheOptions);
  const {
    name,
    url,
    replace,
    fetch,
    props,
    attrs,
    fiber,
    alive,
    degrade,
    sync,
    prefix,
    el,
    loading,
    plugins,
    lifecycles,
  } = options;
  // 已经初始化过的应用，快速渲染
  if (sandbox) {
    sandbox.plugins = getPlugins(plugins);
    sandbox.lifecycles = lifecycles;
    const iframeWindow = sandbox.iframe.contentWindow;
    if (sandbox.preload) {
      await Promise.resolve(sandbox.preload);
    }
    if (alive) {
      // 保活
      await sandbox.active({ url, sync, prefix, el, props, alive, fetch, replace });
      // 预加载但是没有执行的情况
      if (!sandbox.execFlag) {
        sandbox.lifecycles?.beforeLoad?.(sandbox.iframe.contentWindow);
        const { getExternalScripts } = await importHTML(url, {
          fetch: fetch || window.fetch,
          plugins: sandbox.plugins,
          loadError: sandbox.lifecycles.loadError,
          fiber,
        });
        await sandbox.start(getExternalScripts);
      }
      sandbox.lifecycles?.activated?.(sandbox.iframe.contentWindow);
      return sandbox.destroy;
    } else if (isFunction(iframeWindow.__WUJIE_MOUNT)) {
      /**
       * 子应用切换会触发webcomponent的disconnectedCallback调用sandbox.unmount进行实例销毁
       * 此处是防止没有销毁webcomponent时调用startApp的情况，需要手动调用unmount
       */
      sandbox.unmount();
      await sandbox.active({ url, sync, prefix, el, props, alive, fetch, replace });
      // 有渲染函数
      sandbox.lifecycles?.beforeMount?.(sandbox.iframe.contentWindow);
      iframeWindow.__WUJIE_MOUNT();
      sandbox.lifecycles?.afterMount?.(sandbox.iframe.contentWindow);
      sandbox.mountFlag = true;
      sandbox.rebuildStyleSheets();
      return sandbox.destroy;
    } else {
      // 没有渲染函数
      sandbox.destroy();
    }
  }

  // 设置loading
  addLoading(el, loading);
  const newSandbox = new WuJie({ name, url, attrs, fiber, degrade, plugins, lifecycles });
  newSandbox.lifecycles?.beforeLoad?.(newSandbox.iframe.contentWindow);
  const { template, getExternalScripts, getExternalStyleSheets } = await importHTML(url, {
    fetch: fetch || window.fetch,
    plugins: newSandbox.plugins,
    loadError: newSandbox.lifecycles.loadError,
    fiber,
  });

  const processedHtml = await processCssLoader(newSandbox, template, getExternalStyleSheets);
  await newSandbox.active({ url, sync, prefix, template: processedHtml, el, props, alive, fetch, replace });
  await newSandbox.start(getExternalScripts);
  return newSandbox.destroy;
}

/**
 * 预加载无界APP
 */
export function preloadApp(preOptions: preOptions): void {
  requestIdleCallback((): void | Promise<void> => {
    /**
     * 已经存在
     * url查询参数中有子应用的id，大概率是刷新浏览器或者分享url，此时需要直接打开子应用，无需预加载
     */
    if (getWujieById(preOptions.name) || isMatchSyncQueryById(preOptions.name)) return;
    const cacheOptions = getOptionsById(preOptions.name);
    // 合并缓存配置
    const options = mergeOptions({ ...preOptions }, cacheOptions);
    const { name, url, props, alive, replace, fetch, exec, attrs, fiber, degrade, prefix, plugins, lifecycles } =
      options;

    const sandbox = new WuJie({ name, url, attrs, fiber, degrade, plugins, lifecycles });
    if (sandbox.preload) return sandbox.preload;
    const runPreload = async () => {
      sandbox.lifecycles?.beforeLoad?.(sandbox.iframe.contentWindow);
      const { template, getExternalScripts, getExternalStyleSheets } = await importHTML(url, {
        fetch: fetch || window.fetch,
        plugins: sandbox.plugins,
        loadError: sandbox.lifecycles.loadError,
        fiber,
      });
      const processedHtml = await processCssLoader(sandbox, template, getExternalStyleSheets);
      await sandbox.active({ url, props, prefix, alive, template: processedHtml, fetch, replace });
      if (exec) {
        await sandbox.start(getExternalScripts);
      }
    };
    sandbox.preload = runPreload();
  });
}

/**
 * 销毁无界APP
 */
export function destroyApp(id: string): void {
  const sandbox = getWujieById(id);
  if (sandbox) {
    sandbox.destroy();
  }
}
