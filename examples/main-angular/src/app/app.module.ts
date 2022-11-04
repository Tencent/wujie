import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule } from "@angular/forms";
import { WujieModule } from "wujie-angular";

import { NzIconModule } from "ng-zorro-antd/icon";
import { NzSwitchModule } from "ng-zorro-antd/switch";
import { NzToolTipModule } from "ng-zorro-antd/tooltip";
import { NzButtonModule } from "ng-zorro-antd/button";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { Angular12Component } from "./pages/angular12.component";
import { HomeComponent } from "./pages/home.component";
import { React16Component } from "./pages/react16.component";
import { React17Component } from "./pages/react17.component";
import { ViteComponent } from "./pages/vite.component";
import { Vue2Component } from "./pages/vue2.component";
import { Vue3Component } from "./pages/vue3.component";
import { MultipleComponent } from "./pages/multiple.component";

import { UnorderedListOutline, CaretUpFill } from "@ant-design/icons-angular/icons";
import { IconDefinition } from "@ant-design/icons-angular";
const icons: IconDefinition[] = [UnorderedListOutline, CaretUpFill];

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    WujieModule,
    NzIconModule.forRoot(icons),
    NzSwitchModule,
    NzToolTipModule,
    NzButtonModule,
    AppRoutingModule,
  ],
  declarations: [
    AppComponent,
    Angular12Component,
    HomeComponent,
    React16Component,
    React17Component,
    ViteComponent,
    Vue2Component,
    Vue3Component,
    MultipleComponent,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
