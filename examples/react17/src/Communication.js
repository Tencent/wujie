import React from "react";
import Button from "antd/es/button";
import { getLang, subscribeLang, t } from "./i18n";

export default class Communication extends React.Component {
  state = { lang: getLang() };

  componentDidMount() {
    this.unsubLang = subscribeLang((lang) => this.setState({ lang }));
  }

  componentWillUnmount() {
    if (this.unsubLang) this.unsubLang();
  }

  jump = () => {
    window.$wujie && window.$wujie.props.jump("vue3");
  };

  handleAlert = () => {
    window.parent && window.parent.alert(t("comm.mainAlertMsg", this.state.lang));
  };

  handleEmit = () => {
    window.$wujie && window.$wujie.bus.$emit("click", "react17");
  };

  render() {
    const { lang } = this.state;
    return (
      <div>
        <h2>{t("comm.title", lang)}</h2>
        <div className="content">
          <p>{t("comm.intro", lang)}</p>
          <h3>{t("comm.step1Title", lang)}</h3>
          <p>{t("comm.step1Desc", lang)}</p>
          <p>
            <Button onClick={this.jump}>{t("comm.jumpVue3", lang)}</Button>
            <Button className="app-jump" onClick={() => window?.$wujie.props.jump("angular12")}>
              {t("comm.jumpAngular", lang)}
            </Button>
          </p>
          <h3>{t("comm.step2Title", lang)}</h3>
          <p>{t("comm.step2Desc", lang)}</p>
          <p>
            <Button onClick={this.handleAlert}>{t("comm.showAlert", lang)}</Button>
          </p>
          <h3>{t("comm.step3Title", lang)}</h3>
          <p>{t("comm.step3Desc1", lang)}</p>
          <p>{t("comm.step3Desc2", lang)}</p>
          <p>
            <Button onClick={this.handleEmit}>{t("comm.showAlert", lang)}</Button>
          </p>
        </div>
      </div>
    );
  }
}
