---
sidebarDepth: 2
collapsable: false
---

# Quick Start

## Main App

### Import

```javascript
import { bus, setupApp, preloadApp, startApp, destroyApp, refreshApp, clearAssetsCache } from "wujie";
```

::: tip Tip
If your main app uses Vue, you can directly use [wujie-vue](/en/pack/). If it uses React, you can directly use [wujie-react](/en/pack/react.html).
:::

### Configure Sub-app Defaults

Optional. Because `preloadApp` and `startApp` share many options, you can use `setupApp` to register shared default parameters and avoid duplication.

```javascript
setupApp({ name: "unique-id", url: "https://sub-app-url/", exec: true, el: "#container", sync: true });
```

### Preload

```javascript
preloadApp({ name: "unique-id" });
```

### Start Sub-app

```javascript
startApp({ name: "unique-id" });
```

## Sub-app Adaptation

Wujie is minimally invasive for sub-apps — as long as CORS headers are properly configured, sub-apps can run with zero code changes.

### Prerequisites

Sub-app static assets and API requests are initiated from the main app's origin, so cross-origin requests will occur. Sub-apps must configure [CORS headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS).

For example, if a sub-app is served by Node.js, a basic CORS setup looks like this:

```javascript
app.use((req, res, next) => {
  // Path matching or custom checks
  res.set({
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Headers": "X-Requested-With,Content-Type",
    "Access-Control-Allow-Methods": "PUT,POST,GET,DELETE,OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  });
  // Next middleware
  next();
});
```

::: warning Note
This is only a minimal example. Configure CORS policies according to your actual security and business requirements.
:::

### Execution Modes

Wujie supports three execution modes: [Singleton Mode](/en/guide/mode.html#singleton-mode), [Keep-Alive Mode](/en/guide/mode.html#keep-alive-mode), and [Rebuild Mode](/en/guide/mode.html#rebuild-mode).

Both [Keep-Alive Mode](/en/guide/mode.html#keep-alive-mode) and [Rebuild Mode](/en/guide/mode.html#rebuild-mode) require **no code changes** in the sub-app. Only [Singleton Mode](/en/guide/mode.html#singleton-mode) requires lifecycle adaptation.

### Lifecycle Adaptation

Update the sub-app's entry file as follows:

- Wrap router creation, app instantiation, and mounting inside `window.__WUJIE_MOUNT`.
- Wrap app destruction inside `window.__WUJIE_UNMOUNT`.
- If the sub-app is loaded asynchronously (such as Vite ESM), explicitly call `window.__WUJIE.mount()` after defining the lifecycle hooks (see the Vite example below).

See the framework-specific examples below:

::: details Vue 2

```javascript
if (window.__POWERED_BY_WUJIE__) {
  let instance;
  window.__WUJIE_MOUNT = () => {
    const router = new VueRouter({ routes });
    instance = new Vue({ router, render: (h) => h(App) }).$mount("#app");
  };
  window.__WUJIE_UNMOUNT = () => {
    instance.$destroy();
  };
} else {
  new Vue({ router: new VueRouter({ routes }), render: (h) => h(App) }).$mount("#app");
}
```

:::
::: details Vue 3

```javascript
if (window.__POWERED_BY_WUJIE__) {
  let instance;
  window.__WUJIE_MOUNT = () => {
    const router = createRouter({ history: createWebHistory(), routes });
    instance = createApp(App);
    instance.use(router);
    instance.mount("#app");
  };
  window.__WUJIE_UNMOUNT = () => {
    instance.unmount();
  };
} else {
  createApp(App).use(createRouter({ history: createWebHistory(), routes })).mount("#app");
}
```

:::
::: details Vite

```typescript
declare global {
  interface Window {
    // Whether running inside Wujie
    __POWERED_BY_WUJIE__?: boolean;
    // Sub-app mount lifecycle hook
    __WUJIE_MOUNT: () => void;
    // Sub-app unmount lifecycle hook
    __WUJIE_UNMOUNT: () => void | Promise<void>;
    // Sub-app Wujie sandbox instance
    __WUJIE: { mount: () => void };
  }
}

if (window.__POWERED_BY_WUJIE__) {
  let instance: any;
  window.__WUJIE_MOUNT = () => {
    const router = createRouter({ history: createWebHistory(), routes });
    instance = createApp(App);
    instance.use(router);
    instance.mount("#app");
  };
  window.__WUJIE_UNMOUNT = () => {
    instance.unmount();
  };
  /*
    Because Vite loads modules asynchronously and Wujie may run scripts
    in fiber mode, Wujie's automatic mount trigger may fire before Vite
    finishes loading. Explicitly calling window.__WUJIE.mount() ensures
    the sub-app mounts reliably. Wujie tracks mount state internally, so
    it will never mount twice.
  */
  window.__WUJIE.mount();
} else {
  createApp(App).use(createRouter({ history: createWebHistory(), routes })).mount("#app");
}
```

:::
::: details React

```jsx
if (window.__POWERED_BY_WUJIE__) {
  window.__WUJIE_MOUNT = () => {
    ReactDOM.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
      document.getElementById("root")
    );
  };
  window.__WUJIE_UNMOUNT = () => {
    ReactDOM.unmountComponentAtNode(document.getElementById("root"));
  };
} else {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById("root")
  );
}
```

:::
::: details Angular

```typescript
declare global {
  interface Window {
    // Whether running inside Wujie
    __POWERED_BY_WUJIE__?: boolean;
    // Sub-app mount lifecycle hook
    __WUJIE_MOUNT: () => void;
    // Sub-app unmount lifecycle hook
    __WUJIE_UNMOUNT: () => void | Promise<void>;
  }
}

if (window.__POWERED_BY_WUJIE__) {
  let instance: any;
  window.__WUJIE_MOUNT = async () => {
    instance = await platformBrowserDynamic().bootstrapModule(AppModule);
  };
  window.__WUJIE_UNMOUNT = () => {
    instance.destroy?.();
  };
} else {
  platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));
}
```

:::

### Others

Legacy projects not bundled with Webpack require no code changes at all, though switching between sub-apps may exhibit brief blank-screen flashes.

::: warning Note
- For legacy projects, prefer [Keep-Alive Mode](/en/guide/mode.html#keep-alive-mode) whenever possible to eliminate blank-screen switching times.
:::
