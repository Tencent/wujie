import React from "react";
import ReactDOM from "react-dom";
import { bindReactRuntime, preFetchLib } from 'hel-micro';

bindReactRuntime({ React, ReactDOM });

(async function () {
  await preFetchLib('hel-lodash'); // 预加载 hel-lodash，方便其他地方可以静态导入 hel-lodash
  await import('./loadApp');
})().catch(console.error);
