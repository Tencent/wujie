import React from "react";
import PropTypes from "prop-types";
import { bus, preloadApp, startApp, destroyApp, setupApp } from "wujie";

export default class WujieReact extends React.PureComponent {
  static propTypes = propTypes;
  static bus = bus;
  static setupApp = setupApp;
  static preloadApp = preloadApp;
  static destroyApp = destroyApp;

  state = {
    myRef: React.createRef(),
  };

  destroy = null;

  startAppQueue = Promise.resolve();

  startApp = async () => {
    try {
      const props = this.props;
      const { current: el } = this.state.myRef;
      this.destroy = await startApp({
        ...props,
        el,
      });
    } catch (error) {
      console.log(error);
    }
  };

  execStartApp = () => {
    this.startAppQueue = this.startAppQueue.then(this.startApp);
    window.__WUJIE_QUEUE[this.name] = this.startAppQueue;
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
