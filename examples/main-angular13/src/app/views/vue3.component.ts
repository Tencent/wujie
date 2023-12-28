import { Component } from '@angular/core';
import { hostMap } from '../../hostMap';

@Component({
  selector: 'app-vue3',
  template: `
    <!--单例模式，name相同则复用一个无界实例，改变url则子应用重新渲染实例到对应路由 -->
    <wujie-angular width="100%" height="100%" name="vue3" [url]="vue3Url" [sync]="true"></wujie-angular>
  `
})
export class Vue3Component {
  vue3Url = hostMap('//localhost:7300/');
}
