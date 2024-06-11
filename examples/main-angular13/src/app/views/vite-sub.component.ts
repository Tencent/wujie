import { Component} from '@angular/core';
import { hostMap } from '../../hostMap';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-vite-sub',
  template: `
    <!--单例模式，name相同则复用一个无界实例，改变url则子应用重新渲染实例到对应路由 -->
    <wujie-angular width="100%" height="100%" name="vite" [url]="viteUrl"></wujie-angular>
  `
})
export class ViteSubComponent {
  private readonly url = hostMap('//localhost:7500/');
  viteUrl = this.url;

  constructor(private route: ActivatedRoute) {
    route.params.subscribe(params => (this.viteUrl = this.url + params['path']));
  }
}
