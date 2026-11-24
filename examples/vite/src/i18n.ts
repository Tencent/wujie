import { reactive, type App } from "vue";

export type Lang = "zh" | "en";

const STORAGE_KEY = "wujie-demo-lang";

declare global {
  interface Window {
    $wujie?: {
      props?: {
        lang?: string;
        getLang?: () => string;
        jump?: (name: string) => void;
      };
      bus?: {
        $on: (event: string, fn: (...args: any[]) => void) => void;
        $off: (event: string, fn: (...args: any[]) => void) => void;
        $emit: (event: string, ...args: any[]) => void;
      };
      location?: Location;
    };
  }
}

function parseQueryLang(): Lang | null {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const fromSearch = searchParams.get("lang");
    if (fromSearch === "en" || fromSearch === "zh") return fromSearch;
    const hash = window.location.hash || "";
    const qIndex = hash.indexOf("?");
    if (qIndex !== -1) {
      const hashParams = new URLSearchParams(hash.slice(qIndex + 1));
      const fromHash = hashParams.get("lang");
      if (fromHash === "en" || fromHash === "zh") return fromHash;
    }
  } catch (e) {
    // ignore URL parse error
  }
  return null;
}

export function detectLang(): Lang {
  const fromHost = window.$wujie?.props?.getLang?.() || window.$wujie?.props?.lang;
  if (fromHost === "en" || fromHost === "zh") return fromHost;
  const fromQuery = parseQueryLang();
  if (fromQuery) return fromQuery;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "zh") return stored;
  } catch (e) {
    // ignore storage error
  }
  return "zh";
}

export const messages: Record<Lang, Record<string, string>> = {
  zh: {
    "nav.home": "首页",
    "nav.dialog": "弹窗",
    "nav.location": "路由",
    "nav.contact": "通信",
    "nav.state": "状态",
    "home.title": "Vue3 + vite示例",
    "home.viteVersion": "当前vite版本",
    "home.vueVersion": "当前vue版本",
    "home.elVersion": "当前element-plus版本",
    "home.antVersion": "当前ant-design-vue版本",
    "home.repo": "仓库地址",
    "dialog.title": "弹窗处理",
    "dialog.intro": "弹窗无需子应用做任何处理就可使用",
    "dialog.step1": "1、打开弹窗",
    "dialog.openElDialog": "点击打开el-dialog",
    "dialog.openAntModal": "点击打开ant-modal",
    "dialog.step2": "2、打开选择器",
    "dialog.step3": "3、打开气泡卡片",
    "dialog.elPopoverHover": "el-popover hover 激活",
    "dialog.step4": "4、手动向body中append弹窗",
    "dialog.innerElSelectTitle": "弹窗内：element 选择器",
    "dialog.innerElSelectPlaceholder": "el-select（弹窗内）",
    "dialog.innerElPopoverTitle": "弹窗内：element 气泡卡片",
    "dialog.innerElPopoverContent": "this is content (弹窗内), this is content, this is content",
    "dialog.innerElPopoverBtn": "el-popover hover（弹窗内）",
    "dialog.innerAntSelectTitle": "弹窗内：ant 选择器",
    "dialog.innerAntSelectPlaceholder": "ant-select（弹窗内）",
    "dialog.innerAntPopoverHeading": "弹窗内：ant 气泡卡片",
    "dialog.innerAntPopoverTitle": "antd-popover（弹窗内）",
    "dialog.innerAntPopoverContent": "Content（弹窗内）",
    "dialog.innerAntPopoverBtn": "ant-popover Hover me（弹窗内）",
    "dialog.opt1": "黄金糕",
    "dialog.opt2": "双皮奶",
    "dialog.opt3": "蚵仔煎",
    "dialog.opt4": "龙须面",
    "dialog.opt5": "北京烤鸭",
    "append.add": "点击插入body",
    "append.remove": "点击删除body",
    "append.fixedContent": "body中插入position为fixed元素",
    "loc.title": "location处理",
    "loc.intro":
      "当采用 vite 编译框架时，由于 script 的标签 type 为 module，所以无法采用闭包的方式将 location 劫持代理，这里将代理的 location 挂载到 $wujie 上，子应用所有采用 window.location 的代码需要统一修改成 $wujie.location",
    "loc.step1": "1、获取 window.location.host 的值",
    "loc.step2": "2、获取 $wujie.location.host 的值",
    "loc.noWujie": "$wujie不存在",
    "loc.step3": "3、修改 $wujie.location.href",
    "loc.jumpWuji": "跳转无极",
    "loc.step3Desc1": "子应用修改 $wujie.location.href，会将当前的子应用的shadow删除并且替换成一个iframe",
    "loc.step3Desc2": "如果子应用配置路由同步，浏览器可通过回退回到子应用",
    "comm.title": "通信处理",
    "comm.intro": "应用可以有三种方式进行通信：",
    "comm.step1Title": "1、主应用通过 props 属性注入的方法",
    "comm.step1Desc": "主应用通过 props 注入 jump（跳转页面）方法，子应用通过 $wujie.props.jump(xxx) 来使用",
    "comm.jumpReact17": "点击跳转react17",
    "comm.step2Title": "2、通过 window.parent 方法拿到主应用的全局方法",
    "comm.step2Desc": "子应用调用 window.parent.alert 来调用主应用的 alert方法",
    "comm.showAlert": "显示alert",
    "comm.mainAlertMsg": "主应用alert",
    "comm.step3Title": "3、通过 bus 方法发送去中心化的事件",
    "comm.step3Desc1": '主应用 bus.$on("click", (msg) => window.alert(msg)) 监听子应用的 click 事件',
    "comm.step3Desc2": "子应用点击按钮 $wujie.bus.$emit('click', 'vue3') 发送 click 事件",
    "comm.emitBtn": "点击emit",
    "state.title": "子应用保活",
    "state.intro": "设置保活模式，切换应用时，子应用的路由和state都可以得到保留",
    "state.step1": "1、改动实例的状态，切换到react，点击按钮再回来看看",
    "state.jumpReact17": "跳转react17",
  },
  en: {
    "nav.home": "Home",
    "nav.dialog": "Dialog",
    "nav.location": "Location",
    "nav.contact": "Communication",
    "nav.state": "State",
    "home.title": "Vue 3 + Vite Sub-app Demo",
    "home.viteVersion": "Vite version",
    "home.vueVersion": "Vue version",
    "home.elVersion": "Element Plus version",
    "home.antVersion": "Ant Design Vue version",
    "home.repo": "Source Code",
    "dialog.title": "Dialogs & Overlays",
    "dialog.intro": "Modals, selects, and popovers work out of the box with zero sub-app changes",
    "dialog.step1": "1. Open Dialog / Modal",
    "dialog.openElDialog": "Open el-dialog",
    "dialog.openAntModal": "Open ant-modal",
    "dialog.step2": "2. Open Select",
    "dialog.step3": "3. Open Popover",
    "dialog.elPopoverHover": "Hover el-popover",
    "dialog.step4": "4. Manually append fixed element to body",
    "dialog.innerElSelectTitle": "Inside Dialog: Element Select",
    "dialog.innerElSelectPlaceholder": "el-select (in dialog)",
    "dialog.innerElPopoverTitle": "Inside Dialog: Element Popover",
    "dialog.innerElPopoverContent": "this is content (in dialog), this is content, this is content",
    "dialog.innerElPopoverBtn": "el-popover hover (in dialog)",
    "dialog.innerAntSelectTitle": "Inside Modal: Ant Design Select",
    "dialog.innerAntSelectPlaceholder": "ant-select (in modal)",
    "dialog.innerAntPopoverHeading": "Inside Modal: Ant Design Popover",
    "dialog.innerAntPopoverTitle": "antd-popover (in modal)",
    "dialog.innerAntPopoverContent": "Content (in modal)",
    "dialog.innerAntPopoverBtn": "ant-popover Hover me (in modal)",
    "dialog.opt1": "Golden Cake",
    "dialog.opt2": "Double Skin Milk",
    "dialog.opt3": "Oyster Omelette",
    "dialog.opt4": "Dragon Whiskers Noodles",
    "dialog.opt5": "Peking Duck",
    "append.add": "Append to body",
    "append.remove": "Remove from body",
    "append.fixedContent": "Fixed-position element appended to body",
    "loc.title": "Location Handling",
    "loc.intro":
      "Because Vite loads scripts as ES modules (type=\"module\"), location cannot be proxied via a closure. Instead, Wujie attaches the proxied location to $wujie.location; replace window.location references with $wujie.location.",
    "loc.step1": "1. Current window.location.host",
    "loc.step2": "2. Current $wujie.location.host",
    "loc.noWujie": "$wujie is not available",
    "loc.step3": "3. Navigate via $wujie.location.href",
    "loc.jumpWuji": "Open Wuji Site",
    "loc.step3Desc1": "Assigning $wujie.location.href replaces the sub-app's Shadow DOM with a full iframe",
    "loc.step3Desc2": "With route sync enabled, browser Back returns to the sub-app",
    "comm.title": "Communication",
    "comm.intro": "Wujie supports three ways to communicate across apps:",
    "comm.step1Title": "1. Methods injected by the main app via props",
    "comm.step1Desc": "The main app injects a jump() helper via props; the sub-app invokes $wujie.props.jump(name)",
    "comm.jumpReact17": "Jump to react17",
    "comm.step2Title": "2. Access main app globals via window.parent",
    "comm.step2Desc": "The sub-app calls window.parent.alert to invoke the main app's alert",
    "comm.showAlert": "Show alert",
    "comm.mainAlertMsg": "Main app alert",
    "comm.step3Title": "3. Decentralized events via EventBus",
    "comm.step3Desc1": 'The main app listens via bus.$on("click", (msg) => window.alert(msg))',
    "comm.step3Desc2": "Clicking the button emits $wujie.bus.$emit('click', 'vue3')",
    "comm.emitBtn": "Emit event",
    "state.title": "Sub-app Keep-Alive",
    "state.intro": "In Keep-Alive mode, both sub-app routing and internal state are preserved across switches",
    "state.step1": "1. Modify the counter, switch to react17, and switch back to see state preserved",
    "state.jumpReact17": "Jump to react17",
  },
};

export const i18nState = reactive<{ lang: Lang }>({
  lang: detectLang(),
});

export function getLang(): Lang {
  return i18nState.lang;
}

export function setLang(nextLang: string): void {
  const normalized: Lang = nextLang === "en" ? "en" : "zh";
  if (i18nState.lang === normalized) return;
  i18nState.lang = normalized;
}

export function syncLangFromHost(): void {
  setLang(detectLang());
}

export function t(key: string): string {
  const dict = messages[i18nState.lang] || messages.zh;
  return dict[key] !== undefined ? dict[key] : key;
}

export default {
  install(app: App) {
    app.config.globalProperties.$t = t;
    Object.defineProperty(app.config.globalProperties, "$lang", {
      get: () => i18nState.lang,
    });
  },
};

declare module "vue" {
  interface ComponentCustomProperties {
    $t: (key: string) => string;
    $lang: Lang;
  }
}
