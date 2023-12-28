import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-state',
  templateUrl: './state.component.html',
  styleUrls: ['./state.component.less']
})
export class StateComponent implements OnInit {
  count = 10;
  constructor() { }

  ngOnInit(): void {
    window?.$wujie?.bus.$on('add', () => (this.count += 1));
    console.log('angular 12 state mounted');
  }

  handleClick() {
    window?.$wujie.props!.jump('react17');
  }

}
