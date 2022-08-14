import React from "react";
import hostMap from "../hostMap";
import fetch from "../fetch";
import WujieReact from "wujie-react";
import { useNavigate } from "react-router-dom";
import lifecycles from "../lifecycle";

export default function React16() {
  const navigation = useNavigate();
  const react16Url = hostMap("//localhost:7600/");
  const react17Url = hostMap("//localhost:7100/");
  const vue2Url = hostMap("//localhost:7200/");
  const vue3Url = hostMap("//localhost:7300/");
  const vite = hostMap("//localhost:7500/");
  const angular12Url = hostMap("//localhost:7400/");
  // 修正iframe的url，防止github pages csp报错
  const react16Attrs = process.env.NODE_ENV === "production" ? { src: react16Url } : {};
  const react17Attrs = process.env.NODE_ENV === "production" ? { src: react17Url } : {};
  const vue2Attrs = process.env.NODE_ENV === "production" ? { src: vue2Url } : {};
  const vue3Attrs = process.env.NODE_ENV === "production" ? { src: vue3Url } : {};
  const viteAttrs = process.env.NODE_ENV === "production" ? { src: vite } : {};
  const angular12Attrs = process.env.NODE_ENV === "production" ? { src: angular12Url } : {};
  const degrade = window.localStorage.getItem("degrade") === "true";
  const vue3Fetch = (url, options) =>
    url.includes(hostMap("//localhost:7300/")) ? fetch(url, options) : window.fetch(url, options);
  const props = {
    jump: (name) => {
      navigation(`/${name}`);
    },
  };
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <div className="all-item">
        <WujieReact
          height="100%"
          width="100%"
          name="react16"
          url={react16Url}
          sync={true}
          fetch={fetch}
          props={props}
          attrs={react16Attrs}
          degrade={degrade}
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
      </div>
      <div className="all-item">
        <WujieReact
          height="100%"
          width="100%"
          name="react17"
          url={react17Url}
          sync={true}
          fetch={fetch}
          props={props}
          attrs={react17Attrs}
          alive={true}
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
      </div>
      <div className="all-item">
        <WujieReact
          height="100%"
          width="100%"
          name="vue2"
          url={vue2Url}
          sync={true}
          fetch={fetch}
          props={props}
          attrs={vue2Attrs}
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
      </div>
      <div className="all-item">
        <WujieReact
          height="100%"
          width="100%"
          name="vue3"
          url={vue3Url}
          sync={true}
          fetch={vue3Fetch}
          props={props}
          attrs={vue3Attrs}
          alive={true}
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
      </div>
      <div className="all-item">
        <WujieReact
          height="100%"
          width="100%"
          name="vite"
          url={vite}
          sync={true}
          fetch={fetch}
          props={props}
          attrs={viteAttrs}
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
      </div>
      <div className="all-item">
        <WujieReact
          height="100%"
          width="100%"
          name="angular12"
          url={angular12Url}
          sync={true}
          fetch={fetch}
          props={props}
          attrs={angular12Attrs}
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
      </div>
    </div>
  );
}
