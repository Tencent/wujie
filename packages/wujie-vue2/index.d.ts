import Vue from "vue";
import { bus, preloadApp, destroyApp } from "wujie";

declare const WujieVue: {
  bus: typeof bus;
  preloadApp: typeof preloadApp;
  destroyApp: typeof destroyApp;
  install: (Vue: Vue) => void;
};

export default WujieVue;
