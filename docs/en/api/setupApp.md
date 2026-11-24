# setupApp

- **Type:** `Function`

- **Parameters:** `cacheOptions`

- **Returns:** `void`

```typescript
type lifecycle = (appWindow: Window) => any;
type loadErrorHandler = (url: string, e: Error) => any;

type baseOptions = {
  /** Unique identifier for the sub-app */
  name: string;
  /** Entry URL of the sub-app */
  url: string;
  /** Pre-fetched HTML string; if provided, Wujie will not fetch from url */
  html?: string;
  /** Global code replacement hook */
  replace?: (code: string) => string;
  /** Custom fetch implementation */
  fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  /** Data and callbacks injected into the sub-app */
  props?: { [key: string]: any };
  /** Custom attributes for the JS sandbox iframe */
  attrs?: { [key: string]: any };
  /** Custom attributes for the fallback rendering iframe in degrade mode */
  degradeAttrs?: { [key: string]: any };
  /** Execute sub-app JS scripts in fiber mode */
  fiber?: boolean;
  /** Enable Keep-Alive mode so sub-app state is preserved */
  alive?: boolean;
  /** Force iframe degradation mode */
  degrade?: boolean;
  /** Sub-app plugins */
  plugins?: Array<plugin>;
  /** Events listened on the sub-app window */
  iframeAddEventListeners?: Array<string>;
  /** on* event properties forwarded to the sub-app iframe */
  iframeOnEvents?: Array<string>;
  /** Sub-app lifecycle hooks */
  beforeLoad?: lifecycle;
  beforeMount?: lifecycle;
  afterMount?: lifecycle;
  beforeUnmount?: lifecycle;
  afterUnmount?: lifecycle;
  activated?: lifecycle;
  deactivated?: lifecycle;
  loadError?: loadErrorHandler;
};

type preOptions = baseOptions & {
  /** Enable pre-execution during preload */
  exec?: boolean;
};

type startOptions = baseOptions & {
  /** Target container element or selector */
  el: HTMLElement | string;
  /**
   * Enable route synchronization.
   * When false, sub-app navigation does not update the main app's URL query,
   * though browser history entries are still recorded:
   * https://html.spec.whatwg.org/multipage/history.html#the-history-interface
   */
  sync?: boolean;
  /** Short path prefix map used during route sync */
  prefix?: { [key: string]: string };
  /** Custom loading element displayed while loading */
  loading?: HTMLElement;
};

type optionProperty = "url" | "el";

/**
 * Merges preOptions and startOptions while making url and el optional
 */
type cacheOptions = Omit<preOptions & startOptions, optionProperty> & Partial<Pick<startOptions, optionProperty>>;
```

- **Details:** `setupApp` registers default configuration for a sub-app (optional). Both [startApp](/en/api/startApp.html) and [preloadApp](/en/api/preloadApp.html) inherit these defaults and override any options passed explicitly.
