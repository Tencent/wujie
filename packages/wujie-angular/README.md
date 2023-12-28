# wujie-angular

无界微前端angular组件封装

> 注意: angular项目作为主应用才需要安装此包

## 使用环境

- angular 9+

## 快速上手

### 安装

```bash
npm i wujie-angular -S
```

### 引入

```diff
// app.module.ts
+ import { WujieModule } from 'wujie-angular';

@NgModule({
  imports: [
+   WujieModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```


### 使用

```html
<wujie-angular
    width="100%"
    height="100%"
    name="xxx"
    [url]="xxx"
    [sync]="true"
    [fetch]="fetch"
    [props]="props"
    (beforeLoad)="onBeforeLoad($event)"
    (beforeMount)="onBeforeMount($event)"
    (afterMount)="onAfterMount($event)"
    (beforeUnmount)="onBeforeUnmount($event)"
    (afterUnmount)="onAfterUnmount($event)"
    (event)="onEvent($event)"
></wujie-angular>
```

子应用通过[$wujie.bus.$emit](/api/wujie.html#wujie-bus)`(event, args)`出来的事件都可以直接`(event)`来监听

## 实例方法

### destroy()

> 销毁应用并清空缓存和取消事件

```html
<wujie-angular #app></wujie-angular>
<button (click)="app.destroy()">销毁应用</button>
```


## 静态属性和方法

```javascript
import { WujieComponent } from 'wujie-angular';

const { bus, setupApp, preloadApp, destroyApp } = WujieComponent;
```

### bus

[同 API](/api/bus.html)

### setupApp

[同 API](/api/setupApp.html)

### preloadApp

[同 API](/api/preloadApp.html)

### destroyApp

[同 API](/api/destroyApp.html)

## 其他

更多参考文档 [wujie（无界）](https://wujie-micro.github.io/doc/)
