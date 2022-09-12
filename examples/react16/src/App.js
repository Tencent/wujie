import React, { useEffect } from "react";
import { NavLink, Route, Switch, Redirect, useLocation } from "react-router-dom";
import Dialog from "./Dialog";
import Location from "./Location";
import Communication from "./Communication";
import React17 from "./nest";
import Font from "./Font";
import logo from "./logo.svg";
import Tag from "antd/es/tag";
import Button from "antd/es/button";
import "antd/es/tag/style/css";
import "antd/es/button/style/css";
import "antd/es/modal/style/css";
import "antd/es/select/style/css";
import "antd/es/popover/style/css";

const Home = () => (
  <div>
    <h2 className="css-before-flag">react16示例</h2>
    <p>
      当前react版本{" "}
      <Tag style={{ verticalAlign: "text-top" }} color="blue">
        16.13.1
      </Tag>
    </p>
    <p>
      当前antd版本{" "}
      <Tag style={{ verticalAlign: "text-top" }} color="geekblue">
        4.18.3
      </Tag>
    </p>
    <p>
      <Button onClick={() => window.open("https://github.com/Tencent/wujie/tree/master/examples/react16")}>
        仓库地址
      </Button>
    </p>
  </div>
);

export default function App() {
  // 在 react16-sub 路由下主动告知主应用路由跳转，主应用也跳到相应路由高亮菜单栏
  const location = useLocation()
  useEffect(() => {
    window.$wujie?.bus.$emit('sub-route-change', "react16", location.pathname)
  }, [location])

  return (
    <div>
      <nav>
        <NavLink to="/home">首页</NavLink> | <NavLink to="/dialog">弹窗</NavLink> |{" "}
        <NavLink to="/location">路由</NavLink> | <NavLink to="/communication">通信</NavLink> |{" "}
        <NavLink to="/nest">内嵌</NavLink> | <NavLink to="/font">字体</NavLink>
      </nav>

      <div>
        <img src={logo} className="App-logo" alt="logo" />
      </div>

      <Switch>
        <Route exact path="/home">
          <Home />
        </Route>
        <Route path="/dialog">
          <Dialog />
        </Route>
        <Route path="/location">
          <Location />
        </Route>
        <Route path="/communication">
          <Communication />
        </Route>
        <Route path="/nest">
          <React17 />
        </Route>
        <Route path="/font">
          <Font />
        </Route>
        <Route exact path="/">
          <Redirect to="/home" />
        </Route>
      </Switch>
    </div>
  );
}
