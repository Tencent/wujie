import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.less']
})
export class LocationComponent implements OnInit {
  host = location.host;
  windowHost = window.location.host;
  constructor() { }

  ngOnInit(): void {
  }

  handleClick() {
    if (window.__WUJIE?.degrade || !window.Proxy || !window.CustomElementRegistry) {
      window.$wujie.location!.href = "https://wujicode.cn/xy/app/prod/official/index";
    } else {
      window.location.href = "https://wujicode.cn/xy/app/prod/official/index";
    }
  }
}
