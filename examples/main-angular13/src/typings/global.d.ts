import {EventBus} from 'wujie/esm/event';
import WuJie from 'wujie/esm/sandbox';

declare global {
  const $wujie: WujieApp;

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
     *  原生的querySelector
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
     * 子应用沙盒实例
     */
    __WUJIE: WuJie;
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
    $wujie: WujieApp;
  }
}

interface WujieApp {
  bus: EventBus;
  shadowRoot?: ShadowRoot;
  props?: Record<string, any>;
  location?: Location;
}


export {};
