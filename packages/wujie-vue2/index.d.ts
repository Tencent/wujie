import { VueConstructor } from "vue";
import { bus, preloadApp, destroyApp, setupApp, refreshApp } from "wujie";

declare const WujieVue: {
  bus: typeof bus;
  setupApp: typeof setupApp;
  preloadApp: typeof preloadApp;
  destroyApp: typeof destroyApp;
  refreshApp: typeof refreshApp;
  install: (Vue: VueConstructor) => void;
};

export default WujieVue;
