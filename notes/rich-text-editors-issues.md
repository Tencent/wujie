# wujie 富文本 / 文档编辑器相关 Issue 调研

> 基于对 [Tencent/wujie](https://github.com/Tencent/wujie) Issues 的多轮 GitHub API 检索整理（关键词：富文本、各编辑器库名、`getSelection` 等）。
>
> 检索时间：2026-06。仓库当前约 **461** 个 Open Issue；按「明确提到编辑器」口径，富文本相关约占 **3%～5%**。

---

## TL;DR

1. 去重后约 **21 条**明确与富文本/文档编辑器相关的 Issue（Open ~16，Closed ~5），涉及 **9 类**编辑器/库（wangEditor 族算 1 类）。
2. **wangEditor** 相关最多（约 12+ 条），共性根因集中在 `getSelection()` 代理、`instanceof Node` 跨 realm、`isCollapsed` 失真、事件 target 指向 `WUJIE-APP`、降级与非降级行为差异。
3. **TinyMCE** 的 `#224` / `#974` 为同一问题重复上报（skin.min.css 未加载）；**框架层** `#770`（多子应用 `getSelection()` 指向第一个 shadowRoot）与大量富文本 issue 高度相关。
4. 社区常用缓解：`wujie-polyfill`、自定义 `plugins`（`jsBeforeLoaders` / `jsLoader`）、wangEditor 官方微前端 iframe 沙箱 PR、已合并的 `#792` 全局对象缓存修复。

---

## 统计概览

| 维度 | 数量 |
| --- | --- |
| 明确与富文本/文档编辑器相关的 Issue（去重后） | 约 21 条 |
| 其中 Open | 约 16 条 |
| 其中 Closed | 约 5 条 |
| 涉及不同编辑器/库 | 9 类（wangEditor 族算 1 类） |

### 计数说明

- [#224](https://github.com/Tencent/wujie/issues/224) 与 [#974](https://github.com/Tencent/wujie/issues/974) 为同一 TinyMCE 问题重复上报，计数时算 **2 条 issue、1 类问题**。
- [#791](https://github.com/Tencent/wujie/issues/791)、[#656](https://github.com/Tencent/wujie/issues/656)、[#598](https://github.com/Tencent/wujie/issues/598) 偏方案汇总/经验贴，仍计入富文本相关。
- [#770](https://github.com/Tencent/wujie/issues/770) 为框架层 `getSelection()` 问题，但大量富文本 issue 的根因与此相关，单独列出。
- **未计入**：[#996](https://github.com/Tencent/wujie/issues/996)（主诉子应用空白 div，仅代码里出现 Quill）、[#256](https://github.com/Tencent/wujie/issues/256)（通用 `instanceof`，非专指富文本）。

---

## 按富文本库分类清单

### 1. wangEditor / @wangeditor（最多，约 12+ 条）

| Issue | 状态 | 问题摘要 |
| --- | --- | --- |
| [#479](https://github.com/Tencent/wujie/issues/479) | Closed | wangEditor 无法修改/复制粘贴；Quill 工具栏报错 |
| [#489](https://github.com/Tencent/wujie/issues/489) | Closed | 降级模式 `degrade: true` 下无法复制粘贴，光标总在首位 |
| [#218](https://github.com/Tencent/wujie/issues/218) | Open | 无法修改已有内容，聚焦后不能删除 |
| [#450](https://github.com/Tencent/wujie/issues/450) | Open | `Cannot resolve a Slate range from DOM range`，疑似走了主应用 document |
| [#513](https://github.com/Tencent/wujie/issues/513) | Open | v5.1.23 快速输入失焦（含 plugins workaround） |
| [#598](https://github.com/Tencent/wujie/issues/598) | Open | 降级模式 plugins 处理方案（非降级不适用） |
| [#638](https://github.com/Tencent/wujie/issues/638) | Open | Safari 下 `jsBeforeLoader` 偶发不执行（wangEditor 适配分支） |
| [#656](https://github.com/Tencent/wujie/issues/656) | Open | vue2+vite：子应用 index.html 引入；主应用注册会导致图片无法拖拽缩放 |
| [#791](https://github.com/Tencent/wujie/issues/791) | Open | wangEditor/Slate 方案汇总（wujie-polyfill、patch 等） |
| [#906](https://github.com/Tencent/wujie/issues/906) | Open | 基座 Vue3 + 子应用 Vue2，编辑区无法操作 |
| [#933](https://github.com/Tencent/wujie/issues/933) | Open | @wangeditor-next 全屏仅子应用内，无法盖住主应用（fixed 局限） |

**共性根因（社区讨论）：** Selection / `getSelection()` 代理、`instanceof Node`、`isCollapsed` 判断、事件 target 指向 `WUJIE-APP`、降级与非降级行为差异。

---

### 2. TinyMCE（2 条，同一问题）

| Issue | 状态 | 问题摘要 |
| --- | --- | --- |
| [#224](https://github.com/Tencent/wujie/issues/224) | Open | 子应用内未加载 `skin.min.css`，编辑器不显示 |
| [#974](https://github.com/Tencent/wujie/issues/974) | Open | 同上（较新重复 issue） |

**根因方向：** script 加载 + `tinymce.init` 时，子应用环境未自动注入皮肤 CSS；部分库会先 `appendChild(link)` 再设置 `href`，需 wujie 对延迟 href 的 `<link>` 做监听处理。相对路径可能被解析到主应用 origin，init 时建议使用绝对地址。

---

### 3. Quill / @vueup/vue-quill（2 条）

| Issue | 状态 | 问题摘要 |
| --- | --- | --- |
| [#182](https://github.com/Tencent/wujie/issues/182) | Open | 输入多行后回车再插图片，前面文字丢失 |
| [#479](https://github.com/Tencent/wujie/issues/479) | Closed | 工具栏点击控制台报错（与 wangEditor 同帖） |

---

### 4. CKEditor 5（1 条）

| Issue | 状态 | 问题摘要 |
| --- | --- | --- |
| [#768](https://github.com/Tencent/wujie/issues/768) | Closed | 修改 URL query 重载后光标异常（Chrome/Edge）；指向 `getSelection()` |

**关联修复：** [PR #792](https://github.com/Tencent/wujie/pull/792)（多子应用全局对象缓存）。

---

### 5. Tiptap（1 条）

| Issue | 状态 | 问题摘要 |
| --- | --- | --- |
| [#858](https://github.com/Tencent/wujie/issues/858) | Open | 第二次打开子应用后，中文输入法 `@` 变 `@@`；`window.getSelection()` 恒为 `None` |

---

### 6. braft-editor（Draft.js 封装，2 条）

| Issue | 状态 | 问题摘要 |
| --- | --- | --- |
| [#532](https://github.com/Tencent/wujie/issues/532) | Open | 光标总在首位，无法删改/换行；刷新后短暂正常 |
| [#818](https://github.com/Tencent/wujie/issues/818) | Closed | iOS Safari：`InvalidStateError: extend() requires a Range...` |

---

### 7. Draft.js（1 条）

| Issue | 状态 | 问题摘要 |
| --- | --- | --- |
| [#953](https://github.com/Tencent/wujie/issues/953) | Open | 光标一直在首位（与 braft 类问题类似） |

---

### 8. Slate（无独立标题 issue，在汇总中）

| Issue | 状态 | 问题摘要 |
| --- | --- | --- |
| [#791](https://github.com/Tencent/wujie/issues/791) | Open | 通过 patch Slate + wujie + polyfill 插件临时可用 |
| [#450](https://github.com/Tencent/wujie/issues/450) | Open | wangEditor 底层 Slate 报 `Cannot resolve a Slate range from DOM range` |

---

### 9. OnlyOffice（在线文档，1 条）

| Issue | 状态 | 问题摘要 |
| --- | --- | --- |
| [#1083](https://github.com/Tencent/wujie/issues/1083) | Open | 主应用正常，子应用不展示或展示不全；怀疑沙箱阻隔内置 API |

---

### 10. 框架层（影响多数富文本，1 条）

| Issue | 状态 | 问题摘要 |
| --- | --- | --- |
| [#770](https://github.com/Tencent/wujie/issues/770) | Open | 多子应用时 `getSelection()` 始终指向第一个 shadowRoot |

与 [#768](https://github.com/Tencent/wujie/issues/768)、[#858](https://github.com/Tencent/wujie/issues/858) 等高度相关。

---

## 问题类型归纳

### 高频根因

| 根因 | 主要影响库 |
| --- | --- |
| `getSelection` / Selection 代理错误 | wangEditor、CKEditor5、Tiptap、braft / Draft.js |
| `instanceof Node` / `HTMLElement` / `DataTransfer` 跨 realm | wangEditor、Slate |
| `isCollapsed` 等 Selection API 失真 | wangEditor |
| 资源加载：CSS / 皮肤文件 | TinyMCE |
| 降级模式 `degrade` 行为差异 | wangEditor |
| 事件 target 指向 `WUJIE-APP` | wangEditor |
| 沙箱 / API 访问限制 | OnlyOffice |
| 多子应用 Selection 指向错误 shadowRoot | 框架层（#770） |

### 问题分布（按库）

```
wangEditor  ████████████████████  最多（~12+）
TinyMCE     ███                   2（同一问题）
Quill       ███                   2
braft       ███                   2
CKEditor5   ██                    1
Tiptap      ██                    1
Draft.js    ██                    1
OnlyOffice  ██                    1
框架层      ██                    1（#770，影响面广）
```

---

## 社区常用缓解方向

> 来自 issue 讨论，**非官方修复**；实施前需结合具体子应用栈验证。

| 方向 | 说明 |
| --- | --- |
| [wujie-polyfill](https://github.com/Tencent/wujie-polyfill) | `selection`、`eventTarget` 等插件 |
| 自定义 `plugins` | `jsBeforeLoaders` 重写 Selection / DataTransfer；`jsLoader` 替换 `instanceof`、`isCollapsed` |
| wangEditor 官方 | 支持微前端 iframe 沙箱的 PR（[#791](https://github.com/Tencent/wujie/issues/791) 有链接） |
| 多子应用 | 关注 [#792](https://github.com/Tencent/wujie/pull/792) 已合并的全局对象缓存修复 |
| TinyMCE | init 时使用绝对 `skin_url` / `content_css`；确保 wujie 对延迟 href 的 `<link>` 能正确加载 |

---

## 与本仓库 demo / 修复的关联

| 项 | 位置 / 说明 |
| --- | --- |
| 富文本示例路由 | `examples/vue2/src/views/RichText.vue` |
| wangEditor demo | `examples/vue2/src/components/rich-text/WangEditorDemoBlock.vue` |
| isCollapsed 验证 demo | `RichText.vue` — 「isCollapsed 判断正常」；`WangEditorDemoBlock` 的 `showSelectionPanel` |
| TinyMCE demo | `examples/vue2/src/components/rich-text/TinyMceDemoBlock.vue` |
| 延迟 href 的 `<link>` 处理 | `packages/wujie-core/src/effect.ts` — `deferStyleSheetByHref` |
| `DataTransfer` instanceof 跨 realm | `packages/wujie-core/src/iframe.ts` — `patchInstanceofAcrossRealms`；降级模式见 `examples/main-vue/src/plugins/wangEditor.js` |
| 降级 `getSelection` / `ownerDocument` | `packages/wujie-core/src/iframe.ts` — 指向 `sandbox.document`（渲染 iframe），修复 wangEditor LO/RO（#513） |
| 降级 `patchDegradeInstanceofAcrossRealms` | `iframe.ts` + `sandbox.ts` — 渲染/执行 iframe 双向 instanceof；在 `document` 就绪后 patch，不改动 `createElement` |
| 复制粘贴 demo | `RichText.vue` — 「复制粘贴（#479）」 |
| 快速输入不失焦 demo | `RichText.vue` — 「快速输入不失焦（#513）」；含降级 LO/RO 面板 |
| 关联 issue | [#218](https://github.com/Tencent/wujie/issues/218)、[#479](https://github.com/Tencent/wujie/issues/479)、[#489](https://github.com/Tencent/wujie/issues/489)、[#513](https://github.com/Tencent/wujie/issues/513)、[#450](https://github.com/Tencent/wujie/issues/450)、[#770](https://github.com/Tencent/wujie/issues/770)、[#224](https://github.com/Tencent/wujie/issues/224)、[#974](https://github.com/Tencent/wujie/issues/974) |
