import { Component } from '@angular/core';
import { hostMap } from '../../hostMap';
import { ActivatedRoute } from '@angular/router';
import { WujieComponent } from 'wujie-angular';

@Component({
  selector: 'app-vue3-sub',
  template: `
    <!--单例模式，name相同则复用一个无界实例，改变url则子应用重新渲染实例到对应路由 -->
    <wujie-angular width="100%" height="100%" name="vue3" [url]="vue3Url"></wujie-angular>
  `
})
export class Vue3SubComponent {
  private readonly url = hostMap('//localhost:7300/');
  vue3Url = this.url;

  constructor(private route: ActivatedRoute) {
    route.params.subscribe(params => {
      this.vue3Url = this.url + params['path'];
      WujieComponent.bus.$emit('react17-router-change', params['path']);
    });
  }
}
