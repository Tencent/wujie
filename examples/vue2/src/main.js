import "core-js/modules/es.array.find";

import Vue from "vue";
import App from "./App.vue";
import routes from "./router";
import VueRouter from "vue-router";
import Tag from "element-ui/lib/tag";
import Button from "element-ui/lib/button";
import Select from "element-ui/lib/select";
import Option from "element-ui/lib/option";
import Popover from "element-ui/lib/popover";
import Dialog from "element-ui/lib/dialog";
import Tabs from "element-ui/lib/tabs";
import TabPane from "element-ui/lib/tab-pane";
import Collapse from "element-ui/lib/collapse";
import CollapseItem from "element-ui/lib/collapse-item";
import Alert from "element-ui/lib/alert";
import AButton from "ant-design-vue/es/button";
import ASelect from "ant-design-vue/es/select";
import AModal from "ant-design-vue/es/modal";
import APopover from "ant-design-vue/es/popover";
import "./pageLifeTest";
import "element-ui/lib/theme-chalk/base.css";
import "element-ui/lib/theme-chalk/tag.css";
import "element-ui/lib/theme-chalk/button.css";
import "element-ui/lib/theme-chalk/select.css";
import "element-ui/lib/theme-chalk/option.css";
import "element-ui/lib/theme-chalk/popover.css";
import "element-ui/lib/theme-chalk/dialog.css";
import "element-ui/lib/theme-chalk/tabs.css";
import "element-ui/lib/theme-chalk/tab-pane.css";
import "element-ui/lib/theme-chalk/collapse.css";
import "element-ui/lib/theme-chalk/collapse-item.css";
import "element-ui/lib/theme-chalk/alert.css";
import "ant-design-vue/es/style/index.css";
import "ant-design-vue/es/button/style/index.css";
import "ant-design-vue/es/select/style/index.css";
import "ant-design-vue/es/modal/style/index.css";
import "ant-design-vue/es/popover/style/index.css";
import "./index.css";

const base = process.env.NODE_ENV === "production" ? "/demo-vue2/" : "";

[Tag, Button, Select, Option, Popover, Dialog, Tabs, TabPane, Collapse, CollapseItem, Alert].forEach(
  (element) => Vue.use(element)
);
[AButton, ASelect, AModal, APopover].forEach((element) => Vue.use(element));

Vue.use(VueRouter);

Vue.config.productionTip = false;

if (window.__POWERED_BY_WUJIE__) {
  let instance;
  let router;
  window.__WUJIE_MOUNT = () => {
    router = new VueRouter({ base, routes });
    instance = new Vue({ router, render: (h) => h(App) }).$mount("#app");
  };
  window.__WUJIE_UNMOUNT = () => {
    instance.$destroy();
    router?.options?.history?.destroy?.();
    window.__VUE_DEVTOOLS_PLUGINS__ = [];
    window.__VUE_INSTANCE_SETTERS__ = [];
    instance = null;
    router = null;
  };
} else {
  new Vue({ router: new VueRouter({ base, routes }), render: (h) => h(App) }).$mount("#app");
}
