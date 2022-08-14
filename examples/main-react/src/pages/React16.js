import React from "react";
import hostMap from "../hostMap";
import fetch from "../fetch";
import WujieReact from "wujie-react";
import { useNavigate, useLocation } from "react-router-dom";
import lifecycles from "../lifecycle";
import plugins from "../plugin";

export default function React16() {
  const navigation = useNavigate();
  const location = useLocation();
  const path = location.pathname.replace("/react16-sub", "").replace("/react16", "").replace("/",""); ////
  const react16Url = hostMap("//localhost:7600/") + path;
  const degrade = window.localStorage.getItem("degrade") === "true";
  // 修正iframe的url，防止github pages csp报错
  const attrs = process.env.NODE_ENV === "production" ? { src: react16Url } : {};
  const props = {
    jump: (name) => {
      navigation(`/${name}`);
    },
  };
  return (
    // 单例模式，name相同则复用一个无界实例，改变url则子应用重新渲染实例到对应路由
    <WujieReact
      width="100%"
      height="100%"
      name="react16"
      url={react16Url}
      sync={true}
      fetch={fetch}
      props={props}
      degrade={degrade}
      plugins={plugins}
      attrs={attrs}
      prefix={{ "prefix-dialog": "/dialog", "prefix-location": "/location" }}
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
