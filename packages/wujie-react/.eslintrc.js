module.exports = {
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  extends: ["eslint:recommended", "plugin:react/recommended"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["react"],
  rules: {},
  ignorePatterns: ["esm/*.js"],
};
