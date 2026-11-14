# clearAssetsCache

- **类型：** `Function`

- **参数：** `host?: string | string[]`

- **返回值：** `void`

清空无界模块级资源缓存，包括 `styleCache`、`scriptCache`、`embedHTMLCache`。子应用卸载（`destroyApp`）时不会自动清理这些缓存；多 host 子应用切换或热更新场景下，旧资源可能继续被命中，可调用此 API 主动失效。

::: tip 使用场景

- 子应用静态资源热更新后，需要强制重新拉取 html / js / css
- 同一主应用下挂载多个不同 host 的子应用，切换后希望清理指定 host 的缓存
- 排查资源缓存导致的「页面不更新」问题

:::

## host

- **类型：** `string | string[]`

- **详情：**

  - 不传参：清空全部资源缓存
  - 传入单个 host（如 `"https://a.com"`）：只清空缓存 key 以该前缀匹配的条目
  - 传入 host 数组：批量清理多个前缀

## 示例

```javascript
import { clearAssetsCache } from "wujie";

// 清空全部缓存
clearAssetsCache();

// 只清理指定 host
clearAssetsCache("https://a.com");

// 批量清理
clearAssetsCache(["https://a.com", "https://b.com"]);
```

::: warning 注意

此 API 仅清理无界内部的资源加载缓存，不会销毁子应用实例。若需全量重建子应用，请使用 [refreshApp](/api/refreshApp.html) 或 [destroyApp](/api/destroyApp.html) + [startApp](/api/startApp.html)。

:::
