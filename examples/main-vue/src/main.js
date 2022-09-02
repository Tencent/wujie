import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import WujieVue from "wujie-vue2";
import hostMap from "./hostMap";
import credentialsFetch from "./fetch";
import Switch from "ant-design-vue/es/switch";
import Tooltip from "ant-design-vue/es/tooltip";
import button from "ant-design-vue/es/button/index";
import Icon from "ant-design-vue/es/icon/index";
import "ant-design-vue/es/button/style/index.css";
import "ant-design-vue/es/style/index.css";
import "ant-design-vue/es/switch/style/index.css";
import "ant-design-vue/es/tooltip/style/index.css";
import "ant-design-vue/es/icon/style/index.css";
import lifecycles from "./lifecycle";
import plugins from "./plugin";

const isProduction = process.env.NODE_ENV === "production";
const { setupApp, preloadApp, bus } = WujieVue;
Vue.use(WujieVue).use(Switch).use(Tooltip).use(button).use(Icon);

Vue.config.productionTip = false;

bus.$on("click", (msg) => window.alert(msg));

// 在 xxx-sub 路由下子应用将激活路由同步给主应用，主应用跳转对应路由高亮菜单栏
bus.$on("sub-route-change", (name, path) => {
  debugger;
  const mainName = `${name}-sub`;
  const mainPath = `/${name}-sub${path}`;
  const currentName = router.currentRoute.name;
  const currentPath = router.currentRoute.path;
  if (mainName === currentName && mainPath !== currentPath) {
    router.push({ path: mainPath });
  }
});

const degrade = window.localStorage.getItem("degrade") === "true" || !window.Proxy || !window.CustomElementRegistry;
const props = {
  jump: (name) => {
    router.push({ name });
  },
};
// 创建应用，主要是设置配置，preloadApp、startApp的配置基于这个配置做覆盖
setupApp({
  name: "react16",
  url: hostMap("//localhost:7600/"),
  attrs: isProduction ? { src: hostMap("//localhost:7600/") } : {},
  exec: true,
  props,
  fetch: credentialsFetch,
  plugins,
  prefix: { "prefix-dialog": "/dialog", "prefix-location": "/location" },
  degrade,
  // 修正iframe的url，防止github pages csp报错
  react16Attrs: process.env.NODE_ENV === "production" ? { src: hostMap("//localhost:7600/") } : {},
  ...lifecycles,
});

setupApp({
  name: "react17",
  url: hostMap("//localhost:7100/"),
  attrs: isProduction ? { src: hostMap("//localhost:7100/") } : {},
  exec: true,
  alive: true,
  props,
  fetch: credentialsFetch,
  degrade,
  ...lifecycles,
});

setupApp({
  name: "vue2",
  url: hostMap("//localhost:7200/"),
  attrs: isProduction ? { src: hostMap("//localhost:7200/") } : {},
  exec: true,
  props,
  fetch: credentialsFetch,
  degrade,
  ...lifecycles,
});

setupApp({
  name: "vue3",
  url: hostMap("//localhost:7300/"),
  attrs: isProduction ? { src: hostMap("//localhost:7300/") } : {},
  exec: true,
  alive: true,
  plugins: [{ cssExcludes: ["https://stackpath.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"] }],
  props,
  // 引入了的第三方样式不需要添加credentials
  fetch: (url, options) =>
    url.includes(hostMap("//localhost:7300/")) ? credentialsFetch(url, options) : window.fetch(url, options),
  degrade,
  ...lifecycles,
});

setupApp({
  name: "angular12",
  url: hostMap("//localhost:7400/"),
  attrs: isProduction ? { src: hostMap("//localhost:7400/") } : {},
  exec: true,
  props,
  fetch: credentialsFetch,
  degrade,
  ...lifecycles,
});

setupApp({
  name: "vite",
  url: hostMap("//localhost:7500/"),
  attrs: isProduction ? { src: hostMap("//localhost:7500/") } : {},
  exec: true,
  props,
  fetch: credentialsFetch,
  degrade,
  ...lifecycles,
});

if (window.localStorage.getItem("preload") !== "false") {
  preloadApp({
    name: "react16",
  });
  preloadApp({
    name: "react17",
  });
  preloadApp({
    name: "vue2",
  });
  preloadApp({
    name: "vue3",
  });
  preloadApp({
    name: "angular12",
  });
  preloadApp({
    name: "vite",
  });
}

new Vue({
  router,
  render: (h) => h(App),
}).$mount("#app");
