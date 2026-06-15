import React from "react";
import PropTypes from "prop-types";
import { bus, preloadApp, startApp, destroyApp, setupApp, refreshApp } from "wujie";

/**
 * 清理全局 startApp 串行队列，防止组件销毁后 window.__WUJIE_QUEUE 长期持有
 * 已卸载实例的 Promise 链，造成内存泄漏。
 * 仅当全局队列仍指向当前实例的链尾时才删除，避免误删被同名新实例接管的队列。
 */
function clearStartAppQueue(name, queue) {
  if (!name || !window.__WUJIE_QUEUE) return;
  if (window.__WUJIE_QUEUE[name] === queue) {
    delete window.__WUJIE_QUEUE[name];
  }
}

export default class WujieReact extends React.PureComponent {
  static propTypes = propTypes;
  static bus = bus;
  static setupApp = setupApp;
  static preloadApp = preloadApp;
  static destroyApp = destroyApp;
  static refreshApp = refreshApp;

  state = {
    myRef: React.createRef(),
  };

  destroy = null;

  isUnmounted = false;

  startAppQueue = Promise.resolve();

  startApp = async () => {
    // 拦截组件卸载后仍残留在 __WUJIE_QUEUE Promise 链中的 .then(startApp) 幽灵执行
    if (this.isUnmounted) return;
    try {
      const props = this.props;
      const { current: el } = this.state.myRef;
      this.destroy = await startApp({
        ...props,
        el,
      });
      // 异步创建跨越了卸载点，兜底销毁孤儿 sandbox
      if (this.isUnmounted && typeof this.destroy === "function") {
        this.destroy();
      }
    } catch (error) {
      console.log(error);
    }
  };

  execStartApp = () => {
    // 卸载后残留触发不应再入队
    if (this.isUnmounted) return;
    this.startAppQueue = this.startAppQueue.then(this.startApp);
    if (this.props.name && window.__WUJIE_QUEUE) {
      window.__WUJIE_QUEUE[this.props.name] = this.startAppQueue;
    }
  };

  // 销毁当前子应用实例并复用组件 props 全量重建
  refresh = async () => {
    if (this.isUnmounted) return;
    await destroyApp(this.props.name);
    this.execStartApp();
    return this.startAppQueue;
  };

  componentDidMount() {
    if (this.props.name) {
      if (window.__WUJIE_QUEUE) {
        if (window.__WUJIE_QUEUE[this.props.name]) {
          this.startAppQueue = window.__WUJIE_QUEUE[this.props.name];
        } else {
          window.__WUJIE_QUEUE[this.props.name] = this.startAppQueue;
        }
      } else {
        window.__WUJIE_QUEUE = {
          [this.props.name]: this.startAppQueue,
        };
      }
    }
    this.execStartApp();
  }

  componentDidUpdate(prevProps) {
    if (this.props.name !== prevProps.name || this.props.url !== prevProps.url) {
      this.execStartApp();
    }
  }

  componentWillUnmount() {
    this.isUnmounted = true;
    clearStartAppQueue(this.props.name, this.startAppQueue);
  }

  render() {
    const { width, height, style } = this.props;
    const { myRef: ref } = this.state;
    return <div style={{ width, height, ...style }} ref={ref} />;
  }
}

const propTypes = {
  height: PropTypes.string,
  width: PropTypes.string,
  name: PropTypes.string,
  loading: PropTypes.element,
  url: PropTypes.string,
  alive: PropTypes.bool,
  fetch: PropTypes.func,
  props: PropTypes.object,
  attrs: PropTypes.object,
  replace: PropTypes.func,
  sync: PropTypes.bool,
  prefix: PropTypes.object,
  fiber: PropTypes.bool,
  degrade: PropTypes.bool,
  plugins: PropTypes.array,
  beforeLoad: PropTypes.func,
  beforeMount: PropTypes.func,
  afterMount: PropTypes.func,
  beforeUnmount: PropTypes.func,
  afterUnmount: PropTypes.func,
  activated: PropTypes.func,
  deactivated: PropTypes.func,
  loadError: PropTypes.func,
  style: PropTypes.object,
  iframeAddEventListeners: PropTypes.arrayOf(PropTypes.string),
  iframeOnEvents: PropTypes.arrayOf(PropTypes.string),
};
