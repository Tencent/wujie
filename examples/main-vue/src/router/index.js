import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import React16 from "../views/React16.vue";
import React16Sub from "../views/React16-sub.vue";
import React17 from "../views/React17.vue";
import React17Sub from "../views/React17-sub.vue";
import Vue2 from "../views/Vue2.vue";
import Vue2Sub from "../views/Vue2-sub.vue";
import Vite from "../views/Vite.vue";
import ViteSub from "../views/Vite-sub.vue";
import Vue3 from "../views/Vue3.vue";
import Vue3Sub from "../views/Vue3-sub.vue";
import Angular12 from "../views/Angular12.vue";
import Multiple from "../views/Multiple.vue";
const basename = process.env.NODE_ENV === "production" ? "/demo-main-vue/" : "";

Vue.use(VueRouter);

const routes = [
  {
    path: "/home",
    name: "home",
    component: Home,
  },
  {
    path: "/react16",
    name: "react16",
    component: React16,
  },
  {
    path: "/react16-sub/:path",
    name: "react16-sub",
    component: React16Sub,
  },
  {
    path: "/react17",
    name: "react17",
    component: React17,
  },
  {
    path: "/react17-sub/:path",
    name: "react17-sub",
    component: React17Sub,
  },
  {
    path: "/vue2",
    name: "vue2",
    component: Vue2,
  },
  {
    path: "/vue2-sub/:path",
    name: "vue2-sub",
    component: Vue2Sub,
  },
  {
    path: "/vite",
    name: "vite",
    component: Vite,
  },
  {
    path: "/vite-sub/:path",
    name: "vite-sub",
    component: ViteSub,
  },
  {
    path: "/vue3",
    name: "vue3",
    component: Vue3,
  },
  {
    path: "/vue3-sub/:path",
    name: "vue3-sub",
    component: Vue3Sub,
  },
  {
    path: "/angular12",
    name: "angular12",
    component: Angular12,
  },
  {
    path: "/all",
    name: "all",
    component: Multiple,
  },
  {
    path: "/",
    redirect: "/home",
  },
];

const router = new VueRouter({
  mode: "history",
  base: basename,
  routes,
});

export default router;
