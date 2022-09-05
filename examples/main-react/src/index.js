import React from "react";
import ReactDOM from "react-dom";
import WujieReact from "wujie-react";
import "antd/es/switch/style/css.js";
import "antd/es/tooltip/style/css.js";
import "antd/es/button/style/css.js";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import hostMap from "./hostMap";
import credentialsFetch from "./fetch";
import lifecycles from "./lifecycle";
import plugins from "./plugin";

const { setupApp, preloadApp, bus } = WujieReact;
const isProduction = process.env.NODE_ENV === "production";
bus.$on("click", (msg) => window.alert(msg));

const degrade = window.localStorage.getItem("degrade") === "true" || !window.Proxy || !window.CustomElementRegistry;
/**
 * 大部分业务无需设置 attrs
 * 此处修正 iframe 的 src，是防止github pages csp报错
 * 因为默认是只有 host+port，没有携带路径
 */
const attrs = isProduction ? { src: hostMap("//localhost:7700/") } : {};
/**
 * 配置应用，主要是设置默认配置
 * preloadApp、startApp的配置会基于这个配置做覆盖
 */
setupApp({
  name: "react16",
  url: hostMap("//localhost:7600/"),
  attrs,
  exec: true,
  fetch: credentialsFetch,
  plugins,
  prefix: { "prefix-dialog": "/dialog", "prefix-location": "/location" },
  degrade,
  ...lifecycles,
});

setupApp({
  name: "react17",
  url: hostMap("//localhost:7100/"),
  attrs,
  exec: true,
  alive: true,
  fetch: credentialsFetch,
  degrade,
  ...lifecycles,
});

setupApp({
  name: "vue2",
  url: hostMap("//localhost:7200/"),
  attrs,
  exec: true,
  fetch: credentialsFetch,
  degrade,
  ...lifecycles,
});

setupApp({
  name: "vue3",
  url: hostMap("//localhost:7300/"),
  attrs,
  exec: true,
  alive: true,
  plugins: [{ cssExcludes: ["https://stackpath.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"] }],
  // 引入了的第三方样式不需要添加credentials
  fetch: (url, options) =>
    url.includes(hostMap("//localhost:7300/")) ? credentialsFetch(url, options) : window.fetch(url, options),
  degrade,
  ...lifecycles,
});

setupApp({
  name: "angular12",
  url: hostMap("//localhost:7400/"),
  attrs,
  exec: true,
  fetch: credentialsFetch,
  degrade,
  ...lifecycles,
});

setupApp({
  name: "vite",
  url: hostMap("//localhost:7500/"),
  attrs,
  exec: true,
  fetch: credentialsFetch,
  degrade,
  ...lifecycles,
});

if (window.localStorage.getItem("preload") !== "false") {
  preloadApp({
    name: "react16",
  });
  preloadApp({
    name: "react17",
  });
  preloadApp({
    name: "vue2",
  });
  preloadApp({
    name: "vue3",
  });
  preloadApp({
    name: "angular12",
  });
  preloadApp({
    name: "vite",
  });
}

ReactDOM.render(<App />, document.getElementById("root"));
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
