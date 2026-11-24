import { reactive } from "vue";

const STORAGE_KEY = "wujie-demo-lang";

function parseQueryLang() {
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

export function detectLang() {
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

export const messages = {
  zh: {
    "nav.home": "首页",
    "nav.dialog": "弹窗",
    "nav.location": "路由",
    "nav.contact": "通信",
    "nav.state": "状态",
    "nav.inlineEvent": "内联事件",
    "home.title": "Vue3示例",
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
    "loc.intro": "当用户访问location来获取当前的url时，wujie统一拦截并回填子应用正确的地址",
    "loc.step1": "1、获取 location.host 的值",
    "loc.step2": "2、获取 window.location.host 的值",
    "loc.step3": "3、修改window.location.href",
    "loc.jumpWuji": "跳转无极",
    "loc.step3Desc1": "子应用修改location.href，会将当前的子应用的shadow删除并且替换成一个iframe",
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
    "inline.title": "内联事件处理器测试",
    "inline.subtitle": "测试 wujie 双沙箱架构中内联事件处理器的作用域绑定功能",
    "inline.sectionCases": "测试场景",
    "inline.sectionCasesDesc": "以下按钮使用传统的 onclick 内联事件，验证是否能在子应用作用域中正常执行",
    "inline.case1Title": "场景 1: 基本功能测试",
    "inline.case1Btn": "基本测试",
    "inline.case2Title": "场景 2: 多参数测试",
    "inline.case2Btn": "多参数测试",
    "inline.case3Title": "场景 3: 访问全局变量",
    "inline.case3Btn": "访问全局变量",
    "inline.case4Title": "场景 4: 复杂表达式",
    "inline.case4Btn": "复杂表达式",
    "inline.case5Title": "场景 5: 事件对象访问",
    "inline.case5Btn": "事件对象测试",
    "inline.case6Title": "场景 6: 多个内联事件",
    "inline.case6Btn": "多事件测试",
    "inline.waiting": "等待测试...",
    "inline.successPrefix": "✅ 成功:",
    "inline.globalVarValue": "我是全局变量",
    "inline.eventType": "事件类型",
    "inline.eventTarget": "目标",
    "inline.eventTriggered": "事件触发",
    "inline.sectionNotes": "测试说明",
    "inline.note1": "✅ 如果所有按钮都能正常工作，说明内联事件处理器编译成功",
    "inline.note2": '❌ 如果出现 "xxx is not defined" 错误，说明作用域绑定失败',
    "inline.note3": "📝 所有函数都定义在子应用的全局作用域中",
    "inline.sectionImpl": "实现原理",
    "inline.beforeCompile": "编译前：",
    "inline.afterCompile": "编译后：",
    "pm.received": "接收的消息：",
    "pm.sendMain": "发送消息给主应用",
    "pm.sendVue2": "发送消息给vue2子应用(借助主应用)",
    "pm.sendSelf": "发送消息给自己(借助主应用)",
  },
  en: {
    "nav.home": "Home",
    "nav.dialog": "Dialog",
    "nav.location": "Location",
    "nav.contact": "Communication",
    "nav.state": "State",
    "nav.inlineEvent": "Inline Events",
    "home.title": "Vue 3 Sub-app Demo",
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
    "loc.intro": "When reading window.location, Wujie intercepts and returns the sub-app's true URL",
    "loc.step1": "1. Current location.host",
    "loc.step2": "2. Current window.location.host",
    "loc.step3": "3. Navigate via window.location.href",
    "loc.jumpWuji": "Open Wuji Site",
    "loc.step3Desc1": "Assigning location.href replaces the sub-app's Shadow DOM with a full iframe",
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
    "inline.title": "Inline Event Handler Test",
    "inline.subtitle": "Verify inline event handler scope binding inside Wujie's dual-sandbox architecture",
    "inline.sectionCases": "Test Cases",
    "inline.sectionCasesDesc": "The buttons below use traditional inline onclick attributes to verify execution in the sub-app scope",
    "inline.case1Title": "Case 1: Basic Handler",
    "inline.case1Btn": "Basic Test",
    "inline.case2Title": "Case 2: Multiple Arguments",
    "inline.case2Btn": "Multi-Param Test",
    "inline.case3Title": "Case 3: Global Variable Access",
    "inline.case3Btn": "Read Global Var",
    "inline.case4Title": "Case 4: Expression Evaluation",
    "inline.case4Btn": "Expression Test",
    "inline.case5Title": "Case 5: Event Object Access",
    "inline.case5Btn": "Event Object Test",
    "inline.case6Title": "Case 6: Multiple Inline Events",
    "inline.case6Btn": "Multi-Event Test",
    "inline.waiting": "Waiting for test...",
    "inline.successPrefix": "✅ Success:",
    "inline.globalVarValue": "I am a global variable",
    "inline.eventType": "type",
    "inline.eventTarget": "target",
    "inline.eventTriggered": "event triggered",
    "inline.sectionNotes": "Notes",
    "inline.note1": "✅ If all buttons work, inline event handler rewriting succeeded",
    "inline.note2": '❌ If "xxx is not defined" occurs, scope binding failed',
    "inline.note3": "📝 All handler functions are defined on the sub-app's global scope",
    "inline.sectionImpl": "How It Works",
    "inline.beforeCompile": "Before: ",
    "inline.afterCompile": "After: ",
    "pm.received": "Received message: ",
    "pm.sendMain": "Send to Main App",
    "pm.sendVue2": "Send to vue2 Sub-app (via Main App)",
    "pm.sendSelf": "Send to Self (via Main App)",
  },
};

export const i18nState = reactive({
  lang: detectLang(),
});

export function getLang() {
  return i18nState.lang;
}

export function setLang(nextLang) {
  const normalized = nextLang === "en" ? "en" : "zh";
  if (i18nState.lang === normalized) return;
  i18nState.lang = normalized;
}

export function syncLangFromHost() {
  setLang(detectLang());
}

export function t(key) {
  const dict = messages[i18nState.lang] || messages.zh;
  return dict[key] !== undefined ? dict[key] : key;
}

export default {
  install(app) {
    app.config.globalProperties.$t = t;
    Object.defineProperty(app.config.globalProperties, "$lang", {
      get: () => i18nState.lang,
    });
  },
};
