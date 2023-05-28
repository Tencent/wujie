declare global {
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

export {}
