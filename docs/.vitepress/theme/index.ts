import Theme from "vitepress/theme";
import wujieHome from "./components/wujie-home.vue";
import { h } from "vue";
import Documate from "@documate/vue";
import "@documate/vue/dist/style.css";
import "./styles/vars.css";
import "./styles/DocSearch.css";

const inBrowser = typeof window !== "undefined";
export default {
  ...Theme,
  // Layout() {
  //   return h(wujieHome, null, {
  //     "nav-bar-title-before": () => h(wujieHome),
  //     "nav-bar-content-before": () =>
  //       h(Documate, {
  //         endpoint: "https://6gxr8z72bh.us.aircode.run/ask",
  //       }),
  //   });
  // },
  Layout: h(Theme.Layout, null, {
    "nav-bar-content-before": () =>
      h(Documate, {
        endpoint: "https://6gxr8z72bh.us.aircode.run/ask",
      }),
  }),
  enhanceApp({ app }) {
    inBrowser &&
      import("wujie-vue3").then((module) => {
        app.use(module.default);
      });
  },
};
