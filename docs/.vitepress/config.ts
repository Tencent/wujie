import { defineConfig } from "vitepress";
import { zhConfig } from "./config.zh";
import { enConfig } from "./config.en";

const ogImage = "https://wujie-micro.github.io/doc/wujie.png";
const base = "/doc/";

export default defineConfig({
  base,
  head: [
    ["link", { rel: "icon", href: `${base}favicon.ico` }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:image", content: ogImage }],
    ["script", { async: "", src: "https://www.googletagmanager.com/gtag/js?id=G-22P9VKHL8B" }],
    [
      "script",
      {},
      `window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-22P9VKHL8B');`,
    ],
  ],

  vue: {
    reactivityTransform: true,
  },
  lastUpdated: true,

  locales: {
    root: zhConfig,
    en: enConfig,
  },

  themeConfig: {
    logo: "/wujie.svg",
    socialLinks: [{ icon: "github", link: "https://github.com/Tencent/wujie" }],
    algolia: {
      appId: "QMIAJMDLL1",
      apiKey: "4eaef57a0122ce0454d3aed08f822178",
      indexName: "wujie-microio",
    },
  },
});
