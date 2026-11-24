import { useEffect, useState } from "react";

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
    "nav.communication": "通信",
    "nav.state": "状态",
    "home.title": "react17示例",
    "home.reactVersion": "当前react版本",
    "home.antdVersion": "当前antd版本",
    "home.repo": "仓库地址",
    "comm.title": "通信处理",
    "comm.intro": "应用可以有三种方式进行通信",
    "comm.step1Title": "1、主应用通过 props 属性注入的方法",
    "comm.step1Desc": "主应用通过 props 注入 jump（跳转页面）方法，子应用通过 $wujie.props.jump(xxx) 来使用",
    "comm.jumpVue3": "点击跳转vue3",
    "comm.jumpAngular": "跳转angular",
    "comm.step2Title": "2、通过 window.parent 方法拿到主应用的全局方法",
    "comm.step2Desc": "子应用调用 window.parent.alert 来调用主应用的 alert方法",
    "comm.showAlert": "显示alert",
    "comm.mainAlertMsg": "主应用alert",
    "comm.step3Title": "3、通过 bus 方法发送去中心化的事件",
    "comm.step3Desc1": '主应用 bus.$on("click", (msg) => window.alert(msg)) 监听子应用的 click 事件',
    "comm.step3Desc2": "子应用点击按钮 $wujie.bus.$emit('click', 'react17') 发送 click 事件",
    "dialog.title": "弹窗处理",
    "dialog.intro": "弹窗无需子应用做任何处理就可使用",
    "dialog.step1": "1、打开antd弹窗",
    "dialog.step2": "2、打开antd选择器",
    "dialog.step3": "3、打开antd气泡卡片",
    "dialog.innerSelectTitle": "弹窗内：antd 选择器",
    "dialog.innerSelectPlaceholder": "Select a person（弹窗内）",
    "dialog.innerPopoverHeading": "弹窗内：antd 气泡卡片",
    "dialog.innerPopoverTitle": "Title（弹窗内）",
    "dialog.innerPopoverContent": "Content（弹窗内）",
    "dialog.innerPopoverBtn": "Hover me（弹窗内）",
    "loc.title": "路由处理",
    "loc.step1": "1、路由同步",
    "loc.step1Desc1": "路由同步意味着浏览器的刷新、前进、后退都可以作用到子应用上",
    "loc.step1Desc2": "子应用同步路由到主应用url的query参数上且 key值为子应用的name",
    "loc.step2": "2、location劫持",
    "loc.step2Desc": "当用户访问location来获取当前的url时，wujie统一拦截并回填子应用正确的地址",
    "loc.step3": "3、获取window.location.host的值",
    "loc.step4": "4、修改window.location.href",
    "loc.jumpWuji": "跳转无极",
    "loc.step4Desc1": "子应用修改location.href，会将当前的子应用的shadow删除并且替换成一个iframe",
    "loc.step4Desc2": "如果子应用配置路由同步，浏览器可通过回退回到子应用",
    "state.title": "子应用保活",
    "state.intro": "设置保活模式，切换应用时，子应用的路由和state都可以得到保留",
    "state.step1": "1、改动实例的状态，切换到vue，点击按钮再回来看看",
    "state.jumpVue3": "vue3 state+1 跳回",
  },
  en: {
    "nav.home": "Home",
    "nav.dialog": "Dialog",
    "nav.location": "Location",
    "nav.communication": "Communication",
    "nav.state": "State",
    "home.title": "React 17 Sub-app Demo",
    "home.reactVersion": "React version",
    "home.antdVersion": "Ant Design version",
    "home.repo": "Source Code",
    "comm.title": "Communication",
    "comm.intro": "Wujie supports three ways to communicate across apps",
    "comm.step1Title": "1. Methods injected by the main app via props",
    "comm.step1Desc": "The main app injects a jump() helper via props; the sub-app invokes $wujie.props.jump(name)",
    "comm.jumpVue3": "Jump to vue3",
    "comm.jumpAngular": "Jump to angular",
    "comm.step2Title": "2. Access main app globals via window.parent",
    "comm.step2Desc": "The sub-app calls window.parent.alert to invoke the main app's alert",
    "comm.showAlert": "Show alert",
    "comm.mainAlertMsg": "Main app alert",
    "comm.step3Title": "3. Decentralized events via EventBus",
    "comm.step3Desc1": 'The main app listens via bus.$on("click", (msg) => window.alert(msg))',
    "comm.step3Desc2": "Clicking the button emits $wujie.bus.$emit('click', 'react17')",
    "dialog.title": "Dialogs & Overlays",
    "dialog.intro": "Modals, selects, and popovers work out of the box with zero sub-app changes",
    "dialog.step1": "1. Open Ant Design Modal",
    "dialog.step2": "2. Open Ant Design Select",
    "dialog.step3": "3. Open Ant Design Popover",
    "dialog.innerSelectTitle": "Inside Modal: Ant Design Select",
    "dialog.innerSelectPlaceholder": "Select a person (in modal)",
    "dialog.innerPopoverHeading": "Inside Modal: Ant Design Popover",
    "dialog.innerPopoverTitle": "Title (in modal)",
    "dialog.innerPopoverContent": "Content (in modal)",
    "dialog.innerPopoverBtn": "Hover me (in modal)",
    "loc.title": "Routing & Location",
    "loc.step1": "1. Route Synchronization",
    "loc.step1Desc1": "Browser refresh, back, and forward navigation all work seamlessly on the sub-app",
    "loc.step1Desc2": "The sub-app route is synced to a query parameter keyed by the sub-app name",
    "loc.step2": "2. Location Proxying",
    "loc.step2Desc": "When reading window.location, Wujie intercepts and returns the sub-app's true URL",
    "loc.step3": "3. Current window.location.host",
    "loc.step4": "4. Navigate via window.location.href",
    "loc.jumpWuji": "Open Wuji Site",
    "loc.step4Desc1": "Assigning location.href replaces the sub-app's Shadow DOM with a full iframe",
    "loc.step4Desc2": "With route sync enabled, browser Back returns to the sub-app",
    "state.title": "Sub-app Keep-Alive",
    "state.intro": "In Keep-Alive mode, both sub-app routing and internal state are preserved across switches",
    "state.step1": "1. Modify the counter, switch to vue3, and switch back to see state preserved",
    "state.jumpVue3": "vue3 state+1 & jump",
  },
};

let currentLang = detectLang();
const listeners = new Set();

export function getLang() {
  return currentLang;
}

export function setLang(nextLang) {
  const normalized = nextLang === "en" ? "en" : "zh";
  if (currentLang === normalized) return;
  currentLang = normalized;
  listeners.forEach((fn) => fn(normalized));
}

export function syncLangFromHost() {
  setLang(detectLang());
}

export function subscribeLang(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function t(key, lang = currentLang) {
  const dict = messages[lang] || messages.zh;
  return dict[key] !== undefined ? dict[key] : key;
}

export function useI18n() {
  const [lang, setLocalLang] = useState(currentLang);
  useEffect(() => subscribeLang(setLocalLang), []);
  return {
    lang,
    t: (key) => t(key, lang),
  };
}
