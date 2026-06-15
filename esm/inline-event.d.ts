/**
 * 内联事件处理器辅助函数
 * 用于在 ShadowDOM 中动态获取子应用的 window 对象
 */
/**
 * 获取子应用的 window 对象
 * 用于内联事件处理器编译后的 with 语句
 *
 * @param element - 触发事件的元素
 * @returns 子应用的 proxyWindow
 */
export declare function getWujieWindow(element: Element): WindowProxy;
/**
 * 初始化全局辅助函数
 */
export declare function initInlineEventHelper(): void;
