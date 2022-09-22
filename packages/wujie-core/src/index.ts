import importHTML, { processCssLoader } from "./entry";
import WuJie from "./sandbox";
import { defineWujieWebComponent, addLoading } from "./shadow";
import { processAppForHrefJump } from "./sync";
import { getPlugins } from "./plugin";
import { wujieSupport, mergeOptions, isFunction, requestIdleCallback, isMatchSyncQueryById, warn } from "./utils";
import { getWujieById, getOptionsById, addSandboxCacheWithOptions, cacheOptions } from "./cache";
import { EventBus } from "./event";
import { WUJIE_TIPS_STOP_APP, WUJIE_TIPS_NOT_SUPPORTED } from "./constant";
import { baseOptions } from "./types";

export const bus = new EventBus(Date.now().toString());

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
  const newSandbox = await WuJie.build({ name, url, attrs, fiber, degrade, plugins, lifecycles });
  newSandbox.lifecycles?.beforeLoad?.(newSandbox.iframe.contentWindow);
  const { template, getExternalScripts, getExternalStyleSheets } = await importHTML(url, {
    fetch: fetch || window.fetch,
    plugins: newSandbox.plugins,
    loadError: newSandbox.lifecycles.loadError,
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
  requestIdleCallback(async () => {
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

    const sandbox = await WuJie.build({ name, url, attrs, fiber, degrade, plugins, lifecycles });
    if (sandbox.preload) return sandbox.preload;
    const runPreload = async () => {
      sandbox.lifecycles?.beforeLoad?.(sandbox.iframe.contentWindow);
      const { template, getExternalScripts, getExternalStyleSheets } = await importHTML(url, {
        fetch: fetch || window.fetch,
        plugins: sandbox.plugins,
        loadError: sandbox.lifecycles.loadError,
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
