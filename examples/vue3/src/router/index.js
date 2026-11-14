import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
const basename = process.env.NODE_ENV === "production" ? "/demo-vue3/" : "";

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
    component: () => import("../views/Dialog.vue"),
  },
  {
    path: "/location",
    name: "Location",
    component: () => import("../views/Location.vue"),
  },
  {
    path: "/state",
    name: "State",
    component: () => import("../views/State.vue"),
  },
  {
    path: "/contact",
    name: "Contact",
    component: () => import("../views/Communication.vue"),
  },
  {
    path: "/postmessage",
    name: "Postmessage",
    component: () => import("../views/PostMessage.vue"),
  },
  {
    path: "/inline-event",
    name: "InlineEvent",
    component: () => import("../views/InlineEvent.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(basename),
  routes,
});

export default router;
