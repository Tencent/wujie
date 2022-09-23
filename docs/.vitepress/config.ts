import { defineConfig } from "vitepress";
import { version } from "../../packages/wujie-core/package.json";
import path from "path";
const ogDescription = "极致的微前端框架";
const ogImage = "https://wujie-micro.github.io/doc/wujie.png";
const ogTitle = "无界";
const ogUrl = "https://wujie-micro.github.io/doc/";
const base = process.env.NODE_ENV === "production" ? "/doc/" : "";

export default defineConfig({
  title: "无界",
  description: "极致的微前端框架",
  base,
  head: [
    ["link", { rel: "icon", href: `${base}/favicon.ico` }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:title", content: ogTitle }],
    ["meta", { property: "og:image", content: ogImage }],
    ["meta", { property: "og:url", content: ogUrl }],
  ],

  vue: {
    reactivityTransform: true,
  },
  lastUpdated: true,
  themeConfig: {
    logo: "/wujie.svg",
    editLink: {
      pattern: "https://github.com/Tencent/wujie/tree/master/docs/:path",
      text: "编辑本页",
    },
    lastUpdatedText: "最近更新时间",
    socialLinks: [{ icon: "github", link: "https://github.com/Tencent/wujie" }],
    // algolia: {
    //   appId: "",
    //   apiKey: "",
    //   indexName: "wujie",
    //   searchParameters: {
    //     facetFilters: ["tags:en"],
    //   },
    // },

    footer: {
      message: "Released the MIT License.",
    },

    nav: [
      { text: "指南", link: "/guide/", activeMatch: "/guide/" },
      {
        text: "API",
        link: "/api/bus",
        activeMatch: "/api/",
      },
      { text: "常见问题", link: "/question/", activeMatch: "/question/" },
      { text: "框架封装", link: "/pack/", activeMatch: "/pack/" },
      {
        text: `v${version}`,
        items: [
          {
            text: "更新日志",
            link: "https://github.com/Tencent/wujie/blob/master/CHANGELOG.md",
          },
        ],
      },
      {
        text: "示例",
        items: [
          {
            text: "Vue主应用",
            link: "https://wujie-micro.github.io/demo-main-vue/home",
          },
          {
            text: "React主应用",
            link: "https://wujie-micro.github.io/demo-main-react/",
          },
        ],
      },
      { text: "在线体验无界", link: "/wujie/", activeMatch: "/wujie/" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "入门",
          collapsible: true,
          items: [
            {
              text: "介绍",
              link: "/guide/",
            },
            {
              text: "快速上手",
              link: "/guide/start",
            },
            // {
            //   text: "定制Demo",
            //   link: "/guide/demo",
            // },
          ],
        },
        {
          text: "指南",
          collapsible: true,
          items: [
            {
              text: "预加载",
              link: "/guide/preload",
            },
            {
              text: "运行模式",
              link: "/guide/mode",
            },
            {
              text: "路由同步",
              link: "/guide/sync",
            },
            {
              text: "路由跳转",
              link: "/guide/jump",
            },
            {
              text: "生命周期",
              link: "/guide/lifecycle",
            },
            {
              text: "通信系统",
              link: "/guide/communication",
            },
            {
              text: "插件系统",
              link: "/guide/plugin",
            },
            {
              text: "降级处理",
              link: "/guide/degrade",
            },
            {
              text: "应用嵌套",
              link: "/guide/nest",
            },
            {
              text: "应用共享",
              link: "/guide/share",
            },
            {
              text: "全局变量",
              link: "/guide/variable",
            },
          ],
        },
        {
          text: "项目实战",
          collapsible: true,
          items: [
            {
              text: "vue主应用",
              link: "https://github.com/Tencent/wujie/tree/master/examples/main-vue",
            },
            {
              text: "react主应用",
              link: "https://github.com/Tencent/wujie/tree/master/examples/main-react",
            },
          ],
        },
      ],
      "/api/": [
        {
          text: "主应用",
          collapsible: true,
          items: [
            {
              text: "bus",
              link: "/api/bus",
            },
            {
              text: "setupApp",
              link: "/api/setupApp",
            },
            {
              text: "startApp",
              link: "/api/startApp",
            },
            {
              text: "preloadApp",
              link: "/api/preloadApp",
            },
            {
              text: "destroyApp",
              link: "/api/destroyApp",
            },
          ],
        },
        {
          text: "子应用",
          collapsible: true,
          items: [
            {
              text: "wujie",
              link: "/api/wujie",
            },
          ],
        },
      ],
      "/question": [],
      "/pack/": [
        {
          text: "框架封装",
          collapsible: true,
          items: [
            {
              text: "Vue组件封装",
              link: "/pack/",
            },
            {
              text: "React组件封装",
              link: "/pack/react",
            },
          ],
        },
      ],
    },
  },
});
