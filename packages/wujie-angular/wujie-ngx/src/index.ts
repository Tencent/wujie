import { bus, preloadApp, destroyApp, setupApp } from "wujie";

export * from "./wujie.component";
export * from "./wujie.module";

export const WuJieAngular = {
    setupApp,
    preloadApp,
    bus,
    destroyApp,
};
