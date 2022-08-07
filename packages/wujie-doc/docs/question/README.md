---
sidebarDepth: 2
collapsable: false
---

## 1、请求资源报错

请求报错为：`Access to fetch at *** from origin *** has been blocked by CORS policy: No 'Access-Control-Allow-Origin'`

**原因：** 子应用跨域或者请求子应用资源没有携带 cookie

**解决方案：**

1. 如果是跨域导致的错误，参考 [前提](/guide/start.html#前提)

2. 如果是求资源没有携带 cookie（一般请求返回码是 302 跳转到登录页），需要通过自定义 [fetch](/api/startApp.html#fetch) 将`fetch`的`credentials`设置为`include`，这样`cookie`才会携带上去

::: warning 警告
当`credentials`设置为`include`时，服务端的`Access-Control-Allow-Origin`不能设置为`*`，原因[详见](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#credentialed_requests_and_wildcards)，服务端可以这样设置：

```javascript
ctx.set("Access-Control-Allow-Origin", ctx.headers.origin);
```

:::

## 2、第三方包已经引入，使用时报错

**原因：** 脚本本来在全局执行，此时第三方包定义的全局变量（比如`var xxx`）会直接挂载到`window`上。但是`wujie`将所有的脚本都包裹在一个闭包内运行方便劫持修改`location`，所以这些全局变量会留在闭包内，无法挂载到`window`上，子应用的异步脚本会在另一个闭包内运行，所以拿不到这些全局变量。

**解决方案：**

1、方式一：需要将第三方包定义的全局变量显式的挂载到`window`上（比如`window.xxx`），或者修改第三方包`webpack`的[`output.libraryTarget`](https://webpack.docschina.org/configuration/output/#outputlibrarytarget)

2、方式二：如果用户不想修改代码可以通过[插件](/guide/plugin.html#js-loader)的形式在运行时将全局定义的代码 `xxx=`替换成`window.xxx=`

## 3、子应用的字体没有生效

**原因：** `@font-face`不会在`shadow`内部加载，[详见](https://github.com/mdn/interactive-examples/issues/887)

**解决方案：** 框架已解决，会将子应用的`@font-face`放到`shadow`外部执行，注意子应用的自定义字体名和主应用的自定义字体名不能重复，否则可能存在覆盖问题

## 4、冒泡系列组件（比如下拉框）弹出位置不正确

**原因：** 比如`element-plus`采用了`popper.js`2.0 版本，这个版本计算位置会递归元素一直计算到`window.visualViewport`，但是子应用的`dom`挂载在`shadowRoot`上，并没有`window.visualViewport`这部分滚动量，导致偏移计算失败

**解决方案：** 将子应用将`body`设置为`position: relative`即可

## 5、子应用处理异步处理事件时，e.target 变成了 wujie-app

**原因：** 这个问题是浏览器原生的处理，[详见](https://stackoverflow.com/questions/63607966/event-target-changed-in-settimeout-in-shadow-dom)

**解决方案：** 在异步处理时，获取 e.target 的方式需要修改成：
`(e.target.shadowRoot && e.composed) ? (e.composedPath()[0] || e.target) : e.target`

## 6、css 样式内部的相对地址相对的是主应用的域名

**原因：** 由于框架没有处理子应用样式内部的相对地址，而子应用样式是挂载在主应用容器中，导致相对地址错误

**解决方案：** 使用插件中的[css-loader](/guide/plugin.html#css-loader)在运行时将相对地址代码替换成绝对地址。

## 7、子应用使用 module federation 引用远程模块报错

**原因：** 原因[同 3](#_2、第三方包已经引入-使用时报错)，都是由于闭包执行脚本导致脚本内的全局变量在其他脚本中无法读取

**解决方案：** 在`ModuleFederationPlugin`插件中设置`library`的`type`为`window`

```javascript
  library: { type: 'window', name: '保持和name一致' }
```
