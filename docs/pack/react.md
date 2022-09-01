---
sidebarDepth: 2
collapsable: false
---

# React组件封装

无界基于`react`的组件封装，查看 [demo](https://wujie-micro.github.io/demo-main-react/)，查看 [demo github](https://github.com/Tencent/wujie/tree/master/examples/main-react/)

## 安装

```bash
npm i wujie-react -S
```

## 引入

```javascript
import WujieReact from "wujie-react";

const { bus, setupApp, preloadApp, destroyApp } = WujieReact;
```

## 使用

```jsx
<WujieReact
  width="100%"
  height="100%"
  name="xxx"
  url={xxx}
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

[同 API](/api/bus.html)

### setupApp

[同 API](/api/setupApp.html)

### preloadApp

[同 API](/api/preloadApp.html)

### destroyApp

[同 API](/api/destroyApp.html)

## 原理

```javascript
import React from "react";
import PropTypes from "prop-types";
import { bus, setupApp ,preloadApp, startApp, destroyApp } from "wujie";

export default class WujieReact extends React.PureComponent {
  static propTypes = {
    height: PropTypes.string,
    width: PropTypes.string,
    name: PropTypes.string,
    loading: PropTypes.element;
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
