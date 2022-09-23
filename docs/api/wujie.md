无界对子应用注入了`$wujie`对象，可以通过`$wujie`或者`window.$wujie`获取

# $wujie

- **类型：**

  ```typescript
  {
    bus: EventBus,
    shadowRoot?: ShadowRoot | undefined,
    props?: { [key: string]: any } | undefined,
    location?: Object
  }
  ```

## $wujie.bus

同 [bus](/api/bus.html)

## $wujie.shadowRoot

- **类型**：[ShadowRoot](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot)

子应用的渲染容器`shadow DOM`

## $wujie.props

- **类型：**`{ [key: string]: any }`

主应用注入的数据

## $wujie.location

- **类型：**`Object`

- 由于子应用的`location.host`拿到的是主应用的`host`，无界提供了一个正确的`location`挂载到挂载到`$wujie`上

- 当采用`vite`编译框架时，由于`script`的标签`type`为`module`，所以无法采用[闭包](/guide/information.html#iframe-数据劫持和注入)的方式将 `location` 劫持代理，子应用所有采用`window.location.host`的代码需要统一修改成`$wujie.location.host`

- 当子应用发生降级时，由于`proxy`无法正常工作导致`location`无法代理，子应用所有采用`window.location.host`的代码需要统一修改成`$wujie.location.host`

- 当采用非`vite`编译框架时，`proxy`代理了`window.location`，子应用代码无需做任何更改

