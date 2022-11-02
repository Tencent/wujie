import React from "react";
import m from 'hel-lodash';

export default function RemoteComp() {
  const [tip, setTip] = React.useState('');
  const changeTip = () => {
    setTip(`${m.myUtils.myMod.sayHelloToHel()}_${Date.now()}`);
  };


  return <div>
    <h1>这是一个预加载的远程方法调用示例:</h1>
    <h2>lodash version is: {m.VERSION}</h2>
    <h2>tip is: {tip}</h2>
    <button onClick={changeTip} style={{ color: "red", fontSize: "28px" }}>
      click me to see changed result{" "}
    </button>
  </div>;
}
