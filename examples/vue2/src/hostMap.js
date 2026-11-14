const map = {
  "//localhost:7100/": "//wujie-micro.github.io/demo-react17/",
  "//localhost:7200/": "//wujie-micro.github.io/demo-vue2/",
  "//localhost:7300/": "//wujie-micro.github.io/demo-vue3/",
  "//localhost:7400/": "//wujie-micro.github.io/demo-angular12/",
  "//localhost:7500/": "//wujie-micro.github.io/demo-vite/",
  "//localhost:7600/": "//wujie-micro.github.io/demo-react16/",
  "//localhost:7700/": "//wujie-micro.github.io/demo-main-react/",
  "//localhost:8000/": "//wujie-micro.github.io/demo-main-vue/",
};

export default function hostMap(host) {
  if (process.env.NODE_ENV === "production") return map[host];
  return host;
}
