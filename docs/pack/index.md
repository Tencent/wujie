---
sidebarDepth: 2
collapsable: false
---
# Vue组件封装

无界基于`vue2`和`vue3`框架的组件封装，，查看 [demo](https://wujie-micro.github.io/demo-main-vue/)，查看 [demo github](https://github.com/Tencent/wujie/tree/master/examples/main-vue/)

## 安装

```bash
# vue2 框架
npm i wujie-vue2 -S
# vue3 框架
npm i wujie-vue3 -S

```

## 引入

``` javascript
// vue2
import WujieVue from "wujie-vue2";
// vue3
import WujieVue from "wujie-vue3";

const { bus, setupApp, preloadApp, destroyApp } = WujieVue;

Vue.use(WujieVue);
```

## 使用

```js
<WujieVue
  width="100%"
  height="100%"
  name="xxx"
  :url="xxx"
  :sync="true"
  :fetch="fetch"
  :props="props"
  :beforeLoad="beforeLoad"
  :beforeMount="beforeMount"
  :afterMount="afterMount"
  :beforeUnmount="beforeUnmount"
  :afterUnmount="afterUnmount"
></WujieVue>
```

子应用通过[$wujie.bus.$emit](/api/wujie.html#wujie-bus)`(event, args)`出来的事件都可以直接`@event`来监听

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
import Vue from "vue";
import { bus, setupApp, preloadApp, startApp, destroyApp } from "wujie";
import { createApp, h, defineComponent } from "vue";
const vue3Flag = !!createApp;

const wujieVueOptions = {
  name: "WujieVue",
  props: {
    width: { type: String, default: "" },
    height: { type: String, default: "" },
    name: { type: String, default: "" },
    loading: { type: HTMLElement, default: undefined },
    url: { type: String, default: "" },
    sync: { type: Boolean, default: false },
    prefix: { type: Object, default: undefined },
    alive: { type: Boolean, default: false },
    props: { type: Object, default: undefined },
    replace: { type: Function, default: undefined },
    fetch: { type: Function, default: undefined },
    fiber: { type: Boolean, default: true },
    degrade: { type: Boolean, default: false },
    plugins: { type: Array, default: null },
    beforeLoad: { type: Function, default: null },
    beforeMount: { type: Function, default: null },
    afterMount: { type: Function, default: null },
    beforeUnmount: { type: Function, default: null },
    afterUnmount: { type: Function, default: null },
    activated: { type: Function, default: null },
    deactivated: { type: Function, default: null },
    loadError: {type: Function, default: null}
  },
  data() {
    return {
      destroy: null,
      startAppQueue: Promise.resolve(),
    };
  },
  mounted() {
    bus.$onAll(this.handleEmit);
    this.execStartApp();
    this.$watch(
      () => this.name + this.url,
      () => this.execStartApp()
    );
  },
  methods: {
    handleEmit(event, ...args) {
      this.$emit(event, ...args);
    },
    execStartApp() {
      this.startAppQueue = this.startAppQueue.then(async () => {
        try {
          this.destroy = await startApp({
            name: this.name,
            url: this.url,
            el: this.$refs.wujie,
            loading: this.loading,
            alive: this.alive,
            fetch: this.fetch,
            props: this.props,
            replace: this.replace,
            sync: this.sync,
            prefix: this.prefix,
            fiber: this.fiber,
            degrade: this.degrade,
            plugins: this.plugins,
            beforeLoad: this.beforeLoad,
            beforeMount: this.beforeMount,
            afterMount: this.afterMount,
            beforeUnmount: this.beforeUnmount,
            afterUnmount: this.afterUnmount,
            activated: this.activated,
            deactivated: this.deactivated,
            loadError: this.loadError
          });
        } catch (error) {
          console.log(error);
        }
      });
    },
  },
  beforeDestroy() {
    bus.$offAll(this.handleEmit);
  },
  render(c) {
    const createElement = vue3Flag ? h : c;
    return createElement("div", {
      style: {
        width: this.height,
        height: this.height,
      },
      ref: "wujie",
    });
  },
};

const WujieVue = vue3Flag ? defineComponent(wujieVueOptions) : Vue.extend(wujieVueOptions);

WujieVue.setupApp = setupApp;
WujieVue.preloadApp = preloadApp;
WujieVue.bus = bus;
WujieVue.destroyApp = destroyApp;
WujieVue.install = function (Vue) {
  Vue.component("WujieVue", WujieVue);
};

export default WujieVue;

```
