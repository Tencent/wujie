import {Component} from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent {
  preload = window.localStorage.getItem('preload') !== 'false';
  degrade = window.localStorage.getItem('degrade') === 'true' || !window.Proxy || !window.CustomElementRegistry;
  disable = !window.Proxy || !window.CustomElementRegistry;

  onPreloadChange(val: boolean) {
    window.localStorage.setItem('preload', val.toString());
    setTimeout(() => window.location.reload(), 1000);
  }

  onDegradeChange(val: boolean) {
    window.localStorage.setItem('degrade', val.toString());
    setTimeout(() => window.location.reload(), 1000);
  }

  openLink(url: string) {
  }
}
