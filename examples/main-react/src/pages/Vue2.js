import React from "react";
import hostMap from "../hostMap";
import WujieReact from "wujie-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Vue2() {
  const location = useLocation();
  const navigation = useNavigate();
  const path = location.pathname.replace("/vue2-sub", "").replace("/vue2", "");////
  const vue2Url = hostMap("//localhost:7200/") + "#" + path;
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
      name="vue2"
      url={vue2Url}
      sync={!path}
      props={props}
    ></WujieReact>
  );
}
