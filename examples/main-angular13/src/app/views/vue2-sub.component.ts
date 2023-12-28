import { Component} from '@angular/core';
import { hostMap } from '../../hostMap';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-vue2-sub',
  template: `
    <!--单例模式，name相同则复用一个无界实例，改变url则子应用重新渲染实例到对应路由 -->
    <wujie-angular width="100%" height="100%" name="vue2" [url]="vue2Url"></wujie-angular>
  `
})
export class Vue2SubComponent {
  private readonly url = hostMap('//localhost:7200/');
  vue2Url = this.url;

  constructor(private route: ActivatedRoute) {
    route.params.subscribe(params => (this.vue2Url = this.url + params['path']));
  }
}
