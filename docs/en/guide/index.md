---
sidebarDepth: 2
---

# What Are Micro-Frontends?

Micro-frontends are an architectural approach and set of strategies that enable multiple teams to collaboratively build modern web applications by shipping features independently.

::: tip Quote
Techniques, strategies and recipes for building a modern web app with multiple teams that can ship features independently. — [Micro Frontends](https://micro-frontends.org/)
:::

In simple terms, micro-frontends allow one web application to run another web application independently inside it.

What are typical use cases for micro-frontends?

::: tip Examples

- Building an enterprise management portal that integrates existing procurement and finance systems into one unified platform.

- Splitting a large monolithic application into smaller, independently developed and deployed applications to reduce maintenance overhead, then composing them within a host shell.

- Adopting a new framework incrementally — for example, developing a standalone module in `React` inside a `Vue` application, deploying it independently, and mounting it back into the host app.

:::

What capabilities should a complete micro-frontend framework provide?

::: tip Capabilities

- **Loading and unmounting sub-apps**

  As users navigate between sub-apps, the framework must reliably load, render, and switch between them.

- **Isolated runtime execution**

  Sub-apps should not pollute the global `window` object or leak CSS styles into other applications; both JS and CSS must be effectively isolated.

- **Sub-app route persistence**

  Once a sub-app is active, browser refresh, forward, and back navigation must all work seamlessly with the sub-app's routing.

- **Cross-app communication**

  Applications should be able to communicate cleanly and conveniently.

:::

What are the benefits of adopting micro-frontends? ([Reference: qiankun](https://qiankun.umijs.org/guide))

::: tip Benefits

- **Technology stack agnostic**

  The main framework imposes no restrictions on the tech stacks used by sub-apps, giving each team full autonomy.

- **Independent development and deployment**

  Each micro-app lives in its own repository and can be developed and deployed independently; the host app picks up updates automatically.

- **Incremental upgrades**

  Rewriting a large legacy system all at once is rarely feasible. Micro-frontends provide a practical strategy for gradual refactoring and migration.

- **Isolated runtime**

  Each micro-app maintains its own isolated runtime state without unintended state sharing.

:::

You might wonder: why not just use a plain `iframe`?

## The iframe Approach

Using plain `iframe`s can indeed achieve micro-frontends, and its advantages are clear:

::: tip Pros

- Extremely simple to use with zero cognitive overhead.
- Near-perfect isolation: JavaScript, CSS, and DOM are completely separated between web applications.

:::

However, because the isolation is **too strict**, its drawbacks are equally pronounced:

::: danger Cons

- Route state is lost on reload — refreshing the page resets the `iframe`'s URL.
- Severe DOM fragmentation — modals, popovers, and overlays are trapped inside the `iframe` and cannot cover the full viewport.
- Cross-app communication is cumbersome.
- Long blank-screen load times on every open, which is unacceptable for [SPA applications](https://en.wikipedia.org/wiki/Single-page_application).

:::

## The single-spa Approach

[single-spa](https://single-spa.js.org/docs/getting-started-overview) is a widely adopted micro-frontend solution whose core workflow is:

- Pre-register sub-apps (activation routes, entry resources, and lifecycle hooks).
- Listen for route changes, load matching sub-app assets, invoke lifecycle hooks sequentially, and mount into the target container.

[qiankun](https://qiankun.umijs.org/guide) builds on `single-spa` with several important improvements:

- Replaces manual JS entry lists with a single HTML `url`, greatly simplifying sub-app registration.
- Adds application isolation with a JS sandbox (`window` proxy/factory) and a CSS sandbox (similar to Vue's `scoped` styles).
- Adds asset preloading to cache sub-app HTML, JS, and CSS ahead of time for faster startup.

Let's summarize the pros and cons of this approach:

::: tip Pros

- Automatically loads and unmounts sub-apps based on route matching.
- Comprehensive sandbox design: three progressive JS sandboxes (`SnapshotSandbox`, `LegacySandbox`, `ProxySandbox`) and two CSS isolation modes (`strictStyleIsolation`, `experimentalStyleIsolation`).
- Route persistence across browser refresh, back, and forward navigation.
- Simple cross-app communication via global injection.

:::

::: danger Cons

- Route-based activation makes it hard to keep multiple sub-apps active at once or preserve sub-app state (`keep-alive`).
- High adaptation cost across Webpack configuration, entry code, and routing.
- CSS isolation is not 100% airtight, and proxy-based JS sandboxes can incur significant performance degradation in certain scenarios.
- Cannot natively run `Vite` or other native `ESM` scripts.

:::

## The Wujie Approach

An intriguing discussion in a [qiankun GitHub issue](https://github.com/umijs/qiankun/issues/286) asked whether an `iframe` could be used purely as a JavaScript sandbox. That idea inspired Wujie's architecture, described in detail below.

### Application Loading and JS Sandbox

Wujie injects a sub-app's JavaScript into a same-origin `iframe` created under the main app's origin. Because an `iframe` is a browser-native `window` sandbox with its own `history` and `location`, the sub-app `instance` runs completely decoupled from the main app's router and can be mounted directly inside any UI component.

This design brings key benefits:

::: tip Benefits

- **Component-based usage**

  No central registration or router refactoring needed — simply render a Wujie component wherever you want.

- **Multiple active sub-apps on one page**

  Each sub-app uses its own iframe `history`, eliminating route conflicts.

- **Native JS sandbox without polluting the main app**

  Nothing is added to the main app's `window`; all mutations remain confined to the `iframe`.

- **Zero cleanup cost when switching apps**

  Since the main app stays untouched, destroying a sub-app requires no manual global cleanup.

:::

### Route Synchronization Mechanism

When a sub-app calls `history.pushState` inside its `iframe`, the browser automatically records that entry in the [joint session history](https://html.spec.whatwg.org/multipage/history.html#joint-session-history) alongside the iframe's [session history](https://html.spec.whatwg.org/multipage/history.html#session-history). As a result, browser Back and Forward buttons naturally work on the sub-app without extra plumbing.

By intercepting the iframe's `history.pushState` and `history.replaceState`, Wujie syncs the sub-app's URL into a query parameter on the main app's URL. When the browser refreshes and re-initializes the iframe, Wujie reads that query parameter back and restores the sub-app route via `history.replaceState`.

This delivers:

::: tip Benefits

- **Browser refresh, back, and forward navigation all work on sub-apps.**
- **Low implementation overhead without complex manual history listeners.**
- **Simultaneous route synchronization even when multiple sub-apps are active at once.**

:::

### iframe Bridging and CSS Sandbox

Wujie uses [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) (Shadow DOM) for style isolation. It creates a custom `wujie-app` element and renders the sub-app's complete DOM structure inside its ShadowRoot.

The sub-app's JS `instance` runs inside the `iframe`, while its DOM lives inside the Web Component mounted in the main app container. Wujie bridges the two by proxying the iframe's `document` onto the Web Component's ShadowRoot.

DOM query APIs — `getElementsByTagName`, `getElementsByClassName`, `getElementsByName`, `getElementById`, `querySelector`, `querySelectorAll`, `head`, and `body` — are all proxied to the ShadowRoot, seamlessly connecting the JS `instance` to the Web Component DOM.

When switching away from a sub-app, the `iframe` stays alive and the Web Component can also be retained in memory. When switching back, Wujie simply re-attaches the Web Component into the container, giving sub-apps Vue-like `keep-alive` behavior out of the box.

This delivers:

::: tip Benefits

- **Native CSS sandbox**

  True physical style isolation with zero style modifications needed in sub-apps.

- **Native modal & popup support**

  Calls to `document.body.appendChild` and `insertBefore` are proxied directly into the Web Component, so popups render across the viewport with zero sub-app changes.

- **Sub-app Keep-Alive**

  Keeping both the `iframe` and the Web Component in memory preserves all internal application state.

- **Complete DOM structure**

  The Web Component retains the sub-app's full `html` structure so styles and selectors match natively without rewrites.

:::

### Communication Mechanism

Because the sub-app's `iframe` shares the same origin as the main app, cross-app communication is straightforward. Wujie provides three built-in communication mechanisms:

- **Props injection**

  Sub-apps access data and callbacks injected by the main app via `window.$wujie.props`.

- **`window.parent` direct access**

  Because the sandbox `iframe` is same-origin with the main app, sub-apps can directly communicate with the main app via `window.parent`.

- **Decentralized `EventBus`**

  Wujie injects a shared `EventBus` instance into both the main app and all sub-apps, enabling decentralized pub/sub communication across all apps.

### Advantages

Summarizing the architecture above, Wujie offers the following advantages:

::: tip Advantages

- **Multiple active sub-apps simultaneously**

  Activate multiple sub-apps on the same page while keeping all of their routes synchronized.

- **Component-driven integration**

  No app registration or router changes — mount and unmount sub-apps just like regular components.

- **App-level Keep-Alive**

  Enabling [Keep-Alive mode](/en/api/startApp.html#alive) preserves the entire sub-app state across route switches. Combined with [pre-execution](/en/api/preloadApp.html#exec), it delivers an instant, SSR-like opening experience.

- **Clean and pollution-free**

  - Native JS and CSS sandboxes built on `iframe` and `Web Components`.
  - Native route synchronization leveraging the shared [top-level browsing context](https://html.spec.whatwg.org/multipage/browsers.html#top-level-browsing-context).
  - All side effects remain confined inside the sandbox, eliminating cleanup overhead during app switches.

- **Performance and lightweight footprint**

  - Near-native execution speed: code executes directly inside the iframe's `window` context instead of `with (proxyWindow) { code }`. The one-time cost of initializing an `iframe` can be hidden ahead of time using [preloadApp](/en/api/preloadApp.html).
  - Compact bundle size by delegating sandboxing to native browser primitives (`iframe` + `Web Components`).

- **Ready out of the box**

  Style isolation, routing, popups/modals, and HMR all work out of the box with minimal [sub-app adaptation](/en/guide/start.html#sub-app-adaptation).

:::
