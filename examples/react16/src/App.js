import React, { useEffect } from "react";
import { NavLink, Route, Switch, Redirect, useLocation } from "react-router-dom";
import ConfigProvider from "antd/es/config-provider";
import zhCN from "antd/es/locale/zh_CN";
import enUS from "antd/es/locale/en_US";
import Dialog from "./Dialog";
import Location from "./Location";
import Communication from "./Communication";
import React17 from "./nest";
import Font from "./Font";
import logo from "./logo.svg";
import Tag from "antd/es/tag";
import Button from "antd/es/button";
import { setLang, syncLangFromHost, useI18n } from "./i18n";
import "antd/es/tag/style/css";
import "antd/es/button/style/css";
import "antd/es/modal/style/css";
import "antd/es/select/style/css";
import "antd/es/popover/style/css";

const Home = () => {
  const { t } = useI18n();
  return (
    <div>
      <h2 className="css-before-flag">{t("home.title")}</h2>
      <p>
        {t("home.reactVersion")}{" "}
        <Tag style={{ verticalAlign: "text-top" }} color="blue">
          16.13.1
        </Tag>
      </p>
      <p>
        {t("home.antdVersion")}{" "}
        <Tag style={{ verticalAlign: "text-top" }} color="geekblue">
          4.18.3
        </Tag>
      </p>
      <p>
        <Button onClick={() => window.open("https://github.com/Tencent/wujie/tree/master/examples/react16")}>
          {t("home.repo")}
        </Button>
      </p>
    </div>
  );
};

export default function App() {
  const { lang, t } = useI18n();
  // 在 react16-sub 路由下主动告知主应用路由跳转，主应用也跳到相应路由高亮菜单栏
  const location = useLocation();
  useEffect(() => {
    window.$wujie?.bus.$emit("sub-route-change", "react16", location.pathname);
  }, [location]);

  useEffect(() => {
    syncLangFromHost();
    const handleLangChange = (nextLang) => setLang(nextLang);
    window.$wujie?.bus.$on("lang-change", handleLangChange);
    return () => {
      window.$wujie?.bus.$off("lang-change", handleLangChange);
    };
  }, []);

  return (
    <ConfigProvider locale={lang === "en" ? enUS : zhCN}>
      <div>
        <nav>
          <NavLink to="/home">{t("nav.home")}</NavLink> | <NavLink to="/dialog">{t("nav.dialog")}</NavLink> |{" "}
          <NavLink to="/location">{t("nav.location")}</NavLink> |{" "}
          <NavLink to="/communication">{t("nav.communication")}</NavLink> |{" "}
          <NavLink to="/nest">{t("nav.nest")}</NavLink> | <NavLink to="/font">{t("nav.font")}</NavLink>
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
    </ConfigProvider>
  );
}
