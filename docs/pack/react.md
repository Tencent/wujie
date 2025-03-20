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
import React, { createElement } from "react";
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
  };

  render() {
    this.execStartApp();

    const { width, height } = this.props;
    const { myRef: ref } = this.state;
    return createElement("div", {
      style: {
        width,
        height,
      },
      ref,
    });
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
};

```
