import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import React16 from "../views/React16.vue";
import React17 from "../views/React17.vue";
import Vue2 from "../views/Vue2.vue";
import Vite from "../views/Vite.vue";
import Vue3 from "../views/Vue3.vue";
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
    path: "/react17",
    name: "react17",
    component: React17,
  },
  {
    path: "/vue2",
    name: "vue2",
    component: Vue2,
  },
  {
    path: "/vite",
    name: "vite",
    component: Vite,
  },
  {
    path: "/vue3",
    name: "vue3",
    component: Vue3,
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
