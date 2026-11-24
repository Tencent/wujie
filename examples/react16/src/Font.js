import React from "react";
import { IconFont } from "tdesign-icons-react";
import { getLang, subscribeLang, t } from "./i18n";

export default class Font extends React.Component {
  state = { lang: getLang() };

  componentDidMount() {
    console.log("react16 font mounted");
    this.unsubLang = subscribeLang((lang) => this.setState({ lang }));
  }

  componentWillUnmount() {
    if (this.unsubLang) this.unsubLang();
  }

  render() {
    const { lang } = this.state;
    return (
      <div>
        <h2>{t("font.title", lang)}</h2>
        <div className="content">
          <h3>{t("font.bgTitle", lang)}</h3>
          <p>
            {t("font.bgText", lang)}
            <a href="https://github.com/mdn/interactive-examples/issues/887" target="_blank" rel="noreferrer">
              {t("font.bgLink", lang)}
            </a>
          </p>
          <h3>{t("font.solutionTitle", lang)}</h3>
          <p>{t("font.solutionDesc", lang)}</p>
          <h3>{t("font.iconTitle", lang)}</h3>
          <p>TDesign icon</p>
          <p>
            <IconFont name="loading" size="2em" />
            <IconFont name="close" size="2em" />
            <IconFont name="check-circle-filled" size="2em" />
          </p>
          <h3>{t("font.relativeTitle", lang)}</h3>
          <p>{t("font.relativeDesc1", lang)}</p>
          <p>{t("font.relativeDesc2", lang)}</p>
          <p> https://tdesign.gtimg.com/icon/0.1.1/fonts/index.css</p>
          <p>{t("font.relativeDesc3", lang)}</p>
          <p> https://tdesign.gtimg.com/icon/0.1.1/fonts/t.woff</p>
        </div>
      </div>
    );
  }
}
