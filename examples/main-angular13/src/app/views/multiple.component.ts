import { Component } from '@angular/core';
import { hostMap } from '../../hostMap';
import { Router } from '@angular/router';

@Component({
  selector: 'app-multiple',
  template: `
    <div style="height: 100%; width: 100%">
      <wujie-angular class="item" name="react16" [url]="react16Url" [sync]="true"></wujie-angular>
      <wujie-angular class="item" name="react17" [url]="react17Url" [sync]="true"></wujie-angular>
      <wujie-angular class="item" name="vue2" [url]="vue2Url" [sync]="true"></wujie-angular>
      <wujie-angular class="item" name="vue3" [url]="vue3Url" [sync]="true"></wujie-angular>
      <wujie-angular class="item" name="vite" [url]="vite" [sync]="true"></wujie-angular>
      <wujie-angular class="item" name="angular12" [url]="angular12Url" [sync]="true"></wujie-angular>
    </div>
  `,
  styles: [
    `
      .item {
        display: inline-block;
        border: 1px dashed #ccc;
        border-radius: 8px;
        width: 45%;
        height: 45%;
        margin: 20px;
        overflow: scroll;
      }
    `
  ]
})
export class MultipleComponent {
  react16Url = hostMap('//localhost:7600/');
  react17Url = hostMap('//localhost:7100/');
  vue2Url = hostMap('//localhost:7200/');
  vue3Url = hostMap('//localhost:7300/');
  vite = hostMap('//localhost:7500/');
  angular12Url = hostMap('//localhost:7400/');

  constructor(private router: Router) {
  }

  jump(url: string) {
    this.router.navigate([url]);
  }
}
