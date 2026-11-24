# preloadApp

- **Type:** `Function`

- **Parameters:** `preOptions`

```typescript
type lifecycle = (appWindow: Window) => any;
type loadErrorHandler = (url: string, e: Error) => any;

type preOptions = {
  /** Unique identifier for the sub-app */
  name: string;
  /** Entry URL of the sub-app */
  url?: string;
  /** Pre-fetched HTML string; if provided, Wujie will not fetch from url */
  html?: string;
  /** Data and callbacks injected into the sub-app */
  props?: { [key: string]: any };
  /** Custom attributes for the JS sandbox iframe */
  attrs?: { [key: string]: any };
  /** Custom attributes for the fallback rendering iframe in degrade mode */
  degradeAttrs?: { [key: string]: any };
  /** Global code replacement hook */
  replace?: (code: string) => string;
  /** Custom fetch for static assets and fetch API calls */
  fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  /** Enable Keep-Alive mode so sub-app state is preserved */
  alive?: boolean;
  /** Enable pre-execution mode */
  exec?: boolean;
  /** Execute sub-app JS scripts in fiber mode */
  fiber?: boolean;
  /** Force iframe degradation mode */
  degrade?: boolean;
  /** Events listened on the sub-app window */
  iframeAddEventListeners?: Array<string>;
  /** on* event properties forwarded to the sub-app iframe */
  iframeOnEvents?: Array<string>;
  /** Sub-app plugins */
  plugins?: Array<plugin>;
  /** Sub-app lifecycle hooks */
  beforeLoad?: lifecycle;
  /** Only called when the sub-app has implemented lifecycle adaptation */
  beforeMount?: lifecycle;
  afterMount?: lifecycle;
  beforeUnmount?: lifecycle;
  afterUnmount?: lifecycle;
  /** Only called for Keep-Alive sub-apps */
  activated?: lifecycle;
  deactivated?: lifecycle;
  /** Called when a sub-app asset fails to load */
  loadError?: loadErrorHandler;
};
```

- **Details:** Preloading significantly accelerates a sub-app's first-screen load time.

  ::: warning Warning

  - Preloading assets consumes connections from the main app's network pool.
  - Pre-executing sub-app code can contend with the main app's rendering thread.
  - The five options `name`, `replace`, `fetch`, `alive`, and `degrade` must remain **strictly identical** between `preloadApp` and `startApp`, or rendering issues may occur.

  :::

## name

- **Type:** `string`

- **Details:** Unique identifier for the sub-app.

  ::: tip Tip
  If multiple menu entries in the main app open different pages of the same sub-app, use the **same `name`** across them so they share a single sandbox instance.
  :::

## url

- **Type:** `string`

- **Details:** Entry URL of the sub-app.

## html

- **Type:** `string`

- **Details:** Raw HTML string for the sub-app. When provided, Wujie uses it directly instead of fetching HTML from `url`.

## props

- **Type:** `{ [key: string]: any }`

- **Details:** Data and callback functions injected into the sub-app.

  ::: warning Warning
  When `exec` is `true`, the sub-app executes immediately during preload. If the sub-app depends on `props` at startup, either pass `props` to `preloadApp` or ensure the sub-app gracefully handles missing `props`.
  :::

## attrs

- **Type:** `{ [key: string]: any }`

- **Details:** Custom HTML attributes applied to the sub-app's JS sandbox `iframe`.

## replace

- **Type:** `(codeText: string) => string`

- **Details:** Global runtime code replacement hook.

  ::: tip Tip
  Useful when you cannot modify a sub-app's repository directly. `replace` is applied to the sub-app's `html`, `js`, and `css` text at runtime.
  :::

## fetch

- **Type:** `(input: RequestInfo, init?: RequestInit) => Promise<Response>`

- **Details:**
  Custom `fetch` implementation. When specified, both static asset requests and `fetch`-based API requests from the sub-app go through this function.

  ::: tip Tip
  To include cookies in cross-origin requests, pass a custom `fetch`: `(url, options) => window.fetch(url, { ...options, credentials: "include" })`.
  :::

## alive

- **Default:** `false`

- **Type:** `boolean`

- **Details:**

  Enables Keep-Alive Mode. Neither the sub-app's JS `instance` nor its Web Component is destroyed when switching away — state and routing stay intact, and switching is just hot-swapping the Web Component DOM.

  Choose Keep-Alive Mode if you want instant, flicker-free switching without modifying the sub-app's lifecycle hooks.

  If multiple main-app menus point to different pages of the same sub-app, Keep-Alive Mode is not recommended because `startApp` cannot change the route of an already alive sub-app. Use [Singleton Mode](/en/guide/mode.html#singleton-mode) instead.

  ::: tip Tip
  Combining [pre-execution](/en/api/preloadApp.html#exec) with Keep-Alive Mode achieves an SSR-like experience where both data fetching and rendering complete ahead of time for instant opening.
  :::

## exec

- **Default:** `false`

- **Type:** `boolean`

- **Details:** Pre-execution mode. When `false`, Wujie only preloads the sub-app's static resources; when `true`, Wujie also pre-executes the sub-app's scripts during idle time for near-instant startup.

## fiber

- **Default:** `true`

- **Type:** `boolean`

- **Details:**

  Controls JavaScript execution scheduling. When `true`, each script execution is scheduled via `requestIdleCallback` (similar to React Fiber) so the browser can respond to user input between scripts. Splitting oversized JS chunks maximizes the responsiveness benefit of fiber mode.

  ::: tip Tip

  - For a sub-app that must render immediately when the main app opens, set `fiber: false` to speed up initial load.
  - For all other scenarios, keep the default (`true`).

  :::

## degrade

- **Default:** `false`

- **Type:** `boolean`

- **Details:**

  Forces iframe degradation mode. Wujie relies on `Proxy` and Web Components and automatically falls back to an `iframe` + `Object.defineProperty` implementation on older browsers (theoretically down to IE 9). Set `degrade: true` to explicitly opt into iframe rendering even on modern browsers.

  ::: warning Warning
  In Degrade Mode, modals and popups are confined inside the iframe and cannot cover the full main-app viewport.
  :::

## plugins

- **Type:** `Array<plugin>`

```typescript
interface ScriptObjectLoader {
  /** External script URL; omit for inline scripts */
  src?: string;
  /** Whether the script is an ES module */
  module?: boolean;
  /** Whether the script executes asynchronously */
  async?: boolean;
  /** Whether to set the crossorigin attribute */
  crossorigin?: boolean;
  /** Value of the crossorigin attribute */
  crossoriginType?: "anonymous" | "use-credentials" | "";
  /** Inline script source code */
  content?: string;
  /** Callback executed with the sub-app window */
  callback?: (appWindow: Window) => any;
}

interface StyleObjectLoader {
  /** External stylesheet URL; omit for inline styles */
  src?: string;
  /** Inline CSS text */
  content?: string;
}

type eventListenerHook = (
  iframeWindow: Window,
  type: string,
  handler: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
) => void;

interface plugin {
  /** Transform sub-app HTML */
  htmlLoader?: (code: string) => string;
  /** JS files to exclude from execution */
  jsExcludes?: Array<string | RegExp>;
  /** JS files loaded natively without proxying */
  jsIgnores?: Array<string | RegExp>;
  /** Scripts/callbacks executed before sub-app JS */
  jsBeforeLoaders?: Array<ScriptObjectLoader>;
  /** Transform sub-app JS source code */
  jsLoader?: (code: string, url: string, base: string) => string;
  /** Scripts/callbacks executed after sub-app JS */
  jsAfterLoaders?: Array<ScriptObjectLoader>;
  /** CSS files to exclude from loading */
  cssExcludes?: Array<string | RegExp>;
  /** CSS files loaded natively without proxying */
  cssIgnores?: Array<string | RegExp>;
  /** Styles inserted before sub-app CSS */
  cssBeforeLoaders?: Array<StyleObjectLoader>;
  /** Transform sub-app CSS text */
  cssLoader?: (code: string, url: string, base: string) => string;
  /** Styles inserted after sub-app CSS */
  cssAfterLoaders?: Array<StyleObjectLoader>;
  /** Hook for sub-app window.addEventListener */
  windowAddEventListenerHook?: eventListenerHook;
  /** Hook for sub-app window.removeEventListener */
  windowRemoveEventListenerHook?: eventListenerHook;
  /** Hook for sub-app document.addEventListener */
  documentAddEventListenerHook?: eventListenerHook;
  /** Hook for sub-app document.removeEventListener */
  documentRemoveEventListenerHook?: eventListenerHook;
  /** Hook after inserting elements into sub-app body or head */
  appendOrInsertElementHook?: <T extends Node>(element: T, iframeWindow: Window) => void;
  /** Hook after patching created elements in the sub-app */
  patchElementHook?: <T extends Node>(element: T, iframeWindow: Window) => void;
  /** Customize sub-app window properties */
  windowPropertyOverride?: (iframeWindow: Window) => void;
  /** Customize sub-app document properties */
  documentPropertyOverride?: (iframeWindow: Window) => void;
}
```

- **Details:** Plugins for transforming sub-app assets and intercepting runtime behaviors. See the [Plugin System guide](/en/guide/plugin.html) for examples.

## beforeLoad

- **Type:** `(appWindow: Window) => any`

- **Details:** Lifecycle hook called before the sub-app begins loading.

## beforeMount

- **Type:** `(appWindow: Window) => any`

- **Details:** Lifecycle hook called right before the sub-app mounts.

## afterMount

- **Type:** `(appWindow: Window) => any`

- **Details:** Lifecycle hook called right after the sub-app mounts.

## beforeUnmount

- **Type:** `(appWindow: Window) => any`

- **Details:** Lifecycle hook called right before the sub-app unmounts.

## afterUnmount

- **Type:** `(appWindow: Window) => any`

- **Details:** Lifecycle hook called right after the sub-app unmounts.

## activated

- **Type:** `(appWindow: Window) => any`

- **Details:** Lifecycle hook triggered when a Keep-Alive sub-app is activated.

## deactivated

- **Type:** `(appWindow: Window) => any`

- **Details:** Lifecycle hook triggered when a Keep-Alive sub-app is deactivated.

## loadError

- **Type:** `(url: string, e: Error) => any`

- **Details:** Lifecycle hook triggered when a sub-app asset fails to load.

::: warning Note
If the sub-app has not implemented [Lifecycle Adaptation](/en/guide/start.html#lifecycle-adaptation), `beforeMount`, `afterMount`, `beforeUnmount`, and `afterUnmount` will not be invoked. For non-keep-alive sub-apps, `activated` and `deactivated` will not be invoked.
:::
