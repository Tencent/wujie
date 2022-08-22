import { defineConfig } from "vitepress";
import path from "path";
const ogDescription = "Next Generation Frontend Tooling";
const ogImage = "https://main.vitejs.dev/og-image.png";
const ogTitle = "Vite";
const ogUrl = "https://main.vitejs.dev";

export default defineConfig({
  title: "WuJie",
  description: "Next Generation Frontend Tooling",
  head: [
    ["link", { rel: "icon", href: "/favicon.ico" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:title", content: ogTitle }],
    ["meta", { property: "og:image", content: ogImage }],
    ["meta", { property: "og:url", content: ogUrl }]
  ],

  vue: {
    reactivityTransform: true,
  },

  themeConfig: {
    logo: "/wujie.svg",

    editLink: {
      pattern: "https://github.com/vitejs/vite/edit/main/docs/:path",
      text: "Suggest changes to this page",
    },

    socialLinks: [{ icon: "github", link: "https://github.com/Tencent/wujie" }],
    algolia: {
      appId: '',
      apiKey: "",
      indexName: "wujie",
      searchParameters: {
        facetFilters: ["tags:en"],
      },
    },

    // carbonAds: {
    //   code: "CEBIEK3N",
    //   placement: "vitejsdev",
    // },

    // localeLinks: {
    //   text: "English",
    //   items: [
    //     { text: "简体中文", link: "https://cn.vitejs.dev" },
    //     { text: "日本語", link: "https://ja.vitejs.dev" },
    //     { text: "Español", link: "https://es.vitejs.dev" },
    //   ],
    // },

    footer: {
      message: "Released the MIT License.",
      // copyright: "Copyright © 2022-present ERKELOST & Vite CLI Contributors",
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
      {
        text: "更新日志",
        link: "https://github.com/Tencent/wujie/blob/master/CHANGELOG.md",
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "指南",
          items: [
            {
              text: "介绍",
              link: "/guide/",
            },
            {
              text: "快速上手",
              link: "/guide/start",
            },
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
        }
      ],
      "/api/":  [
        {
          text: "主应用",
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
          items: [
            {
              text: "$wujie",
              link: "/api/subApp",
            },
          ],
        },
      ],
      "/question": [],
      "/pack/": [
        {
          text: "框架封装",
          items: [
            {
              text: 'Vue组件封装',
              link: '/pack/'
            },
            {
              text: 'React组件封装',
              link: '/pack/react'
            }
          ],
        }
      ],
    },
  },
});
