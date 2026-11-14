import Vue, { VueConstructor } from "vue";
import { ExtendedVue } from "vue/types/vue";
import { bus, preloadApp, destroyApp, setupApp, refreshApp, clearAssetsCache, startOptions } from "wujie";

/**
 * WujieVue 组件属性：与组件声明的 props 一一对应，类型与 startApp 的同名参数一致
 */
export interface WujieVueProps
  extends Pick<
    startOptions,
    | "name"
    | "url"
    | "loading"
    | "sync"
    | "prefix"
    | "alive"
    | "props"
    | "attrs"
    | "replace"
    | "fetch"
    | "fiber"
    | "degrade"
    | "plugins"
    | "beforeLoad"
    | "beforeMount"
    | "afterMount"
    | "beforeUnmount"
    | "afterUnmount"
    | "activated"
    | "deactivated"
    | "loadError"
    | "iframeAddEventListeners"
    | "iframeOnEvents"
  > {
  /** 容器宽度 */
  width?: string;
  /** 容器高度 */
  height?: string;
}

/**
 * WujieVue 组件实例方法
 */
export type WujieVueMethods = {
  /** 销毁当前子应用 */
  destroy(): void;
  /** 销毁当前子应用并复用组件 props 全量重建 */
  refresh(): Promise<void>;
};

declare const WujieVue: ExtendedVue<Vue, {}, WujieVueMethods, {}, WujieVueProps> & {
  bus: typeof bus;
  setupApp: typeof setupApp;
  preloadApp: typeof preloadApp;
  destroyApp: typeof destroyApp;
  refreshApp: typeof refreshApp;
  clearAssetsCache: typeof clearAssetsCache;
  install: (Vue: VueConstructor) => void;
};

export default WujieVue;
