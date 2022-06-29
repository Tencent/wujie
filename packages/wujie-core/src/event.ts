import { warn, error } from "./utils";
import { WUJIE_ALL_EVENT, WUJIE_TIPS_NO_SUBJECT } from "./constant";

export type EventObj = { [event: string]: Array<Function> };

// 全部事件存储map
export const appEventObjMap = window.__POWERED_BY_WUJIE__
  ? window.__WUJIE.inject.appEventObjMap
  : new Map<String, EventObj>();

// eventBus 事件中心
export class EventBus {
  private id: string;
  private eventObj: EventObj;

  constructor(id: string) {
    this.id = id;
    this.$clear();
    if (!appEventObjMap.get(this.id)) {
      appEventObjMap.set(this.id, {});
    }
    this.eventObj = appEventObjMap.get(this.id);
  }

  // 监听事件
  public $on(event: string, fn: Function): EventBus {
    const cbs = this.eventObj[event];
    if (!cbs) {
      this.eventObj[event] = [fn];
      return this;
    }
    if (!cbs.includes(fn)) cbs.push(fn);
    return this;
  }

  /** 任何$emit都会导致监听函数触发，第一个参数为事件名，后续的参数为$emit的参数 */
  public $onAll(fn: (event: string, ...args: Array<any>) => any): EventBus {
    return this.$on(WUJIE_ALL_EVENT, fn);
  }

  // 一次性监听事件
  public $once(event: string, fn: Function): void {
    const on = function (...args: Array<any>) {
      this.$off(event, on);
      fn(...args);
    }.bind(this);
    this.$on(event, on);
  }

  // 取消监听
  public $off(event: string, fn: Function): EventBus {
    const cbs = this.eventObj[event];
    if (!event || !cbs || !cbs.length) {
      warn(`${event} ${WUJIE_TIPS_NO_SUBJECT}`);
      return this;
    }

    let cb;
    let i = cbs.length;
    while (i--) {
      cb = cbs[i];
      if (cb === fn) {
        cbs.splice(i, 1);
        break;
      }
    }
    return this;
  }

  // 取消监听$onAll
  public $offAll(fn: Function): EventBus {
    return this.$off(WUJIE_ALL_EVENT, fn);
  }

  // 发送事件
  public $emit(event: string, ...args: Array<any>): EventBus {
    let cbs = [];
    let allCbs = [];

    appEventObjMap.forEach((eventObj) => {
      if (eventObj[event]) cbs = cbs.concat(eventObj[event]);
      if (eventObj[WUJIE_ALL_EVENT]) allCbs = allCbs.concat(eventObj[WUJIE_ALL_EVENT]);
    });

    if (!event || (cbs.length === 0 && allCbs.length === 0)) {
      warn(`${event} ${WUJIE_TIPS_NO_SUBJECT}`);
    } else {
      try {
        for (let i = 0, l = cbs.length; i < l; i++) cbs[i](...args);
        for (let i = 0, l = allCbs.length; i < l; i++) allCbs[i](event, ...args);
      } catch (e) {
        error(e);
      }
    }
    return this;
  }

  // 清空当前所有的监听事件
  public $clear(): EventBus {
    const eventObj = appEventObjMap.get(this.id) ?? {};
    const events = Object.keys(eventObj);
    events.forEach((event) => delete eventObj[event]);
    return this;
  }
}
