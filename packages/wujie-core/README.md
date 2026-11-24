# wujie

Core runtime for [Wujie](https://github.com/Tencent/wujie) — a micro-frontend framework powered by **Web Components** and **iframes**, featuring native JS/CSS isolation, Keep-Alive mode, route synchronization, preloading, and a flexible plugin system.

## Installation

```bash
npm install wujie
```

## Quick Start

```javascript
import { setupApp, preloadApp, startApp, destroyApp, refreshApp, clearAssetsCache, bus } from "wujie";

// Optional: configure shared default options for a sub-app
setupApp({
  name: "my-sub-app",
  url: "https://sub-app.example.com/",
  exec: true,
  sync: true,
});

// Optional: preload resources during browser idle time
preloadApp({ name: "my-sub-app" });

// Mount and start the sub-app
startApp({
  name: "my-sub-app",
  url: "https://sub-app.example.com/",
  el: "#sub-app-container",
  sync: true,
});
```

## Core APIs

- `setupApp(options)` — Cache default configuration shared by `preloadApp` and `startApp`.
- `preloadApp(options)` — Preload (and optionally pre-execute) a sub-app during idle time.
- `startApp(options)` — Render and mount a sub-app into a container element.
- `destroyApp(name)` — Destroy a sub-app instance along with its iframe and ShadowRoot.
- `refreshApp(options)` — Destroy and rebuild a sub-app cleanly without race conditions.
- `clearAssetsCache(host?)` — Invalidate cached HTML, JS, and CSS assets globally or by host.
- `bus` — Decentralized `EventBus` shared across the main app and all sub-apps.

## Framework Wrappers

If you are using Vue or React in the main app, consider using the official wrapper packages:

- Vue 2: [`wujie-vue2`](https://www.npmjs.com/package/wujie-vue2)
- Vue 3: [`wujie-vue3`](https://www.npmjs.com/package/wujie-vue3)
- React: [`wujie-react`](https://www.npmjs.com/package/wujie-react)

## Documentation & Links

- [Documentation (English)](https://wujie-micro.github.io/doc/en/)
- [API Reference](https://wujie-micro.github.io/doc/en/api/startApp.html)
- [GitHub Repository](https://github.com/Tencent/wujie)
- [License: MIT](https://github.com/Tencent/wujie/blob/master/LICENSE)
