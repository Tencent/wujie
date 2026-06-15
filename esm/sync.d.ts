/**
 * 同步子应用路由到主应用路由
 */
export declare function syncUrlToWindow(iframeWindow: Window): void;
/**
 * 同步主应用路由到子应用
 */
export declare function syncUrlToIframe(iframeWindow: Window): void;
/**
 * 清理非激活态的子应用同步参数
 * 主应用采用hash模式时，切换子应用后已销毁的子应用同步参数还存在需要手动清理
 */
export declare function clearInactiveAppUrl(): void;
/**
 * 推送指定url到主应用路由
 */
export declare function pushUrlToWindow(id: string, url: string): void;
/**
 * 应用跳转(window.location.href)情况路由处理
 */
export declare function processAppForHrefJump(): void;
