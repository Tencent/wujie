import { bus, preloadApp, destroyApp, setupApp, refreshApp, clearAssetsCache, plugin } from "wujie";
import PropTypes from "prop-types";
import React from "react";

/** wujie 子应用生命周期回调，入参为子应用 window */
export type WujieLifecycle = (appWindow: Window) => any;

/** 子应用加载失败回调 */
export type WujieLoadErrorHandler = (url: string, e: Error) => any;

export interface WujieReactProps {
  /**
   * 唯一性用户必须保证
   */
  name?: string;
  /**
   * 需要渲染的url
   */
  url?: string;
  /**
   * 容器宽度
   */
  width?: string;
  /**
   * 容器高度
   */
  height?: string;
  /**
   * 自定义样式，透传给容器 div
   */
  style?: object;
  /**
   * 子应用加载时loading元素
   */
  loading?: React.ReactElement;
  /**
   * 自定义fetch
   */
  fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  /**
   * 注入给子应用的属性
   */
  props?: { [key: string]: any };
  /**
   * 自定义运行iframe的属性
   */
  attrs?: { [key: string]: any };
  /**
   * 代码替换钩子
   */
  replace?: (code: string) => string;
  /**
   * 路由同步开关
   */
  sync?: boolean;
  /**
   * 子应用短路径替换，路由同步时生效
   */
  prefix?: { [key: string]: string };
  /**
   * 子应用采用fiber模式执行
   */
  fiber?: boolean;
  /**
   * 子应用保活，state不会丢失
   */
  alive?: boolean;
  /**
   * 子应用采用降级iframe方案
   */
  degrade?: boolean;
  /**
   * 子应用插件
   */
  plugins?: Array<plugin>;
  /**
   * 子应用window监听事件
   */
  iframeAddEventListeners?: Array<string>;
  /**
   * 子应用iframe on事件
   */
  iframeOnEvents?: Array<string>;
  /**
   * 子应用生命周期
   */
  beforeLoad?: WujieLifecycle;
  beforeMount?: WujieLifecycle;
  afterMount?: WujieLifecycle;
  beforeUnmount?: WujieLifecycle;
  afterUnmount?: WujieLifecycle;
  activated?: WujieLifecycle;
  deactivated?: WujieLifecycle;
  loadError?: WujieLoadErrorHandler;
}

export default class WujieReact extends React.PureComponent<WujieReactProps> {
  static propTypes: {
    height: typeof PropTypes.string;
    width: typeof PropTypes.string;
    name: typeof PropTypes.string;
    loading: typeof PropTypes.element;
    url: typeof PropTypes.string;
    alive: typeof PropTypes.bool;
    fetch: typeof PropTypes.func;
    props: typeof PropTypes.object;
    attrs: typeof PropTypes.object;
    replace: typeof PropTypes.func;
    sync: typeof PropTypes.bool;
    prefix: typeof PropTypes.object;
    fiber: typeof PropTypes.bool;
    degrade: typeof PropTypes.bool;
    plugins: typeof PropTypes.array;
    beforeLoad: typeof PropTypes.func;
    beforeMount: typeof PropTypes.func;
    afterMount: typeof PropTypes.func;
    beforeUnmount: typeof PropTypes.func;
    afterUnmount: typeof PropTypes.func;
    activated: typeof PropTypes.func;
    deactivated: typeof PropTypes.func;
    loadError: typeof PropTypes.func;
    style: typeof PropTypes.object;
    iframeAddEventListeners: typeof PropTypes.arrayOf;
    iframeOnEvents: typeof PropTypes.arrayOf;
  };
  static bus: typeof bus;
  static setupApp: typeof setupApp;
  static preloadApp: typeof preloadApp;
  static destroyApp: typeof destroyApp;
  static refreshApp: typeof refreshApp;
  static clearAssetsCache: typeof clearAssetsCache;
}
