/**
 * wangEditor 在无界下的兼容插件（Issue #479）。
 *
 * 子应用 UI 在主应用 shadowRoot 中渲染，paste 事件的 clipboardData 来自主应用 realm，
 * 子应用内 `clipboardData instanceof DataTransfer` 会为 false，导致粘贴无响应。
 *
 * 非降级模式可由 wujie-core 的 patchInstanceofAcrossRealms 修复 DataTransfer；
 * 降级模式需在此显式对齐 Selection / DataTransfer 构造函数。
 */
export const wangEditorPlugin = {
  jsBeforeLoaders: [
    {
      callback(appWindow) {
        Object.defineProperties(appWindow, {
          Selection: {
            configurable: true,
            get() {
              return appWindow.__WUJIE.degrade
                ? appWindow.__WUJIE.document.defaultView.Selection
                : appWindow.parent.Selection;
            },
          },
          DataTransfer: {
            configurable: true,
            get() {
              return appWindow.__WUJIE.degrade
                ? appWindow.__WUJIE.document.defaultView.DataTransfer
                : appWindow.parent.DataTransfer;
            },
          },
        });
      },
    },
  ],
};
