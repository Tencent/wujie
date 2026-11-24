export interface WujieSiteItem {
  name: string;
  url: string;
}

export const wujieListZh: WujieSiteItem[] = [
  // {
  //   name: "无极",
  //   url: "https://wujicode.cn/xy/app/prod/official/index",
  // },
  {
    name: "AntDesign",
    url: "https://ant.design/components/drawer-cn/",
  },
  {
    name: "React",
    url: "https://react.dev/",
  },
  {
    name: "Webpack",
    url: "https://webpack.js.org/",
  },
  {
    name: "Vuetify",
    url: "https://vuetifyjs.com/en/",
  },
  {
    name: "NaiveUI",
    url: "https://www.naiveui.com/zh-CN/os-theme/components/button",
  },
];

export const wujieListEn: WujieSiteItem[] = [
  {
    name: "AntDesign",
    url: "https://ant.design/components/drawer",
  },
  {
    name: "React",
    url: "https://react.dev/",
  },
  {
    name: "Webpack",
    url: "https://webpack.js.org/",
  },
  {
    name: "Vuetify",
    url: "https://vuetifyjs.com/en/",
  },
  {
    name: "NaiveUI",
    url: "https://www.naiveui.com/en-US/os-theme/components/button",
  },
];

export const wujieList = wujieListZh;
