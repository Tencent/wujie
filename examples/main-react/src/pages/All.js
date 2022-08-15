import React from "react";
import hostMap from "../hostMap";
import WujieReact from "wujie-react";
import { useNavigate } from "react-router-dom";

export default function React16() {
  const navigation = useNavigate();
  const react16Url = hostMap("//localhost:7600/");
  const react17Url = hostMap("//localhost:7100/");
  const vue2Url = hostMap("//localhost:7200/");
  const vue3Url = hostMap("//localhost:7300/");
  const vite = hostMap("//localhost:7500/");
  const angular12Url = hostMap("//localhost:7400/");
  // 修正iframe的url，防止github pages csp报错
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
          props={props}
        ></WujieReact>
      </div>
      <div className="all-item">
        <WujieReact
          height="100%"
          width="100%"
          name="react17"
          url={react17Url}
          sync={true}
          props={props}
          alive={true}
        ></WujieReact>
      </div>
      <div className="all-item">
        <WujieReact
          height="100%"
          width="100%"
          name="vue2"
          url={vue2Url}
          sync={true}
          props={props}
        ></WujieReact>
      </div>
      <div className="all-item">
        <WujieReact
          height="100%"
          width="100%"
          name="vue3"
          url={vue3Url}
          sync={true}
          props={props}
          alive={true}
        ></WujieReact>
      </div>
      <div className="all-item">
        <WujieReact
          height="100%"
          width="100%"
          name="vite"
          url={vite}
          sync={true}
          props={props}
        ></WujieReact>
      </div>
      <div className="all-item">
        <WujieReact
          height="100%"
          width="100%"
          name="angular12"
          url={angular12Url}
          sync={true}
          props={props}
        ></WujieReact>
      </div>
    </div>
  );
}
