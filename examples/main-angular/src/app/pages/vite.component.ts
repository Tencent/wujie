import { Component, NgZone, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { filter } from "rxjs/operators";
import hostMap from "../../hostMap";

@Component({
  selector: "vite",
  template: `<wujie-ngx
    width="100%"
    height="100%"
    [name]="'vite'"
    [url]="viteUrl"
    [sync]="true"
    [props]="props"
    (change)="handleChange($event)"
  ></wujie-ngx>`,
})
export class ViteComponent implements OnInit {
  viteUrl = hostMap("//localhost:7500/");
  props = {
    jump: ((name) => {
      const url = this.router.config.find((x) => x.data.name === name)?.path;
      url && this.zone.run(() => this.router.navigateByUrl(url));
    }).bind(this),
  };

  constructor(private activatedRoute: ActivatedRoute, private router: Router, private zone: NgZone) {}

  ngOnInit(): void {
    console.log("[vite] init");
    this.activatedRoute.params.pipe(filter(({ path }) => path)).subscribe(({ path }) => {
      this.viteUrl = hostMap("//localhost:7500/") + `${path}`;
    });
  }

  handleChange(e) {
    console.log("[vite] change >", e);
  }
}
