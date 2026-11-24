# wujie-vue2

Official Vue 2 wrapper component for [Wujie](https://github.com/Tencent/wujie), a micro-frontend framework powered by **Web Components** and **iframes**.

## Installation

```bash
npm install wujie-vue2
```

## Quick Start

Register the plugin in your Vue 2 entry file:

```javascript
import Vue from "vue";
import WujieVue from "wujie-vue2";

const { bus, setupApp, preloadApp, destroyApp, refreshApp, clearAssetsCache } = WujieVue;

Vue.use(WujieVue);
```

Use `<WujieVue>` in your templates:

```vue
<template>
  <WujieVue
    ref="wujie"
    width="100%"
    height="100%"
    name="sub-app"
    url="https://sub-app.example.com/"
    :sync="true"
    :props="{ user: 'alice' }"
  />
</template>
```

## Props, Events & Methods

- Accepts all `startApp` options (except `el`) as component props, plus `width` and `height`.
- Events emitted by a sub-app via `window.$wujie.bus.$emit(event, ...args)` can be listened to directly with `@event` on `<WujieVue>`.
- Exposes static helpers: `bus`, `setupApp`, `preloadApp`, `destroyApp`, `refreshApp`, and `clearAssetsCache`.
- Instance methods: `this.$refs.wujie.destroy()` and `this.$refs.wujie.refresh()`.

## Documentation & Links

- [Vue Wrapper Guide](https://wujie-micro.github.io/doc/en/pack/)
- [Documentation (English)](https://wujie-micro.github.io/doc/en/)
- [Vue Main App Demo](https://wujie-micro.github.io/demo-main-vue/home)
- [GitHub Repository](https://github.com/Tencent/wujie)
- [License: MIT](https://github.com/Tencent/wujie/blob/master/LICENSE)
