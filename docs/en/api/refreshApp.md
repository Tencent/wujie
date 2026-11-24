# refreshApp

- **Type:** `Function`

- **Parameters:** `startOptions` (same as [startApp](/en/api/startApp.html))

- **Returns:** `Promise<Function | void>`

Programmatically refreshes a sub-app: first calls [destroyApp](/en/api/destroyApp.html) to destroy the current instance, then calls [startApp](/en/api/startApp.html) with the provided options to perform a full rebuild. Internally it awaits `destroyApp` before invoking `startApp`, preventing race conditions caused by restarting before teardown finishes.

This is equivalent to chaining `destroyApp(name)` + `startApp(startOptions)` with framework-guaranteed sequencing.

::: tip Use Cases

- The sub-app runs in [Rebuild Mode](/en/guide/mode.html#rebuild-mode) and you want to force a full rebuild to reset state and reload assets.
- Sub-app code or static assets have been updated and you need to discard the old instance and re-fetch.
- When using Vue or React wrapper components, you can also call [refresh()](/en/pack/#refresh) via the component ref **with no arguments** to rebuild using the component's current props.

:::

::: warning Note

- Refreshing destroys the current sub-app instance along with its `iframe` and `shadowRoot`, which may cause a brief blank screen during reload.
- Options such as `name`, `replace`, `fetch`, `alive`, and `degrade` must remain consistent with the initial `startApp` call to avoid rendering issues.
- Avoid refreshing unnecessarily if the sub-app will be revisited normally; use `refreshApp` only when a full rebuild is required.

:::

## Example

```javascript
import { refreshApp } from "wujie";

await refreshApp({
  name: "vue3",
  url: "https://xxx.com/",
  el: document.querySelector("#container"),
});
```

When using the Vue or React wrapper components:

```javascript
// Static method refreshApp (same options as startApp)
import WujieVue from "wujie-vue3";
await WujieVue.refreshApp({ name: "vue3", url: "...", el: "..." });

// Component instance method refresh() — no arguments needed, reuses current component props
await this.$refs.wujie.refresh();
```
