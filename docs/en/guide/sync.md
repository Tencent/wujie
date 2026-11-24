# Route Sync

## Route Sync

Route synchronization encodes the sub-app's `path + query + hash` using `window.encodeURIComponent` and attaches it as a query parameter on the main app's URL, using the sub-app's [name](/en/api/startApp.html#name) as the query key.

With route sync enabled, refreshing the browser or sharing the URL preserves the sub-app's route state. Even when multiple sub-apps are mounted on the same page, Wujie synchronizes all of them so browser refresh, back, and forward navigation work seamlessly.

Enable this feature via the [sync](/en/api/startApp.html#sync) option.

::: warning Note
A Wujie instance only reads the route back from the main app's URL query parameters during its **initial instantiation**. After initialization, synchronization is strictly one-way from the sub-app to the main app's URL.
:::

## Short Path

Wujie supports short path aliases so that long sub-app URLs can be shortened when synced to the main app's URL. Configure [prefix](/en/api/startApp.html#prefix) to define prefix mappings. When matching paths, Wujie selects the **longest matching prefix**.

Once matched, the path is attached to the main app's URL in the format `{shortKey} + remainingPath`. Note that prefixes should not include the domain name.

**Example**

```vue
<WujieVue
  width="100%"
  height="100%"
  name="xxx"
  :url="xxx"
  :sync="true"
  :prefix="{
    prod: '/example/prod',
    test: '/example/test',
    prodId: '/example/prod/debug?id=',
  }"
></WujieVue>
```

With this configuration, sub-app paths are transformed as follows:

```
/example/prod/hello  => {prod}/hello

/example/test/name => {test}/name

/example/prod/debug?id=5&age=10 => {prodId}5&age=10
```
