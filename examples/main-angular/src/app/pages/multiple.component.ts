import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import hostMap from "../../hostMap";

@Component({
  selector: "vue2",
  template: `
    <div style="height: 100%; width: 100%">
      <wujie-ngx
        class="item"
        [name]="'react16'"
        [url]="react16Url"
        [sync]="true"
        (change)="handleChange($event)"
      ></wujie-ngx>

      <wujie-ngx
        class="item"
        [name]="'react17'"
        [url]="react17Url"
        [sync]="true"
        [alive]="true"
        [props]="props"
        (change)="handleChange($event)"
      ></wujie-ngx>

      <wujie-ngx
        class="item"
        [name]="'vue2'"
        [url]="vue2Url"
        [sync]="true"
        [props]="props"
        (change)="handleChange($event)"
      ></wujie-ngx>

      <wujie-ngx
        class="item"
        [name]="'vue3'"
        [url]="vue3Url"
        [sync]="true"
        [alive]="true"
        [props]="props"
        (change)="handleChange($event)"
      ></wujie-ngx>

      <wujie-ngx
        class="item"
        [name]="'vite'"
        [url]="viteUrl"
        [sync]="true"
        [props]="props"
        (change)="handleChange($event)"
      ></wujie-ngx>

      <wujie-ngx
        class="item"
        [name]="'angular12'"
        [url]="angular12Url"
        [sync]="true"
        [props]="props"
        (change)="handleChange($event)"
      ></wujie-ngx>
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
    `,
  ],
})
export class MultipleComponent implements OnInit {
  react16Url = hostMap("//localhost:7600/");
  react17Url = hostMap("//localhost:7100/");
  vue2Url = hostMap("//localhost:7200/");
  vue3Url = hostMap("//localhost:7300/");
  vite = hostMap("//localhost:7500/");
  angular12Url = hostMap("//localhost:7400/");

  constructor() {}

  ngOnInit(): void {
    console.log("[all] init");
  }

  handleChange(e) {
    console.log("[all] change >", e);
  }
}
