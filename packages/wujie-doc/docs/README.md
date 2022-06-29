---
home: true
heroImage: /wujie.svg
actionText: 快速上手 →
actionLink: /guide/start
features:
  - title: 极速 🚀
    details: 极致预加载提速，页面秒开无白屏，应用丝滑般切换
  - title: 强大 💪
    details: 多应用可以在一个页面同时激活在线、保活、并行运行、互联互通
  - title: 简单 🤞
    details: 更小的体积，精简的API，极低的改造成本，开箱即用
footer: Copyright © 2021-present yiludege
---

```javascript
import { bus, preloadApp, startApp, destroyAPP } from "wujie";

preloadApp({ name: "唯一id", url: "子应用路径", exec: true });

startApp({ name: "唯一id", url: "子应用路径", el: "容器", sync: true });

bus.$on("事件名字", function(){});

bus.$emit("事件名字", arg1, arg2, ...);

bus.$off("事件名字", function(){});

destroyApp("唯一id");
```
