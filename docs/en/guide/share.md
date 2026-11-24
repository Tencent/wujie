# App Sharing

In a micro-frontend system running multiple sub-apps simultaneously, different sub-apps often share common library dependencies. Bundling and executing the same dependency in every sub-app wastes both bandwidth and memory.

Below is an engineering pattern combining Wujie's plugin system with bundler externals to share common dependencies cleanly.

Suppose both the main app and Sub-app A depend on the same version of `lodash`.

::: warning Warning
Dependency sharing works because the main app and the sub-app's iframe sandbox share the same origin and memory space. Third-party UI component libraries with DOM or global side effects may not be safely shareable.
:::

## Sub-app Runs Only Inside the Micro-Frontend

In the main app:

1. Attach the shared library to `window` in the main app's entry file (`index.js`):

```javascript
// index.js
import lodash from "lodash";

// Expose shared dependency on the main app's global window
window.lodash = lodash;
```

2. Use a Wujie plugin when loading the sub-app to forward `window.parent.lodash` into the sub-app's `window`:

```vue
<WujieVue
  name="A"
  url="xxxxx"
  :plugins="[{ jsBeforeLoaders: [{ content: 'window.lodash = window.parent.lodash' }] }]"
></WujieVue>
```

In the sub-app, configure `externals` in Webpack:

```javascript
module.exports = {
  externals: {
    lodash: {
      root: "lodash",
      commonjs: "lodash",
      commonjs2: "lodash",
      amd: "lodash",
    },
  },
};
```

## Sub-app Also Needs to Run Standalone

If the sub-app must also run independently outside Wujie, externalizing `lodash` without providing it standalone will cause a runtime error. To support standalone execution:

1. Bundle the externalized dependencies into a standalone script (for example, `A.bundle.js`) that attaches `lodash` to `window`.

2. Include `A.bundle.js` in the sub-app's HTML `<head>` with the `ignore` attribute:

```html
<head>
  <script src="xxxx/A.bundle.js" ignore></script>
</head>
```

Because of the `ignore` attribute, Wujie skips this `<script>` tag when running inside the micro-frontend, while the browser still loads it normally when the sub-app runs standalone. Alternatively, you can omit `ignore` and exclude the script via Wujie's plugin configuration:

```vue
<WujieVue
  name="A"
  url="xxxxx"
  :plugins="[
    { jsExcludes: ['xxxx/A.bundle.js'], jsBeforeLoaders: [{ content: 'window.lodash = window.parent.lodash' }] },
  ]"
></WujieVue>
```
