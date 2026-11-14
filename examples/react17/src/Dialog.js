import React from "react";
import Button from "antd/es/button";
import Modal from "antd/es/modal";
import Select from "antd/es/select";
import Popover from "antd/es/popover";

const Option = Select.Option;

export default class Dialog extends React.Component {
  state = { visible: false };

  showModal = () => {
    this.setState({
      visible: true,
    });
  };

  handleOk = (e) => {
    this.setState({
      visible: false,
    });
  };

  handleCancel = (e) => {
    this.setState({
      visible: false,
    });
  };

  componentDidMount() {
    console.log("react17 dialog mounted")
  }

  render() {
    const content = (
      <div>
        <div>Content</div>
        <div>Content</div>
      </div>
    );
    const modalInnerContent = (
      <div>
        <div>Content（弹窗内）</div>
        <div>Content</div>
      </div>
    );
    const scrollSpacer = <div style={{ height: 520 }} aria-hidden="true" />;
    const modalScrollBodyStyle = { maxHeight: "60vh", overflow: "auto", paddingRight: 8 };
    return (
      <div>
        <h2>弹窗处理</h2>
        <div className="content">
          <p>弹窗无需子应用做任何处理就可使用</p>
          <h3>1、打开antd弹窗</h3>
          <p>
            <Button onClick={this.showModal}>Open Modal</Button>
          </p>
          <Modal title="Basic Modal" visible={this.state.visible} onOk={this.handleOk} onCancel={this.handleCancel} width={760}>
            <div style={modalScrollBodyStyle}>
              <h4>弹窗内：antd 选择器</h4>
              <div className="p">
                <Select
                  showSearch
                  style={{ width: 200 }}
                  placeholder="Select a person（弹窗内）"
                  optionFilterProp="children"
                  filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                >
                  <Option value="jack">Jack</Option>
                  <Option value="lucy">Lucy</Option>
                  <Option value="tom">Tom</Option>
                </Select>
              </div>
              <h4>弹窗内：antd 气泡卡片</h4>
              <div className="p">
                <Popover content={modalInnerContent} title="Title（弹窗内）" trigger="hover">
                  <Button>Hover me（弹窗内）</Button>
                </Popover>
              </div>
              {scrollSpacer}
            </div>
          </Modal>
          <h3>2、打开antd选择器</h3>
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
          <h3>3、打开antd气泡卡片</h3>
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
