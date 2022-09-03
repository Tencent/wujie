import { bus, preloadApp, destroyApp, setupApp } from "wujie";
import PropTypes from "prop-types";
import React from "react";

export default class WujieReact extends React.PureComponent {
  static propTypes: {
    height: typeof PropTypes.string;
    width: typeof PropTypes.string;
    name: typeof PropTypes.string;
    loading: typeof PropTypes.element;
    url: typeof PropTypes.string;
    alive: typeof PropTypes.bool;
    fetch: typeof PropTypes.func;
    props: typeof PropTypes.object;
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
  };
  static bus: typeof bus;
  static setupApp: typeof setupApp;
  static preloadApp: typeof preloadApp;
  static destroyApp: typeof destroyApp;
}
