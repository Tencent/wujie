# 无界微前端类型定义

- Vue组件
  - vue <= 2.6 引用 `vue26.d.ts`
  - vue 2.7 引用 `vue27.d.ts`
  - vue >= 3 引用 `vue3.d.ts`
- JSX组件引用 `jsx.d.ts`
- 全局变量引用 `global.d.ts`

**注意，在与 vue < 2.7 一起使用时，需要安装 `@vue/runtime-dom`**

`tsconfig.json` 或 `jsconfig.json` 示例：

```json
{
  "compilerOptions": {
    "types": [
      "wujie-typings/global",
      "wujie-typings/jsx"
    ]
  }
}
```
