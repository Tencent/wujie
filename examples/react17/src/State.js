import React from "react";
import Button from "antd/es/button";
import "antd/es/button/style/css";

export default class Location extends React.Component {
  state = { count: 10 };
  handleClick() {
    window.location.href = "https://wujicode.cn/xy/app/prod/official/index";
  }

  componentDidMount() {
    console.log("react17 state mounted")
  }

  render() {
    return (
      <div>
        <h2>子应用保活</h2>
        <div className="content">
          <p>设置保活模式，切换应用时，子应用的路由和state都可以得到保留</p>
          <h3>1、改动实例的状态，切换到vue，点击按钮再回来看看</h3>
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
              vue3 state+1 跳回
            </Button>
          </p>
        </div>
      </div>
    );
  }
}
