import React from "react";
import Button from "antd/es/button";
import "antd/es/button/style/css";
import { getLang, subscribeLang, t } from "./i18n";

export default class Location extends React.Component {
  state = { count: 10, lang: getLang() };
  handleClick() {
    window.location.href = "https://wujicode.cn/xy/app/prod/official/index";
  }

  componentDidMount() {
    console.log("react17 state mounted");
    this.unsubLang = subscribeLang((lang) => this.setState({ lang }));
  }

  componentWillUnmount() {
    if (this.unsubLang) this.unsubLang();
  }

  render() {
    const { lang } = this.state;
    return (
      <div>
        <h2>{t("state.title", lang)}</h2>
        <div className="content">
          <p>{t("state.intro", lang)}</p>
          <h3>{t("state.step1", lang)}</h3>
          <p className="number-content">
            <Button onClick={() => this.setState((state) => ({ count: state.count - 1 }))}>-</Button>
            <span className="number">{this.state.count}</span>
            <Button onClick={() => this.setState((state) => ({ count: state.count + 1 }))}>+</Button>
            <Button
              className="app-jump"
              onClick={() => {
                window?.$wujie.bus.$emit("add");
                window?.$wujie.props.jump("vue3");
              }}
            >
              {t("state.jumpVue3", lang)}
            </Button>
          </p>
        </div>
      </div>
    );
  }
}
