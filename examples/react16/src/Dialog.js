import React from "react";
import Button from "antd/es/button";
import Modal from "antd/es/modal";
import Select from "antd/es/select";
import Popover from "antd/es/popover";
import { getLang, subscribeLang, t } from "./i18n";

const Option = Select.Option;

export default class Dialog extends React.Component {
  state = { visible: false, lang: getLang() };

  showModal = () => {
    this.setState({
      visible: true,
    });
  };

  handleOk = () => {
    this.setState({
      visible: false,
    });
  };

  componentDidMount() {
    console.log("react16 dialog mounted");
    this.unsubLang = subscribeLang((lang) => this.setState({ lang }));
  }

  componentWillUnmount() {
    if (this.unsubLang) this.unsubLang();
  }

  handleCancel = () => {
    this.setState({
      visible: false,
    });
  };
  render() {
    const { lang } = this.state;
    const content = (
      <div>
        <div>Content</div>
        <div>Content</div>
      </div>
    );
    const modalInnerContent = (
      <div>
        <div>{t("dialog.innerPopoverContent", lang)}</div>
        <div>Content</div>
      </div>
    );
    const scrollSpacer = <div style={{ height: 520 }} aria-hidden="true" />;
    const modalScrollBodyStyle = { maxHeight: "60vh", overflow: "auto", paddingRight: 8 };
    return (
      <div>
        <h2 className="css-after-flag">{t("dialog.title", lang)}</h2>
        <div className="content">
          <p>{t("dialog.intro", lang)}</p>
          <h3>{t("dialog.step1", lang)}</h3>
          <p>
            <Button onClick={this.showModal}>Open Modal</Button>
          </p>
          <Modal title="Basic Modal" visible={this.state.visible} onOk={this.handleOk} onCancel={this.handleCancel} width={760}>
            <div style={modalScrollBodyStyle}>
              <h4>{t("dialog.innerSelectTitle", lang)}</h4>
              <div className="p">
                <Select
                  showSearch
                  style={{ width: 200 }}
                  placeholder={t("dialog.innerSelectPlaceholder", lang)}
                  optionFilterProp="children"
                  filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                >
                  <Option value="jack">Jack</Option>
                  <Option value="lucy">Lucy</Option>
                  <Option value="tom">Tom</Option>
                </Select>
              </div>
              <h4>{t("dialog.innerPopoverHeading", lang)}</h4>
              <div className="p">
                <Popover content={modalInnerContent} title={t("dialog.innerPopoverTitle", lang)} trigger="hover">
                  <Button>{t("dialog.innerPopoverBtn", lang)}</Button>
                </Popover>
              </div>
              {scrollSpacer}
            </div>
          </Modal>
          <h3>{t("dialog.step2", lang)}</h3>
          <div className="p">
            <Select
              showSearch
              style={{ width: 200 }}
              placeholder="Select a person"
              optionFilterProp="children"
              filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
            >
              <Option value="jack">Jack</Option>
              <Option value="lucy">Lucy</Option>
              <Option value="tom">Tom</Option>
            </Select>
          </div>
          <h3>{t("dialog.step3", lang)}</h3>
          <div className="p">
            <Popover content={content} title="Title" trigger="hover">
              <Button>Hover me</Button>
            </Popover>
          </div>
          {scrollSpacer}
        </div>
      </div>
    );
  }
}
