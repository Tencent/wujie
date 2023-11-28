import React from "react";
import { useRemoteComp } from 'hel-micro-react';

export default function RemoteComp() {
  const Comp = useRemoteComp(
    // see https://github.com/hel-e co/hel-tpl-remote-react-comp
    "hel-tpl-remote-react-comps",
    // see https://github.com/hel-eco/hel-tpl-remote-react-comp-ts
    // "hel-tpl-remote-react-comps-ts",
    "HelloRemoteReactComp",
    { versionId: "1.3.2" }
  );
  return <div>
    <h1>这是一个懒加载的远程react组件</h1>
    <Comp />
  </div>;
}
