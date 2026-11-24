Wujie injects the `$wujie` object into every sub-app, accessible via `$wujie` or `window.$wujie`.

# $wujie

- **Type:**

  ```typescript
  {
    bus: EventBus;
    shadowRoot?: ShadowRoot;
    props?: { [key: string]: any };
    location?: Object;
  }
  ```

## $wujie.bus

Same as [bus](/en/api/bus.html).

## $wujie.shadowRoot

- **Type:** [ShadowRoot](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot)

The `Shadow DOM` root where the sub-app is rendered.

## $wujie.props

- **Type:** `{ [key: string]: any }`

Data and callbacks injected by the main app.

## $wujie.location

- **Type:** `Object`

- Because the sub-app's `iframe` runs on the main app's origin, native `location.host` returns the main app's host. Wujie exposes the sub-app's true `location` on `$wujie.location`.

- For `Vite` sub-apps (whose scripts use `type="module"`), Wujie cannot wrap ES module scripts in a [closure](/en/question/#_2-third-party-package-imported-but-throws-error-at-runtime) to proxy `location`. Replace all references to `window.location.host` with `$wujie.location.host` in Vite sub-apps.

- When a sub-app runs in Degrade Mode, `Proxy` is unavailable and `location` cannot be proxied. Replace references to `window.location.host` with `$wujie.location.host`.

- For non-Vite sub-apps running in standard mode, Wujie proxies `window.location` automatically, so no code changes are required.
