import Vue, { VueConstructor } from "vue";
import { ExtendedVue } from "vue/types/vue";
import { bus, preloadApp, destroyApp, setupApp, refreshApp, clearAssetsCache, startOptions } from "wujie";

/**
 * WujieVue 组件属性：除 el 由组件容器提供外，其余与 startApp 的参数保持一致
 */
export interface WujieVueProps extends Omit<startOptions, "el"> {
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
