# 创建一个新项目

### 介绍

`create-wujie` 用来帮助快速启动示例项目，方便开发者快速上手。

- 支持选择一个或多个子应用来创建一个新的项目，便于针对特定框架进行开发测试。
- 支持主,子应用路由模式(`hash`, `history`)选择。

后续会支持更多功能以及其他框架，版本的支持, 便于快速上手 `wujie`。

如在使用过程中遇到任何问题, 请在 [issues](https://github.com/wujie-micro/create-wujie/issues) 进行说明。

### 快速开始

开发环境配置:

- [Node.js](https://nodejs.org/en/) 版本 < 18.0.0
- [pnpm](https://pnpm.io/) 脚手架示例模版基于 pnpm + [turborepo](https://turborepo.org/docs/getting-started) 管理项目

如果您的当前环境中需要切换 node.js 版本, 可以使用 [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) 进行安装.

以下是通过 nvm 安装 Node.js 16 LTS 版本的示例:

```bash
# Install the LTS version of Node.js 16
nvm install 16 --lts

# Make the newly installed Node.js 16 as the default version
nvm alias default 16

# Switch to the newly installed Node.js 16
nvm use 16
```

### 安装

打开一个终端并使用以下命令创建一个新的`wujie demo` 示例：

```bash
# Create a new wujie-app project
npx create-wujie@latest
```

### 模版列表

- 主应用列表

| 主应用框架        |     |
| ----------------- | --- |
| Webpack + Vue2    | ✅  |
| Webpack + React17 | ✅  |
| Vite + Vue3       | 🚧  |

- 子应用列表

| 子应用框架        |     |
| ----------------- | --- |
| Vite + Vue3       | ✅  |
| Webpack + Vue2    | ✅  |
| Webpack + Vue3    | ✅  |
| Webpack + React16 | ✅  |
| Webpack + React17 | ✅  |
| Angular12         | ✅  |
