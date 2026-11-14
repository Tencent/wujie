/**
 * wujie-vue3 组件卸载时需执行清理：移除 bus 监听、清理 startApp 队列、销毁卸载后才创建完成的 sandbox。
 * Vue 3 卸载只调用 beforeUnmount（beforeDestroy 仅在 @vue/compat 中生效）。
 */

export {};

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const WUJIE_VUE3_DIR = path.resolve(__dirname, "../../../wujie-vue3");
const Vue = require(require.resolve("vue", { paths: [WUJIE_VUE3_DIR] }));

/** 以 CommonJS 加载 wujie-vue3 源码，vue 使用其自身依赖，wujie 替换为 mock */
function loadWujieVue(wujieMock: Record<string, any>) {
  const source = fs.readFileSync(path.join(WUJIE_VUE3_DIR, "index.js"), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
  });
  const module = { exports: {} as Record<string, any> };
  const localRequire = (name: string) => (name === "vue" ? Vue : name === "wujie" ? wujieMock : require(name));
  new Function("require", "module", "exports", outputText)(localRequire, module, module.exports);
  return module.exports.default;
}

describe("wujie-vue3 卸载清理", () => {
  let wujieMock: Record<string, any>;
  let resolveStartApp: (destroy: () => void) => void;
  let WujieVue: any;

  beforeEach(() => {
    delete (window as any).__WUJIE_QUEUE;
    wujieMock = {
      bus: { $onAll: jest.fn(), $offAll: jest.fn() },
      startApp: jest.fn(() => new Promise((resolve) => (resolveStartApp = resolve))),
      destroyApp: jest.fn(),
      preloadApp: jest.fn(),
      setupApp: jest.fn(),
      refreshApp: jest.fn(),
      clearAssetsCache: jest.fn(),
    };
    WujieVue = loadWujieVue(wujieMock);
  });

  async function mountThenUnmount() {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const app = Vue.createApp({ render: () => Vue.h(WujieVue, { name: "sub", url: "https://sub.example.com/" }) });
    app.mount(host);
    await new Promise((resolve) => setTimeout(resolve, 0));
    app.unmount();
  }

  it("卸载时移除 bus 监听", async () => {
    await mountThenUnmount();
    expect(wujieMock.bus.$onAll).toHaveBeenCalledTimes(1);
    expect(wujieMock.bus.$offAll).toHaveBeenCalledWith(wujieMock.bus.$onAll.mock.calls[0][0]);
  });

  it("卸载时清理 startApp 队列", async () => {
    await mountThenUnmount();
    expect((window as any).__WUJIE_QUEUE.sub).toBeUndefined();
  });

  it("startApp 在卸载后才完成时销毁该 sandbox", async () => {
    await mountThenUnmount();
    const destroy = jest.fn();
    resolveStartApp(destroy);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
