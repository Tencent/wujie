import React from "react";
import { IconFont } from "tdesign-icons-react";

export default class Font extends React.Component {
  componentDidMount() {
    console.log("react16 font mounted");
  }
  render() {
    return (
      <div>
        <h2>字体处理</h2>
        <div className="content">
          <h3>背景</h3>
          <p>
            子应用的 dom 挂载在 Web Component 的 shadowRoot 内，
            <a href="https://github.com/mdn/interactive-examples/issues/887" target="_blank" rel="noreferrer">
              shadowRoot 内部的字体文件不会加载
            </a>
          </p>
          <h3>解决</h3>
          <p>
            框架加载子应用时将自定义字体样式提取到 shadowRoot 的外部，注意主应用和子应用的 @font-face 的 font-family
            不要重名，否则会有字体覆盖的问题。
          </p>
          <h3>IconFont 图标示例</h3>
          <p>TDesign icon</p>
          <p>
            <IconFont name="loading" size="2em" />
            <IconFont name="close" size="2em" />
            <IconFont name="check-circle-filled" size="2em" />
          </p>
          <h3>相对地址</h3>
          <p>框架会将子应用的 css 文件中的相对地址换成绝对地址</p>
          <p>比如 TDesign icon 的 css 文件地址为: </p>
          <p> https://tdesign.gtimg.com/icon/0.1.1/fonts/index.css</p>
          <p>index.css 文件中 @font-face 中 url('./t.woff') 最终转换为:</p>
          <p> https://tdesign.gtimg.com/icon/0.1.1/fonts/t.woff</p>
        </div>
      </div>
    );
  }
}
