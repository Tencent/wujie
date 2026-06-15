const plugins = [
  {
    htmlLoader: (code) => {
      console.log("html-loader");
      return code;
    },
    jsBeforeLoaders: [
      {
        callback(appWindow) {
          console.log("js-before-loader-callback", appWindow.__WUJIE.id);
        },
      },
    ],
    jsLoader: (code, url) => {
      console.log("js-loader", url);
      return code;
    },
    jsAfterLoaders: [
      {
        callback(appWindow) {
          console.log("js-after-loader-callback", appWindow.__WUJIE.id);
        },
      },
    ],
    cssBeforeLoaders: [
      //在加载html所有的样式之前添加一个外联样式
      { src: "https://vfiles.gtimg.cn/wuji_dashboard/xy/test_wuji_damy/HDaBURp7.css" },
      //在加载html所有的样式之前添加一个内联样式
      { content: "img{width: 300px}" },
    ],
    cssLoader: (code, url) => {
      console.log("css-loader", url, code.slice(0, 50) + "...");
      return code;
    },
    cssAfterLoaders: [
      //在加载html所有样式之后添加一个外联样式
      { src: "https://vfiles.gtimg.cn/wuji_dashboard/xy/test_wuji_damy/FQsK8IN6.css" },
      //在加载html所有样式之后添加一个内联样式
      { content: "img{height: 300px}" },
    ],
  },
];

export default plugins;
