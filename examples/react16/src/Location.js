import React from "react";
import Button from "antd/es/button";
import { getLang, subscribeLang, t } from "./i18n";

export default class Location extends React.Component {
  state = { lang: getLang() };

  handleClick() {
    if (window.__WUJIE?.degrade || !window.Proxy || !window.CustomElementRegistry) {
      window.$wujie.location.href = "https://v2.vuejs.org/";
    } else window.location.href = "https://wujicode.cn/xy/app/prod/official/index";
  }

  componentDidMount() {
    console.log("react16 location mounted");
    this.unsubLang = subscribeLang((lang) => this.setState({ lang }));
  }

  componentWillUnmount() {
    if (this.unsubLang) this.unsubLang();
  }

  render() {
    const { lang } = this.state;
    return (
      <div>
        <h2>{t("loc.title", lang)}</h2>
        <div className="content">
          <h3>{t("loc.step1", lang)}</h3>
          <p>{t("loc.step1Desc1", lang)}</p>
          <p>{t("loc.step1Desc2", lang)}</p>
          <h3>{t("loc.step2", lang)}</h3>
          <p>{t("loc.step2Desc", lang)}</p>
          <h3>{t("loc.step3", lang)}</h3>
          <p>{window.location.host}</p>
          <h3>{t("loc.step4", lang)}</h3>
          <div className="p">
            <Button type="warning" onClick={this.handleClick}>
              {t("loc.jumpWuji", lang)}
            </Button>
            <p>{t("loc.step4Desc1", lang)}</p>
            <p>{t("loc.step4Desc2", lang)}</p>
          </div>
        </div>
      </div>
    );
  }
}
