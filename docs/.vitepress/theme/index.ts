import Theme from "vitepress/theme";
import WujieVue from "wujie-vue3";
import wujieHome from "./components/wujie-home.vue";
import { h } from "vue";
import "./styles/vars.css";

export default {
  ...Theme,
  Layout() {
    return h(wujieHome, null, {
      "nav-bar-title-before": () => h(wujieHome),
    });
  },
  enhanceApp({ app }) {
    app.use(WujieVue);
  },
};
