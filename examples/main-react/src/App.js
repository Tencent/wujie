import { HashRouter as Router, Route, Routes, NavLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import WujieReact from "wujie-react";
import React, { useState } from "react";
import Home from "./pages/Home";
import React16 from "./pages/React16";
import React17 from "./pages/React17";
import Vue2 from "./pages/Vue2";
import Vue3 from "./pages/Vue3";
import Vite from "./pages/Vite";
import Angular12 from "./pages/Angular12";
import All from "./pages/All";
import Button from "antd/es/button";
import { UnorderedListOutlined, CaretUpOutlined } from "@ant-design/icons";

const { bus } = WujieReact;

const subMap = {
  react16: ["home", "dialog", "location", "communication", "nest", "font"],
  react17: ["home", "dialog", "location", "communication", "state"],
  vue2: ["home", "dialog", "location", "communication"],
  vue3: ["home", "dialog", "location", "contact", "state"],
  vite: ["home", "dialog", "location", "contact"],
};

function Nav() {
  const location = useLocation();
  const navigation = useNavigate(); 
  const [react16Flag, setReact16Flag] = useState(location.pathname.includes("react16-sub"));
  const [react17Flag, setReact17Flag] = useState(location.pathname.includes("react7-sub"));
  const [vue2Flag, setVue2Flag] = useState(location.pathname.includes("vue2-sub"));
  const [vue3Flag, setVue3Flag] = useState(location.pathname.includes("vue3-sub"));
  const [viteFlag, setViteFlag] = useState(location.pathname.includes("vite-sub"));

  // 在 xxx-sub 路由下子应用将激活路由同步给主应用，主应用跳转对应路由高亮菜单栏
  bus.$on("sub-route-change", (name, path) => {
    const mainName = `${name}-sub`;
    const mainPath = `/${name}-sub${path}`;
    const currentPath = window.location.hash.replace("#", "")
    if(currentPath.includes(mainName) && currentPath !== mainPath) {
      navigation(mainPath);
    }
  });


  const handleFlag = (name) => {
    switch (name) {
      case "react16":
        setReact16Flag(!react16Flag);
        break;
      case "react17":
        setReact17Flag(!react17Flag);
        break;
      case "vue2":
        setVue2Flag(!vue2Flag);
        break;
      case "vue3":
        setVue3Flag(!vue3Flag);
        break;
      case "vite":
        setViteFlag(!viteFlag);
        break;
      default:
        break;
    }
  };
  return (
    <nav>
      <NavLink to="/home" className={({ isActive }) => (isActive ? "active" : "inactive")}>
        介绍
      </NavLink>
      <NavLink to="/react16" className={({ isActive }) => (isActive ? "active" : "inactive")}>
        react16
        <CaretUpOutlined
          className={react16Flag ? "main-icon active" : "main-icon"}
          onClick={() => handleFlag("react16")}
        />
      </NavLink>
      <div className="sub-menu" style={{display: react16Flag ? "block" : "none"}}>
        {subMap.react16.map((item) => (
          <NavLink to={`/react16-sub/${item}`} key={item} className={({ isActive }) => (isActive ? "active" : "inactive")}>
            {item}
          </NavLink>
        ))}
      </div>
      <NavLink to="/react17" className={({ isActive }) => (isActive ? "active" : "inactive")}>
        react17<span className="alive">保活</span>
        <CaretUpOutlined
          className={react17Flag ? "main-icon active" : "main-icon"}
          onClick={() => handleFlag("react17")}
        />
      </NavLink>
      <div className="sub-menu" style={{display: react17Flag ? "block" : "none"}}>
        {subMap.react17.map((item) => (
          <NavLink to={`/react17-sub/${item}`} key={item} className={({ isActive }) => (isActive ? "active" : "inactive")}>
            {item}
          </NavLink>
        ))}
      </div>
      <NavLink to="/vue2" className={({ isActive }) => (isActive ? "active" : "inactive")}>
        vue2
        <CaretUpOutlined className={vue2Flag ? "main-icon active" : "main-icon"} onClick={() => handleFlag("vue2")} />
      </NavLink>
      <div className="sub-menu" style={{display: vue2Flag ? "block" : "none"}}>
        {subMap.vue2.map((item) => (
          <NavLink to={`/vue2-sub/${item}`} key={item} className={({ isActive }) => (isActive ? "active" : "inactive")}>
            {item}
          </NavLink>
        ))}
      </div>
      <NavLink to="/vue3" className={({ isActive }) => (isActive ? "active" : "inactive")}>
        vue3<span className="alive">保活</span>
        <CaretUpOutlined className={vue3Flag ? "main-icon active" : "main-icon"} onClick={() => handleFlag("vue3")} />
      </NavLink>
      <div className="sub-menu" style={{display: vue3Flag ? "block" : "none"}}>
        {subMap.vue3.map((item) => (
          <NavLink to={`/vue3-sub/${item}`} key={item} className={({ isActive }) => (isActive ? "active" : "inactive")}>
            {item}
          </NavLink>
        ))}
      </div>
      <NavLink to="/vite" className={({ isActive }) => (isActive ? "active" : "inactive")}>
        vite
        <CaretUpOutlined className={viteFlag ? "main-icon active" : "main-icon"} onClick={() => handleFlag("vite")} />
      </NavLink>
      <div className="sub-menu" style={{display: viteFlag ? "block" : "none"}}>
        {subMap.vite.map((item) => (
          <NavLink to={`/vite-sub/${item}`} key={item} className={({ isActive }) => (isActive ? "active" : "inactive")}>
            {item}
          </NavLink>
        ))}
      </div>
      <NavLink to="/angular12" className={({ isActive }) => (isActive ? "active" : "inactive")}>
        angular12
      </NavLink>
      <NavLink to="/all" className={({ isActive }) => (isActive ? "active" : "inactive")}>
        all
      </NavLink>
      <Button type="primary" className="menu-icon" icon={<UnorderedListOutlined />}></Button>
    </nav>
  );
}

class App extends React.PureComponent {
  state = {
    active: false,
  };
  changeActive = (val) => {
    this.setState({ active: val });
  };
  render() {
    return (
      <div className="app">
        <Router>
          <div className={this.state.active ? "nav active" : "nav"}>
            <Nav />
          </div>
          <div className="content" onClick={() => this.changeActive(false)}>
            <Routes>
              <Route exact path="/home" element={<Home changeActive={this.changeActive} />} />
              <Route exact path="/react16" element={<React16 />} />
              <Route exact path="/react16-sub/:path" element={<React16 />} />
              <Route exact path="/react17" element={<React17 />} />
              <Route exact path="/react17-sub/:path" element={<React17 />} />
              <Route exact path="/vue2" element={<Vue2 />} />
              <Route exact path="/vue2-sub/:path" element={<Vue2 />} />
              <Route exact path="/vue3" element={<Vue3 />} />
              <Route exact path="/vue3-sub/:path" element={<Vue3 />} />
              <Route exact path="/vite" element={<Vite />} />
              <Route exact path="/vite-sub/:path" element={<Vite />} />
              <Route exact path="/angular12" element={<Angular12 />} />
              <Route exact path="/all" element={<All />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </div>
        </Router>
      </div>
    );
  }
}

export default App;
