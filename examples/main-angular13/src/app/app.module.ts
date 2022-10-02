import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {HomeComponent} from './home/home.component';
import {NZ_I18N} from 'ng-zorro-antd/i18n';
import {zh_CN} from 'ng-zorro-antd/i18n';
import {registerLocaleData} from '@angular/common';
import {CommonModule} from '@angular/common';
import zh from '@angular/common/locales/zh';
import {FormsModule} from '@angular/forms';
import {WujieModule} from 'wujie-angular';
import {HttpClientModule} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { IconDefinition } from '@ant-design/icons-angular';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {Vue2Component} from './views/vue2.component';
import {ViteComponent} from './views/vite.component';
import {NzToolTipModule} from 'ng-zorro-antd/tooltip';
import {NzSwitchModule} from 'ng-zorro-antd/switch';
import {Angular12Component} from './views/angular12.component';
import {MultipleComponent} from './views/multiple.component';
import {React16Component} from './views/react16.component';
import {React16SubComponent} from './views/react16-sub.component';
import {React17Component} from './views/react17.component';
import {React17SubComponent} from './views/react17-sub.component';
import {ViteSubComponent} from './views/vite-sub.component';
import {Vue2SubComponent} from './views/vue2-sub.component';
import {Vue3Component} from './views/vue3.component';
import {Vue3SubComponent} from './views/vue3-sub.component';

// 引入你需要的图标，比如你需要 fill 主题的 AccountBook Alert 和 outline 主题的 Alert，推荐 ✔️
import { UnorderedListOutline } from '@ant-design/icons-angular/icons';

registerLocaleData(zh);
const icons: IconDefinition[] = [ UnorderedListOutline ];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    Angular12Component,
    Vue2Component,
    ViteComponent,
    MultipleComponent,
    React16Component,
    React16SubComponent,
    React17Component,
    React17SubComponent,
    ViteSubComponent,
    Vue2SubComponent,
    Vue3Component,
    Vue3SubComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    NzIconModule.forRoot(icons),
    NzButtonModule,
    WujieModule,
    CommonModule,
    NzToolTipModule,
    NzSwitchModule
  ],
  providers: [{provide: NZ_I18N, useValue: zh_CN}],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {
}
