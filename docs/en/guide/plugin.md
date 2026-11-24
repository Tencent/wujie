# Plugin System

![Wujie plugin lifecycle diagram](https://vfiles.gtimg.cn/wuji_dashboard/wupload/xy/test_wuji_damy/50LRt2ig.jpeg)

Wujie's plugin system lets you transform and intercept sub-app code at runtime without modifying the sub-app's source repository. See the [plugins API](/en/api/startApp.html#plugins) for type definitions.

## html-loader

Modifies the sub-app's HTML template string at runtime.

- **Example**

```javascript
const plugins = [
  {
    // Replace "aaa" with "bbb" in the sub-app's HTML template
    htmlLoader: (code) => {
      return code.replace("aaa", "bbb");
    },
  },
];
```

## js-excludes

Excludes specific JavaScript files so they are **not** executed when loading the sub-app.

- **Example**

```javascript
const plugins = [
  // Scripts matching "http://xxxxx.js" or /test\.js/ will not be executed
  { jsExcludes: ["http://xxxxx.js", /test\.js/] },
];
```

## js-ignores

Allows specific JavaScript files to be loaded natively by the sub-app via `<script>` tags rather than fetched and proxied by Wujie (useful when external scripts do not support CORS).

- **Example**

```javascript
const plugins = [
  // Scripts matching "http://xxxxx.js" or /test\.js/ will be loaded directly by the sub-app
  { jsIgnores: ["http://xxxxx.js", /test\.js/] },
];
```

::: warning Warning
Because scripts listed in `jsIgnores` are loaded directly without `location` proxying, any assignment to `window.location.href` inside them must be replaced with `window.$wujie.location.href`; otherwise, the sub-app's iframe sandbox will be navigated away and destroyed.
:::

## js-before-loaders

Runs before all JavaScript files in the sub-app's HTML to:

1. Load an external script (`src="http://xxxxx"`) inside the sub-app.
2. Run an inline script (`<script>content</script>`) inside the sub-app.
3. Execute a callback function.

- **Example**

```javascript
const plugins = [
  {
    // Executed before all sub-app scripts
    jsBeforeLoaders: [
      // Inject an external script
      { src: "http://xxxx.js" },
      // Inject an inline script
      { content: 'console.log("test")' },
      // Execute a callback and log the sub-app name
      {
        callback(appWindow) {
          console.log("js-before-loader-callback", appWindow.__WUJIE.id);
        },
      },
    ],
  },
];
```

## js-loader

Transforms the source code of sub-app JavaScript files at runtime.

- **Example**

```javascript
const plugins = [
  {
    // Replace "aaa" with "bbb" in aaa.js
    // code: script source, url: script URL ("" for inline scripts), base: sub-app base URL
    jsLoader: (code, url, base) => {
      if (url === "aaa.js") return code.replace("aaa", "bbb");
    },
  },
];
```

::: warning Warning
- ES module (`type="module"`) scripts are not processed by `jsLoader`.
- Scripts matched by `jsIgnores` are not processed by `jsLoader`.
:::

## js-after-loaders

Runs after all JavaScript files in the sub-app's HTML to:

1. Load an external script (`src="http://xxxxx"`) inside the sub-app.
2. Run an inline script (`<script>content</script>`) inside the sub-app.
3. Execute a callback function.

- **Example**

```javascript
const plugins = [
  {
    jsAfterLoaders: [
      // Inject an external script
      { src: "http://xxxx.js" },
      // Inject an inline script
      { content: 'console.log("test")' },
      // Execute a callback and log the sub-app name
      {
        callback(appWindow) {
          console.log("js-after-loader-callback", appWindow.__WUJIE.id);
        },
      },
    ],
  },
];
```

## css-excludes

Excludes specific CSS stylesheets so they are **not** loaded by the sub-app.

- **Example**

```javascript
const plugins = [
  // Stylesheets matching "http://xxxxx.css" or /test\.css/ will not be loaded
  { cssExcludes: ["http://xxxxx.css", /test\.css/] },
];
```

## css-ignores

Allows specific CSS stylesheets to be loaded natively by the sub-app via `<link>` tags rather than fetched by Wujie (useful when external stylesheets do not support CORS).

- **Example**

```javascript
const plugins = [
  // Stylesheets matching "http://xxxxx.css" or /test\.css/ will be loaded directly by the sub-app
  { cssIgnores: ["http://xxxxx.css", /test\.css/] },
];
```

## css-before-loaders

Runs before all stylesheets in the sub-app's HTML to:

1. Insert an external stylesheet (`src="http://xxxxx"`).
2. Insert an inline `<style>content</style>` block.

- **Example**

```javascript
const plugins = [
  {
    // Applied before all sub-app stylesheets
    cssBeforeLoaders: [
      // Insert an external stylesheet before HTML styles
      { src: "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" },
      // Insert an inline style before HTML styles
      { content: "img{width: 300px}" },
    ],
  },
];
```

## css-loader

Transforms the sub-app's CSS text at runtime.

- **Example**

```javascript
const plugins = [
  {
    // Dynamically transform CSS source
    // code: CSS source, url: stylesheet URL ("" for inline styles), base: sub-app base URL
    cssLoader: (code, url, base) => {
      console.log("css-loader", url, code.slice(0, 50) + "...");
      return code;
    },
  },
];
```

## css-after-loaders

Runs after all stylesheets in the sub-app's HTML to:

1. Insert an external stylesheet (`src="http://xxxxx"`).
2. Insert an inline `<style>content</style>` block.

- **Example**

```javascript
const plugins = [
  {
    cssAfterLoaders: [
      // Insert an external stylesheet after HTML styles
      { src: "https://cdn.jsdelivr.net/npm/bootstrap@4.6.1/dist/css/bootstrap.min.css" },
      // Insert an inline style after HTML styles
      { content: "img{height: 300px}" },
    ],
  },
];
```

## windowAddEventListenerHook

Callback invoked whenever the sub-app calls `window.addEventListener`.

- **Example**

Because the sub-app's DOM renders inside a Web Component while its JS runs inside an `iframe`, scrolling often happens on an outer container rather than the iframe `window`. Listening to `window` `scroll` events directly will not fire, so you can forward them to the scrolling container:

```javascript
const plugins = [
  {
    windowAddEventListenerHook(iframeWindow, type, handler, options) {
      container.addEventListener(type, handler, options);
    },
  },
];
```

## windowRemoveEventListenerHook

Callback invoked whenever the sub-app calls `window.removeEventListener`.

- **Example**

```javascript
const plugins = [
  {
    windowAddEventListenerHook(iframeWindow, type, handler, options) {
      container.addEventListener(type, handler, options);
    },
    windowRemoveEventListenerHook(iframeWindow, type, handler, options) {
      container.removeEventListener(type, handler, options);
    },
  },
];
```

## documentAddEventListenerHook

Callback invoked whenever the sub-app calls `document.addEventListener`.

- **Example**

Similarly, if the sub-app listens for `scroll` events on `document`, you can forward them to the outer scrolling container:

```javascript
const plugins = [
  {
    documentAddEventListenerHook(iframeWindow, type, handler, options) {
      container.addEventListener(type, handler, options);
    },
  },
];
```

## documentRemoveEventListenerHook

Callback invoked whenever the sub-app calls `document.removeEventListener`.

- **Example**

```javascript
const plugins = [
  {
    documentAddEventListenerHook(iframeWindow, type, handler, options) {
      container.addEventListener(type, handler, options);
    },
    documentRemoveEventListenerHook(iframeWindow, type, handler, options) {
      container.removeEventListener(type, handler, options);
    },
  },
];
```

## appendOrInsertElementHook

Callback invoked after the sub-app appends or inserts an element into `body` or `head`.

- **Example**

```javascript
const plugins = [
  {
    // element: the element actually inserted, iframeWindow: sub-app window, rawElement: original element
    appendOrInsertElementHook(element, iframeWindow, rawElement) {
      console.log(element, iframeWindow, rawElement);
    },
  },
];
```

## patchElementHook

Callback invoked after the sub-app creates a DOM element.

- **Example**

```javascript
const plugins = [
  {
    patchElementHook(element, iframeWindow) {
      console.log(element, iframeWindow);
    },
  },
];
```
