interface WujieProps {
  /**
   * 宽度
   * @default ""
   */
  width?: string
  /**
   * 高度
   * @default ""
   */
  height?: string
  /**
   * 唯一名称
   * @default ""
   */
  name?: string
  /**
   * 地址
   * @default ""
   */
  url?: string
  /**
   * 是否同步
   * @default false
   */
  sync?: boolean
  /**
   *
   * @default undefined
   */
  fetch?: (...args) => any
  /**
   *
   * @default undefined
   */
  props?: Record<string, any>
  /**
   * 子应用开始加载静态资源前触发
   * @default null
   */
  beforeLoad?: (...args) => void
  /**
   * 子应用渲染（调用`window.__WUJIE_MOUNT`）前触发
   * @default null
   */
  beforeMount?: (...args) => void
  /**
   * 子应用渲染（调用`window.__WUJIE_MOUNT`）后触发
   * @default null
   */
  afterMount?: (...args) => void
  /**
   * 子应用卸载（调用`window.__WUJIE_UNMOUNT`）前触发
   * @default null
   */
  beforeUnmount?: (...args) => void
  /**
   * 子应用卸载（调用`window.__WUJIE_UNMOUNT`）后触发
   * @default null
   */
  afterUnmount?: (...args) => void
}

declare interface WujieComponent {
  new (): {
    $props: WujieProps
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ['wujie-vue']: WujieProps
    }
  }

  interface Window {
    /**
     * 是否存在无界
     */
    __POWERED_BY_WUJIE__?: boolean;
    /**
     * 子应用公共加载路径
     */
    __WUJIE_PUBLIC_PATH__: string;
    /**
     * 原生的querySelector
     */
    __WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__: typeof Document.prototype.querySelector;
    /**
     * 原生的querySelectorAll
     */
    __WUJIE_RAW_DOCUMENT_QUERY_SELECTOR_ALL__: typeof Document.prototype.querySelectorAll;
    /**
     * 原生的window对象
     */
    __WUJIE_RAW_WINDOW__: Window;
    /**
     * 子应用沙盒实例，用户不应该使用
     */
    __WUJIE: any;
    /**
     * 子应用mount函数
     */
    __WUJIE_MOUNT: () => void;
    /**
     * 子应用unmount函数
     */
    __WUJIE_UNMOUNT: () => void;
    /**
     * 注入对象
     */
    $wujie: {
      bus: typeof import('wujie')['bus'];
      shadowRoot?: ShadowRoot;
      props?: { [key: string]: any };
      location?: Object;
    }
  }
}

declare module 'vue' {
  export interface GlobalComponents {
    WujieVue: WujieComponent
  }
}

export {}
