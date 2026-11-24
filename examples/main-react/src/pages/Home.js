import React from "react";
import Switch from "antd/es/switch";
import Tooltip from "antd/es/tooltip";
import Button from "antd/es/button";
import { UnorderedListOutlined } from "@ant-design/icons";
import { getLang, subscribeLang, t, toggleLang } from "../i18n";

export default class Home extends React.Component {
  state = {
    lang: getLang(),
    checkState: window.localStorage.getItem("preload") !== "false",
    disable: !window.Proxy || !window.CustomElementRegistry,
    degradeState: window.localStorage.getItem("degrade") === "true" || !window.Proxy || !window.CustomElementRegistry,
  };
  componentDidMount() {
    this.unsubLang = subscribeLang((lang) => this.setState({ lang }));
  }
  componentWillUnmount() {
    if (this.unsubLang) this.unsubLang();
  }
  checkStateChange = (check) => {
    window.localStorage.setItem("preload", check);
    setTimeout(() => window.location.reload(), 1000);
  };
  degradeStateChange = (check) => {
    window.localStorage.setItem("degrade", check);
    setTimeout(() => window.location.reload(), 1000);
  };
  handleClick = (e) => {
    this.props.changeActive(true);
    e.stopPropagation();
  };

  render() {
    const { lang } = this.state;
    const docsUrl = lang === "en" ? "https://wujie-micro.github.io/doc/en/" : "https://wujie-micro.github.io/doc/";
    const vueMainUrl =
      lang === "en"
        ? "https://wujie-micro.github.io/demo-main-vue/home?lang=en"
        : "https://wujie-micro.github.io/demo-main-vue/home?lang=zh";

    return (
      <div className="home">
        <div className="tool">
          <Button type="primary" style={{ visibility: "hidden" }} icon={<UnorderedListOutlined />}></Button>
          <div className="button-list">
            <Tooltip title={t("home.degradeTip", lang)}>
              <Switch
                className="switch button-gap"
                checkedChildren={t("home.degradeOn", lang)}
                unCheckedChildren={t("home.degradeOff", lang)}
                disabled={this.state.disable}
                defaultChecked={this.state.degradeState}
                onChange={this.degradeStateChange}
              ></Switch>
            </Tooltip>
            <Tooltip title={t("home.preloadTip", lang)}>
              <Switch
                className="switch button-gap"
                checkedChildren={t("home.preloadOn", lang)}
                unCheckedChildren={t("home.preloadOff", lang)}
                defaultChecked={this.state.checkState}
                onChange={this.checkStateChange}
              ></Switch>
            </Tooltip>
            <Tooltip title={t("home.vueMainTip", lang)}>
              <a href={vueMainUrl} target="_blank" className="docs button-gap" rel="noreferrer">
                {t("home.vueMain", lang)}
              </a>
            </Tooltip>
            <a href="https://github.com/Tencent/wujie" target="_blank" className="docs button-gap" rel="noreferrer">
              {t("home.repo", lang)}
            </a>
            <a href={docsUrl} target="_blank" className="docs button-gap" rel="noreferrer">
              {t("home.docs", lang)}
            </a>
            <button type="button" className="docs button-gap" onClick={toggleLang}>
              {lang === "en" ? "中文" : "EN"}
            </button>
          </div>
        </div>
        <h1 className="header">
          <img
            alt="Wujie"
            style={{ width: "70px", height: "70px", marginRight: "15px" }}
            src="https://vfiles.gtimg.cn/wuji_dashboard/xy/test_wuji_damy/XC5WMbxE.svg"
          />
          <span className="bland">{t("home.brand", lang)}</span>
        </h1>
        <h2 className="subtitle">{t("home.subtitle", lang)}</h2>

        <div className="detail-content">
          <div className="item">
            <div className="title">{t("home.fastTitle", lang)}</div>
            <div className="detail">
              <ul>
                <li>{t("home.fast1", lang)}</li>
                <li>{t("home.fast2", lang)}</li>
                <li>{t("home.fast3", lang)}</li>
              </ul>
            </div>
          </div>
          <div className="item">
            <div className="title">{t("home.powerTitle", lang)}</div>
            <div className="detail">
              <ul>
                <li>{t("home.power1", lang)}</li>
                <li>{t("home.power2", lang)}</li>
                <li>{t("home.power3", lang)}</li>
              </ul>
            </div>
          </div>
          <div className="item">
            <div className="title">{t("home.simpleTitle", lang)}</div>
            <div className="detail">
              <ul>
                <li>{t("home.simple1", lang)}</li>
                <li>{t("home.simple2", lang)}</li>
                <li>{t("home.simple3", lang)}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
