---
sidebarDepth: 2
collapsable: false
---

# Execution Modes

![Wujie execution modes flowchart](https://vfiles.gtimg.cn/wuji_dashboard/xy/test_wuji_damy/F0NYfpHl.jpeg)

In a micro-frontend architecture, sub-apps are repeatedly activated and deactivated as users navigate across pages in the main app. In Wujie, whether a sub-app enables Keep-Alive mode and whether it implements lifecycle adaptation determines which of three execution flows it follows.

## Keep-Alive Mode

Setting [alive](/en/api/startApp.html#alive) to `true` enables **Keep-Alive Mode**, preserving internal state and routing across page switches.

In Keep-Alive Mode, the sub-app renders only once. When navigating away, the Web Component holding the sub-app's DOM stays cached in memory. When the sub-app is activated again, Wujie re-attaches that cached Web Component directly into the container.

Changing [url](/en/api/startApp.html#url) in Keep-Alive Mode will **not** navigate the sub-app to a new route; instead, use [Communication](/en/guide/communication.html) (such as `EventBus`) to trigger route changes inside the sub-app.

::: warning Note

A keep-alive sub-app instance is never destroyed, so it continues to receive `bus` events even when switched out of view. In contrast, non-keep-alive sub-apps have all of their event listeners cleared when switched away and must re-subscribe on their next mount.

:::

## Singleton Mode

When `alive` is `false` and the sub-app has completed [Lifecycle Adaptation](/en/guide/start.html#lifecycle-adaptation), it runs in **Singleton Mode**.

When navigating away from the sub-app, Wujie invokes `window.__WUJIE_UNMOUNT` to destroy the current app instance. When navigating back, Wujie invokes `window.__WUJIE_MOUNT` to render a fresh instance while reusing the same sandbox.

In Singleton Mode, updating [url](/en/api/startApp.html#url) navigates the sub-app to the corresponding route.

If multiple menu items in the main app point to different pages of the same sub-app, give them the **same `name`**. They will share a single `wujie` instance and JavaScript `iframe`, and switching between those pages becomes: destroy current app instance → sync new route → create new app instance.

## Rebuild Mode

When a sub-app neither enables Keep-Alive Mode nor implements lifecycle adaptation, it runs in **Rebuild Mode**. On every switch, Wujie destroys both the Web Component holding the DOM and the `iframe` running the JavaScript, tearing down the entire `wujie` instance and sub-app instance.

In Rebuild Mode, changing [url](/en/api/startApp.html#url) navigates the sub-app to the target route. However, if [Route Sync](/en/guide/sync.html) is enabled and the sub-app's synced route query parameter is already present in the main app's URL, changing `url` will not override it — because rebuilding re-initializes the sub-app and synced query parameters take highest precedence.

To programmatically trigger a full rebuild, use [refreshApp](/en/api/refreshApp.html).
