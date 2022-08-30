import React from "react";
import Switch from "antd/es/switch";
import Tooltip from "antd/es/tooltip";
import Button from "antd/es/button";
import { UnorderedListOutlined } from "@ant-design/icons";

export default class Home extends React.Component {
  state = {
    checkState: window.localStorage.getItem("preload") !== "false",
    disable: !window.Proxy || !window.CustomElementRegistry,
    degradeState: window.localStorage.getItem("degrade") === "true" || !window.Proxy || !window.CustomElementRegistry,
  };
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
    return (
      <div className="home">
        <div className="tool">
          <Button
            type="primary"
            style={{ visibility: "hidden" }}
            icon={<UnorderedListOutlined />}
          ></Button>
          <div className="button-list">
            <Tooltip title="主动降级，去除shadow+proxy">
              <Switch
                className="switch button-gap"
                checkedChildren="降级开"
                unCheckedChildren="降级关"
                disabled={this.state.disable}
                defaultChecked={this.state.degradeState}
                onChange={this.degradeStateChange}
              ></Switch>
            </Tooltip>
            <Tooltip title="预加载+预执行">
              <Switch
                className="switch button-gap"
                checkedChildren="预加载开"
                unCheckedChildren="预加载关"
                defaultChecked={this.state.checkState}
                onChange={this.checkStateChange}
              ></Switch>
            </Tooltip>
            <Tooltip title="主应用为history模式">
              <a
                href="https://wujie-micro.github.io/demo-main-vue/"
                target="_blank"
                className="docs button-gap"
                rel="noreferrer"
              >
                vue主应用
              </a>
            </Tooltip>
            <a href="https://github.com/Tencent/wujie" target="_blank" className="docs button-gap" rel="noreferrer">
              仓库
            </a>
            <a href="https://wujie-micro.github.io/doc/" target="_blank" className="docs button-gap" rel="noreferrer">
              文档
            </a>
          </div>
        </div>
        <h1 className="header">
          <img
            alt="图片"
            style={{ width: "70px", height: "70px", marginRight: "15px" }}
            src="https://vfiles.gtimg.cn/wuji_dashboard/xy/test_wuji_damy/XC5WMbxE.svg"
          />
          <span className="bland">无界</span>
        </h1>
        <h2 className="subtitle">—极致的微前端框架</h2>

        <div className="detail-content">
          <div className="item">
            <div className="title">极速 🚀</div>
            <div className="detail">
              <ul>
                <li>极致预加载提速</li>
                <li>应用秒开无白屏</li>
                <li>应用丝滑般切换</li>
              </ul>
            </div>
          </div>
          <div className="item">
            <div className="title">强大 💪</div>
            <div className="detail">
              <ul>
                <li>多应用同时激活在线</li>
                <li>应用级别保活</li>
                <li>去中心化的通信</li>
              </ul>
            </div>
          </div>
          <div className="item">
            <div className="title">简单 🤞</div>
            <div className="detail">
              <ul>
                <li>更小的体积</li>
                <li>精简的API</li>
                <li>开箱即用</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
