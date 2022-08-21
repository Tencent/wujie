<p align="center">
  <a href="https://wujie-micro.github.io/doc/" target="_blank">
    <img src="https://vfiles.gtimg.cn/wuji_dashboard/xy/test_wuji_damy/phFSuhUC.png" width="100" height="100" alt="logo">
  </a>
</p>

# wujie（无界）

无界微前端是一款基于 Web Components + iframe 微前端框架，具备成本低、速度快、原生隔离、功能强等一系列优点。

## 文档

动机：[动机](https://zhuanlan.zhihu.com/p/551206945)

文档详见：[文档](https://wujie-micro.github.io/doc/)

演示详见：[demo](https://wujie-micro.github.io/demo-main-vue/home)

## 背景

微前端已经是一个非常成熟的领域了，但开发者不管采用哪个现有方案，在适配成本、样式隔离、运行性能、页面白屏、子应用通信、子应用保活、多应用激活、vite 框架支持、应用共享等用户核心诉求都或存在问题、或无法提供支持。

Web Components 是一个浏览器原生支持的组件封装技术，可以有效隔离元素之间的样式，iframe 可以给子应用提供一个原生隔离的运行环境，相比自行构造的沙箱 iframe 提供了独立的 window、document、history、location，可以更好的和外部解耦。无界微前端采用 webcomponent + iframe 的沙箱模式，在实现原生隔离的前提下比较完善的解决了上述问题。

## 特性

1. 成本低
   - 主应用使用成本低
   - 子应用适配成本低
2. 速度快
   - 子应用首屏打开速度快
   - 子应用运行速度快
3. 原生隔离
   - css 样式通过 Web Components 可以做到严格的原生隔离
   - js 运行在 iframe 中做到严格的原生隔离
4. 功能强大
   - 支持子应用保活
   - 支持子应用嵌套
   - 支持多应用激活
   - 支持应用共享
   - 支持去中心化通信
   - 支持生命周期钩子
   - 支持插件系统
   - 支持 vite 框架
   - 兼容 IE9（需自行 babel 编译）

## 快速上手

### 直接使用

- 安装

```bash
npm install wujie -S
```

- 使用

```javascript
import { startApp } from "wujie";

startApp({ name: "唯一id", url: "子应用路径", el: "容器", sync: true });
```

### vue 框架

- 安装

```bash
# vue2 框架
npm i wujie-vue2 -S
# vue3 框架
npm i wujie-vue3 -S

```

- 引入

```javascript
// vue2
import WujieVue from "wujie-vue2";
// vue3
import WujieVue from "wujie-vue3";
Vue.use(WujieVue);
```

- 使用

```html
<WujieVue
  width="100%"
  height="100%"
  name="xxx"
  :url="xxx"
  :sync="true"
  :fetch="fetch"
  :props="props"
  :beforeLoad="beforeLoad"
  :beforeMount="beforeMount"
  :afterMount="afterMount"
  :beforeUnmount="beforeUnmount"
  :afterUnmount="afterUnmount"
></WujieVue>
```

### react 框架

- 安装

```bash
npm i wujie-react -S

```

- 引入

```javascript
import WujieReact from "wujie-react";
```

- 使用

```html
<WujieReact
  width="100%"
  height="100%"
  name="xxx"
  url="{xxx}"
  sync="{true}"
  fetch="{fetch}"
  props="{props}"
  beforeLoad="{beforeLoad}"
  beforeMount="{beforeMount}"
  afterMount="{afterMount}"
  beforeUnmount="{beforeUnmount}"
  afterUnmount="{afterUnmount}"
></WujieReact>
```

## 常见问题

[详见文档](https://wujie-micro.github.io/doc/question/#_1%E3%80%81%E8%AF%B7%E6%B1%82%E8%B5%84%E6%BA%90%E6%8A%A5%E9%94%99)

## 本地开发

运行以下脚本，可以本地开发无界微前端框架，支持实时编译调试开发。

```bash
npm i                   // 安装包依赖
npm run start           // 启动所有应用
```
