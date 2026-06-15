/**
 * 非降级情况下window、document、location代理
 */
export declare function proxyGenerator(iframe: HTMLIFrameElement, urlElement: HTMLAnchorElement, mainHostPath: string, appHostPath: string): {
    proxyWindow: Window;
    proxyDocument: Object;
    proxyLocation: Object;
    proxyRevoke: () => void;
};
/**
 * 降级情况下document、location代理处理
 */
export declare function localGenerator(iframe: HTMLIFrameElement, urlElement: HTMLAnchorElement, mainHostPath: string, appHostPath: string): {
    proxyDocument: Object;
    proxyLocation: Object;
    proxyRevoke: () => void;
};
