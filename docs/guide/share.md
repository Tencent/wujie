
# 应用共享

一个微前端系统可能同时运行多个子应用，不同子应用之间可能存在相同的包依赖，那么这个依赖就会在不同子应用中重复打包、重复执行造成性能和内存的浪费

这里提供一种工程上的策略结合无界的插件能力，可以有效的解决这个问题

以这个场景举例：主应用使用到了`ant-design-vue`，子应用 A 也使用到了相同版本的`ant-design-vue`

## 子应用只运行在微前端框架

主应用：

1. 修改主应用的`index.js`，将共享包挂载到主应用的`window`对象上

```javascript
// index.js
import Antdv from "ant-design-vue";

// 将需要共享的包挂载到主应用全局
window.Antdv = Antdv;
```

2. 加载子应用时注入插件，将主应用的`Antdv`赋值到子应用的`window`对象上

```vue
<WujieVue
  name="A"
  url="xxxxx"
  :plugins="[{ jsBeforeLoaders: [{ content: 'window.Antdv = window.parent.Antdv' }] }]"
></WujieVue>
```

子应用: `webpack` 设置 `externals`

```javascript
module.exports = {
  externals: {
    "ant-design-vue": {
      root: "Antdv",
      commonjs: "Antdv",
      commonjs2: "Antdv",
      amd: "Antdv",
    },
  },
};
```

## 子应用需要单独运行

子应用如果需要单独运行的话，由于上面步骤将`Antdv` `externals` 掉了所以子应用运行会报错，为了让子应用可以单独运行需要做如下步骤：

1. 此时需要将子应用 `externals` 掉的包单独打成一个包（比如：`A.bundle.js`），这个包需要打包`Antv`并将其注入到`window`中

2. 在子应用的`html`的`head`中将`A.bundle.js`放进去

```html
<head>
  <script src="xxxx/A.bundle.js" ignore >
<head>
```

由于添加了`ignore`标志，无界执行子应用的这个标签时会忽略，但子应用单独运行时不受`ignore`影响会执行，当然也可以不添加`ignore`标志而采用无界的插件将这个脚本排除在外：

```vue
<WujieVue
  name="A"
  url="xxxxx"
  :plugins="[
    { jsExcludes: ['xxxx/A.bundle.js'], jsBeforeLoaders: [{ content: 'window.Antdv = window.parent.Antdv' }] },
  ]"
></WujieVue>
```
