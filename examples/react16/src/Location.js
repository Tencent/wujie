import React from "react";
import Button from "antd/es/button";

export default class Location extends React.Component {
  handleClick() {
    if (window.__WUJIE?.degrade || !window.Proxy || !window.CustomElementRegistry) {
      window.$wujie.location.href = "https://v2.vuejs.org/";
    } else window.location.href = "https://wujicode.cn/xy/app/prod/official/index";
  }
  componentDidMount() {
    console.log("react16 location mounted")
  }

  render() {
    return (
      <div>
        <h2>路由处理</h2>
        <div className="content">
          <h3>1、路由同步</h3>
          <p>路由同步意味着浏览器的刷新、前进、后退都可以作用到子应用上</p>
          <p>子应用同步路由到主应用url的query参数上且 key值为子应用的name</p>
          <h3>2、location劫持</h3>
          <p>当用户访问location来获取当前的url时，wujie统一拦截并回填子应用正确的地址</p>
          <h3>3、获取window.location.host的值</h3>
          <p>{window.location.host}</p>
          <h3>4、修改window.location.href</h3>
          <div className="p">
            <Button type="warning" onClick={this.handleClick}>
              跳转无极
            </Button>
            <p>子应用修改location.href，会将当前的子应用的shadow删除并且替换成一个iframe</p>
            <p>如果子应用配置路由同步，浏览器可通过回退回到子应用</p>
          </div>
        </div>
      </div>
    );
  }
}
