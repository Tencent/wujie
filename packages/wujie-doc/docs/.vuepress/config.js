module.exports = {
  title: "无界",
  description: "极致的微前端框架",
  base: process.env.NODE_ENV === "production" ? "/doc/" : "",
  head: [
    ["link", { rel: "icon", href: "/favicon.ico" }],
    ["link", { rel: "stylesheet", href: "/index.css" }],
  ],
  themeConfig: {
    nav: [
      { text: "指南", link: "/guide/" },
      { text: "API", link: "/api/bus.html" },
      { text: "常见问题", link: "/question/" },
      { text: "框架封装", link: "/pack/" },
      { text: "vue主应用", link: "https://wujie-micro.github.io/demo-main-vue/" },
      { text: "react主应用", link: "https://wujie-micro.github.io/demo-main-react/" },
      { text: "更新日志", link: "https://github.com/Tencent/wujie/blob/master/CHANGELOG.md" },
      { text: "git", link: "https://github.com/Tencent/wujie" },
    ],
    sidebar: {
      "/guide/": [
        ["", "介绍"],
        ["start", "快速上手"],
        ["preload", "预加载"],
        ["mode", "运行模式"],
        ["sync", "路由同步"],
        ["jump", "路由跳转"],
        ["lifecycle", "生命周期"],
        ["communication", "通信系统"],
        ["plugin", "插件系统"],
        ["degrade", "降级处理"],
        ["nest", "应用嵌套"],
        ["share", "应用共享"],
        ["variable", "全局变量"],
        // ["information", "资料"],
      ],
      "/api/": [
        {
          title: '主应用',
          collapsable: false,
          sidebarDepth: 2,
          children: [
            'bus.md',
            'startApp.md',
            'preloadApp.md',
            'destroyApp.md'
          ]
        },
        ["subapp", "子应用"],
      ],
      "/question/": [["", "常见问题"]],
      "/pack/": [
        ["", "vue封装"],
        ["react", "react封装"],
      ],
    },
  },
  plugins: ['@bidoubiwa/vuepress-plugin-element-tabs'],
};
