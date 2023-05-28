export interface WujieProps {
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

declare interface _WujieComponent {
  new (): {
    $props: WujieProps
  }
}

export declare const WujieComponent: _WujieComponent