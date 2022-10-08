import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, ActivationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
  constructor(private router: Router, private zone: NgZone) {
  }

  ngOnInit(): void {
    this.router.events.pipe(filter(event => event instanceof ActivationEnd)).subscribe(evt => {
      const url = (evt as ActivationEnd).snapshot.url.join('/');
      window.$wujie?.bus.$emit('sub-route-change', 'angular12', `/${url}`);
    });

    window.$wujie?.bus.$on('angular12-router-change', (path) => this.zone.run(() => this.router.navigate([path])));
  }
}
