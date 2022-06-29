import React from "react";
import Button from "antd/es/button";

export default class Communication extends React.Component {
  jump = () => {
    window.$wujie && window.$wujie.props.jump("vue3");
  };

  handleAlert = () => {
    window.parent && window.parent.alert("主应用alert");
  };

  handleEmit = () => {
    window.$wujie && window.$wujie.bus.$emit("click", "react17");
  };
  render() {
    return (
      <div>
        <h2>通信处理</h2>
        <div className="content">
          <p>应用可以有三种方式进行通信</p>
          <h3>1、主应用通过 props 属性注入的方法</h3>
          <p>主应用通过 props 注入 jump（跳转页面）方法，子应用通过 $wujie.props.jump(xxx) 来使用</p>
          <p>
            <Button onClick={this.jump}>点击跳转vue3</Button>
            <Button className="app-jump" onClick={() => window?.$wujie.props.jump("angular12")}>
              跳转angular
            </Button>
          </p>
          <h3>2、通过 window.parent 方法拿到主应用的全局方法</h3>
          <p>子应用调用 window.parent.alert 来调用主应用的 alert方法</p>
          <p>
            <Button onClick={this.handleAlert}>显示alert</Button>
          </p>
          <h3>3、通过 bus 方法发送去中心化的事件</h3>
          <p>主应用 bus.$on("click", (msg) ={">"} window.alert(msg)) 监听子应用的 click 事件</p>
          <p>子应用点击按钮 $wujie.bus.$emit('click', 'react17') 发送 click 事件</p>
          <p>
            <Button onClick={this.handleEmit}>显示alert</Button>
          </p>
        </div>
      </div>
    );
  }
}
