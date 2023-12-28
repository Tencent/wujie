import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { Vue2Component } from './views/vue2.component';
import { ViteComponent } from './views/vite.component';
import { React16Component } from './views/react16.component';
import { React16SubComponent } from './views/react16-sub.component';
import { React17Component } from './views/react17.component';
import { React17SubComponent } from './views/react17-sub.component';
import { Vue2SubComponent } from './views/vue2-sub.component';
import { ViteSubComponent } from './views/vite-sub.component';
import { Vue3Component } from './views/vue3.component';
import { Vue3SubComponent } from './views/vue3-sub.component';
import { Angular12Component } from './views/angular12.component';
import { Angular12SubComponent } from './views/angular12-sub.component';
import { MultipleComponent } from './views/multiple.component';

const routes: Routes = [
  {
    path: 'home',
    data: { name: 'home' },
    component: HomeComponent
  },
  {
    path: 'react16',
    data: { name: 'react16' },
    component: React16Component
  },
  {
    path: 'react16-sub/:path',
    data: { name: 'react16-sub' },
    component: React16SubComponent
  },
  {
    path: 'react17',
    data: { name: 'react17' },
    component: React17Component
  },
  {
    path: 'react17-sub/:path',
    data: { name: 'react17-sub' },
    component: React17SubComponent
  },
  {
    path: 'vue2',
    data: { name: 'vue2' },
    component: Vue2Component
  },
  {
    path: 'vue2-sub/:path',
    data: { name: 'vue2-sub' },
    component: Vue2SubComponent
  },
  {
    path: 'vite',
    data: { name: 'vite' },
    component: ViteComponent
  },
  {
    path: 'vite-sub/:path',
    data: { name: 'vite-sub' },
    component: ViteSubComponent
  },
  {
    path: 'vue3',
    data: { name: 'vue3' },
    component: Vue3Component
  },
  {
    path: 'vue3-sub/:path',
    data: { name: 'vue3-sub' },
    component: Vue3SubComponent
  },
  {
    path: 'angular12',
    data: { name: 'angular12' },
    component: Angular12Component
  },
  {
    path: 'angular12-sub/:path',
    data: { name: 'angular12-sub' },
    component: Angular12SubComponent
  },
  {
    path: 'all',
    data: { name: 'all' },
    component: MultipleComponent
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
