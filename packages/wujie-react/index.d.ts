import { bus, preloadApp, destroyApp, setupApp, refreshApp, clearAssetsCache, startOptions } from "wujie";
import PropTypes from "prop-types";
import React from "react";

/**
 * WujieReact 组件属性：除 el 由组件容器提供外，其余与 startApp 的参数保持一致
 */
export interface WujieReactProps extends Omit<startOptions, "el"> {
  /** 容器宽度 */
  width?: string;
  /** 容器高度 */
  height?: string;
  /** 容器自定义样式 */
  style?: React.CSSProperties;
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
