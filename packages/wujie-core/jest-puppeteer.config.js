const { resolve } = require("path");
const LERNA_EXEC = resolve(__dirname, "../../node_modules/.bin/lerna");

// CI 环境（如 GitHub Actions）需要 --no-sandbox，由 PUPPETEER_LAUNCH_ARGS 注入；
// 本地开发不设置该变量时保持默认行为
const launchArgs = (process.env.PUPPETEER_LAUNCH_ARGS || "").split(/\s+/).filter(Boolean);

module.exports = {
  launch: {
    headless: true,
    devtools: false,
    product: "chrome",
    ...(launchArgs.length ? { args: launchArgs } : {}),
  },
  server: [
    {
      command: LERNA_EXEC + " run start --scope react16",
      usedPortAction: "kill",
      launchTimeout: 60000,
      host: "0.0.0.0",
      port: 7600,
    },
    {
      command: LERNA_EXEC + " run start --scope react17",
      usedPortAction: "kill",
      launchTimeout: 60000,
      host: "0.0.0.0",
      port: 7100,
    },
    {
      command: LERNA_EXEC + " run start --scope vue2",
      usedPortAction: "kill",
      launchTimeout: 60000,
      host: "0.0.0.0",
      port: 7200,
    },
    {
      command: LERNA_EXEC + " run start --scope vue3",
      usedPortAction: "kill",
      launchTimeout: 60000,
      host: "0.0.0.0",
      port: 7300,
    },
    {
      command: LERNA_EXEC + " run start --scope vite",
      usedPortAction: "kill",
      launchTimeout: 60000,
      host: "0.0.0.0",
      port: 7500,
    },
    {
      command: LERNA_EXEC + " run start --scope angular12",
      usedPortAction: "kill",
      launchTimeout: 60000,
      host: "0.0.0.0",
      port: 7400,
    },
    {
      command: LERNA_EXEC + " run integration --scope main-react",
      usedPortAction: "kill",
      launchTimeout: 60000,
      host: "0.0.0.0",
      port: 7700,
    },
    {
      command: LERNA_EXEC + " run start --scope main-vue",
      usedPortAction: "kill",
      launchTimeout: 60000,
      host: "0.0.0.0",
      port: 8000,
    },
  ],
  browserContext: "default",
};
