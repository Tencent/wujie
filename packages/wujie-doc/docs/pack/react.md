---
sidebarDepth: 2
collapsable: false
---

无界基于`react`的组件封装，查看 [demo](https://wujie-micro.github.io/demo-main-react/)，查看 [demo git](https://github.com/Tencent/wujie/tree/master/examples/main-react/)

## 安装

```bash
npm i wujie-react -S
```

## 引入

```javascript
import WujieReact from "wujie-react";

const { bus, preloadApp, destroyApp } = WujieReact;
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

### preloadApp

[同 API](/api/preloadApp.html)

### destroyApp

[同 API](/api/destroyapp.html)

## 常见问题

#### 1、编译报错

编译时报错：

```
ERROR in ./node_modules/wujie-react/esm/index.js 6:19
Module parse failed: Unexpected token (6:19)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
|
| export default class WujieReact extends React.PureComponent {
>   static propTypes = {
|     height: PropTypes.string,
|     width: PropTypes.string,
```

**原因**：wujie-react 编译有 esm 包和 lib 包且，默认采用 esm 包，esm 包没有进行 babel 处理，在 webpack 编译中导致报错。

**解决**：


方法 1：采用 lib 包

```javascript
import WujieReact from 'wujie-react/lib/index';
```

方法 2：webpack babel-loader 编译一下 wujie-react 和 wujie
```javascript
{
  // babel-loader的 exclude 参数，排除掉 wujie-react 和 wujie
  exclude: /node_modules\/(?!(wujie(-react)?)\/).*/,
}
```

## 原理

```javascript
import React from "react";
import PropTypes from "prop-types";
import { bus, preloadApp, startApp, destroyApp } from "wujie";

export default class WujieReact extends React.PureComponent {
  static propTypes = {
    height: PropTypes.string,
    width: PropTypes.string,
    name: PropTypes.string,
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
