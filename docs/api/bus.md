# bus

- **类型：** `EventBus`

```typescript
type callback = (...args: Array<any>) => any;

export declare class EventBus {
  private id;
  private eventObj;
  constructor(id: string);
  $on(event: string, fn: callback): EventBus;
  /** 任何$emit都会导致监听函数触发，第一个参数为事件名，后续的参数为$emit的参数 */
  $onAll(fn: (event: string, ...args: Array<any>) => any): EventBus;
  $once(event: string, fn: callback): void;
  $off(event: string, fn: callback): EventBus;
  $offAll(fn: callback): EventBus;
  $emit(event: string, ...args: Array<any>): EventBus;
  $clear(): EventBus;
}
```

- **详情：** 去中心化的事件平台，类`Vue`的事件`api`，支持链式调用。[示例](/guide/communication.html#eventbus-通信)

## $on

- **类型：** `(event: string, fn: callback) => EventBus`

- **参数：**
  - `{string} event` 事件名
  - `{callback} fn` 回调参数

- **详情：** 监听事件并提供回调

## $onAll

- **类型：** `(fn: (event: string, ...args: Array<any>) => any) => EventBus`

- **参数：**
  - `{callback} fn` 回调参数

- **详情：** 监听所有事件并提供回调，回调函数的第一个参数是事件名


## $once

- **类型：** `(event: string, fn: callback) => void`

- **参数：**
  - `{string} event` 事件名
  - `{callback} fn` 回调参数

- **详情：** 一次性的监听事件

## $off

- **类型：** `(event: string, fn: callback) => EventBus`

- **参数：**
  - `{string} event` 事件名
  - `{callback} fn` 回调参数

- **详情：** 取消事件监听

## $offAll

- **类型：** `(fn: callback) => EventBus`

- **参数：**
  - `{callback} fn` 回调参数

- **详情：** 取消监听所有事件

## $emit

- **类型：** `(event: string, ...args: Array<any>) => EventBus`

- **参数：**
  - `{string} event` 事件名
  - `{Array<any>} args` 其他回调参数

- **详情：** 触发事件

## $clear

- **类型：** `Function`

- **详情：** 清空`EventBus`实例下所有监听事件

::: warning 警告

- 子应用在被销毁或者重新渲染（非保活状态）时框架会自动调用清空上次渲染所有的订阅事件
- 子应用内部组件的渲染可能导致反复订阅（比如在`mounted`生命周期调用`$wujie.bus.$on`），需要用户在`unmount`生命周期内手动调用`$wujie.bus.$off`来取消订阅
  :::
