import { Component} from '@angular/core';
import { hostMap } from '../../hostMap';

@Component({
  selector: 'app-vite',
  template: `
    <!--单例模式，name相同则复用一个无界实例，改变url则子应用重新渲染实例到对应路由 -->
    <wujie-angular width="100%" height="100%" name="vite" [url]="viteUrl" [sync]="true"></wujie-angular>
  `
})
export class ViteComponent {
  viteUrl = hostMap('//localhost:7500/');
}
