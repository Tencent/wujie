import React from "react";
import hostMap from "../hostMap";
import fetch from "../fetch";
import WujieReact from "wujie-react";
import { useNavigate, useLocation } from "react-router-dom";
import lifecycles from "../lifecycle";

export default function Vue3() {
  const location = useLocation();
  const navigation = useNavigate();
  const path = location.pathname.replace("/vue3-sub", "").replace("/vue3", "");////
  const vue3Url = hostMap("//localhost:7300/");
    // 告诉子应用要跳转哪个路由
    WujieReact.bus.$emit("vue3-router-change", path);
  const degrade = window.localStorage.getItem("degrade") === "true";
  // 修正iframe的url，防止github pages csp报错
  const attrs = process.env.NODE_ENV === "production" ? { src: vue3Url } : {};
  const customFetch = (url, options) =>
    url.includes(hostMap("//localhost:7300/")) ? fetch(url, options) : window.fetch(url, options);
  const props = {
    jump: (name) => {
      navigation(`/${name}`);
    },
  };
  return (
    <WujieReact
      width="100%"
      height="100%"
      name="vue3"
      url={vue3Url}
      sync={true}
      alive={true}
      fetch={customFetch}
      props={props}
      attrs={attrs}
      degrade={degrade}
      plugins={[{ cssExcludes: ['https://stackpath.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css'] }]}
      beforeLoad={lifecycles.beforeLoad}
      beforeMount={lifecycles.beforeMount}
      afterMount={lifecycles.afterMount}
      beforeUnmount={lifecycles.beforeUnmount}
      afterUnmount={lifecycles.afterUnmount}
      activated={lifecycles.activated}
      deactivated={lifecycles.deactivated}
      loadError={lifecycles.loadError}
    ></WujieReact>
  );
}
