import Vue from "vue";
import { bus, preloadApp, destroyApp, setupApp } from "wujie";

declare const WujieVue: {
  bus: typeof bus;
  setupApp: typeof setupApp;
  preloadApp: typeof preloadApp;
  destroyApp: typeof destroyApp;
  install: (Vue: Vue) => void;
};

export default WujieVue;
