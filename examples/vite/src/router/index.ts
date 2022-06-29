import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import { defineAsyncComponent } from "vue";
const _import = (name: string) => defineAsyncComponent(() => import(`../views/${name}.vue`));
const basename = process.env.NODE_ENV === "production" ? "/demo-vite/" : "";

const routes = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/home",
    component: Home,
  },
  {
    path: "/dialog",
    name: "Dialog",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: _import("Dialog"),
  },
  {
    path: "/location",
    name: "Location",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: _import("Location"),
  },
  // {
  //   path: "/state",
  //   name: "State",
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: _import('State')
  // },
  {
    path: "/contact",
    name: "Contact",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: _import("Communication"),
  },
];

const router = createRouter({
  history: createWebHistory(basename),
  routes,
});

export default router;
