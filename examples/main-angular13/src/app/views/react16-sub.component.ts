import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { hostMap } from '../../hostMap';

@Component({
  selector: 'app-react16-sub',
  template: `
    <!--单例模式，name相同则复用一个无界实例，改变url则子应用重新渲染实例到对应路由 -->
    <wujie-angular width="100%" height="100%" name="react16" [url]="react16Url"></wujie-angular>
  `
})
export class React16SubComponent {
  private readonly url = hostMap('//localhost:7600/');
  react16Url = this.url;

  constructor(private route: ActivatedRoute) {
    route.params.subscribe(params => (this.react16Url = this.url + params['path']));
  }
}
