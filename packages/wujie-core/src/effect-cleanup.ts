/**
 * 销毁链路清理跟踪器。
 *
 * 背景（详见 notes/memory-leak-investigation.md §2 §3）：
 *  - patchDocumentEffect 会把子应用 document.addEventListener 转发到主应用 window.document，
 *    若不在 destroy 时反向解绑，handler 闭包会持有 iframeWindow，整个子应用上下文 GC 不掉。
 *  - patchWindowEffect 会把子应用 window.onXXX 改写到主应用 window，
 *    destroy 时不还原会让主 window 上长期残留 dangling handler。
 *
 * 该跟踪器的实例挂在每个 Wujie 沙箱实例上，在 sandbox.destroy() 末尾统一调用 cleanupAll()。
 */

export type DocumentListenerEntry = {
  type: string;
  callback: EventListenerOrEventListenerObject;
  options?: boolean | AddEventListenerOptions;
};

export type WindowOnEventOriginal = {
  key: string;
  /** 修复前主应用 window 上该 key 的值（可能是原 handler / null / undefined） */
  originalValue: any;
  /** 修复前该 key 在主应用 window 上是否是 own property（用于 cleanup 决定是否要 delete） */
  hadOwnProperty: boolean;
};

export class EventCleanupTracker {
  /** 已经从 patchDocumentEffect 转发到主应用 window.document 的 listener */
  private readonly mainDocumentListeners: Set<DocumentListenerEntry> = new Set();
  /** 已被 patchWindowEffect 改写过的主应用 window onXXX，记录原始描述符以便还原 */
  private readonly windowOnEventOverrides: Map<string, WindowOnEventOriginal> = new Map();

  trackMainDocumentListener(entry: DocumentListenerEntry): void {
    this.mainDocumentListeners.add(entry);
  }

  /** removeEventListener 时同步从跟踪集合中剔除，避免 destroy 时再次解绑 */
  untrackMainDocumentListener(entry: DocumentListenerEntry): void {
    for (const existing of this.mainDocumentListeners) {
      if (existing.type === entry.type && existing.callback === entry.callback && existing.options === entry.options) {
        this.mainDocumentListeners.delete(existing);
        break;
      }
    }
  }

  /**
   * 记录某个 window onXXX 的原始值，供 destroy 时还原。
   * 同一 key 仅首次记录，避免后续覆盖把脏值当原始值。
   *
   * 注意：onresize/onclick 这类标准事件属性在浏览器/jsdom 中通常是 Window.prototype 上的
   * accessor descriptor（getter/setter），还原时不能 defineProperty 还原 descriptor 本身
   * （那只是重新装上同一个 accessor，不会清除内部存储的 handler），必须直接赋值让 setter
   * 重新写入存储，从而真正释放 dangling handler 引用。
   */
  trackWindowOnEvent(key: string, originalValue: any, hadOwnProperty: boolean): void {
    if (!this.windowOnEventOverrides.has(key)) {
      this.windowOnEventOverrides.set(key, { key, originalValue, hadOwnProperty });
    }
  }

  cleanupAll(targetWindow: Window = window): void {
    this.mainDocumentListeners.forEach(({ type, callback, options }) => {
      try {
        targetWindow.document.removeEventListener(type, callback, options as any);
      } catch (_) {
        /* noop: destroy 阶段任何异常都不应中断后续清理 */
      }
    });
    this.mainDocumentListeners.clear();

    this.windowOnEventOverrides.forEach(({ key, originalValue, hadOwnProperty }) => {
      try {
        // 直接赋值：对 prototype accessor 而言会调用 setter 把内部存储覆盖回原值；
        // 对自定义 data property 而言会更新自身值。
        (targetWindow as any)[key] = originalValue;
      } catch (_) {
        /* noop */
      }
      // 原本没有 own property（例如 patchWindowEffect 之前主 window 没设过自定义属性）
      // 时，cleanup 后再 delete，避免 polluted 痕迹残留为 own。
      if (!hadOwnProperty) {
        try {
          delete (targetWindow as any)[key];
        } catch (_) {
          /* noop */
        }
      }
    });
    this.windowOnEventOverrides.clear();
  }
}
