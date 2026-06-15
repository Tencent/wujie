import { useEffect } from "react";
import logo from "./logo.svg";
import { BrowserRouter as Router, Switch, Route, NavLink, Redirect, useHistory, useLocation } from "react-router-dom";
import Dialog from "./Dialog";
import Location from "./Location";
import Communication from "./Communication";
import State from "./State";
import Tag from "antd/es/tag";
import Button from "antd/es/button";
import "antd/es/tag/style/css";
import "antd/es/button/style/css";
import "antd/es/modal/style/css";
import "antd/es/select/style/css";
import "antd/es/popover/style/css";

const basename = process.env.NODE_ENV === "production" ? "/demo-react17/" : "";

const Home = () => (
  <div>
    <h2>react17示例</h2>
    <p>
      当前react版本{" "}
      <Tag style={{ verticalAlign: "text-top" }} color="blue">
        17.0.2
      </Tag>
    </p>
    <p>
      当前antd版本{" "}
      <Tag style={{ verticalAlign: "text-top" }} color="geekblue">
        4.18.3
      </Tag>
    </p>
    <p>
      <Button onClick={() => window.open("https://github.com/Tencent/wujie/tree/master/examples/react17")}>
        仓库地址
      </Button>
    </p>
  </div>
);

function Nav() {
  const history = useHistory();
  const routerJump = path =>  history.push(path)
  // 主应用告诉子应用跳转路由
  useEffect(() => {
    window.$wujie?.bus.$on("react17-router-change", routerJump);
  }, [])

  // 在 react17-sub 路由下主动告知主应用路由跳转，主应用也跳到相应路由高亮菜单栏
  const location = useLocation()
  useEffect(() => {
    window.$wujie?.bus.$emit('sub-route-change', "react17", location.pathname)
  }, [location])

  return (
    <nav>
    <NavLink to="/home">首页</NavLink> | <NavLink to="/dialog">弹窗</NavLink> |{" "}
    <NavLink to="/location">路由</NavLink> | <NavLink to="/communication">通信</NavLink> |{" "}
    <NavLink to="/state">状态</NavLink>
  </nav>

  )
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Router basename={basename}>
          <div>
            <Nav />
            <img src={logo} className="App-logo" alt="logo" />
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
              <Route path="/state">
                <State />
              </Route>
              <Route exact path="/">
                <Redirect to="/home" />
              </Route>
            </Switch>
          </div>
        </Router>
      </header>
    </div>
  );
}

export default App;
