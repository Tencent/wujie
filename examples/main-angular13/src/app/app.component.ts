import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ActivationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { pathChangeObservable } from '../path-change';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
  active = false;
  react16Flag = false;
  react17Flag = false;
  vue2Flag = false;
  vue3Flag = false;
  viteFlag = false;

  constructor(private activatedRoute: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.router.events.pipe(filter(event => event instanceof ActivationEnd)).subscribe(evt => {
      const routeName = (evt as ActivationEnd).snapshot.data['name'];
      this.react16Flag = routeName === 'react16-sub';
      this.react17Flag = routeName === 'react17-sub';
      this.vue2Flag = routeName === 'vue2-sub';
      this.vue3Flag = routeName === 'vue3-sub';
      this.viteFlag = routeName === 'vite-sub';
    });

    pathChangeObservable.subscribe(path => this.router.navigate([path]));
  }

  close() {
    this.active = false;
  }

  handleFlag(evt: MouseEvent, name: keyof AppComponent) {
    evt.preventDefault();
    evt.stopPropagation();
    // @ts-ignore
    this[name] = !this[name];
  }
}
