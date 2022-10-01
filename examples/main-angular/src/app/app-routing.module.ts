import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { Angular12Component } from "./pages/angular12.component";
import { HomeComponent } from "./pages/home.component";
import { React16Component } from "./pages/react16.component";
import { React17Component } from "./pages/react17.component";
import { ViteComponent } from "./pages/vite.component";
import { Vue2Component } from "./pages/vue2.component";
import { Vue3Component } from "./pages/vue3.component";
import { MultipleComponent } from "./pages/multiple.component";

const routes: Routes = [
  { path: "react16", component: React16Component, data: { name: "react16" } },
  { path: "react16-sub/:path", component: React16Component, data: { name: "react16-sub" } },
  { path: "react17", component: React17Component, data: { name: "react17" } },
  { path: "react17-sub/:path", component: React17Component, data: { name: "react17-sub" } },
  { path: "vue2", component: Vue2Component, data: { name: "vue2" } },
  { path: "vue2-sub/:path", component: Vue2Component, data: { name: "vue2-sub" } },
  { path: "vue3", component: Vue3Component, data: { name: "vue3" } },
  { path: "vue3-sub/:path", component: Vue3Component, data: { name: "vue3-sub" } },
  { path: "vite", component: ViteComponent, data: { name: "vite" } },
  { path: "vite-sub/:path", component: ViteComponent, data: { name: "vite-sub" } },
  { path: "angular12", component: Angular12Component, data: { name: "angular" } },
  { path: "all", component: MultipleComponent, data: { name: "all" } },
  { path: "home", component: HomeComponent, data: { name: "home" } },
  { path: "**", redirectTo: "/home" },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
