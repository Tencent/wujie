import { Component, VERSION } from "@angular/core";

@Component({
  selector: "my-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  name = "Angular " + VERSION.major;

  active = false;
  react16Flag = false;
  react17Flag = false;
  vue2Flag = false;
  vue3Flag = false;
  viteFlag = false;

  constructor() {}

  close() {
    if (this.active) this.active = false;
  }

  handleFlag(name) {
    this[name + "Flag"] = !this[name + "Flag"];
  }
}
