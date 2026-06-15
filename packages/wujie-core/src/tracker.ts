/**
 * 销毁链路清理跟踪器。
 *
 * 子应用通过 patchDocumentEffect 注册的部分事件会被转发到主应用 window.document，
 * patchWindowEffect 改写的 window.onXXX 也会写到主应用 window 上。两者若不在
 * sandbox.destroy() 时反向清理，handler 闭包会持有 iframeWindow，整个子应用
 * 上下文都无法被 GC，且主 window 上会留下 dangling handler。
 *
 * 跟踪器实例挂在每个 Wujie 沙箱上，在 sandbox.destroy() 末尾统一清理。
 */

export type DocumentListenerEntry = {
  type: string;
  callback: EventListenerOrEventListenerObject;
  options?: boolean | AddEventListenerOptions;
};

export type WindowOnEventOriginal = {
  key: string;
  /** 主应用 window 上该 key 的原始值（可能是原 handler / null / undefined） */
  originalValue: any;
  /** 该 key 原本是否是主应用 window 的 own property（用于 cleanup 决定是否要 delete） */
  hadOwnProperty: boolean;
};

export class EventCleanupTracker {
  /** 已经从 patchDocumentEffect 转发到主应用 window.document 的 listener */
  private readonly mainDocumentListeners: Set<DocumentListenerEntry> = new Set();
  /** 已被 patchWindowEffect 改写过的主应用 window onXXX，记录原始状态以便还原 */
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

  /** 清理主应用 window.document 上的 listener */
  cleanupMainDocumentListeners(targetDocument: Document = window.document): void {
    this.mainDocumentListeners.forEach(({ type, callback, options }) => {
      try {
        targetDocument.removeEventListener(type, callback, options as any);
      } catch (_) {
        /* noop: destroy 阶段任何异常都不应中断后续清理 */
      }
    });
    this.mainDocumentListeners.clear();
  }

  /**
   * 记录主应用 window.onXXX 被子应用覆盖前的状态，供 destroy 时还原。
   * 同一 key 仅首次记录，避免把子应用后续写入的 handler 当作原值。
   *
   * 一些 onXXX 属性由 accessor 管理，cleanup 时需要通过赋值写回 originalValue，
   * 让 setter 清掉内部保存的 handler；如果赋值新增了 own property，再按需 delete。
   */
  trackWindowOnEvent(key: string, originalValue: any, hadOwnProperty: boolean): void {
    if (!this.windowOnEventOverrides.has(key)) {
      this.windowOnEventOverrides.set(key, { key, originalValue, hadOwnProperty });
    }
  }

  /** 清理主应用 window 上的 onXXX */
  cleanupWindowOnEventOverrides(targetWindow: Window = window): void {
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

  cleanupAll(targetWindow: Window = window): void {
    this.cleanupMainDocumentListeners(targetWindow.document);
    this.cleanupWindowOnEventOverrides(targetWindow);
  }
}
