import { bus, preloadApp, destroyApp, setupApp, refreshApp, clearAssetsCache, startOptions } from "wujie";
import type { CSSProperties, DefineComponent, Plugin } from "vue";

/**
 * WujieVue 组件属性：除 el 由组件容器提供外，其余与 startApp 的参数保持一致
 */
export interface WujieVueProps extends Omit<startOptions, "el"> {
  /** 容器宽度 */
  width?: string;
  /** 容器高度 */
  height?: string;
  /** 容器自定义样式 */
  style?: CSSProperties;
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

declare const WujieVue: DefineComponent<WujieVueProps, {}, {}, {}, WujieVueMethods> &
  Plugin & {
    bus: typeof bus;
    setupApp: typeof setupApp;
    preloadApp: typeof preloadApp;
    destroyApp: typeof destroyApp;
    refreshApp: typeof refreshApp;
    clearAssetsCache: typeof clearAssetsCache;
  };

declare module "vue" {
  export interface GlobalComponents {
    WujieVue: typeof WujieVue;
  }
}

export default WujieVue;
