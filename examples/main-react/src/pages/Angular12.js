import React from "react";
import hostMap from "../hostMap";
import WujieReact from "wujie-react";
import { useNavigate } from "react-router-dom";

export default function Angular12() {
  const navigation = useNavigate();
  const angular12Url = hostMap("//localhost:7400/");
  const props = {
    jump: (name) => {
      navigation(`/${name}`);
    },
  };
  return (
    <WujieReact
      width="100%"
      height="100%"
      name="angular12"
      url={angular12Url}
      sync={true}
      props={props}
    ></WujieReact>
  );
}
