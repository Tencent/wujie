import { Component, OnInit } from "@angular/core";
import hostMap from "../../hostMap";

@Component({
  selector: "angular12",
  template: `<wujie-ngx
    width="100%"
    height="100%"
    [name]="'angular12'"
    [url]="angular12Url"
    [sync]="true"
    (change)="handleChange($event)"
  ></wujie-ngx>`,
})
export class Angular12Component implements OnInit {
  angular12Url = hostMap("//localhost:7400/");

  constructor() {}

  ngOnInit(): void {
    console.log("[angular12] init");
  }

  handleChange(e) {
    console.log("[angular12] change >", e);
  }
}
