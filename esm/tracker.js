import _classCallCheck from "@babel/runtime/helpers/classCallCheck";
import _createClass from "@babel/runtime/helpers/createClass";
import _defineProperty from "@babel/runtime/helpers/defineProperty";
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
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

export var EventCleanupTracker = /*#__PURE__*/function () {
  function EventCleanupTracker() {
    _classCallCheck(this, EventCleanupTracker);
    /** 已经从 patchDocumentEffect 转发到主应用 window.document 的 listener */
    _defineProperty(this, "mainDocumentListeners", new Set());
    /** 已被 patchWindowEffect 改写过的主应用 window onXXX，记录原始状态以便还原 */
    _defineProperty(this, "windowOnEventOverrides", new Map());
  }
  return _createClass(EventCleanupTracker, [{
    key: "trackMainDocumentListener",
    value: function trackMainDocumentListener(entry) {
      this.mainDocumentListeners.add(entry);
    }

    /** removeEventListener 时同步从跟踪集合中剔除，避免 destroy 时再次解绑 */
  }, {
    key: "untrackMainDocumentListener",
    value: function untrackMainDocumentListener(entry) {
      var _iterator = _createForOfIteratorHelper(this.mainDocumentListeners),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var existing = _step.value;
          if (existing.type === entry.type && existing.callback === entry.callback && existing.options === entry.options) {
            this.mainDocumentListeners["delete"](existing);
            break;
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }

    /** 清理主应用 window.document 上的 listener */
  }, {
    key: "cleanupMainDocumentListeners",
    value: function cleanupMainDocumentListeners() {
      var targetDocument = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window.document;
      this.mainDocumentListeners.forEach(function (_ref) {
        var type = _ref.type,
          callback = _ref.callback,
          options = _ref.options;
        try {
          targetDocument.removeEventListener(type, callback, options);
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
  }, {
    key: "trackWindowOnEvent",
    value: function trackWindowOnEvent(key, originalValue, hadOwnProperty) {
      if (!this.windowOnEventOverrides.has(key)) {
        this.windowOnEventOverrides.set(key, {
          key: key,
          originalValue: originalValue,
          hadOwnProperty: hadOwnProperty
        });
      }
    }

    /** 清理主应用 window 上的 onXXX */
  }, {
    key: "cleanupWindowOnEventOverrides",
    value: function cleanupWindowOnEventOverrides() {
      var targetWindow = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window;
      this.windowOnEventOverrides.forEach(function (_ref2) {
        var key = _ref2.key,
          originalValue = _ref2.originalValue,
          hadOwnProperty = _ref2.hadOwnProperty;
        try {
          // 直接赋值：对 prototype accessor 而言会调用 setter 把内部存储覆盖回原值；
          // 对自定义 data property 而言会更新自身值。
          targetWindow[key] = originalValue;
        } catch (_) {
          /* noop */
        }
        // 原本没有 own property（例如 patchWindowEffect 之前主 window 没设过自定义属性）
        // 时，cleanup 后再 delete，避免 polluted 痕迹残留为 own。
        if (!hadOwnProperty) {
          try {
            delete targetWindow[key];
          } catch (_) {
            /* noop */
          }
        }
      });
      this.windowOnEventOverrides.clear();
    }
  }, {
    key: "cleanupAll",
    value: function cleanupAll() {
      var targetWindow = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window;
      this.cleanupMainDocumentListeners(targetWindow.document);
      this.cleanupWindowOnEventOverrides(targetWindow);
    }
  }]);
}();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFdmVudENsZWFudXBUcmFja2VyIiwiX2NsYXNzQ2FsbENoZWNrIiwiX2RlZmluZVByb3BlcnR5IiwiU2V0IiwiTWFwIiwiX2NyZWF0ZUNsYXNzIiwia2V5IiwidmFsdWUiLCJ0cmFja01haW5Eb2N1bWVudExpc3RlbmVyIiwiZW50cnkiLCJtYWluRG9jdW1lbnRMaXN0ZW5lcnMiLCJhZGQiLCJ1bnRyYWNrTWFpbkRvY3VtZW50TGlzdGVuZXIiLCJfaXRlcmF0b3IiLCJfY3JlYXRlRm9yT2ZJdGVyYXRvckhlbHBlciIsIl9zdGVwIiwicyIsIm4iLCJkb25lIiwiZXhpc3RpbmciLCJ0eXBlIiwiY2FsbGJhY2siLCJvcHRpb25zIiwiZXJyIiwiZSIsImYiLCJjbGVhbnVwTWFpbkRvY3VtZW50TGlzdGVuZXJzIiwidGFyZ2V0RG9jdW1lbnQiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJ1bmRlZmluZWQiLCJ3aW5kb3ciLCJkb2N1bWVudCIsImZvckVhY2giLCJfcmVmIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsIl8iLCJjbGVhciIsInRyYWNrV2luZG93T25FdmVudCIsIm9yaWdpbmFsVmFsdWUiLCJoYWRPd25Qcm9wZXJ0eSIsIndpbmRvd09uRXZlbnRPdmVycmlkZXMiLCJoYXMiLCJzZXQiLCJjbGVhbnVwV2luZG93T25FdmVudE92ZXJyaWRlcyIsInRhcmdldFdpbmRvdyIsIl9yZWYyIiwiY2xlYW51cEFsbCJdLCJzb3VyY2VzIjpbIi4uL3NyYy90cmFja2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog6ZSA5q+B6ZO+6Lev5riF55CG6Lef6Liq5Zmo44CCXG4gKlxuICog5a2Q5bqU55So6YCa6L+HIHBhdGNoRG9jdW1lbnRFZmZlY3Qg5rOo5YaM55qE6YOo5YiG5LqL5Lu25Lya6KKr6L2s5Y+R5Yiw5Li75bqU55SoIHdpbmRvdy5kb2N1bWVudO+8jFxuICogcGF0Y2hXaW5kb3dFZmZlY3Qg5pS55YaZ55qEIHdpbmRvdy5vblhYWCDkuZ/kvJrlhpnliLDkuLvlupTnlKggd2luZG93IOS4iuOAguS4pOiAheiLpeS4jeWcqFxuICogc2FuZGJveC5kZXN0cm95KCkg5pe25Y+N5ZCR5riF55CG77yMaGFuZGxlciDpl63ljIXkvJrmjIHmnIkgaWZyYW1lV2luZG9377yM5pW05Liq5a2Q5bqU55SoXG4gKiDkuIrkuIvmlofpg73ml6Dms5XooqsgR0PvvIzkuJTkuLsgd2luZG93IOS4iuS8mueVmeS4iyBkYW5nbGluZyBoYW5kbGVy44CCXG4gKlxuICog6Lef6Liq5Zmo5a6e5L6L5oyC5Zyo5q+P5LiqIFd1amllIOaymeeuseS4iu+8jOWcqCBzYW5kYm94LmRlc3Ryb3koKSDmnKvlsL7nu5/kuIDmuIXnkIbjgIJcbiAqL1xuXG5leHBvcnQgdHlwZSBEb2N1bWVudExpc3RlbmVyRW50cnkgPSB7XG4gIHR5cGU6IHN0cmluZztcbiAgY2FsbGJhY2s6IEV2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3Q7XG4gIG9wdGlvbnM/OiBib29sZWFuIHwgQWRkRXZlbnRMaXN0ZW5lck9wdGlvbnM7XG59O1xuXG5leHBvcnQgdHlwZSBXaW5kb3dPbkV2ZW50T3JpZ2luYWwgPSB7XG4gIGtleTogc3RyaW5nO1xuICAvKiog5Li75bqU55SoIHdpbmRvdyDkuIror6Uga2V5IOeahOWOn+Wni+WAvO+8iOWPr+iDveaYr+WOnyBoYW5kbGVyIC8gbnVsbCAvIHVuZGVmaW5lZO+8iSAqL1xuICBvcmlnaW5hbFZhbHVlOiBhbnk7XG4gIC8qKiDor6Uga2V5IOWOn+acrOaYr+WQpuaYr+S4u+W6lOeUqCB3aW5kb3cg55qEIG93biBwcm9wZXJ0ee+8iOeUqOS6jiBjbGVhbnVwIOWGs+WumuaYr+WQpuimgSBkZWxldGXvvIkgKi9cbiAgaGFkT3duUHJvcGVydHk6IGJvb2xlYW47XG59O1xuXG5leHBvcnQgY2xhc3MgRXZlbnRDbGVhbnVwVHJhY2tlciB7XG4gIC8qKiDlt7Lnu4/ku44gcGF0Y2hEb2N1bWVudEVmZmVjdCDovazlj5HliLDkuLvlupTnlKggd2luZG93LmRvY3VtZW50IOeahCBsaXN0ZW5lciAqL1xuICBwcml2YXRlIHJlYWRvbmx5IG1haW5Eb2N1bWVudExpc3RlbmVyczogU2V0PERvY3VtZW50TGlzdGVuZXJFbnRyeT4gPSBuZXcgU2V0KCk7XG4gIC8qKiDlt7LooqsgcGF0Y2hXaW5kb3dFZmZlY3Qg5pS55YaZ6L+H55qE5Li75bqU55SoIHdpbmRvdyBvblhYWO+8jOiusOW9leWOn+Wni+eKtuaAgeS7peS+v+i/mOWOnyAqL1xuICBwcml2YXRlIHJlYWRvbmx5IHdpbmRvd09uRXZlbnRPdmVycmlkZXM6IE1hcDxzdHJpbmcsIFdpbmRvd09uRXZlbnRPcmlnaW5hbD4gPSBuZXcgTWFwKCk7XG5cbiAgdHJhY2tNYWluRG9jdW1lbnRMaXN0ZW5lcihlbnRyeTogRG9jdW1lbnRMaXN0ZW5lckVudHJ5KTogdm9pZCB7XG4gICAgdGhpcy5tYWluRG9jdW1lbnRMaXN0ZW5lcnMuYWRkKGVudHJ5KTtcbiAgfVxuXG4gIC8qKiByZW1vdmVFdmVudExpc3RlbmVyIOaXtuWQjOatpeS7jui3n+i4qumbhuWQiOS4reWJlOmZpO+8jOmBv+WFjSBkZXN0cm95IOaXtuWGjeasoeino+e7kSAqL1xuICB1bnRyYWNrTWFpbkRvY3VtZW50TGlzdGVuZXIoZW50cnk6IERvY3VtZW50TGlzdGVuZXJFbnRyeSk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgZXhpc3Rpbmcgb2YgdGhpcy5tYWluRG9jdW1lbnRMaXN0ZW5lcnMpIHtcbiAgICAgIGlmIChleGlzdGluZy50eXBlID09PSBlbnRyeS50eXBlICYmIGV4aXN0aW5nLmNhbGxiYWNrID09PSBlbnRyeS5jYWxsYmFjayAmJiBleGlzdGluZy5vcHRpb25zID09PSBlbnRyeS5vcHRpb25zKSB7XG4gICAgICAgIHRoaXMubWFpbkRvY3VtZW50TGlzdGVuZXJzLmRlbGV0ZShleGlzdGluZyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiDmuIXnkIbkuLvlupTnlKggd2luZG93LmRvY3VtZW50IOS4iueahCBsaXN0ZW5lciAqL1xuICBjbGVhbnVwTWFpbkRvY3VtZW50TGlzdGVuZXJzKHRhcmdldERvY3VtZW50OiBEb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudCk6IHZvaWQge1xuICAgIHRoaXMubWFpbkRvY3VtZW50TGlzdGVuZXJzLmZvckVhY2goKHsgdHlwZSwgY2FsbGJhY2ssIG9wdGlvbnMgfSkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGFyZ2V0RG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBjYWxsYmFjaywgb3B0aW9ucyBhcyBhbnkpO1xuICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAvKiBub29wOiBkZXN0cm95IOmYtuauteS7u+S9leW8guW4uOmDveS4jeW6lOS4reaWreWQjue7rea4heeQhiAqL1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMubWFpbkRvY3VtZW50TGlzdGVuZXJzLmNsZWFyKCk7XG4gIH1cblxuICAvKipcbiAgICog6K6w5b2V5Li75bqU55SoIHdpbmRvdy5vblhYWCDooqvlrZDlupTnlKjopobnm5bliY3nmoTnirbmgIHvvIzkvpsgZGVzdHJveSDml7bov5jljp/jgIJcbiAgICog5ZCM5LiAIGtleSDku4XpppbmrKHorrDlvZXvvIzpgb/lhY3miorlrZDlupTnlKjlkI7nu63lhpnlhaXnmoQgaGFuZGxlciDlvZPkvZzljp/lgLzjgIJcbiAgICpcbiAgICog5LiA5LqbIG9uWFhYIOWxnuaAp+eUsSBhY2Nlc3NvciDnrqHnkIbvvIxjbGVhbnVwIOaXtumcgOimgemAmui/h+i1i+WAvOWGmeWbniBvcmlnaW5hbFZhbHVl77yMXG4gICAqIOiuqSBzZXR0ZXIg5riF5o6J5YaF6YOo5L+d5a2Y55qEIGhhbmRsZXLvvJvlpoLmnpzotYvlgLzmlrDlop7kuoYgb3duIHByb3BlcnR577yM5YaN5oyJ6ZyAIGRlbGV0ZeOAglxuICAgKi9cbiAgdHJhY2tXaW5kb3dPbkV2ZW50KGtleTogc3RyaW5nLCBvcmlnaW5hbFZhbHVlOiBhbnksIGhhZE93blByb3BlcnR5OiBib29sZWFuKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLndpbmRvd09uRXZlbnRPdmVycmlkZXMuaGFzKGtleSkpIHtcbiAgICAgIHRoaXMud2luZG93T25FdmVudE92ZXJyaWRlcy5zZXQoa2V5LCB7IGtleSwgb3JpZ2luYWxWYWx1ZSwgaGFkT3duUHJvcGVydHkgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIOa4heeQhuS4u+W6lOeUqCB3aW5kb3cg5LiK55qEIG9uWFhYICovXG4gIGNsZWFudXBXaW5kb3dPbkV2ZW50T3ZlcnJpZGVzKHRhcmdldFdpbmRvdzogV2luZG93ID0gd2luZG93KTogdm9pZCB7XG4gICAgdGhpcy53aW5kb3dPbkV2ZW50T3ZlcnJpZGVzLmZvckVhY2goKHsga2V5LCBvcmlnaW5hbFZhbHVlLCBoYWRPd25Qcm9wZXJ0eSB9KSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICAvLyDnm7TmjqXotYvlgLzvvJrlr7kgcHJvdG90eXBlIGFjY2Vzc29yIOiAjOiogOS8muiwg+eUqCBzZXR0ZXIg5oqK5YaF6YOo5a2Y5YKo6KaG55uW5Zue5Y6f5YC877ybXG4gICAgICAgIC8vIOWvueiHquWumuS5iSBkYXRhIHByb3BlcnR5IOiAjOiogOS8muabtOaWsOiHqui6q+WAvOOAglxuICAgICAgICAodGFyZ2V0V2luZG93IGFzIGFueSlba2V5XSA9IG9yaWdpbmFsVmFsdWU7XG4gICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgIC8qIG5vb3AgKi9cbiAgICAgIH1cbiAgICAgIC8vIOWOn+acrOayoeaciSBvd24gcHJvcGVydHnvvIjkvovlpoIgcGF0Y2hXaW5kb3dFZmZlY3Qg5LmL5YmN5Li7IHdpbmRvdyDmsqHorr7ov4foh6rlrprkuYnlsZ7mgKfvvIlcbiAgICAgIC8vIOaXtu+8jGNsZWFudXAg5ZCO5YaNIGRlbGV0Ze+8jOmBv+WFjSBwb2xsdXRlZCDnl5Xov7nmrovnlZnkuLogb3du44CCXG4gICAgICBpZiAoIWhhZE93blByb3BlcnR5KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZGVsZXRlICh0YXJnZXRXaW5kb3cgYXMgYW55KVtrZXldO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgLyogbm9vcCAqL1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy53aW5kb3dPbkV2ZW50T3ZlcnJpZGVzLmNsZWFyKCk7XG4gIH1cblxuICBjbGVhbnVwQWxsKHRhcmdldFdpbmRvdzogV2luZG93ID0gd2luZG93KTogdm9pZCB7XG4gICAgdGhpcy5jbGVhbnVwTWFpbkRvY3VtZW50TGlzdGVuZXJzKHRhcmdldFdpbmRvdy5kb2N1bWVudCk7XG4gICAgdGhpcy5jbGVhbnVwV2luZG93T25FdmVudE92ZXJyaWRlcyh0YXJnZXRXaW5kb3cpO1xuICB9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQWdCQSxXQUFhQSxtQkFBbUI7RUFBQSxTQUFBQSxvQkFBQTtJQUFBQyxlQUFBLE9BQUFELG1CQUFBO0lBQzlCO0lBQUFFLGVBQUEsZ0NBQ3FFLElBQUlDLEdBQUcsQ0FBQyxDQUFDO0lBQzlFO0lBQUFELGVBQUEsaUNBQzhFLElBQUlFLEdBQUcsQ0FBQyxDQUFDO0VBQUE7RUFBQSxPQUFBQyxZQUFBLENBQUFMLG1CQUFBO0lBQUFNLEdBQUE7SUFBQUMsS0FBQSxFQUV2RixTQUFBQyx5QkFBeUJBLENBQUNDLEtBQTRCLEVBQVE7TUFDNUQsSUFBSSxDQUFDQyxxQkFBcUIsQ0FBQ0MsR0FBRyxDQUFDRixLQUFLLENBQUM7SUFDdkM7O0lBRUE7RUFBQTtJQUFBSCxHQUFBO0lBQUFDLEtBQUEsRUFDQSxTQUFBSywyQkFBMkJBLENBQUNILEtBQTRCLEVBQVE7TUFBQSxJQUFBSSxTQUFBLEdBQUFDLDBCQUFBLENBQ3ZDLElBQUksQ0FBQ0oscUJBQXFCO1FBQUFLLEtBQUE7TUFBQTtRQUFqRCxLQUFBRixTQUFBLENBQUFHLENBQUEsTUFBQUQsS0FBQSxHQUFB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