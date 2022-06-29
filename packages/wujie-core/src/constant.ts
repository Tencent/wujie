// 私有元素属性
export const WUJIE_DATA_ID = "data-wujie-id";
export const WUJIE_DATA_FLAG = "data-wujie-Flag";
export const WUJIE_DATA_ATTACH_CSS_FLAG = "data-wujie-attach-css-flag";

// 需要使用的某些固定变量
export const WUJIE_IFRAME_CLASS = "wujie_iframe";
export const WUJIE_ALL_EVENT = "_wujie_all_event";
export const WUJIE_SHADE_STYLE =
  "position: fixed; z-index: 2147483647; visibility: hidden; inset: 0px; backface-visibility: hidden;";

// 提醒类
export const WUJIE_TIPS_NO_URL = "url参数为空";
export const WUJIE_TIPS_RELOAD_DISABLED = "子应用调用reload无法生效";
export const WUJIE_TIPS_STOP_APP = "此报错可以忽略，iframe主动中断主应用代码在子应用运行";
export const WUJIE_TIPS_NO_SUBJECT = "事件订阅数量为空";
export const WUJIE_TIPS_NO_FETCH = "window上不存在fetch属性，需要自行polyfill";
export const WUJIE_TIPS_EMPTY_CALLBACK = "监听事件回调函数不存在";
export const WUJIE_TIPS_NOT_SUPPORTED = "当前浏览器不支持无界，子应用将采用iframe方式渲染";
export const WUJIE_TIPS_SCRIPT_ERROR_REQUESTED = "脚本请求出现错误";
export const WUJIE_TIPS_CSS_ERROR_REQUESTED = "样式请求出现错误";
export const WUJIE_TIPS_REPEAT_RENDER = "无界组件短时间重复渲染了两次，可能存在性能问题请检查代码";
