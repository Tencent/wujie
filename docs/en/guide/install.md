# Create a New Project

### Introduction

`create-wujie` helps you scaffold starter demo projects quickly so you can get up and running with Wujie right away.

- Select one or more sub-apps when creating a project to develop and test with specific frameworks.
- Choose routing modes (`hash` or `history`) for both the main app and sub-apps.

More features, frameworks, and version templates will continue to be added to make onboarding with `wujie` even easier.

If you encounter any issues, please report them on [GitHub Issues](https://github.com/wujie-micro/create-wujie/issues).

### Prerequisites

Development environment requirements:

- [Node.js](https://nodejs.org/en/) version `< 18.0.0` (for the legacy starter templates)
- [pnpm](https://pnpm.io/) — starter templates are managed with `pnpm` + [Turborepo](https://turborepo.org/docs/getting-started)

If you need to switch Node.js versions in your local environment, use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm).

Example using `nvm` to install and switch to Node.js 16 LTS:

```bash
# Install the LTS version of Node.js 16
nvm install 16 --lts

# Make the newly installed Node.js 16 the default version
nvm alias default 16

# Switch to the newly installed Node.js 16
nvm use 16
```

### Install

Open a terminal and run the following command:

```bash
# Install wujie Cursor skill
npx skills add wujie-micro/wujie-skill
```

### Template List

- Main App Templates

| Main App Framework | Status |
| ------------------ | ------ |
| Webpack + Vue 2    | ✅     |
| Webpack + React 17 | ✅     |
| Vite + Vue 3       | 🚧     |

- Sub-app Templates

| Sub-app Framework  | Status |
| ------------------ | ------ |
| Vite + Vue 3       | ✅     |
| Webpack + Vue 2    | ✅     |
| Webpack + Vue 3    | ✅     |
| Webpack + React 16 | ✅     |
| Webpack + React 17 | ✅     |
| Angular 12         | ✅     |
