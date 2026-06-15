import React from "react";
import hostMap from "../hostMap";
import WujieReact from "wujie-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function React17() {
  const location = useLocation();
  const navigation = useNavigate();
  const react17Url = hostMap("//localhost:7100/");
  const path = location.pathname.replace("/react17-sub", "").replace("/react17", "");////
  // 告诉子应用要跳转哪个路由
  path && WujieReact.bus.$emit("react17-router-change", path);
  const props = {
    jump: (name) => {
      navigation(`/${name}`);
    },
  };
  return (
    // 保活模式，name相同则复用一个子应用实例，改变url无效，必须采用通信的方式告知路由变化
    <WujieReact
      width="100%"
      height="100%"
      name="react17"
      url={react17Url}
      sync={!path}
      props={props}
    ></WujieReact>
  );
}
