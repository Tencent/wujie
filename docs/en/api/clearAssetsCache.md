# clearAssetsCache

- **Type:** `Function`

- **Parameters:** `host?: string | string[]`

- **Returns:** `void`

Clears Wujie's module-level asset caches, including `styleCache`, `scriptCache`, and `embedHTMLCache`. Unmounting or destroying a sub-app (`destroyApp`) does not automatically clear these caches. When switching between sub-apps across hosts or after hot deployments, stale cached assets may still be served; call this API to explicitly invalidate them.

::: tip Use Cases

- Forcing a fresh fetch of HTML / JS / CSS after a sub-app's static assets have been redeployed.
- Hosting multiple sub-apps on different hosts under the same main app and clearing the cache for a specific host when switching.
- Troubleshooting stale-page issues caused by cached static assets.

:::

## host

- **Type:** `string | string[]`

- **Details:**

  - Omitted: clears all cached assets.
  - Single host string (e.g., `"https://a.com"`): clears only cache entries whose keys start with that prefix.
  - Array of host strings: clears cache entries matching any of the given prefixes.

## Example

```javascript
import { clearAssetsCache } from "wujie";

// Clear all cached assets
clearAssetsCache();

// Clear cache for a specific host only
clearAssetsCache("https://a.com");

// Batch clear multiple hosts
clearAssetsCache(["https://a.com", "https://b.com"]);
```

::: warning Note

This API only clears Wujie's internal asset loader caches and does **not** destroy any active sub-app instances. To perform a full rebuild of a sub-app, use [refreshApp](/en/api/refreshApp.html) or [destroyApp](/en/api/destroyApp.html) + [startApp](/en/api/startApp.html).

:::
