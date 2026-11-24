import type { DefaultTheme, LocaleSpecificConfig } from "vitepress";
import { version } from "../../packages/wujie-core/package.json";

const ogTitle = "Wujie";
const ogDescription = "The Ultimate Micro-Frontend Framework";
const ogUrl = "https://wujie-micro.github.io/doc/en/";

export const enConfig: LocaleSpecificConfig<DefaultTheme.Config> & { label: string } = {
  label: "English",
  lang: "en-US",
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
      text: "Edit this page on GitHub",
    },
    lastUpdatedText: "Last updated",
    outlineTitle: "On this page",
    docFooter: {
      prev: "Previous page",
      next: "Next page",
    },
    darkModeSwitchLabel: "Appearance",
    sidebarMenuLabel: "Menu",
    returnToTopLabel: "Return to top",
    langMenuLabel: "Change language",

    nav: [
      { text: "Guide", link: "/en/guide/", activeMatch: "/en/guide/" },
      {
        text: "API",
        link: "/en/api/bus",
        activeMatch: "/en/api/",
      },
      { text: "FAQ", link: "/en/question/", activeMatch: "/en/question/" },
      { text: "Wrappers", link: "/en/pack/", activeMatch: "/en/pack/" },
      {
        text: `v${version}`,
        items: [
          {
            text: "Changelog",
            link: "https://github.com/Tencent/wujie/blob/master/CHANGELOG.md",
          },
        ],
      },
      {
        text: "Demos",
        items: [
          {
            text: "Vue Main App",
            link: "https://wujie-micro.github.io/demo-main-vue/home?lang=en",
          },
          {
            text: "React Main App",
            link: "https://wujie-micro.github.io/demo-main-react/?lang=en",
          },
        ],
      },
      { text: "Try Online", link: "/en/wujie/", activeMatch: "/en/wujie/" },
      { text: "fluth", link: "https://fluthjs.github.io/fluth-doc/en/index.html" },
    ],

    sidebar: {
      "/en/guide/": [
        {
          text: "Getting Started",
          collapsed: true,
          items: [
            {
              text: "Introduction",
              link: "/en/guide/",
            },
            {
              text: "Quick Start",
              link: "/en/guide/start",
            },
            {
              text: "Create Project",
              link: "/en/guide/install",
            },
          ],
        },
        {
          text: "Guide",
          collapsed: false,
          items: [
            {
              text: "Preload",
              link: "/en/guide/preload",
            },
            {
              text: "Execution Modes",
              link: "/en/guide/mode",
            },
            {
              text: "Route Sync",
              link: "/en/guide/sync",
            },
            {
              text: "Route Navigation",
              link: "/en/guide/jump",
            },
            {
              text: "Lifecycle",
              link: "/en/guide/lifecycle",
            },
            {
              text: "Communication",
              link: "/en/guide/communication",
            },
            {
              text: "Plugin System",
              link: "/en/guide/plugin",
            },
            {
              text: "Degradation",
              link: "/en/guide/degrade",
            },
            {
              text: "Nested Apps",
              link: "/en/guide/nest",
            },
            {
              text: "App Sharing",
              link: "/en/guide/share",
            },
            {
              text: "Global Variables",
              link: "/en/guide/variable",
            },
          ],
        },
        {
          text: "Examples",
          collapsed: true,
          items: [
            {
              text: "Vue Main App",
              link: "https://github.com/Tencent/wujie/tree/master/examples/main-vue",
            },
            {
              text: "React Main App",
              link: "https://github.com/Tencent/wujie/tree/master/examples/main-react",
            },
          ],
        },
        {
          text: "Recommended Plugins",
          collapsed: true,
          items: [
            {
              text: "wujie-polyfill",
              link: "https://github.com/jardenliu/wujie-polyfill",
            },
          ],
        },
      ],
      "/en/api/": [
        {
          text: "Main App",
          collapsed: true,
          items: [
            {
              text: "bus",
              link: "/en/api/bus",
            },
            {
              text: "setupApp",
              link: "/en/api/setupApp",
            },
            {
              text: "startApp",
              link: "/en/api/startApp",
            },
            {
              text: "preloadApp",
              link: "/en/api/preloadApp",
            },
            {
              text: "destroyApp",
              link: "/en/api/destroyApp",
            },
            {
              text: "refreshApp",
              link: "/en/api/refreshApp",
            },
            {
              text: "clearAssetsCache",
              link: "/en/api/clearAssetsCache",
            },
          ],
        },
        {
          text: "Sub-app",
          collapsed: true,
          items: [
            {
              text: "wujie",
              link: "/en/api/wujie",
            },
          ],
        },
      ],
      "/en/question": [],
      "/en/pack/": [
        {
          text: "Framework Wrappers",
          collapsed: true,
          items: [
            {
              text: "Vue Wrapper",
              link: "/en/pack/",
            },
            {
              text: "React Wrapper",
              link: "/en/pack/react",
            },
          ],
        },
      ],
    },
  },
};
