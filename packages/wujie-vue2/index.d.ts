import Vue from "vue";
import { bus, preloadApp, destroyApp, createApp } from "wujie";

declare const WujieVue: {
  bus: typeof bus;
  createApp: typeof createApp;
  preloadApp: typeof preloadApp;
  destroyApp: typeof destroyApp;
  install: (Vue: Vue) => void;
};

export default WujieVue;
