import * as React from "react";
import Button from "antd/es/button";

export default function Iframe() {
  const sendPostMessage = () => {
    window.parent.postMessage(
      {
        type: "react16",
        msg: "react16  向父级窗口发送消息L: " + new Date().getTime(),
      },
      "*"
    );
  };

  return (
    <div>
      Iframe测试
      <p>
        <Button onClick={sendPostMessage}>react 16 发送消息给上一级应用</Button>
      </p>
    </div>
  );
}
