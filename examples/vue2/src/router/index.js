import Home from "../views/Home.vue";

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
    name: "dialog",
    component: () => import(/* webpackChunkName: "Page1" */ "../views/Dialog.vue"),
  },
  {
    path: "/communication",
    name: "communication",
    component: () => import(/* webpackChunkName: "Page2" */ "../views/Communication.vue"),
  },
  {
    path: "/location",
    name: "location",
    component: () => import(/* webpackChunkName: "Page3" */ "../views/Location.vue"),
  },
  {
    path: "/postmessage",
    name: "postmessage",
    component: () => import(/* webpackChunkName: "Page3" */ "../views/PostMessage.vue"),
  },
  {
    path: "/rich-text",
    name: "rich-text",
    component: () => import(/* webpackChunkName: "RichText" */ "../views/RichText.vue"),
  },
];

export default routes;
