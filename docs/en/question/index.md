---
sidebarDepth: 2
collapsable: false
---

# FAQ

## 1. Error Fetching Sub-app Resources

Error message: `Access to fetch at *** from origin *** has been blocked by CORS policy: No 'Access-Control-Allow-Origin'`

**Cause:** The sub-app server does not allow cross-origin requests, or the resource request requires cookies that are not being sent.

**Solution:**

1. If the issue is missing CORS headers, see [Prerequisites](/en/guide/start.html#prerequisites).

2. If the issue is missing cookies (commonly seen when requests return `302` redirects to a login page), pass a custom [fetch](/en/api/startApp.html#fetch) with `credentials: "include"` so cookies are attached.

::: warning Warning
When `credentials` is set to `"include"`, the server cannot return `Access-Control-Allow-Origin: *` (see [MDN: Credentialed requests and wildcards](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#credentialed_requests_and_wildcards)). Echo the request origin explicitly on the server instead:

```javascript
ctx.set("Access-Control-Allow-Origin", ctx.headers.origin);
```

:::

## 2. Third-Party Package Imported but Throws Error at Runtime

**Cause:** Normally, top-level scripts execute in the global scope so variables declared with `var xxx` attach directly to `window`. However, Wujie wraps sub-app scripts in a closure in order to proxy `location`. As a result, `var xxx` stays scoped inside that closure rather than attaching to `window`, and asynchronous chunks executed in another closure cannot read it.

**Solution:**

1. Explicitly attach the global variable to `window` (e.g., `window.xxx = ...`), or configure Webpack's [`output.libraryTarget`](https://webpack.js.org/configuration/output/#outputlibrarytarget) to `"window"`.

2. If you cannot modify the third-party package, use the [js-loader plugin](/en/guide/plugin.html#js-loader) to rewrite `xxx=` to `window.xxx=` at runtime.

## 3. Sub-app Custom Fonts Do Not Take Effect

**Cause:** `@font-face` rules declared inside Shadow DOM are not loaded by browsers (see [mdn/interactive-examples#887](https://github.com/mdn/interactive-examples/issues/887)).

**Handled by Wujie:** Wujie automatically hoists sub-app `@font-face` rules outside the Shadow DOM. Just ensure custom font family names do not collide between the main app and sub-apps to avoid overrides.

## 4. Popover / Dropdown Positioning Is Incorrect

**Cause:** Libraries such as `element-plus` use `popper.js` v2, which walks ancestor elements up to `window.visualViewport` to compute offsets. Because a sub-app's DOM is mounted inside `shadowRoot`, scroll offsets relative to `window.visualViewport` are miscalculated.

**Solution:** Set `position: relative` on the sub-app's `body`.

## 5. e.target Becomes wujie-app in Async Event Handlers

**Cause:** This is standard browser Shadow DOM event retargeting behavior (see [Stack Overflow](https://stackoverflow.com/questions/63607966/event-target-changed-in-settimeout-in-shadow-dom)).

**Solution:** Resolve the real target inside asynchronous handlers using:
`(e.target.shadowRoot && e.composed) ? (e.composedPath()[0] || e.target) : e.target`

## 6. Relative URLs Inside CSS Resolve Against the Main App Domain

**Handled by Wujie:** Wujie automatically rewrites relative URLs in `<style>` tags and external CSS files into absolute URLs based on the sub-app origin.

## 7. Error Loading Remote Modules with Module Federation

**Cause:** Same as [FAQ #2](#_2-third-party-package-imported-but-throws-error-at-runtime) — closure-wrapped script execution prevents global variables declared in one script from being visible in another.

**Solution:** Set `library.type` to `"window"` in `ModuleFederationPlugin`:

```javascript
library: { type: "window", name: "same-as-plugin-name" }
```

## 8. Sub-app iframe Loads and Executes Main App Assets During Initialization

**Cause:** See [Tencent/wujie#54](https://github.com/Tencent/wujie/issues/54).

**Solution:**

- Serve an empty endpoint on the main app's origin (for example, `https://host/empty` returning an empty 200 response) and pass [attrs](/en/api/startApp.html#attrs) as `{ src: "https://host/empty" }` so the sandbox iframe loads that empty URL.
- Alternatively, place `<script>if (window.parent !== window) { window.stop(); }</script>` as the first element inside the main app's `<head>` to prevent main app scripts from running inside the sandbox iframe.

## 9. Sub-app window Is a Proxy — How to Get the Real window Object

**Cause:** See [Tencent/wujie#63](https://github.com/Tencent/wujie/issues/63) for why Wujie proxies `window`.

**Solution:**

- Use `window.__WUJIE_RAW_WINDOW__` to access the native unproxied `window` object. See [Global Variables](/en/guide/variable.html#wujie-raw-window).

## 10. DOMException: Blocked a frame with origin from accessing a cross-origin frame

**Possible Causes:** The sub-app's iframe sandbox has been navigated away or replaced. Three common causes:

1. The sub-app runs inside an iframe whose `src` is the main app's `host`, and that URL triggers a redirect (such as a `302` to a cross-origin SSO login page), replacing the sandbox.
2. The sub-app is built with `Vite` and assigns to `window.location.href`, navigating the iframe away.
3. A script configured in [jsIgnores](/en/guide/plugin.html#js-ignores) assigns to `window.location.href`.

**Solution:**

1. Provide a non-redirecting empty path on the main app's origin (such as `https://host/empty`) and set [attrs](/en/api/startApp.html#attrs) to `{ src: "https://host/empty" }`.
2. In `Vite` sub-apps, use `window.$wujie.location` for all `location` operations.
3. In scripts listed under `jsIgnores`, use `window.$wujie.location` for all `location` operations.

## 11. Sub-app Relative Asset URLs Request the Main App Domain

**Cause:** In standard (non-degrade) mode, the sub-app's DOM is mounted inside the main app document's `shadowRoot`, so relative URLs on elements like images and videos resolve against the main app's URL instead of the sub-app's.

**Handled by Wujie:** Relative URLs on the following element attributes are automatically resolved to the sub-app's origin — whether written in HTML templates or set dynamically via `setAttribute`, property assignment (e.g., `img.src = ...`), or `innerHTML` (including `v-html`):

| Element                           | Attribute            |
| --------------------------------- | -------------------- |
| `img`, `source`                   | `src`, `srcset`      |
| `video`                           | `src`, `poster`      |
| `audio`, `track`, `iframe`, `embed` | `src`              |
| `object`                          | `data`               |
| `a`, `link`                       | `href`               |
| `script`                          | `src`                |
| SVG `image`                       | `href`, `xlink:href` |

Fragment-only URLs starting with `#` are left untouched. Versions `2.1.1` and earlier only covered `src` / `href` on `img`, `a`, `source`, `link`, `script`, `video`, and `audio` and did not rewrite `innerHTML`; upgrading covers the full table above.

**Still requires manual handling:** `url()` inside inline `style` attributes (for `<style>` blocks and external CSS files, see [FAQ #6](#_6-relative-urls-inside-css-resolve-against-the-main-app-domain)), as well as HTML inserted via `insertAdjacentHTML`, `outerHTML`, or similar APIs.

**Recommended Best Practice:** Configure your build so asset URLs do not depend on document base-URL resolution, using either approach below:

1. Use absolute asset URLs with the sub-app origin. For Webpack sub-apps, import `./config` at the very top of your `main` entry file with the snippet below; for Vite sub-apps, set `base` to the full sub-app origin URL:

```javascript
if (window.__POWERED_BY_WUJIE__) {
  // eslint-disable-next-line
  window.__webpack_public_path__ = window.__WUJIE_PUBLIC_PATH__;
}
```

2. Configure a same-origin reverse proxy on the main app to forward sub-app asset paths to the sub-app server (ensure asset path prefixes do not collide with the main app).

## 12. Vite 4 Sub-app Loses Styles When Switching

See [Tencent/wujie#434](https://github.com/Tencent/wujie/issues/434#issuecomment-1614089196) for the root cause and workaround.
