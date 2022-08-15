import React from "react";
import PropTypes from "prop-types";
import { bus, preloadApp, startApp, destroyApp, createApp } from "wujie";

export default class WujieReact extends React.PureComponent {
  static propTypes = {
    height: PropTypes.string,
    width: PropTypes.string,
    name: PropTypes.string,
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
  };
  static bus = bus;
  static createApp = createApp;
  static preloadApp = preloadApp;
  static destroyApp = destroyApp;

  state = {
    myRef: React.createRef(),
  };

  destroy = null;

  startAppQueue = Promise.resolve();

  execStartApp = () => {
    const {
      name,
      url,
      alive,
      fetch,
      props,
      attrs,
      replace,
      sync,
      prefix,
      fiber,
      degrade,
      plugins,
      beforeLoad,
      beforeMount,
      afterMount,
      beforeUnmount,
      afterUnmount,
      activated,
      deactivated,
      loadError,
    } = this.props;
    this.startAppQueue = this.startAppQueue.then(async () => {
      try {
        this.destroy = await startApp({
          name,
          url,
          el: this.state.myRef.current,
          alive,
          fetch,
          props,
          attrs,
          replace,
          sync,
          prefix,
          fiber,
          degrade,
          plugins,
          beforeLoad,
          beforeMount,
          afterMount,
          beforeUnmount,
          afterUnmount,
          activated,
          deactivated,
          loadError,
        });
      } catch (error) {
        console.log(error);
      }
    });
  };

  render() {
    this.execStartApp();
    return React.createElement("div", {
      style: {
        width: this.props.width,
        height: this.props.height,
      },
      ref: this.state.myRef,
    });
  }
}
