# Preload

::: tip
Preloading dramatically improves the first-screen load time of sub-apps.
:::

## Preloading

Preloading uses `requestIdleCallback` during browser idle time to fetch a sub-app's static assets from the network into memory ahead of time. See [preloadApp](/en/api/preloadApp.html) for details.

## Pre-execution

Pre-execution renders the sub-app in advance during browser idle time, further reducing perceived startup latency.

Simply set [exec](/en/api/preloadApp.html#exec) to `true` in `preloadApp`.

Because pre-executing a sub-app could block the main app's main thread, Wujie uses a [React Fiber](https://github.com/acdlite/react-fiber-architecture)-inspired execution mode to yield back to the browser between scripts. See [fiber](/en/api/startApp.html#fiber) for details.

## Clearing the Assets Cache

Wujie caches sub-app HTML, JS, and CSS at the module level to speed up repeat loads. If a sub-app's static assets have been updated or you need to force a fresh fetch, call [clearAssetsCache](/en/api/clearAssetsCache.html) to invalidate the cache globally or for specific hosts.
