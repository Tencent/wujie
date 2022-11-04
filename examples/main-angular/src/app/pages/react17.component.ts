import { Component, NgZone, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { filter } from "rxjs/operators";
import { WuJieAngular } from "wujie-angular";
import hostMap from "../../hostMap";

@Component({
  selector: "react17",
  template: `<wujie-ngx
    width="100%"
    height="100%"
    [name]="'react17'"
    [url]="react17Url"
    [sync]="true"
    [alive]="true"
    [props]="props"
    (change)="handleChange($event)"
  ></wujie-ngx>`,
})
export class React17Component implements OnInit {
  react17Url = hostMap("//localhost:7100/");
  props = {
    jump: ((name) => {
      const url = this.router.config.find((x) => x.data.name === name)?.path;
      url && this.zone.run(() => this.router.navigateByUrl(url));
    }).bind(this),
  };

  constructor(private activatedRoute: ActivatedRoute, private router: Router, private zone: NgZone) {}

  ngOnInit(): void {
    console.log("[react17] init");
    this.activatedRoute.params.pipe(filter(({ path }) => path)).subscribe(({ path }) => {
      WuJieAngular.bus.$emit("react17-router-change", `/${path}`);
    });
  }

  handleChange(e) {
    console.log("[react17] change >", e);
  }
}
