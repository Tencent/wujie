import Vue from "vue";
import WujieVue from "wujie-vue2";

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

function detectInitialLang() {
  const fromQuery = parseQueryLang();
  if (fromQuery) {
    try {
      window.localStorage.setItem(STORAGE_KEY, fromQuery);
    } catch (e) {
      // ignore storage error
    }
    return fromQuery;
  }
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
    "doc.title": "无界vue-demo展示",
    "nav.intro": "介绍",
    "nav.alive": "保活",
    "nav.richText": "富文本",
    "home.degradeTip": "主动降级，去除shadow+proxy",
    "home.degradeOn": "降级开",
    "home.degradeOff": "降级关",
    "home.preloadTip": "预加载+预执行",
    "home.preloadOn": "预加载开",
    "home.preloadOff": "预加载关",
    "home.reactMainTip": "主应用为hash模式",
    "home.reactMain": "react主应用",
    "home.repo": "仓库",
    "home.docs": "文档",
    "home.brand": "无界",
    "home.subtitle": "—极致的微前端框架",
    "home.fastTitle": "极速 🚀",
    "home.fast1": "极致预加载提速",
    "home.fast2": "应用秒开无白屏",
    "home.fast3": "应用丝滑般切换",
    "home.powerTitle": "强大 💪",
    "home.power1": "多应用同时激活在线",
    "home.power2": "应用级别保活",
    "home.power3": "去中心化的通信",
    "home.simpleTitle": "简单 🤞",
    "home.simple1": "更小的体积",
    "home.simple2": "精简的API",
    "home.simple3": "开箱即用",
    "pm.title": "主应用",
    "pm.received": "接收的消息：",
    "pm.sendVue2": "发送消息给vue2子应用",
    "pm.sendVue2Iframe": "发送消息给vue2子应用的iframe",
  },
  en: {
    "doc.title": "Wujie Vue Demo",
    "nav.intro": "Intro",
    "nav.alive": "Alive",
    "nav.richText": "rich-text",
    "home.degradeTip": "Force degradation mode (without Shadow DOM + Proxy)",
    "home.degradeOn": "Degrade On",
    "home.degradeOff": "Degrade Off",
    "home.preloadTip": "Preload + Pre-execution",
    "home.preloadOn": "Preload On",
    "home.preloadOff": "Preload Off",
    "home.reactMainTip": "React main app (hash routing mode)",
    "home.reactMain": "React Main",
    "home.repo": "GitHub",
    "home.docs": "Docs",
    "home.brand": "Wujie",
    "home.subtitle": "— The Ultimate Micro-Frontend Framework",
    "home.fastTitle": "Ultra Fast 🚀",
    "home.fast1": "Aggressive preloading",
    "home.fast2": "Instant render, zero blank screen",
    "home.fast3": "Seamless app switching",
    "home.powerTitle": "Powerful 💪",
    "home.power1": "Multiple active sub-apps at once",
    "home.power2": "App-level Keep-Alive",
    "home.power3": "Decentralized communication",
    "home.simpleTitle": "Simple 🤞",
    "home.simple1": "Lightweight footprint",
    "home.simple2": "Minimal, intuitive API",
    "home.simple3": "Works out of the box",
    "pm.title": "Main App",
    "pm.received": "Received message: ",
    "pm.sendVue2": "Post message to vue2 sub-app",
    "pm.sendVue2Iframe": "Post message to vue2's inner iframe",
  },
};

export const i18nState = Vue.observable({
  lang: detectInitialLang(),
});

function syncDocumentTitle(lang) {
  if (typeof document !== "undefined") {
    document.title = messages[lang]["doc.title"];
  }
}

syncDocumentTitle(i18nState.lang);

export function getLang() {
  return i18nState.lang;
}

export function setLang(nextLang) {
  const normalized = nextLang === "en" ? "en" : "zh";
  if (i18nState.lang === normalized) return;
  i18nState.lang = normalized;
  try {
    window.localStorage.setItem(STORAGE_KEY, normalized);
  } catch (e) {
    // ignore storage error
  }
  syncDocumentTitle(normalized);
  WujieVue.bus.$emit("lang-change", normalized);
}

export function toggleLang() {
  setLang(i18nState.lang === "en" ? "zh" : "en");
}

export function t(key) {
  const dict = messages[i18nState.lang] || messages.zh;
  return dict[key] !== undefined ? dict[key] : key;
}

export default {
  install(VueCtor) {
    VueCtor.prototype.$t = t;
    VueCtor.prototype.$toggleLang = toggleLang;
    Object.defineProperty(VueCtor.prototype, "$lang", {
      get() {
        return i18nState.lang;
      },
    });
  },
};
