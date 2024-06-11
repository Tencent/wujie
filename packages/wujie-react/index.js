import React, {useEffect, useRef} from "react";
import PropTypes from "prop-types";
import { bus, preloadApp, startApp, destroyApp, setupApp } from "wujie";

export default function WujieReact(props) {
  const { width, height,name,url } = props;
  const myRef=useRef(null)
  // 缓存 function 的引用地址，useCallback 会因为 react 的多次 rerender 而多次改变，进而导致调用 startApp 不符合预期
  const _startApp = useRef(()=>{});
  _startApp.current = async () => {
    try {
      await startApp({
        ...props,
        el:myRef.current,
      });
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(()=>{
    _startApp.current()
  },[_startApp, name, url])

  return <div style={{ width, height }} ref={myRef} />;
}

WujieReact.propTypes = {
  height: PropTypes.string,
  width: PropTypes.string,
  name: PropTypes.string,
  loading: PropTypes.element,
  url: PropTypes.string,
  alive: PropTypes.bool,
  fetch: PropTypes.func,
  props: PropTypes.object,
  attrs: PropTypes.object,
  replace: PropTypes.func,
  sync: PropTypes.bool,
  prefix: PropTypes.object,
  fiber: PropTypes.bool,
  degrade: PropTypes.bool,
  plugins: PropTypes.array,
  beforeLoad: PropTypes.func,
  beforeMount: PropTypes.func,
  afterMount: PropTypes.func,
  beforeUnmount: PropTypes.func,
  afterUnmount: PropTypes.func,
  activated: PropTypes.func,
  deactivated: PropTypes.func,
  loadError: PropTypes.func,
}

WujieReact.bus = bus;
WujieReact.setupApp = setupApp;
WujieReact.preloadApp = preloadApp;
WujieReact.destroyApp = destroyApp;
