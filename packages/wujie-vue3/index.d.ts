import { bus, preloadApp, destroyApp, setupApp } from "wujie";
import { App } from "vue";

declare const WujieVue: {
  bus: typeof bus;
  setupApp: typeof setupApp;
  preloadApp: typeof preloadApp;
  destroyApp: typeof destroyApp;
  install: (app: App) => any;
};

export default WujieVue;
