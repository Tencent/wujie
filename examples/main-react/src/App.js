import { HashRouter as Router, Route, Routes, NavLink, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import React16 from "./pages/React16";
import React17 from "./pages/React17";
import Vue2 from "./pages/Vue2";
import Vue3 from "./pages/Vue3";
import Vite from "./pages/Vite";
import Angular12 from "./pages/Angular12";
import All from "./pages/All";

function App() {
  return (
    <div className="app">
      <Router>
        <div className="nav">
          <nav>
            <NavLink to="/home" className={({ isActive }) => (isActive ? "active" : "inactive")}>
              介绍
            </NavLink>
            <NavLink to="/react16" className={({ isActive }) => (isActive ? "active" : "inactive")}>
              react16
            </NavLink>
            <NavLink to="/react17" className={({ isActive }) => (isActive ? "active" : "inactive")}>
              react17<span className="alive">保活</span>
            </NavLink>
            <NavLink to="/vue2" className={({ isActive }) => (isActive ? "active" : "inactive")}>
              vue2
            </NavLink>
            <NavLink to="/vue3" className={({ isActive }) => (isActive ? "active" : "inactive")}>
              vue3<span className="alive">保活</span>
            </NavLink>
            <NavLink to="/vite" className={({ isActive }) => (isActive ? "active" : "inactive")}>
              vite
            </NavLink>
            <NavLink to="/angular12" className={({ isActive }) => (isActive ? "active" : "inactive")}>
              angular12
            </NavLink>
            <NavLink to="/all" className={({ isActive }) => (isActive ? "active" : "inactive")}>
              all
            </NavLink>
          </nav>
        </div>
        <div className="content">
          <Routes>
            <Route exact path="/home" element={<Home />} />
            <Route exact path="/react16" element={<React16 />} />
            <Route exact path="/react17" element={<React17 />} />
            <Route exact path="/vue2" element={<Vue2 />} />
            <Route exact path="/vue3" element={<Vue3 />} />
            <Route exact path="/vite" element={<Vite />} />
            <Route exact path="/angular12" element={<Angular12 />} />
            <Route exact path="/all" element={<All />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
