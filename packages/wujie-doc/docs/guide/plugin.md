![Untitled Diagram.jpeg](https://vfiles.gtimg.cn/wuji_dashboard/wupload/xy/test_wuji_damy/50LRt2ig.jpeg)

无界的插件体系主要是方便用户在运行时去修改子应用代码从而避免去改动仓库代码，详见[API](/api/startApp.html#plugins)

## html-loader

无界提供插件在运行时对子应用的 html 文本进行修改

- **示例**

```javascript
const plugins = [
  {
    // 对子应用的template进行的aaa替换成bbb
    htmlLoader: (code) => {
      return code.replace('aaa', 'bbb');
    },
];
```

## js-excludes

如果用户想加载子应用的时候，不执行子应用中的某些`js`文件

那么这些工作可以放置在`js-excludes`中进行

- **示例**

```javascript
const plugins = [
  // 子应用的 http://xxxxx.js 或者符合正则 /test\.js/ 脚本将不在子应用中进行
  { jsExcludes: ["http://xxxxx.js", /test\.js/] },
];
```

## js-ignores

如果用户想子应用自己加载某些`js`文件（通过`script`标签），而非框架劫持加载（通常会导致跨域）

那么这些工作可以放置在`js-ignores`中进行

- **示例**

```javascript
const plugins = [
  // 子应用的 http://xxxxx.js 或者符合正则 /test\.js/ 脚本将由子应用自行加载
  { jsIgnores: ["http://xxxxx.js", /test\.js/] },
];
```

::: warning 警告
jsIgnores 中的 js 文件由于是子应用自行加载没有对 location 进行劫持，如果有对 window.location.href 进行操作复制请务必替换成 window.$wujie.location.href 的操作，否则子应用的沙箱会被取代掉
:::

## js-before-loaders

如果用户想在`html`中所有的`js`之前做：

1. 在子应用运行一个`src="http://xxxxx"`的脚本
2. 在子应用中运行一个内联的 js 脚本`<script>content</script>`
3. 执行一个回调函数

那么这些工作可以放置在`js-before-loaders`中进行

- **示例**

```javascript
const plugins = [
  {
    // 在子应用所有的js之前
    jsBeforeLoaders: [
      // 插入一个外联脚本
      { src: "http://xxxx.js" },
      // 插入一个内联监本
      { content: 'console.log("test")' },
      // 执行一个回调，打印子应用名字
      {
        callback(appWindow) {
          console.log("js-before-loader-callback", appWindow.__WUJIE.id);
        },
      },
    ],
  },
];
```

## js-loader

如果用户想将子应用的某个`js`脚本的代码进行替换，可以在这个地方进行处理

- **示例**

```javascript
const plugins = [
  {
    // 将url为aaa.js的脚本中的aaa替换成bbb
    // code 为脚本代码、url为脚本的地址（内联脚本为''）、base为子应用当前的地址
    jsLoader: (code, url, base) => {
      if (url === "aaa.js") return code.replace("aaa", "bbb");
    },
  },
];
```

## js-after-loader

如果用户想在`html`中所有的`js`之后做：

1. 在子应用运行一个`src="http://xxxxx"`的脚本
2. 在子应用中运行一个内联的 js 脚本`<script>content</script>`
3. 执行一个回调函数

那么这些工作可以放置在`js-before-loaders`中进行

- **示例**

```javascript
const plugins = [
  {
    jsAfterLoaders: [
      // 插入一个外联脚本
      { src: "http://xxxx.js" },
      // 插入一个内联监本
      { content: 'console.log("test")' },
      // 执行一个回调，打印子应用名字
      {
        callback(appWindow) {
          console.log("js-after-loader-callback", appWindow.__WUJIE.id);
        },
      },
    ],
  },
];
```

## css-excludes

如果用户想加载子应用的时候，不加载子应用中的某些`css`文件

那么这些工作可以放置在`css-excludes`中进行

- **示例**

```javascript
const plugins = [
  // 子应用的 http://xxxxx.css 脚本将不在子应用中加载
  { cssExcludes: ["http://xxxxx.css" /test\.css/] },
];
```

## css-ignores

如果用户想子应用自己加载某些`css`文件（通过`link`标签），而非框架劫持加载（通常会导致跨域）

那么这些工作可以放置在`css-ignores`中进行

- **示例**

```javascript
const plugins = [
  // 子应用的 http://xxxxx.css 或者符合正则 /test\.css/ 脚本将由子应用自行加载
  { cssIgnores: ["http://xxxxx.css", /test\.css/] },
];
```

## css-before-loaders

如果用户想在`html`中所有的`css`之前做：

1. 插入一个`src="http://xxxxx"`的外联样式脚本
2. 插入一个`<style>content</style>`的内联样式脚本

那么这些工作可以放置在`css-before-loaders`中进行

- **示例**

```javascript
const plugins = [
  {
    // 在子应用所有的css之前
    cssBeforeLoaders: [
      //在加载html所有的样式之前添加一个外联样式
      { src: "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" },
      //在加载html所有的样式之前添加一个内联样式
      { content: "img{width: 300px}" },
    ],
  },
];
```

## css-loader

无界提供插件在运行时对子应用的`css`文本进行修改

- **示例**

```javascript
const plugins = [
  {
    // 对css脚本动态的进行替换
    // code 为样式代码、url为样式的地址（内联样式为''）、base为子应用当前的地址
    cssLoader: (code, url, base) => {
      console.log("css-loader", url, code.slice(0, 50) + "...");
      return code;
    },
  },
];
```

## css-after-loaders

如果用户想在`html`中所有的`css`之后做：

1. 插入一个`src="http://xxxxx"`的外联样式脚本
2. 插入一个`<style>content</style>`的内联样式脚本

那么这些工作可以放置在`css-after-loaders`中进行

- **示例**

```javascript
const plugins = [
  {
    cssAfterLoaders: [
      //在加载html所有样式之后添加一个外联样式
      { src: "https://cdn.jsdelivr.net/npm/bootstrap@4.6.1/dist/css/bootstrap.min.css" },
      //在加载html所有样式之后添加一个内联样式
      { content: "img{height: 300px}" },
    ],
  },
];
```

## windowAddEventListenerHook

子应用的`window`添加监听事件时执行的回调函数

- **示例**

无界子应用的`dom`渲染在`webcomponent`中，`js`在`iframe`中运行，往往子应用在外部的容器滚动，所以监听`window`的`scroll`事件是无效的，可以将处理`window`的`scroll`事件绑定在滚动容器中

```javascript
const plugins = [
  {
    windowAddEventListenerHook(iframeWindow, type, handler, options) {
      container.addEventListener(type, handler, options);
    },
  },
];
```

## windowRemoveEventListenerHook

子应用的`window`移除监听事件时执行的回调函数

- **示例**

```javascript
const plugins = [
  {
    windowAddEventListenerHook(iframeWindow, type, handler, options) {
      container.addEventListener(type, handler, options);
    },
    windowRemoveEventListenerHook(iframeWindow, type, handler, options) {
      container.removeEventListener(type, handler, options);
    },
  },
];
```

## documentAddEventListenerHook

子应用的`document`添加监听事件时执行的回调函数

- **示例**

无界子应用的`dom`渲染在`webcomponent`中，`js`在`iframe`中运行，往往子应用在外部的容器滚动，所以监听`document`的`scroll`事件是无效的，可以将处理`document`的`scroll`事件绑定在滚动容器中

```javascript
const plugins = [
  {
    documentAddEventListenerHook(iframeWindow, type, handler, options) {
      container.addEventListener(type, handler, options);
    },
  },
];
```

## documentRemoveEventListenerHook

子应用的`document`移除监听事件时执行的回调函数

- **示例**

```javascript
const plugins = [
  {
    documentAddEventListenerHook(iframeWindow, type, handler, options) {
      container.addEventListener(type, handler, options);
    },
    documentRemoveEventListenerHook(iframeWindow, type, handler, options) {
      container.removeEventListener(type, handler, options);
    },
  },
];
```

<!--
## windowPropertyOverride

自定义子应用`window`的属性

- **示例**

```javascript
const plugins = [
  {
    // 自定义子应用的`window`的属性 property
    windowPropertyOverride(iframeWindow) {
      iframeWindow.propKey = window.propKey;
    },
  },
];
```

## documentPropertyOverride

自定义子应用`document`的属性

```javascript
const plugins = [
  {
    documentPropertyOverride(iframeWindow) {
      // 自定义子应用的`document`的属性 propKey
      Object.defineProperty(iframeWindow.document, propKey, {
        enumerable: true,
        configurable: true,
        get: () => xxx,
        set: () => xxx,
      });
    },
  },
];
``` -->
