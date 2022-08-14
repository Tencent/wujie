import React from "react";
import hostMap from "../hostMap";
import fetch from "../fetch";
import WujieReact from "wujie-react";
import { useNavigate, useLocation } from "react-router-dom";
import lifecycles from "../lifecycle";

export default function Vite() {
  const location = useLocation();
  const navigation = useNavigate();
  const path = location.pathname.replace("/vite-sub", "").replace("/vite", "").replace("/", "");////
  const viteUrl = hostMap("//localhost:7500/") + path;
  const degrade = window.localStorage.getItem("degrade") === "true";
  // 修正iframe的url，防止github pages csp报错
  const attrs = process.env.NODE_ENV === "production" ? { src: viteUrl } : {};
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
      name="vite"
      url={viteUrl}
      sync={true}
      fetch={fetch}
      props={props}
      attrs={attrs}
      degrade={degrade}
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
