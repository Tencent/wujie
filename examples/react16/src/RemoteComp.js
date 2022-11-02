import React from "react";
import { useRemoteComp } from 'hel-micro-react';

export default function RemoteComp() {
  const Comp = useRemoteComp("hel-tpl-remote-react-comps", "HelloRemoteReactComp");
  return <div>
    <h1>这是一个懒加载的远程react组件</h1>
    <Comp />
  </div>;
}
