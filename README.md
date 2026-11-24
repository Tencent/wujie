<p align="center">
  <a href="https://wujie-micro.github.io/doc/en/" target="_blank">
    <img src="https://vfiles.gtimg.cn/wuji_dashboard/xy/test_wuji_damy/phFSuhUC.png" width="100" height="100" alt="Wujie logo">
  </a>
</p>

<h1 align="center">Wujie</h1>

<p align="center">
  The Ultimate Micro-Frontend Framework powered by Web Components + iframe
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/wujie"><img src="https://img.shields.io/npm/v/wujie.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/wujie"><img src="https://img.shields.io/npm/dm/wujie.svg" alt="npm downloads"></a>
  <a href="https://github.com/Tencent/wujie/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/wujie.svg" alt="MIT license"></a>
</p>

<p align="center">
  English | <a href="./README.zh-CN.md">简体中文</a>
</p>

Wujie is a micro-frontend framework built on **Web Components** and **iframes**, delivering low adoption cost, high performance, native isolation, and a rich feature set.

## Documentation & Demos

- Documentation: [English Docs](https://wujie-micro.github.io/doc/en/) | [中文文档](https://wujie-micro.github.io/doc/)
- Motivation & Architecture: [Introduction](https://wujie-micro.github.io/doc/en/guide/) | [中文知乎专栏](https://zhuanlan.zhihu.com/p/551206945)
- Live Demos: [Vue Main App Demo](https://wujie-micro.github.io/demo-main-vue/home?lang=en) | [React Main App Demo](https://wujie-micro.github.io/demo-main-react/?lang=en) | [Try Online](https://wujie-micro.github.io/doc/en/wujie/)

## Background

While micro-frontends have matured considerably, existing solutions still struggle with core developer requirements such as adaptation overhead, CSS isolation, runtime performance, blank-screen flickering, cross-app communication, sub-app keep-alive, activating multiple sub-apps simultaneously, Vite / ESM support, and dependency sharing.

**Web Components** (Shadow DOM) provide browser-native style encapsulation, while an **iframe** provides a browser-native JavaScript execution sandbox with its own `window`, `document`, `history`, and `location`. By combining a Web Component container with an iframe sandbox, Wujie achieves strict native isolation while addressing all of the challenges above.

## Features

1. **Low Adoption Cost**
   - Minimal setup in the main app
   - Little to zero adaptation needed in sub-apps
2. **High Performance**
   - Fast first-screen rendering with preloading and pre-execution
   - Native-level runtime performance without `with(proxy)` overhead
3. **Native Isolation**
   - Strict CSS isolation via Web Components (Shadow DOM)
   - Strict JavaScript isolation inside a same-origin iframe
4. **Rich Capabilities**
   - App-level Keep-Alive mode
   - Nested sub-apps
   - Multiple active sub-apps on the same page with route synchronization
   - Dependency sharing across apps
   - Decentralized communication (`EventBus`, `props`, `window`)
   - Comprehensive lifecycle hooks
   - Extensible plugin system
   - First-class Vite & ESM support

## Packages

| Package | Description | npm |
| --- | --- | --- |
| [`wujie`](./packages/wujie-core) | Framework-agnostic core runtime | [![npm](https://img.shields.io/npm/v/wujie.svg)](https://www.npmjs.com/package/wujie) |
| [`wujie-vue2`](./packages/wujie-vue2) | Vue 2 wrapper component | [![npm](https://img.shields.io/npm/v/wujie-vue2.svg)](https://www.npmjs.com/package/wujie-vue2) |
| [`wujie-vue3`](./packages/wujie-vue3) | Vue 3 wrapper component | [![npm](https://img.shields.io/npm/v/wujie-vue3.svg)](https://www.npmjs.com/package/wujie-vue3) |
| [`wujie-react`](./packages/wujie-react) | React wrapper component | [![npm](https://img.shields.io/npm/v/wujie-react.svg)](https://www.npmjs.com/package/wujie-react) |

## Quick Start

### Vanilla JS / Framework-Agnostic

- Install

```bash
npm install wujie
```

- Usage

```javascript
import { startApp } from "wujie";

startApp({ name: "unique-id", url: "https://sub-app-url/", el: "#container", sync: true });
```

### Vue

- Install

```bash
# Vue 2
npm install wujie-vue2
# Vue 3
npm install wujie-vue3
```

- Register

```javascript
// Vue 2
import WujieVue from "wujie-vue2";
Vue.use(WujieVue);

// Vue 3
import WujieVue from "wujie-vue3";
app.use(WujieVue);
```

- Usage

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

### React

- Install

```bash
npm install wujie-react
```

- Import

```javascript
import WujieReact from "wujie-react";
```

- Usage

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

## FAQ

See the [FAQ documentation](https://wujie-micro.github.io/doc/en/question/) for common troubleshooting guides (CORS, cookies, Shadow DOM events, relative assets, Vite, Module Federation, etc.).

## Local Development

Run the following commands to develop and debug Wujie locally with live reload:

```bash
pnpm install            # Install workspace dependencies (pnpm is required)
pnpm run start          # Start all packages and example apps
```

## One More Thing

Wujie originated from [**Tencent Wuji Low-Code Platform**](https://wujicode.cn), an enterprise-grade, all-in-one low-code solution widely used across Tencent. With Wujie, legacy pages and low-code pages can seamlessly embed one another, bridging existing and new systems. Explore [Tencent Wuji Low-Code](https://wujicode.cn) to learn more.
