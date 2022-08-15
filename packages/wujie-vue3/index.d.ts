import { bus, preloadApp, destroyApp, createApp } from "wujie";
import { App } from "vue";

declare const WujieVue: {
  bus: typeof bus;
  createApp: typeof createApp;
  preloadApp: typeof preloadApp;
  destroyApp: typeof destroyApp;
  install: (app: App) => any;
};

export default WujieVue;
