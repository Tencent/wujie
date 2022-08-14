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

const { preloadApp, bus } = WujieReact;
const isProduction = process.env.NODE_ENV === "production";
bus.$on("click", (msg) => window.alert(msg));

if (window.localStorage.getItem("preload") !== "false") {
  const degrade = window.localStorage.getItem("degrade") === "true" || !window.Proxy || !window.CustomElementRegistry;
  preloadApp({
    name: "react16",
    url: hostMap("//localhost:7600/"),
    attrs: isProduction ? {src: hostMap("//localhost:7600/")} : {},
    exec: true,
    fetch: credentialsFetch,
    degrade,
    plugins,
    ...lifecycles,
  });
  preloadApp({
    name: "react17",
    url: hostMap("//localhost:7100/"),
    attrs: isProduction ? {src: hostMap("//localhost:7100/")} : {},
    exec: true,
    alive: true,
    fetch: credentialsFetch,
    degrade,
    ...lifecycles,
  });
  preloadApp({
    name: "vue2",
    url: hostMap("//localhost:7200/"),
    attrs: isProduction ? {src: hostMap("//localhost:7200/")} : {},
    exec: true,
    fetch: credentialsFetch,
    degrade,
    ...lifecycles,
  });
  preloadApp({
    name: "vue3",
    url: hostMap("//localhost:7300/"),
    attrs: isProduction ? {src: hostMap("//localhost:7300/")} : {},
    exec: true,
    alive: true,
    // 引入了的第三方样式不需要添加credentials
    fetch: (url, options) =>
      url.includes(hostMap("//localhost:7300/")) ? credentialsFetch(url, options) : window.fetch(url, options),
    degrade,
    ...lifecycles,
  });
  preloadApp({
    name: "angular12",
    url: hostMap("//localhost:7400/"),
    attrs: isProduction ? {src: hostMap("//localhost:7400/")} : {},
    exec: true,
    fetch: credentialsFetch,
    degrade,
    ...lifecycles,
  });
  preloadApp({
    name: "vite",
    url: hostMap("//localhost:7500/"),
    attrs: isProduction ? {src: hostMap("//localhost:7500/")} : {},
    exec: true,
    fetch: credentialsFetch,
    degrade,
    ...lifecycles,
  });
}

ReactDOM.render(<App />, document.getElementById("root"));
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
