import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { filter } from "rxjs/operators";
import hostMap from "../../hostMap";

@Component({
  selector: "react16",
  template: `<wujie-ngx
    width="100%"
    height="100%"
    [name]="'react16'"
    [url]="react16Url"
    [sync]="true"
    (change)="handleChange($event)"
  ></wujie-ngx>`,
})
export class React16Component implements OnInit {
  react16Url = hostMap("//localhost:7600/");

  constructor(private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    console.log("[react16] init");
    this.activatedRoute.params.pipe(filter(({ path }) => path)).subscribe(({ path }) => {
      this.react16Url = hostMap("//localhost:7600/") + path;
    });
  }

  handleChange(e) {
    console.log("[react16] change >", e);
  }
}
