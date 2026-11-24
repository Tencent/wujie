import Vue from "vue";
import elementLocale from "element-ui/lib/locale";
import elZhCN from "element-ui/lib/locale/lang/zh-CN";
import elEn from "element-ui/lib/locale/lang/en";

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
    "nav.richText": "富文本",
    "home.title": "Vue2示例",
    "home.vueVersion": "当前vue版本",
    "home.elVersion": "当前element版本",
    "home.antVersion": "当前ant-design-vue版本",
    "home.repo": "仓库地址",
    "dialog.title": "弹窗处理",
    "dialog.intro": "弹窗无需子应用做任何处理就可使用",
    "dialog.step1": "1、打开弹窗",
    "dialog.openElDialog": "点击打开el-dialog",
    "dialog.openAntModal": "点击打开ant-modal",
    "dialog.step2": "2、打开选择器",
    "dialog.step3": "3、打开气泡卡片",
    "dialog.popoverTitle": "标题",
    "dialog.popoverContent": "这是一段内容,这是一段内容,这是一段内容,这是一段内容。",
    "dialog.elPopoverHover": "el-popover hover 激活",
    "dialog.step4": "4、手动向body中append弹窗",
    "dialog.step5": "5、原生 Popper/Floating 弹出层",
    "dialog.routePageCtx": "路由页面",
    "dialog.elDialogCtx": "el-dialog 弹窗内",
    "dialog.tipsTitle": "提示",
    "dialog.tipsBody": "这是一段信息",
    "dialog.innerElSelectTitle": "弹窗内：element 选择器",
    "dialog.innerElSelectPlaceholder": "el-select（弹窗内）",
    "dialog.innerElPopoverTitle": "弹窗内：element 气泡卡片",
    "dialog.innerElPopoverContent": "这是一段内容（弹窗内）,这是一段内容,这是一段内容,这是一段内容。",
    "dialog.innerElPopoverBtn": "el-popover hover（弹窗内）",
    "dialog.cancel": "取 消",
    "dialog.confirm": "确 定",
    "dialog.innerAntSelectTitle": "弹窗内：ant 选择器",
    "dialog.innerAntSelectPlaceholder": "ant-select（弹窗内）",
    "dialog.innerAntPopoverHeading": "弹窗内：ant 气泡卡片",
    "dialog.innerAntPopoverTitle": "Title（弹窗内）",
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
    "popper.headingSuffix": "：原生定位库弹出层",
    "popper.desc": "点击按钮打开 append 到 document.body 的原生弹出层，用于观察无界子应用内是否发生漂移。",
    "popper.open1": "打开 Popper.js 1.x",
    "popper.open2": "打开 Popper.js 2.x",
    "popper.openFloating": "打开 Floating UI",
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
    "comm.step3Desc2": "子应用点击按钮 $wujie.bus.$emit('click', 'vue2') 发送 click 事件",
    "comm.emitBtn": "点击emit",
    "comm.step4Title": "4、通过 postmessage 方法发送消息",
    "pm.title": "vue2-子应用",
    "pm.received": "接收的消息：",
    "pm.sendMain": "发消息给主应用",
    "pm.sendIframe": "发消息给iframe",
    "rt.title": "富文本",
    "rt.introPrefix": "对照",
    "rt.introMid": "中 wangEditor / TinyMCE 的常见问题。建议在",
    "rt.introEmbed": "无界主应用嵌入子应用",
    "rt.introAnd": "与",
    "rt.introStandalone": "子应用单独打开",
    "rt.introSuffix": "两种环境下分别验证。",
    "rt.envWujie": "当前运行在无界子应用环境",
    "rt.envStandalone": "当前为子应用独立运行",
    "rt.case218Title": "预填内容删改（#218）",
    "rt.case218Label": "已验证 · Issue #218",
    "rt.case218Desc": "子应用使用 wangEditor 初始化已有 HTML 后，聚焦编辑、删除预填文字、在中段插入内容均正常。",
    "rt.case218Steps": "操作：点击下方编辑器，删除预填文字或在「预填」二字前插入新内容，确认光标与删改行为符合预期。",
    "rt.case218Html": "<p>这是<strong>预填内容</strong>，请尝试删除本段文字或在「预填」二字前插入新内容。</p>",
    "rt.case513Title": "快速输入不失焦（#513）",
    "rt.case513Label": "已验证 · Issue #513",
    "rt.case513Desc":
      "wangEditor 5.x 在无界环境（含降级）下快速连续输入时编辑器保持聚焦。框架侧：getSelection / ownerDocument 指向渲染 iframe，patchDegradeInstanceofAcrossRealms 修复跨 iframe instanceof。",
    "rt.case513Steps":
      "操作：建议在主应用降级模式下验证——在下方编辑器快速连续打字（含输入法），确认无失焦、光标跳动；可选观察上方 LO/RO 面板均为 true。",
    "rt.case450Title": "Selection / DOM 一致（#450、#770）",
    "rt.case450Label": "已验证 · Issue #450、#770",
    "rt.case450Desc":
      "选区与 DOM 映射正常，无 Cannot resolve a Slate range from DOM range；getSelection() 指向正确的 document / shadowRoot。",
    "rt.case450Steps": "操作：在编辑器中点击、选中文字并编辑，确认无控制台报错，选区行为正常。",
    "rt.case479Title": "复制粘贴（#479）",
    "rt.case479Label": "已验证 · Issue #479",
    "rt.case479Desc":
      "paste 事件的 clipboardData 来自主应用 realm，需修复 DataTransfer 的 instanceof 跨 realm 判断；否则复制正常但粘贴进编辑器无响应。",
    "rt.case479Steps":
      "操作：在下方编辑器中选中文字 Ctrl+C，再 Ctrl+V 粘贴；或从外部复制一段文字后粘贴进编辑器，确认内容出现。",
    "rt.case479Html": "<p>请选中本段文字并复制，再粘贴到下方空白处；或从外部复制文字后粘贴到此处。</p>",
    "rt.case489Title": "isCollapsed 判断正常（#489 等）",
    "rt.case489Label": "已验证 · Selection.isCollapsed",
    "rt.case489Desc":
      "无界环境下 Selection.isCollapsed 不再恒为 true：仅光标折叠时为 true，拖选文字时为 false。该问题曾导致 wangEditor 误判选区、删改与粘贴异常。",
    "rt.case489Steps":
      "操作：点击编辑器定位光标，确认 isCollapsed 为 true；再拖选一段文字，确认 isCollapsed 变为 false，且与 anchor/focus 偏移一致。",
    "rt.case489Html": "<p>请<strong>拖选这段文字</strong>，观察上方 isCollapsed 从 true 变为 false。</p>",
    "rt.tinymceTitle": "本地自托管 TinyMCE：显式配置 skin_url / content_css（#224 / #974）",
    "rt.tinymceLabel": "关联 Issue #224、#974",
    "rt.tinymceDesc":
      "不使用远端 CDN，直接加载本地 public/tinymce/tinymce.min.js，并在 init 时按 TinyMCE 常规接入方式显式配置 skin_url 和 content_css。",
    "rt.tinymceSteps":
      "验证：下方编辑器若能完整显示 oxide 皮肤（工具栏、边框、编辑区样式齐全），说明 TinyMCE 的皮肤与内容样式在无界子应用内都能正常加载。可在 Network 过滤 tinymce / skin 确认资源请求。",
    "rt.wangPlaceholder": "请在此输入内容进行验证…",
    "rt.wangNotFocused": "（尚未聚焦编辑器）",
    "rt.wangEmptySelection": "getSelection() 为空或 rangeCount = 0",
    "rt.wangSelLive": "（编辑时实时刷新）",
    "rt.wangSelHintPrefix": "光标折叠时应为 ",
    "rt.wangSelHintMid": "，拖选文字时应为 ",
    "rt.wangSelHintSuffix": "。",
    "rt.wangSelOk": "isCollapsed 表现正常",
    "rt.wangLoRoTitle": "（#513 降级快速输入）",
    "rt.wangLoRoHint": " 为 true 时 Slate 选区同步正常；快速输入时若变为 false 易失焦。",
    "rt.wangLoRoOk": "LO / RO 校验通过",
    "rt.wangInitOk": "编辑器已正常加载，上述场景验证通过。",
    "rt.tinymceInitOk": "编辑器与皮肤已正常加载。",
    "rt.tinymceNotFound": "未找到 window.tinymce，请确认 public/tinymce/tinymce.min.js 已正确加载",
    "rt.tinymceInitFail": "TinyMCE 初始化失败：",
  },
  en: {
    "nav.home": "Home",
    "nav.dialog": "Dialog",
    "nav.location": "Location",
    "nav.communication": "Communication",
    "nav.richText": "Rich Text",
    "home.title": "Vue 2 Sub-app Demo",
    "home.vueVersion": "Vue version",
    "home.elVersion": "Element UI version",
    "home.antVersion": "Ant Design Vue version",
    "home.repo": "Source Code",
    "dialog.title": "Dialogs & Overlays",
    "dialog.intro": "Modals, selects, and popovers work out of the box with zero sub-app changes",
    "dialog.step1": "1. Open Dialog / Modal",
    "dialog.openElDialog": "Open el-dialog",
    "dialog.openAntModal": "Open ant-modal",
    "dialog.step2": "2. Open Select",
    "dialog.step3": "3. Open Popover",
    "dialog.popoverTitle": "Title",
    "dialog.popoverContent": "This is popover content, this is popover content, this is popover content.",
    "dialog.elPopoverHover": "Hover el-popover",
    "dialog.step4": "4. Manually append fixed element to body",
    "dialog.step5": "5. Native Popper / Floating UI Overlays",
    "dialog.routePageCtx": "Route Page",
    "dialog.elDialogCtx": "Inside el-dialog",
    "dialog.tipsTitle": "Tips",
    "dialog.tipsBody": "This is a message",
    "dialog.innerElSelectTitle": "Inside Dialog: Element Select",
    "dialog.innerElSelectPlaceholder": "el-select (in dialog)",
    "dialog.innerElPopoverTitle": "Inside Dialog: Element Popover",
    "dialog.innerElPopoverContent": "This is content (in dialog), this is content, this is content.",
    "dialog.innerElPopoverBtn": "el-popover hover (in dialog)",
    "dialog.cancel": "Cancel",
    "dialog.confirm": "Confirm",
    "dialog.innerAntSelectTitle": "Inside Modal: Ant Design Select",
    "dialog.innerAntSelectPlaceholder": "ant-select (in modal)",
    "dialog.innerAntPopoverHeading": "Inside Modal: Ant Design Popover",
    "dialog.innerAntPopoverTitle": "Title (in modal)",
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
    "popper.headingSuffix": ": Native Positioning Overlays",
    "popper.desc":
      "Click a button to open a native overlay appended to document.body and verify whether positioning drifts inside Wujie.",
    "popper.open1": "Open Popper.js 1.x",
    "popper.open2": "Open Popper.js 2.x",
    "popper.openFloating": "Open Floating UI",
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
    "comm.step3Desc2": "Clicking the button emits $wujie.bus.$emit('click', 'vue2')",
    "comm.emitBtn": "Emit event",
    "comm.step4Title": "4. Send messages via postMessage",
    "pm.title": "vue2 Sub-app",
    "pm.received": "Received message: ",
    "pm.sendMain": "Send to Main App",
    "pm.sendIframe": "Send to iframe",
    "rt.title": "Rich Text Editors",
    "rt.introPrefix": "Reproduces common wangEditor / TinyMCE issues reported in ",
    "rt.introMid": ". Recommended to verify both ",
    "rt.introEmbed": "embedded inside a Wujie main app",
    "rt.introAnd": " and ",
    "rt.introStandalone": "opened standalone",
    "rt.introSuffix": ".",
    "rt.envWujie": "Running inside Wujie sub-app environment",
    "rt.envStandalone": "Running standalone",
    "rt.case218Title": "Edit & Delete Prefilled Content (#218)",
    "rt.case218Label": "Verified · Issue #218",
    "rt.case218Desc":
      "After initializing wangEditor with existing HTML in a sub-app, focusing, deleting prefilled text, and inserting in the middle all work properly.",
    "rt.case218Steps":
      "Steps: Click the editor below, delete prefilled text or insert new text before 'prefilled', and verify cursor and editing behavior.",
    "rt.case218Html":
      "<p>This is <strong>prefilled content</strong>. Try deleting this paragraph or inserting new text before 'prefilled'.</p>",
    "rt.case513Title": "Fast Typing Without Losing Focus (#513)",
    "rt.case513Label": "Verified · Issue #513",
    "rt.case513Desc":
      "wangEditor 5.x stays focused during rapid typing in Wujie (including degrade mode). Wujie points getSelection/ownerDocument to the render iframe and patches cross-realm instanceof.",
    "rt.case513Steps":
      "Steps: Verify in degrade mode by typing rapidly (including IME) below; confirm no focus loss or cursor jump, and LO/RO indicators stay true.",
    "rt.case450Title": "Selection / DOM Consistency (#450, #770)",
    "rt.case450Label": "Verified · Issue #450, #770",
    "rt.case450Desc":
      "Selection maps cleanly to DOM without 'Cannot resolve a Slate range from DOM range'; getSelection() resolves to the proper document / shadowRoot.",
    "rt.case450Steps": "Steps: Click, select text, and edit in the editor below; verify no console errors.",
    "rt.case479Title": "Copy & Paste (#479)",
    "rt.case479Label": "Verified · Issue #479",
    "rt.case479Desc":
      "paste event clipboardData originates from the main app realm; cross-realm DataTransfer instanceof must be patched so pasting works.",
    "rt.case479Steps":
      "Steps: Select text below, press Ctrl+C and Ctrl+V, or paste text copied from outside and verify it appears.",
    "rt.case479Html":
      "<p>Select and copy this paragraph, then paste it below — or paste text copied from outside.</p>",
    "rt.case489Title": "Selection.isCollapsed Accuracy (#489)",
    "rt.case489Label": "Verified · Selection.isCollapsed",
    "rt.case489Desc":
      "Selection.isCollapsed is no longer stuck at true: true only when collapsed, false when dragging a selection. Previously caused wangEditor editing & paste bugs.",
    "rt.case489Steps":
      "Steps: Click to place a caret (isCollapsed should be true), then drag-select text (isCollapsed should turn false matching anchor/focus offsets).",
    "rt.case489Html":
      "<p>Please <strong>drag-select this text</strong> and watch isCollapsed above change from true to false.</p>",
    "rt.tinymceTitle": "Self-hosted TinyMCE: Explicit skin_url / content_css (#224 / #974)",
    "rt.tinymceLabel": "Related Issue #224, #974",
    "rt.tinymceDesc":
      "Loads local public/tinymce/tinymce.min.js without a remote CDN and configures skin_url and content_css explicitly during tinymce.init.",
    "rt.tinymceSteps":
      "Verify: If the oxide skin (toolbar, borders, editor styling) renders completely below, TinyMCE skin and content styles load properly inside Wujie.",
    "rt.wangPlaceholder": "Type here to test…",
    "rt.wangNotFocused": "(Editor not focused yet)",
    "rt.wangEmptySelection": "getSelection() is empty or rangeCount = 0",
    "rt.wangSelLive": "(live-updated while editing)",
    "rt.wangSelHintPrefix": "Should be ",
    "rt.wangSelHintMid": " when collapsed, and ",
    "rt.wangSelHintSuffix": " when dragging a selection.",
    "rt.wangSelOk": "isCollapsed behaves as expected",
    "rt.wangLoRoTitle": "(#513 fast typing in degrade mode)",
    "rt.wangLoRoHint": " being true means Slate selection stays in sync; turning false causes focus loss.",
    "rt.wangLoRoOk": "LO / RO check passed",
    "rt.wangInitOk": "Editor loaded properly and the scenario above is verified.",
    "rt.tinymceInitOk": "Editor and skin loaded properly.",
    "rt.tinymceNotFound": "window.tinymce not found — ensure public/tinymce/tinymce.min.js loaded properly",
    "rt.tinymceInitFail": "TinyMCE initialization failed: ",
  },
};

function applyElementLocale(lang) {
  elementLocale.use(lang === "en" ? elEn : elZhCN);
}

export const i18nState = Vue.observable({
  lang: detectLang(),
});

applyElementLocale(i18nState.lang);

export function getLang() {
  return i18nState.lang;
}

export function setLang(nextLang) {
  const normalized = nextLang === "en" ? "en" : "zh";
  if (i18nState.lang === normalized) return;
  i18nState.lang = normalized;
  applyElementLocale(normalized);
}

export function syncLangFromHost() {
  setLang(detectLang());
}

export function t(key) {
  const dict = messages[i18nState.lang] || messages.zh;
  return dict[key] !== undefined ? dict[key] : key;
}

export default {
  install(VueCtor) {
    VueCtor.prototype.$t = t;
    Object.defineProperty(VueCtor.prototype, "$lang", {
      get: () => i18nState.lang,
    });
  },
};
