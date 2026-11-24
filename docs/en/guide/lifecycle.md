# Lifecycle

::: tip Tip
Wujie provides a complete set of lifecycle hooks for the main app to observe and react to sub-app transitions.
:::

::: warning Warning
If a sub-app has not implemented [Lifecycle Adaptation](/en/guide/start.html#lifecycle-adaptation), the four hooks `beforeMount`, `afterMount`, `beforeUnmount`, and `afterUnmount` will **not** be invoked.
:::

## beforeLoad

- **Type:** `type lifecycle = (appWindow: Window) => any;`

Triggered before the sub-app starts loading its static assets.

## beforeMount

- **Type:** `type lifecycle = (appWindow: Window) => any;`

Triggered right before the sub-app renders (before `window.__WUJIE_MOUNT` is called).

## afterMount

- **Type:** `type lifecycle = (appWindow: Window) => any;`

Triggered right after the sub-app renders (after `window.__WUJIE_MOUNT` is called).

## beforeUnmount

- **Type:** `type lifecycle = (appWindow: Window) => any;`

Triggered right before the sub-app unmounts (before `window.__WUJIE_UNMOUNT` is called).

## afterUnmount

- **Type:** `type lifecycle = (appWindow: Window) => any;`

Triggered right after the sub-app unmounts (after `window.__WUJIE_UNMOUNT` is called).

## activated

- **Type:** `type lifecycle = (appWindow: Window) => any;`

Triggered when a sub-app in [Keep-Alive Mode](/en/api/startApp.html#alive) enters view.

## deactivated

- **Type:** `type lifecycle = (appWindow: Window) => any;`

Triggered when a sub-app in [Keep-Alive Mode](/en/api/startApp.html#alive) leaves view.

## loadError

- **Type:** `type loadErrorHandler = (url: string, e: Error) => any;`

Triggered when the sub-app fails to load a static asset.
