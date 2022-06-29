---
sidebarDepth: 2
collapsable: false
---

## 原理图

![原理](https://vfiles.gtimg.cn/vupload/20211118/f050281637240979027.png)

## 运行图

![框架](https://vfiles.gtimg.cn/vupload/20211118/f273b01637241117989.png)

从上面框架运行图可以看出，子应用的`shadowRoot`和`iframe`和承载子应用的组件是解耦的，`iframe`中运行着子应用的实例`instance`

- 当子应用采用**保活模式**时主应用切换路由，组件被销毁

  - 子应用`shadowRoot`、`iframe`、`instance`都保留

  - 当组件重新渲染，无界则将`shadowRoot`重新插入组件容器即可，相当于一个`shadowRoot`的插拔动作

- 当子应用采用**非保活模式**时主应用切换路由，组件被销毁

  - 子应用会调用`window.__WUJIE_UNMOUNT`销毁`instance`并清空`shadowRoot`内部所有元素，但是`shadowRoot`、`iframe`都保留

  - 当子应用重新渲染

    - 无界将调用`window.__WUJIE_MOUNT`创建新`instance`
    - 无界将子应用的`html`重新填充到`shadowRoot`内
    - 新`instance`会`mount`到`shadowRoot`上。

  - 如果用户没有定义`window.__WUJIE_UNMOUNT`和`window.__WUJIE_MOUNT`，那么每次组件重新渲染，都会将`wujie`实例包括`shadowRoot`、`iframe`全部销毁，然后重新创建`wujie`实例，这样会有白屏时间

思考：为什么要定义`window.__WUJIE_UNMOUNT`和`window.__WUJIE_MOUNT`这两个生命周期?

## 内部接口

### 子应用`window`对象拓展

```typescript
interface Window {
  // 是否存在无界
  __POWERED_BY_WUJIE__?: boolean;
  // 子应用公共加载路径
  __WUJIE_PUBLIC_PATH__: string;
  // 子应用沙盒实例
  __WUJIE: WuJie;
  // 子应用mount函数
  __WUJIE_MOUNT: () => void;
  // 子应用unmount函数
  __WUJIE_UNMOUNT: () => void;
}
```

### 无界沙箱 sandbox

```typescript
/**
 * 子应用的沙箱
 * @author damyxu
 * @since 2021-07-14
 */
export default class Wujie {
  id: string;
  /** 激活时路由地址 */
  url: string;
  /** 子应用保活 */
  alive: boolean;
  /** window代理 */
  proxy: WindowProxy;
  /** document代理 */
  proxyDocument: Object;
  /** location代理 */
  proxyLocation: Object;
  /** 事件中心 */
  bus: EventBus;
  /** 容器 */
  el: HTMLElement;
  /** js沙箱 */
  iframe: HTMLIFrameElement;
  /** css沙箱 */
  shadowRoot: ShadowRoot;
  /** 子应用的template */
  template: string;
  /** 子应用代码替换钩子 */
  replace: (code: string) => string;
  /** 子应用自定义fetch */
  fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  /** js沙箱ready态 */
  iframeReady: Promise<void>;
  /** 子应用预加载态 */
  preload: Promise<void>;
  /** 子应用js执行队列 */
  execQueue: Array<Function>;
  /** 子应用执行标志 */
  execFlag: boolean;
  /** 子应用mount标志 */
  mountFlag: boolean;
  /** 路由同步标志 */
  sync: boolean;
  /** 子应用跳转标志 */
  hrefFlag: boolean;
  /** 子应用采用fiber模式执行 */
  fiber: boolean;
  /** 子应用styleSheet元素 */
  styleSheetElements: Array<HTMLLinkElement | HTMLStyleElement>;
  /** $wujie对象，提供给子应用的接口 */
  provide: {
    bus: EventBus;
    shadowRoot?: ShadowRoot | undefined;
    props?:
      | {
          [key: string]: any;
        }
      | undefined;
    location?: Object;
  };
  /** 激活子应用
   * 1、同步路由
   * 2、动态修改iframe的fetch
   * 3、准备shadow
   * 4、准备子应用注入
   */
  active(options: {
    url: string;
    sync?: boolean;
    template?: string;
    el?: string | HTMLElement;
    props?: {
      [key: string]: any;
    };
    alive?: boolean;
    fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
    replace?: (code: string) => string;
  }): Promise<void>;
  /** 启动子应用
   * 1、运行js
   * 2、处理兼容样式
   */
  start(getExternalScripts: () => ScriptResultList): Promise<void>;
  mount(): void;
  /** 销毁子应用 */
  destroy(): void;
  /** 当子应用再次激活后，只运行mount函数，样式需要重新恢复 */
  rebuildStyleSheets(): void;
  /** 兼容:root选择器样式到:host选择器上 */
  attachHostCssRules(): void;
  /**
   * @param id 子应用的id，唯一标识
   * @param url 子应用的url，可以包含protocol、host、path、query、hash
   */
  constructor(
    name: string,
    url: string,
    attrs: {
      [key: string]: any;
    },
    fiber: boolean
  );
}
```

## 细节

### 实现一个纯净的 iframe

子应用运行在一个和主应用同域的`iframe`中，设置`src`为替换了主域名`host`的子应用`url`，子应用路由只取`location`的`pathname`和`hash`

但是一旦设置`src`后，`iframe`由于同域，会加载主应用的`html`、`js`，所以必须在`iframe`实例化完成并且还没有加载完`html`时中断加载，防止污染子应用

::: warning 提醒

- 如果`iframe`没有实例化完成就进行`stop`，`location`的`origin`为`about:blank`会导致子应用路由无法运行
- 如果直接在 iframe 实例化时采用`document.write`擦除，路由器的同步功能将失败

:::

具体实现：

```typescript
/**
 * 防止运行主应用的js代码，给子应用带来很多副作用
 */
// TODO: 更加准确抓取停止时机
function stopIframeLoading(iframeWindow: Window) {
  iframeWindow.__WUJIE.iframeReady = new Promise<void>((resolve) => {
    function loop() {
      setTimeout(() => {
        // location ready
        if (iframeWindow.location.href === "about:blank") {
          loop();
        } else {
          iframeWindow.stop();
          initIframeDom(iframeWindow);
          resolve();
        }
      }, 0);
    }
    loop();
  });
}
```

### iframe 数据劫持和注入

子应用的代码 `code` 在 `iframe` 内部访问 `window`、`location` 都被劫持到相应的 `proxy`，注意这个闭包只是为了修改`location`而`window`和`document`对象和原型已经被直接修改

当采用`script`的`type`为`module`时会去除这个闭包，需要访问`$wujie.location`来获取修改后的`location`

```typescript
const script = `(function(window, self, global, location) {
    ${code}\n
  }).bind(window.__WUJIE.proxy)(
    window.__WUJIE.proxy,
    window.__WUJIE.proxy,
    window.__WUJIE.proxy,
    window.__WUJIE.proxy.location,
  );`;
```

### iframe 和 shadowRoot 副作用的处理

`iframe` 内部的副作用处理在初始化`iframe`时进行，主要分为如下几部

```javascript
/**
 * 1、location劫持后的数据修改回来，防止跨域错误
 * 2、同步路由到主应用
 */
patchIframeHistory(iframeWindow, appPublicPath, mainPublicPath);
/**
 * 对window.addEventListener进行劫持，比如resize事件必须是监听主应用的
 */
patchIframeEvents(iframeWindow);
/**
 * 注入私有变量
 */
patchIframeVariable(iframeWindow, appPublicPath);
/**
 * 将有DOM副作用的统一在此修改，比如mutationObserver必须调用主应用的
 */
patchIframeDomEffect(iframeWindow);
/**
 * 子应用前进后退，同步路由到主应用
 */
syncIframeUrlToWindow(iframeWindow);
```

`ShadowRoot` 内部的副作用必须进行处理，主要处理的就是`shadowRoot`的`head`和`body`

```javascript
  shadowRoot.head.appendChild = getOverwrittenAppendChildOrInsertBefore({
    rawDOMAppendOrInsertBefore: rawHeadAppendChild
  }) as typeof rawHeadAppendChild
  shadowRoot.head.insertBefore = getOverwrittenAppendChildOrInsertBefore({
    rawDOMAppendOrInsertBefore: rawHeadInsertBefore as any
  }) as typeof rawHeadInsertBefore
  shadowRoot.body.appendChild = getOverwrittenAppendChildOrInsertBefore({
    rawDOMAppendOrInsertBefore: rawBodyAppendChild
  }) as typeof rawBodyAppendChild
  shadowRoot.body.insertBefore = getOverwrittenAppendChildOrInsertBefore({
    rawDOMAppendOrInsertBefore: rawBodyInsertBefore as any
  }) as typeof rawBodyInsertBefore
```

`getOverwrittenAppendChildOrInsertBefore`主要是处理四种类型标签：

- **`link/style`标签**

  收集`stylesheetElement`并用于子应用重新激活重建样式

- **`script`标签**

  动态插入的`script`标签必须从`ShadowRoot`转移至`iframe`内部执行

- **`iframe`标签**

  修复`iframe`的指向对应子应用`iframe`的`window`

::: tip 收益

- **js 层面、css 层面、dom 层面的副作用全部框架处理，应用接入没有适配成本**
- **副作用约束在 iframe 和 ShadowRoot 内部不会溢出**
  :::

### iframe 的 document 改造

```typescript
new Proxy(
  {},
  {
    get: function (_fakeDocument, propKey) {
      const document = window.document;
      const shadowRoot = iframe.contentWindow.__WUJIE.shadowRoot;
      // need fix
      if (propKey === "createElement" || propKey === "createTextNode") {
        return new Proxy(document[propKey], {
          apply(createElement, _ctx, args) {
            const element = createElement.apply(iframe.contentDocument, args);
            patchElementEffect(element, iframe.contentWindow);
            return element;
          },
        });
      }
      if (propKey === "documentURI" || propKey === "URL") {
        return (iframe.contentWindow.__WUJIE.proxyLocation as Location).href;
      }

      // from shadowRoot
      if (
        propKey === "getElementsByTagName" ||
        propKey === "getElementsByClassName" ||
        propKey === "getElementsByName"
      ) {
        return new Proxy(shadowRoot.querySelectorAll, {
          apply(querySelectorAll, _ctx, args) {
            let arg = args[0];
            if (propKey === "getElementsByClassName") arg += ".";
            if (propKey === "getElementsByName") arg = `[name="${arg}"]`;
            return querySelectorAll.call(shadowRoot, arg);
          },
        });
      }
      if (propKey === "getElementById") {
        return new Proxy(shadowRoot.querySelector, {
          apply(querySelector, _ctx, args) {
            return querySelector.call(shadowRoot, `#${args[0]}`);
          },
        });
      }
      if (propKey === "querySelector" || propKey === "querySelectorAll") {
        return shadowRoot[propKey].bind(shadowRoot);
      }
      if (propKey === "documentElement" || propKey === "scrollingElement") return shadowRoot.firstElementChild;
      if (propKey === "forms") return shadowRoot.querySelectorAll("form");
      if (propKey === "images") return shadowRoot.querySelectorAll("img");
      if (propKey === "links") return shadowRoot.querySelectorAll("a");
      const { ownerProperties, shadowProperties, shadowMethods, documentProperties, documentMethods } =
        documentProxyProperties;
      if (ownerProperties.concat(shadowProperties).includes(propKey.toString())) {
        return shadowRoot[propKey];
      }
      if (shadowMethods.includes(propKey.toString())) {
        return getTargetValue(shadowRoot, propKey) ?? getTargetValue(document, propKey);
      }
      // from window.document
      if (documentProperties.includes(propKey.toString())) {
        return document[propKey];
      }
      if (documentMethods.includes(propKey.toString())) {
        return getTargetValue(document, propKey);
      }
    },
  }
);
```

### iframe 的 location 改造

```typescript
new Proxy(
  {},
  {
    get: function (fakeLocation, propKey) {
      const location = target.location;
      if (propKey === "host" || propKey === "hostname" || propKey === "protocol" || propKey === "port") {
        return urlElement[propKey];
      }
      if (propKey === "href") {
        return target.location[propKey].replace(mainPublicPath, appPublicPath);
      }
      if (propKey === "reload") {
        warn("子应用调用reload无法生效");
        return () => null;
      }
      return getTargetValue(location, propKey);
    },
    set: function (location, propKey, value, receiver) {
      // 如果是跳转链接的话重开一个iframe
      if (propKey === "href") {
        const { shadowRoot, id } = target.__WUJIE;
        let url = value;
        if (!/^http/.test(url)) {
          let hrefElement = anchorElementGenerator(url);
          url = appPublicPath + hrefElement.pathname + hrefElement.search + hrefElement.hash;
          hrefElement = null;
        }
        target.__WUJIE.hrefFlag = true;
        renderIframeReplaceShadowRoot(url, shadowRoot);
        pushUrlToWindow(id, url);
        return true;
      }
      return Reflect.set(location, propKey, value, receiver);
    },
  }
);
```
