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
  }

  execStartApp = () => {
    this.startAppQueue = this.startAppQueue.then(this.startApp);
  };

  render() {
    this.execStartApp();

    const { width, height } = this.props;
    const { myRef: ref } = this.state;
    return <div style={{ width, height }} ref={ref} />;
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
  }