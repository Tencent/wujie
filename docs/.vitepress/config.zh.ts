import type { DefaultTheme, LocaleSpecificConfig } from "vitepress";
import { version } from "../../packages/wujie-core/package.json";

const ogTitle = "无界";
const ogDescription = "极致的微前端框架";
const ogUrl = "https://wujie-micro.github.io/doc/";

export const zhConfig: LocaleSpecificConfig<DefaultTheme.Config> & { label: string } = {
  label: "简体中文",
  lang: "zh-CN",
  title: ogTitle,
  description: ogDescription,
  head: [
    ["meta", { property: "og:title", content: ogTitle }],
    ["meta", { property: "og:description", content: ogDescription }],
    ["meta", { property: "og:url", content: ogUrl }],
  ],
  themeConfig: {
    editLink: {
      pattern: "https://github.com/Tencent/wujie/tree/master/docs/:path",
      text: "编辑本页",
    },
    lastUpdatedText: "最近更新时间",
    outlineTitle: "页面导航",
    docFooter: {
      prev: "上一页",
      next: "下一页",
    },
    darkModeSwitchLabel: "主题",
    sidebarMenuLabel: "菜单",
    returnToTopLabel: "回到顶部",
    langMenuLabel: "切换语言",

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
            link: "https://wujie-micro.github.io/demo-main-vue/home?lang=zh",
          },
          {
            text: "React主应用",
            link: "https://wujie-micro.github.io/demo-main-react/?lang=zh",
          },
        ],
      },
      { text: "在线体验无界", link: "/wujie/", activeMatch: "/wujie/" },
      { text: "fluth", link: "https://fluthjs.github.io/fluth-doc/cn/index.html" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "入门",
          collapsed: true,
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
              text: "创建项目",
              link: "/guide/install",
            },
          ],
        },
        {
          text: "指南",
          collapsed: false,
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
          collapsed: true,
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
        {
          text: "插件推荐",
          collapsed: true,
          items: [
            {
              text: "wujie-polyfill",
              link: "https://github.com/jardenliu/wujie-polyfill",
            },
          ],
        },
      ],
      "/api/": [
        {
          text: "主应用",
          collapsed: true,
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
            {
              text: "refreshApp",
              link: "/api/refreshApp",
            },
            {
              text: "clearAssetsCache",
              link: "/api/clearAssetsCache",
            },
          ],
        },
        {
          text: "子应用",
          collapsed: true,
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
          collapsed: true,
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
};
