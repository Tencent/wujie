import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import WujieVue from "wujie-vue2";
import hostMap from "./hostMap";
import credentialsFetch from "./fetch";
import Switch from "ant-design-vue/es/switch";
import Tooltip from "ant-design-vue/es/tooltip";
import "ant-design-vue/es/style/index.css";
import "ant-design-vue/es/switch/style/index.css";
import "ant-design-vue/es/tooltip/style/index.css";
import lifecycles from "./lifecycle";
import plugins from "./plugin";
// import { wujiFetch, props } from "./wuji";

const isProduction = process.env.NODE_ENV === "production";
const { preloadApp, bus } = WujieVue;
Vue.use(WujieVue).use(Switch).use(Tooltip);

Vue.config.productionTip = false;

bus.$on("click", (msg) => window.alert(msg));

if (window.localStorage.getItem("preload") !== "false") {
  const degrade = window.localStorage.getItem("degrade") === "true" || !window.Proxy || !window.CustomElementRegistry;
  preloadApp({
    name: "react16",
    url: hostMap("//localhost:7600"),
    attrs: isProduction ? { src: hostMap("//localhost:7600") } : {},
    exec: true,
    fetch: credentialsFetch,
    degrade,
    plugins,
    ...lifecycles,
  });
  preloadApp({
    name: "react17",
    url: hostMap("//localhost:7100"),
    attrs: isProduction ? { src: hostMap("//localhost:7100") } : {},
    exec: true,
    alive: true,
    fetch: credentialsFetch,
    degrade,
    ...lifecycles,
  });
  preloadApp({
    name: "vue2",
    url: hostMap("//localhost:7200"),
    attrs: isProduction ? { src: hostMap("//localhost:7200") } : {},
    exec: true,
    fetch: credentialsFetch,
    degrade,
    ...lifecycles,
  });
  preloadApp({
    name: "vue3",
    url: hostMap("//localhost:7300"),
    attrs: isProduction ? { src: hostMap("//localhost:7300") } : {},
    exec: true,
    alive: true,
    // 引入了的第三方样式不需要添加credentials
    fetch: (url, options) =>
      url.includes(hostMap("//localhost:7300")) ? credentialsFetch(url, options) : window.fetch(url, options),
    degrade,
    ...lifecycles,
  });
  preloadApp({
    name: "angular12",
    url: hostMap("//localhost:7400"),
    attrs: isProduction ? { src: hostMap("//localhost:7400") } : {},
    exec: true,
    fetch: credentialsFetch,
    degrade,
    ...lifecycles,
  });
  preloadApp({
    name: "vite",
    url: hostMap("//localhost:7500"),
    attrs: isProduction ? { src: hostMap("//localhost:7500") } : {},
    exec: true,
    fetch: credentialsFetch,
    degrade,
    ...lifecycles,
  });
}

new Vue({
  router,
  render: (h) => h(App),
}).$mount("#app");
