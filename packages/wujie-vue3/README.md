# wujie-vue3

Official Vue 3 wrapper component for [Wujie](https://github.com/Tencent/wujie), a micro-frontend framework powered by **Web Components** and **iframes**.

## Installation

```bash
npm install wujie-vue3
```

## Quick Start

Register the plugin in your Vue 3 entry file:

```javascript
import { createApp } from "vue";
import WujieVue from "wujie-vue3";
import App from "./App.vue";

const { bus, setupApp, preloadApp, destroyApp, refreshApp, clearAssetsCache } = WujieVue;

createApp(App).use(WujieVue).mount("#app");
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

- Accepts all `startApp` options (except `el`) as component props, plus `width`, `height`, and `style`.
- Events emitted by a sub-app via `window.$wujie.bus.$emit(event, ...args)` can be listened to directly with `@event` on `<WujieVue>`.
- Exposes static helpers: `bus`, `setupApp`, `preloadApp`, `destroyApp`, `refreshApp`, and `clearAssetsCache`.
- Instance methods: `wujieRef.value.destroy()` and `wujieRef.value.refresh()`.

## Documentation & Links

- [Vue Wrapper Guide](https://wujie-micro.github.io/doc/en/pack/)
- [Documentation (English)](https://wujie-micro.github.io/doc/en/)
- [Vue Main App Demo](https://wujie-micro.github.io/demo-main-vue/home)
- [GitHub Repository](https://github.com/Tencent/wujie)
- [License: MIT](https://github.com/Tencent/wujie/blob/master/LICENSE)
