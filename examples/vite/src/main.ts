import { createApp } from "vue";
import App from "./App.vue";
import routes from "./router";
import { createRouter, createWebHistory } from "vue-router";
import Tag from "element-plus/es/components/tag/index";
import Button from "element-plus/es/components/button/index";
import Dialog from "element-plus/es/components/dialog/index";
import Select from "element-plus/es/components/select/index";
import Popover from "element-plus/es/components/popover/index";
import AButton from "ant-design-vue/es/button";
import ASelect from "ant-design-vue/es/select";
import AModal from "ant-design-vue/es/modal";
import APopover from "ant-design-vue/es/popover";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/tag/style/css";
import "element-plus/es/components/dialog/style/css";
import "element-plus/es/components/select/style/css";
import "element-plus/es/components/popover/style/css";
import "ant-design-vue/es/style/index.css";
import "ant-design-vue/es/button/style/index.css";
import "ant-design-vue/es/select/style/index.css";
import "ant-design-vue/es/modal/style/index.css";
import "ant-design-vue/es/popover/style/index.css";
import "./index.css";

const basename = process.env.NODE_ENV === "production" ? "/demo-vite/" : "";
declare global {
  interface Window {
    // 是否存在无界
    __POWERED_BY_WUJIE__?: boolean;
    // 子应用mount函数
    __WUJIE_MOUNT: () => void;
    // 子应用unmount函数
    __WUJIE_UNMOUNT: () => void;
    // 子应用无界实例
    __WUJIE: { mount: () => void };
  }
}

if (window.__POWERED_BY_WUJIE__) {
  let instance: any;
  window.__WUJIE_MOUNT = () => {
    const router = createRouter({ history: createWebHistory(basename), routes });
    instance = createApp(App)
      .use(Tag)
      .use(Button)
      .use(Dialog)
      .use(Select)
      .use(Popover)
      .use(AButton)
      .use(ASelect)
      .use(AModal)
      .use(APopover)
      .use(router);
    instance.mount("#app");
  };
  window.__WUJIE_UNMOUNT = () => {
    instance.unmount();
  };
  // module脚本异步加载，应用主动调用生命周期
  window.__WUJIE.mount();
} else {
  createApp(App)
    .use(Tag)
    .use(Button)
    .use(Dialog)
    .use(Select)
    .use(Popover)
    .use(AButton)
    .use(ASelect)
    .use(AModal)
    .use(APopover)
    .use(createRouter({ history: createWebHistory(basename), routes }))
    .mount("#app");
}
