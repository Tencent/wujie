# Graceful Degradation

Wujie provides a transparent fallback mechanism for browsers that do not support modern APIs.

In standard mode, the sub-app's DOM lives inside a Web Component and its JavaScript runs inside an `iframe`, with `Proxy` bridging DOM operations from the `iframe` to the Web Component. Because legacy browsers such as IE do not support Web Components or `Proxy`, Wujie falls back to using a second `iframe` in place of the Web Component and `Object.defineProperty` in place of `Proxy`.

::: warning Note

Wujie does not bundle ES6 polyfills because browser support targets vary by project. If you need to support older browsers, include the required polyfills via Babel in your own build setup.

:::

## Pros

1. Automatic detection — Wujie automatically degrades when the browser lacks Web Components or `Proxy` support.

2. Strict application isolation is preserved even in Degrade Mode.

3. Zero code changes required — existing preloading, Keep-Alive mode, and communication code continue to work identically across standard and degraded environments.

4. Opt-in forced degradation — even on modern browsers, you can explicitly set [degrade](/en/api/startApp.html#degrade) to `true` if you prefer rendering the sub-app's DOM inside an `iframe`.

## Cons

1. Modals and popups are constrained inside the sub-app's `iframe` and cannot cover the full viewport.

2. Without `Proxy`, Wujie cannot intercept `window.location`, so reading `window.location.host` returns the main app's host. Use [$wujie.location](/en/api/wujie.html#wujie-location) to retrieve the sub-app's actual host instead.
