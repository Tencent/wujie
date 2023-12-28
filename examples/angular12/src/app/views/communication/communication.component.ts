import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-communication',
  templateUrl: './communication.component.html',
  styleUrls: ['./communication.component.less']
})
export class CommunicationComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  handleClick() {
    window.$wujie.props!.jump('react17');
  }
  handleAlert() {
    window?.parent.alert('主应用alert');
  }
  handleEmit() {
    window?.$wujie.bus.$emit('click', 'angular 12');
  }
}
