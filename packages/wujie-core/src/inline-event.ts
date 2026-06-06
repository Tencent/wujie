/**
 * 内联事件处理器辅助函数
 * 用于在 ShadowDOM 中动态获取子应用的 window 对象
 */

import WuJie from "./sandbox";

/**
 * 获取子应用的 window 对象
 * 用于内联事件处理器编译后的 with 语句
 * 
 * @param element - 触发事件的元素
 * @returns 子应用的 proxyWindow
 */
export function getWujieWindow(element: Element): WindowProxy {
  try {
    // 1. 获取 shadowRoot
    const shadowRoot = element.getRootNode() as ShadowRoot;
    
    // 2. 获取 wujie-app 元素
    const wujieApp = shadowRoot.host as HTMLElement;
    if (!wujieApp) {
      console.warn('[wujie] Cannot find wujie-app element');
      return window;
    }
    
    // 3. 获取 appId
    const appId = wujieApp.getAttribute('data-wujie-id');
    if (!appId) {
      console.warn('[wujie] Cannot find app id');
      return window;
    }
    
    // 4. 查找对应的 iframe
    const iframe = document.querySelector(`iframe[name="${appId}"]`) as HTMLIFrameElement;
    if (!iframe) {
      console.warn(`[wujie] Cannot find iframe for app ${appId}`);
      return window;
    }
    
    // 5. 返回子应用的 proxyWindow
    const proxyWindow = iframe.contentWindow?.__WUJIE?.proxy;
    if (!proxyWindow) {
      console.warn(`[wujie] Cannot find proxy window for app ${appId}`);
      return window;
    }
    
    return proxyWindow;
  } catch (e) {
    console.warn('[wujie] Failed to get wujie window:', e);
    return window;
  }
}

/**
 * 初始化全局辅助函数
 */
export function initInlineEventHelper(): void {
  if (typeof window !== 'undefined' && !window.__getWujieWindow__) {
    window.__getWujieWindow__ = getWujieWindow;
  }
}
