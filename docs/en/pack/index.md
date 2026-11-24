---
sidebarDepth: 2
collapsable: false
---

# Vue Wrapper

Official Wujie component wrappers for `Vue 2` and `Vue 3`. View the [live demo](https://wujie-micro.github.io/demo-main-vue/?lang=en) or browse the [demo source on GitHub](https://github.com/Tencent/wujie/tree/master/examples/main-vue/).

## Installation

```bash
# Vue 2
npm install wujie-vue2
# Vue 3
npm install wujie-vue3
```

## Registration

```javascript
// Vue 2
import WujieVue from "wujie-vue2";
Vue.use(WujieVue);

// Vue 3
import WujieVue from "wujie-vue3";
app.use(WujieVue);

const { bus, setupApp, preloadApp, destroyApp, refreshApp, clearAssetsCache } = WujieVue;
```

## Usage

```html
<WujieVue
  width="100%"
  height="100%"
  name="xxx"
  :url="url"
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

Any event emitted by a sub-app via [$wujie.bus.$emit](/en/api/wujie.html#wujie-bus)`(event, ...args)` can be listened to directly using `@event` on `<WujieVue>`.

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

Component instance method (**no arguments required**). Destroys the current sub-app instance and performs a full rebuild automatically reusing the component's current props (`name`, `url`, `alive`, etc.). Returns the `Promise` from `startAppQueue` so you can await completion.

```javascript
// Invoke directly with no arguments
await this.$refs.wujie.refresh();
```

## Implementation

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
    loadError: { type: Function, default: null },
    iframeAddEventListeners: { type: Array, default: null },
    iframeOnEvents: { type: Array, default: null },
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
            loadError: this.loadError,
            iframeAddEventListeners: this.iframeAddEventListeners,
            iframeOnEvents: this.iframeOnEvents,
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
        width: this.width,
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
