/**
 * Vue 封装的 props 需与 startApp 参数（el 除外）一一对应，并原样传给 startApp。
 * 类型声明由 startOptions 派生，wujie 新增参数而 Vue 封装未声明时，会出现类型可传、运行时却被忽略的情况。
 */

export {};

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const PACKAGES_DIR = path.resolve(__dirname, "../../..");
const CONTAINER_PROPS = ["width", "height", "style"];

/** 读取 wujie 源码中 startOptions 的全部字段 */
function getStartOptionKeys(): string[] {
  const file = path.resolve(__dirname, "../../src/index.ts");
  const program = ts.createProgram([file], {
    strict: true,
    noEmit: true,
    target: ts.ScriptTarget.ES2017,
    lib: ["lib.dom.d.ts", "lib.es2017.d.ts"],
  });
  const source = program.getSourceFile(file);
  const declaration = source.statements.find(
    (statement) => ts.isTypeAliasDeclaration(statement) && statement.name.text === "startOptions"
  );
  const checker = program.getTypeChecker();
  return checker
    .getPropertiesOfType(checker.getTypeAtLocation(declaration.name))
    .map((property) => property.name)
    .filter((name) => name !== "el")
    .sort();
}

/** 以 CommonJS 加载封装源码，vue 使用该封装自身的依赖，wujie 替换为 mock */
function loadWrapper(pkg: string, wujieMock: Record<string, any>) {
  const dir = path.join(PACKAGES_DIR, pkg);
  const vue = require(require.resolve("vue", { paths: [dir] }));
  const { outputText } = ts.transpileModule(fs.readFileSync(path.join(dir, "index.js"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, esModuleInterop: true },
  });
  const module = { exports: {} as Record<string, any> };
  const localRequire = (name: string) => (name === "vue" ? vue : name === "wujie" ? wujieMock : require(name));
  new Function("require", "module", "exports", outputText)(localRequire, module, module.exports);
  return { vue, WujieVue: module.exports.default };
}

/** 按 prop 声明的类型为每个参数构造可区分的值 */
function createPropValues(propOptions: Record<string, { type: any }>): Record<string, any> {
  const values: Record<string, any> = {};
  Object.keys(propOptions)
    .filter((key) => !CONTAINER_PROPS.includes(key))
    .forEach((key) => {
      const { type } = propOptions[key];
      if (type === String) values[key] = `value-${key}`;
      else if (type === Boolean) values[key] = true;
      else if (type === Function) values[key] = () => key;
      else if (type === Array) values[key] = [key];
      else if (type === Object) values[key] = { key };
      else values[key] = document.createElement("div");
    });
  return values;
}

function createWujieMock() {
  return {
    bus: { $onAll: jest.fn(), $offAll: jest.fn() },
    startApp: jest.fn((options: Record<string, any>) => Promise.resolve(() => options)),
    destroyApp: jest.fn(),
    preloadApp: jest.fn(),
    setupApp: jest.fn(),
    refreshApp: jest.fn(),
    clearAssetsCache: jest.fn(),
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("Vue 封装的 props 与 startApp 参数保持一致", () => {
  const startOptionKeys = getStartOptionKeys();

  beforeEach(() => {
    delete (window as any).__WUJIE_QUEUE;
  });

  describe("wujie-vue3", () => {
    it("props 覆盖 startApp 的全部参数，且没有多余参数", () => {
      const { WujieVue } = loadWrapper("wujie-vue3", createWujieMock());
      const keys = Object.keys(WujieVue.props).filter((key) => !CONTAINER_PROPS.includes(key));
      expect(keys.sort()).toEqual(startOptionKeys);
    });

    it("声明的参数原样传给 startApp，容器属性不传入", async () => {
      const wujieMock = createWujieMock();
      const { vue, WujieVue } = loadWrapper("wujie-vue3", wujieMock);
      const values = createPropValues(WujieVue.props);
      const host = document.createElement("div");
      document.body.appendChild(host);
      const app = vue.createApp({
        render: () => vue.h(WujieVue, { ...values, width: "100px", style: { color: "red" } }),
      });
      app.mount(host);
      await flush();

      const options = wujieMock.startApp.mock.calls[0][0];
      Object.keys(values).forEach((key) => expect(options[key]).toBe(values[key]));
      CONTAINER_PROPS.forEach((key) => expect(options).not.toHaveProperty(key));
      expect(options.el).toBeInstanceOf(HTMLElement);
      app.unmount();
    });
  });

  describe("wujie-vue2", () => {
    it("props 覆盖 startApp 的全部参数，且没有多余参数", () => {
      const { WujieVue } = loadWrapper("wujie-vue2", createWujieMock());
      const keys = Object.keys(WujieVue.options.props).filter((key) => !CONTAINER_PROPS.includes(key));
      expect(keys.sort()).toEqual(startOptionKeys);
    });

    it("声明的参数原样传给 startApp，容器属性不传入", async () => {
      const wujieMock = createWujieMock();
      const { WujieVue } = loadWrapper("wujie-vue2", wujieMock);
      const values = createPropValues(WujieVue.options.props);
      const host = document.createElement("div");
      document.body.appendChild(host);
      const vm = new WujieVue({ propsData: { ...values, width: "100px" } }).$mount(host);
      await flush();

      const options = wujieMock.startApp.mock.calls[0][0];
      Object.keys(values).forEach((key) => expect(options[key]).toBe(values[key]));
      CONTAINER_PROPS.forEach((key) => expect(options).not.toHaveProperty(key));
      expect(options.el).toBeInstanceOf(HTMLElement);
      vm.$destroy();
    });
  });
});
