import {
  iframeGenerator,
  recoverEventListeners,
  recoverDocumentListeners,
  insertScriptToIframe,
  patchEventTimeStamp,
} from "./iframe";
import { syncUrlToWindow, syncUrlToIframe, clearInactiveAppUrl } from "./sync";
import {
  createWujieWebComponent,
  clearChild,
  getPatchStyleElements,
  renderElementToContainer,
  renderTemplateToShadowRoot,
  createIframeContainer,
  renderTemplateToIframe,
  removeLoading,
} from "./shadow";
import { proxyGenerator, localGenerator } from "./proxy";
import { ScriptResultList } from "./entry";
import { getPlugins, getPresetLoaders } from "./plugin";
import { removeEventListener } from "./effect";
import {
  SandboxCache,
  idToSandboxCacheMap,
  addSandboxCacheWithWujie,
  deleteWujieById,
  rawElementAppendChild,
  rawDocumentQuerySelector,
} from "./common";
import { EventBus, appEventObjMap, EventObj } from "./event";
import { isFunction, wujieSupport, appRouteParse, requestIdleCallback, getAbsolutePath, eventTrigger } from "./utils";
import { WUJIE_DATA_ATTACH_CSS_FLAG } from "./constant";
import { plugin, ScriptObjectLoader, loadErrorHandler } from "./index";

export type lifecycle = (appWindow: Window) => any;
type lifecycles = {
  beforeLoad: lifecycle;
  beforeMount: lifecycle;
  afterMount: lifecycle;
  beforeUnmount: lifecycle;
  afterUnmount: lifecycle;
  activated: lifecycle;
  deactivated: lifecycle;
  loadError: loadErrorHandler;
};
/**
 * 基于 Proxy和iframe 实现的沙箱
 */
export default class Wujie {
  public id: string;
  /** 激活时路由地址 */
  public url: string;
  /** 子应用保活 */
  public alive: boolean;
  /** window代理 */
  public proxy: WindowProxy;
  /** document代理 */
  public proxyDocument: Object;
  /** location代理 */
  public proxyLocation: Object;
  /** 事件中心 */
  public bus: EventBus;
  /** 容器 */
  public el: HTMLElement;
  /** js沙箱 */
  public iframe: HTMLIFrameElement;
  /** css沙箱 */
  public shadowRoot: ShadowRoot;
  /** 子应用的template */
  public template: string;
  /** 子应用代码替换钩子 */
  public replace: (code: string) => string;
  /** 子应用自定义fetch */
  public fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  /** 子应用的生命周期 */
  public lifecycles: lifecycles;
  /** 子应用的插件 */
  public plugins: Array<plugin>;
  /** js沙箱ready态 */
  public iframeReady: Promise<void>;
  /** 子应用预加载态 */
  public preload: Promise<void>;
  /** 子应用js执行队列 */
  public execQueue: Array<Function>;
  /** 子应用执行标志 */
  public execFlag: boolean;
  /** 子应用mount标志 */
  public mountFlag: boolean;
  /** 路由同步标志 */
  public sync: boolean;
  /** 子应用短路径替换，路由同步时生效 */
  public prefix: { [key: string]: string };
  /** 子应用跳转标志 */
  public hrefFlag: boolean;
  /** 子应用采用fiber模式执行 */
  public fiber: boolean;
  /** 子应用降级标志 */
  public degrade: boolean;
  /** 子应用降级document */
  public document: Document;
  /** 子应用styleSheet元素 */
  public styleSheetElements: Array<HTMLLinkElement | HTMLStyleElement>;
  /** 子应用head元素 */
  public head: HTMLHeadElement;
  /** 子应用body元素 */
  public body: HTMLBodyElement;
  /** 子应用dom监听事件留存，当降级时用于保存元素事件 */
  public elementEventCacheMap: WeakMap<
    Node,
    Array<{ type: string; handler: EventListenerOrEventListenerObject; options: any }>
  > = new WeakMap();

  /** $wujie对象，提供给子应用的接口 */
  public provide: {
    bus: EventBus;
    shadowRoot?: ShadowRoot | undefined;
    props?: { [key: string]: any } | undefined;
    location?: Object;
  };

  /** 子应用嵌套场景，父应用传递给子应用的数据 */
  public inject: {
    idToSandboxMap: Map<String, SandboxCache>;
    appEventObjMap: Map<String, EventObj>;
    mainHostPath: string;
  };

  /** 激活子应用
   * 1、同步路由
   * 2、动态修改iframe的fetch
   * 3、准备shadow
   * 4、准备子应用注入
   */
  public async active(options: {
    url: string;
    sync?: boolean;
    prefix?: { [key: string]: string };
    template?: string;
    el?: string | HTMLElement;
    props?: { [key: string]: any };
    alive?: boolean;
    fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
    replace?: (code: string) => string;
  }): Promise<void> {
    const { sync, url, el, template, props, alive, prefix, fetch, replace } = options;
    this.url = url;
    this.sync = sync;
    this.alive = alive;
    this.hrefFlag = false;
    this.prefix = prefix ?? this.prefix;
    this.replace = replace ?? this.replace;
    this.provide.props = props ?? this.provide.props;
    // wait iframe init
    await this.iframeReady;

    // 处理子应用自定义fetch
    // TODO fetch检验合法性
    const iframeWindow = this.iframe.contentWindow;
    const iframeFetch = fetch
      ? (input: RequestInfo, init?: RequestInit) =>
          fetch(typeof input === "string" ? getAbsolutePath(input, (this.proxyLocation as Location).href) : input, init)
      : this.fetch;
    if (iframeFetch) {
      iframeWindow.fetch = iframeFetch;
      this.fetch = iframeFetch;
    }

    // 处理子应用路由同步
    if (this.execFlag && this.alive) {
      // 当保活模式下子应用重新激活时，只需要将子应用路径同步回主应用
      syncUrlToWindow(iframeWindow);
    } else {
      // 先将url同步回iframe，然后再同步回浏览器url
      syncUrlToIframe(iframeWindow);
      syncUrlToWindow(iframeWindow);
    }

    // inject template
    this.template = template ?? this.template;

    /* 降级处理 */
    if (this.degrade) {
      const iframe = createIframeContainer(this.id);
      const iframeBody = rawDocumentQuerySelector.call(iframeWindow.document, "body") as HTMLElement;
      this.el = renderElementToContainer(iframe, el ?? iframeBody);
      clearChild(iframe.contentDocument);
      // 销毁js运行iframe容器内部dom
      if (el) clearChild(iframeBody);
      // 修复vue的event.timeStamp问题
      patchEventTimeStamp(iframe.contentWindow, iframeWindow);
      // 当销毁iframe时主动unmount子应用
      iframe.contentWindow.onunload = () => {
        this.unmount();
      };
      if (this.document) {
        if (this.alive) {
          iframe.contentDocument.appendChild(this.document.firstElementChild);
          // 保活场景需要事件全部恢复
          recoverEventListeners(iframe.contentDocument.firstElementChild, iframeWindow);
        } else {
          await renderTemplateToIframe(iframe.contentDocument, this.iframe.contentWindow, this.template);
          // 非保活场景需要恢复根节点的事件，防止react16监听事件丢失
          recoverDocumentListeners(
            this.document.firstElementChild,
            iframe.contentDocument.firstElementChild,
            iframeWindow
          );
        }
      } else {
        await renderTemplateToIframe(iframe.contentDocument, this.iframe.contentWindow, this.template);
      }
      this.document = iframe.contentDocument;
      return;
    }

    if (this.shadowRoot) {
      /*
       document.addEventListener was transfer to shadowRoot.addEventListener
       react 16 SyntheticEvent will remember document event for avoid repeat listen
       shadowRoot have to dispatchEvent for react 16 so can't be destroyed
       this may lead memory leak risk
       */
      this.el = renderElementToContainer(this.shadowRoot.host, el);
      if (this.alive) return;
    } else {
      // 预执行无容器，暂时插入iframe内部触发Web Component的connect
      const iframeBody = rawDocumentQuerySelector.call(iframeWindow.document, "body") as HTMLElement;
      this.el = renderElementToContainer(createWujieWebComponent(this.id), el ?? iframeBody);
    }

    await renderTemplateToShadowRoot(this.shadowRoot, iframeWindow, this.template);
    this.patchCssRules();

    // inject shadowRoot to app
    this.provide.shadowRoot = this.shadowRoot;
  }

  /** 启动子应用
   * 1、运行js
   * 2、处理兼容样式
   */
  public async start(getExternalScripts: () => ScriptResultList): Promise<void> {
    this.execFlag = true;
    // 执行脚本
    const scriptResultList = await getExternalScripts();
    // 假如已经被销毁了
    if (!this.iframe) return;
    const iframeWindow = this.iframe.contentWindow;
    // 标志位，执行代码前设置
    iframeWindow.__POWERED_BY_WUJIE__ = true;
    // 用户自定义代码前
    const beforeScriptResultList: ScriptObjectLoader[] = getPresetLoaders("jsBeforeLoaders", this.plugins);
    // 用户自定义代码后
    const afterScriptResultList: ScriptObjectLoader[] = getPresetLoaders("jsAfterLoaders", this.plugins);
    // 同步代码
    const syncScriptResultList: ScriptResultList = [];
    // async代码无需保证顺序，所以不用放入执行队列
    const asyncScriptResultList: ScriptResultList = [];
    // defer代码需要保证顺序并且DOMContentLoaded前完成，这里统一放置同步脚本后执行
    const deferScriptResultList: ScriptResultList = [];
    scriptResultList.forEach((scriptResult) => {
      if (scriptResult.defer) deferScriptResultList.push(scriptResult);
      else if (scriptResult.async) asyncScriptResultList.push(scriptResult);
      else syncScriptResultList.push(scriptResult);
    });

    // 插入代码前
    beforeScriptResultList.forEach((beforeScriptResult) => {
      this.execQueue.push(() =>
        this.fiber
          ? requestIdleCallback(() => insertScriptToIframe(beforeScriptResult, iframeWindow))
          : insertScriptToIframe(beforeScriptResult, iframeWindow)
      );
    });

    // 同步代码
    syncScriptResultList.concat(deferScriptResultList).forEach((scriptResult) => {
      this.execQueue.push(() =>
        scriptResult.contentPromise.then((content) =>
          this.fiber
            ? requestIdleCallback(() => insertScriptToIframe({ ...scriptResult, content }, iframeWindow))
            : insertScriptToIframe({ ...scriptResult, content }, iframeWindow)
        )
      );
    });

    // 异步代码
    asyncScriptResultList.forEach((scriptResult) => {
      scriptResult.contentPromise.then((content) => {
        this.fiber
          ? requestIdleCallback(() => insertScriptToIframe({ ...scriptResult, content }, iframeWindow))
          : insertScriptToIframe({ ...scriptResult, content }, iframeWindow);
      });
    });

    //框架主动调用mount方法
    this.execQueue.push(this.fiber ? () => requestIdleCallback(() => this.mount()) : () => this.mount());

    //触发 DOMContentLoaded 事件
    const domContentLoadedTrigger = () => {
      eventTrigger(iframeWindow.document, "DOMContentLoaded");
      eventTrigger(iframeWindow, "DOMContentLoaded");
      this.execQueue.shift()?.();
    };
    this.execQueue.push(this.fiber ? () => requestIdleCallback(domContentLoadedTrigger) : domContentLoadedTrigger);

    // 插入代码后
    afterScriptResultList.forEach((afterScriptResult) => {
      this.execQueue.push(() =>
        this.fiber
          ? requestIdleCallback(() => insertScriptToIframe(afterScriptResult, iframeWindow))
          : insertScriptToIframe(afterScriptResult, iframeWindow)
      );
    });

    //触发 loaded 事件
    const domLoadedTrigger = () => {
      eventTrigger(iframeWindow.document, "readystatechange");
      eventTrigger(iframeWindow, "load");
      this.execQueue.shift()?.();
    };
    this.execQueue.push(this.fiber ? () => requestIdleCallback(domLoadedTrigger) : domLoadedTrigger);
    // 由于没有办法准确定位是哪个代码做了mount，保活、重建模式提前关闭loading
    if (this.alive || !isFunction(this.iframe.contentWindow.__WUJIE_UNMOUNT)) removeLoading(this.el);
    this.execQueue.shift()();

    // 所有的execQueue队列执行完毕，start才算结束，保证串行的执行子应用
    return new Promise((resolve) => {
      this.execQueue.push(() => {
        resolve();
        this.execQueue.shift()?.();
      });
    });
  }

  /**
   * 框架主动发起mount，如果子应用是异步渲染实例，比如将生命周__WUJIE_MOUNT放到async函数内
   * 此时如果采用fiber模式渲染（主应用调用mount的时机也是异步不确定的），框架调用mount时可能
   * 子应用的__WUJIE_MOUNT还没有挂载到window，所以这里封装一个mount函数，当子应用是异步渲染
   * 实例时，子应用异步函数里面最后加上window.__WUJIE.mount()来主动调用
   */
  public mount(): void {
    if (this.mountFlag) return;
    if (isFunction(this.iframe.contentWindow.__WUJIE_MOUNT)) {
      removeLoading(this.el);
      this.lifecycles?.beforeMount?.(this.iframe.contentWindow);
      this.iframe.contentWindow.__WUJIE_MOUNT();
      this.lifecycles?.afterMount?.(this.iframe.contentWindow);
      this.mountFlag = true;
    }
    if (this.alive) {
      this.lifecycles?.activated?.(this.iframe.contentWindow);
    }
    this.execQueue.shift()?.();
  }

  /** 保活模式和使用proxyLocation.href跳转链接都不应该销毁shadow */
  public unmount(): void {
    // 清理子应用过期的同步参数，降级时调用需要等iframe完全销毁再clear
    this.degrade ? setTimeout(() => clearInactiveAppUrl()) : clearInactiveAppUrl();
    if (this.alive) {
      this.lifecycles?.deactivated?.(this.iframe.contentWindow);
    }
    if (!this.mountFlag) return;
    if (isFunction(this.iframe.contentWindow.__WUJIE_UNMOUNT) && !this.alive && !this.hrefFlag) {
      this.lifecycles?.beforeUnmount?.(this.iframe.contentWindow);
      this.iframe.contentWindow.__WUJIE_UNMOUNT();
      this.lifecycles?.afterUnmount?.(this.iframe.contentWindow);
      this.mountFlag = false;
      this.bus.$clear();
      if (!this.degrade) {
        clearChild(this.shadowRoot);
        // head body需要复用，每次都要清空事件
        removeEventListener(this.head);
        removeEventListener(this.body);
      }
      clearChild(this.head);
      clearChild(this.body);
    }
  }

  /** 销毁子应用 */
  public destroy() {
    this.bus.$clear();
    this.shadowRoot = null;
    this.proxy = null;
    this.proxyDocument = null;
    this.proxyLocation = null;
    this.execQueue = null;
    this.provide = null;
    this.styleSheetElements = null;
    this.bus = null;
    this.replace = null;
    this.fetch = null;
    this.execFlag = null;
    this.mountFlag = null;
    this.hrefFlag = null;
    this.document = null;
    this.head = null;
    this.body = null;
    this.elementEventCacheMap = null;
    this.lifecycles = null;
    this.plugins = null;
    this.provide = null;
    this.inject = null;
    this.execQueue = null;
    this.prefix = null;
    // 清除 dom
    if (this.el) {
      clearChild(this.el);
      this.el = null;
    }
    // 清除 iframe 沙箱
    if (this.iframe) {
      this.iframe.parentNode?.removeChild(this.iframe);
    }
    deleteWujieById(this.id);
  }

  /** 当子应用再次激活后，只运行mount函数，样式需要重新恢复 */
  public rebuildStyleSheets(): void {
    if (this.styleSheetElements && this.styleSheetElements.length) {
      this.styleSheetElements.forEach((styleSheetElement) => {
        rawElementAppendChild.call(this.degrade ? this.document.head : this.shadowRoot.head, styleSheetElement);
      });
    }
    this.patchCssRules();
  }

  /**
   * 子应用样式打补丁
   * 1、兼容:root选择器样式到:host选择器上
   * 2、将@font-face定义到shadowRoot外部
   */
  public patchCssRules(): void {
    if (this.degrade) return;
    if (this.shadowRoot.host.hasAttribute(WUJIE_DATA_ATTACH_CSS_FLAG)) return;
    const [hostStyleSheetElement, fontStyleSheetElement] = getPatchStyleElements(
      Array.from(this.iframe.contentDocument.querySelectorAll("style")).map(
        (styleSheetElement) => styleSheetElement.sheet
      )
    );
    if (hostStyleSheetElement) {
      this.shadowRoot.head.appendChild(hostStyleSheetElement);
      this.styleSheetElements.push(hostStyleSheetElement);
    }
    if (fontStyleSheetElement) {
      this.shadowRoot.host.appendChild(fontStyleSheetElement);
    }
    (hostStyleSheetElement || fontStyleSheetElement) &&
      this.shadowRoot.host.setAttribute(WUJIE_DATA_ATTACH_CSS_FLAG, "");
  }

  /**
   * @param id 子应用的id，唯一标识
   * @param url 子应用的url，可以包含protocol、host、path、query、hash
   */
  constructor(options: {
    name: string;
    url: string;
    attrs: { [key: string]: any };
    fiber: boolean;
    degrade;
    plugins: Array<plugin>;
    lifecycles: lifecycles;
  }) {
    // 传递inject给嵌套子应用
    if (window.__POWERED_BY_WUJIE__) this.inject = window.__WUJIE.inject;
    else {
      this.inject = {
        idToSandboxMap: idToSandboxCacheMap,
        appEventObjMap,
        mainHostPath: window.location.protocol + "//" + window.location.host,
      };
    }
    const { name, url, attrs, fiber, degrade, lifecycles, plugins } = options;
    this.id = name;
    this.fiber = fiber;
    this.degrade = degrade || !wujieSupport;
    this.bus = new EventBus(this.id);
    this.url = url;
    this.provide = { bus: this.bus };
    this.styleSheetElements = [];
    this.execQueue = [];
    this.lifecycles = lifecycles;
    this.plugins = getPlugins(plugins);

    // 创建目标地址的解析
    const { urlElement, appHostPath, appRoutePath } = appRouteParse(url);
    const { mainHostPath } = this.inject;
    // 创建iframe
    const iframe = iframeGenerator(this, attrs, mainHostPath, appHostPath, appRoutePath);
    this.iframe = iframe;

    if (this.degrade) {
      const { proxyDocument, proxyLocation } = localGenerator(iframe, urlElement, mainHostPath, appHostPath);
      this.proxyDocument = proxyDocument;
      this.proxyLocation = proxyLocation;
    } else {
      const { proxyWindow, proxyDocument, proxyLocation } = proxyGenerator(
        iframe,
        urlElement,
        mainHostPath,
        appHostPath
      );
      this.proxy = proxyWindow;
      this.proxyDocument = proxyDocument;
      this.proxyLocation = proxyLocation;
    }
    this.provide.location = this.proxyLocation;

    addSandboxCacheWithWujie(this.id, this);
  }
}
