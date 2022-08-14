import React from "react";
import WujieReact from "wujie-react";
import lifecycles from "./lifecycle";
import hostMap from "./hostMap"

function selfFetch(url, options) {
  const includeFlag = process.env.NODE_ENV === "production";
  return window.fetch(url, { ...options, credentials: includeFlag ? "include" : "omit" });
}

export default function React17() {
  const react17Url = hostMap("//localhost:7100/");
  const degrade = window.localStorage.getItem("degrade") === "true";
  const props = {
    jump: (name) => {
      window?.$wujie.props.jump(name);
    },
  };
  return (
    <div>
      <h2>子应用嵌套</h2>
      <div className="content" style={{border: '1px dashed #ccc', overflow: 'auto'}}>
        <WujieReact
          width="100%"
          height="500px"
          name="react17"
          url={react17Url}
          alive={true}
          sync={true}
          fetch={selfFetch}
          props={props}
          degrade={degrade}
          beforeLoad={lifecycles.beforeLoad}
          beforeMount={lifecycles.beforeMount}
          afterMount={lifecycles.afterMount}
          beforeUnmount={lifecycles.beforeUnmount}
          afterUnmount={lifecycles.afterUnmount}
        ></WujieReact>
      </div>
    </div>
  );
}
