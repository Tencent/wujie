import { bus, preloadApp, destroyApp } from "wujie";
import { App } from "vue";

declare const WujieVue: {
  bus: typeof bus;
  preloadApp: typeof preloadApp;
  destroyApp: typeof destroyApp;
  install: (app: App) => any;
};

export default WujieVue;
