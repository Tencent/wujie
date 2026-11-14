import Vue from "vue";
import { bus, preloadApp, startApp as rawStartApp, destroyApp, setupApp, refreshApp, clearAssetsCache } from "wujie";

/**
 * 清理全局 startApp 串行队列，防止组件销毁后 window.__WUJIE_QUEUE 长期持有
 * 已卸载实例的 Promise 链，造成内存泄漏。
 * 仅当全局队列仍指向当前实例的链尾时才删除，避免误删被同名新实例接管的队列。
 */
function clearStartAppQueue(name, queue) {
  if (!name || !window.__WUJIE_QUEUE) return;
  if (window.__WUJIE_QUEUE[name] === queue) {
    delete window.__WUJIE_QUEUE[name];
  }
}

// 只作用于组件容器，不传给 startApp
const CONTAINER_PROPS = ["width", "height"];

function getStartOptions(props) {
  const options = {};
  Object.keys(props).forEach((key) => {
    if (!CONTAINER_PROPS.includes(key)) options[key] = props[key];
  });
  return options;
}

// 除容器属性外，props 与 startApp 参数一一对应，新增 startApp 参数时只需在此声明
const wujieVueOptions = {
  name: "WujieVue",
  props: {
    width: { type: String, default: "" },
    height: { type: String, default: "" },
    name: { type: String, default: "" },
    loading: { type: HTMLElement, default: undefined },
    url: { type: String, default: "" },
    html: { type: String, default: undefined },
    sync: { type: Boolean, default: undefined },
    prefix: { type: Object, default: undefined },
    alive: { type: Boolean, default: undefined },
    props: { type: Object, default: undefined },
    attrs: { type: Object, default: undefined },
    degradeAttrs: { type: Object, default: undefined },
    replace: { type: Function, default: undefined },
    fetch: { type: Function, default: undefined },
    fiber: { type: Boolean, default: undefined },
    degrade: { type: Boolean, default: undefined },
    plugins: { type: Array, default: null },
    beforeLoad: { type: Function, default: null },
    beforeMount: { type: Function, default: null },
    afterMount: { type: Function, default: null },
    beforeUnmount: { type: Function, default: null },
    afterUnmount: { type: Function, default: null },
    activated: { type: Function, default: null },
    deactivated: { type: Function, default: null },
    loadError: { type: Function, default: null },
    iframeAddEventListeners: { type: Array, default: null },
    iframeOnEvents: { type: Array, default: null },
  },
  data() {
    return {
      startAppQueue: Promise.resolve(),
      isUnmounted: false,
    };
  },
  mounted() {
    if (this.name) {
      if (window.__WUJIE_QUEUE) {
        if (window.__WUJIE_QUEUE[this.name]) {
          this.startAppQueue = window.__WUJIE_QUEUE[this.name];
        } else {
          window.__WUJIE_QUEUE[this.name] = this.startAppQueue;
        }
      } else {
        window.__WUJIE_QUEUE = {
          [this.name]: this.startAppQueue,
        };
      }
    }
    bus.$onAll(this.handleEmit);
    this.execStartApp();
    this.$watch(
      () => this.name + this.url,
      () => this.execStartApp()
    );
  },
  methods: {
    handleEmit(event, ...args) {
      this.$emit(event, ...args);
    },
    async startApp() {
      // 拦截组件卸载后仍残留在 __WUJIE_QUEUE Promise 链中的 .then(startApp) 幽灵执行
      if (this.isUnmounted) return;
      try {
        const destroy = await rawStartApp({
          ...getStartOptions(this.$props),
          el: this.$refs.wujie,
        });
        // 异步创建跨越了卸载点，兜底销毁孤儿 sandbox
        if (this.isUnmounted && typeof destroy === "function") {
          destroy();
        }
      } catch (error) {
        console.log(error);
      }
    },
    execStartApp() {
      // 卸载后 watch 残留触发不应再入队
      if (this.isUnmounted) return;
      this.startAppQueue = this.startAppQueue.then(this.startApp);
      if (this.name && window.__WUJIE_QUEUE) {
        window.__WUJIE_QUEUE[this.name] = this.startAppQueue;
      }
    },
    destroy() {
      destroyApp(this.name);
    },
    // 销毁当前子应用实例并复用组件 props 全量重建
    async refresh() {
      if (this.isUnmounted) return;
      await destroyApp(this.name);
      clearStartAppQueue(this.name, this.startAppQueue);
      this.startAppQueue = Promise.resolve();
      this.execStartApp();
      return this.startAppQueue;
    },
  },
  beforeDestroy() {
    this.isUnmounted = true;
    bus.$offAll(this.handleEmit);
    clearStartAppQueue(this.name, this.startAppQueue);
  },
  render(c) {
    // Vue 2 会自动将组件 VNode 的 style 合并到根元素，避免声明同名保留 prop。
    return c("div", {
      style: {
        width: this.width,
        height: this.height,
      },
      ref: "wujie",
    });
  },
};

const WujieVue = Vue.extend(wujieVueOptions);

WujieVue.setupApp = setupApp;
WujieVue.preloadApp = preloadApp;
WujieVue.bus = bus;
WujieVue.destroyApp = destroyApp;
WujieVue.refreshApp = refreshApp;
WujieVue.clearAssetsCache = clearAssetsCache;
WujieVue.install = function (Vue) {
  Vue.component("WujieVue", WujieVue);
};

export default WujieVue;
