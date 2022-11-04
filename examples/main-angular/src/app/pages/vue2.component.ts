import { Component, NgZone, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { filter } from "rxjs/operators";
import hostMap from "../../hostMap";

@Component({
  selector: "vue2",
  template: `<wujie-ngx
    width="100%"
    height="100%"
    [name]="'vue2'"
    [url]="vue2Url"
    [sync]="true"
    [props]="props"
    (change)="handleChange($event)"
  ></wujie-ngx>`,
})
export class Vue2Component implements OnInit {
  vue2Url = hostMap("//localhost:7200/");
  props = {
    jump: ((name) => {
      const url = this.router.config.find((x) => x.data.name === name)?.path;
      url && this.zone.run(() => this.router.navigateByUrl(url));
    }).bind(this),
  };

  constructor(private activatedRoute: ActivatedRoute, private router: Router, private zone: NgZone) {}

  ngOnInit(): void {
    console.log("[vue2] init");
    this.activatedRoute.params.pipe(filter(({ path }) => path)).subscribe(({ path }) => {
      this.vue2Url = hostMap("//localhost:7200/") + `#/${path}`;
    });
  }

  handleChange(e) {
    console.log("[vue2] change >", e);
  }
}
