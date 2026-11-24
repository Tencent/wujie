---
sidebarDepth: 2
collapsable: false
---

# React Wrapper

Official Wujie component wrapper for `React`. View the [live demo](https://wujie-micro.github.io/demo-main-react/) or browse the [demo source on GitHub](https://github.com/Tencent/wujie/tree/master/examples/main-react/).

## Installation

```bash
npm install wujie-react
```

## Import

```javascript
import WujieReact from "wujie-react";

const { bus, setupApp, preloadApp, destroyApp, refreshApp, clearAssetsCache } = WujieReact;
```

## Usage

```jsx
<WujieReact
  width="100%"
  height="100%"
  name="xxx"
  url={url}
  sync={true}
  fetch={fetch}
  props={props}
  beforeLoad={beforeLoad}
  beforeMount={beforeMount}
  afterMount={afterMount}
  beforeUnmount={beforeUnmount}
  afterUnmount={afterUnmount}
></WujieReact>
```

### bus

See [bus API](/en/api/bus.html).

### setupApp

See [setupApp API](/en/api/setupApp.html).

### preloadApp

See [preloadApp API](/en/api/preloadApp.html).

### destroyApp

See [destroyApp API](/en/api/destroyApp.html).

### refreshApp

See [refreshApp API](/en/api/refreshApp.html).

### clearAssetsCache

See [clearAssetsCache API](/en/api/clearAssetsCache.html).

### refresh

Component instance method (**no arguments required**). Destroys the current sub-app instance and performs a full rebuild automatically reusing the component's current props. Returns the `Promise` from `startAppQueue`.

```javascript
// Invoke directly with no arguments
await this.wujieRef.current.refresh();
```

## Implementation

```javascript
import React from "react";
import PropTypes from "prop-types";
import { bus, setupApp, preloadApp, startApp, destroyApp } from "wujie";

export default class WujieReact extends React.PureComponent {
  static propTypes = {
    height: PropTypes.string,
    width: PropTypes.string,
    name: PropTypes.string,
    loading: PropTypes.element,
    url: PropTypes.string,
    alive: PropTypes.bool,
    fetch: PropTypes.func,
    props: PropTypes.object,
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
    iframeAddEventListeners: PropTypes.array,
    iframeOnEvents: PropTypes.array,
  };
  static bus = bus;
  static setupApp = setupApp;
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
      loading,
      alive,
      fetch,
      props,
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
      iframeAddEventListeners,
      iframeOnEvents,
    } = this.props;
    this.startAppQueue = this.startAppQueue.then(async () => {
      try {
        this.destroy = await startApp({
          name,
          url,
          el: this.state.myRef.current,
          loading,
          alive,
          fetch,
          props,
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
          iframeAddEventListeners,
          iframeOnEvents,
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
```
