import { Component, NgZone } from '@angular/core';
import { hostMap } from '../../hostMap';
import { ActivatedRoute } from '@angular/router';
import { WujieComponent } from 'wujie-angular';

@Component({
  selector: 'app-angular12',
  template: `
    <!--单例模式，name相同则复用一个无界实例，改变url则子应用重新渲染实例到对应路由 -->
    <wujie-angular width="100%" height="100%" name="angular12" [url]="angular12Url"></wujie-angular>
  `
})
export class Angular12SubComponent {
  private readonly url = hostMap('//localhost:7400/');
  angular12Url = this.url;

  constructor(private route: ActivatedRoute, private zone: NgZone) {
    route.params.subscribe(params => {
      this.angular12Url = this.url + params['path'];
      WujieComponent.bus.$emit('angular12-router-change', params['path']);
    });
  }
}
