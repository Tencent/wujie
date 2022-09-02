import Theme from "vitepress/theme";
import wujieHome from "./components/wujie-home.vue";
import { h } from "vue";
import "./styles/vars.css";

const inBrowser = typeof window !== "undefined";
export default {
  ...Theme,
  Layout() {
    return h(wujieHome, null, {
      "nav-bar-title-before": () => h(wujieHome),
    });
  },
  enhanceApp({ app }) {
    inBrowser &&
      import("wujie-vue3").then((module) => {
        app.use(module.default);
      });
  },
};
