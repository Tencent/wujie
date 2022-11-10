module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ["eslint:recommended", "plugin:prettier/recommended", "prettier"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  overrides: [
    {
      files: ["*.ts"],
      rules: {
        "no-undef": "off",
      },
    },
  ],
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn"],
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-prototype-builtins": "off",
    "no-self-assign": "off",
    "no-empty": ["error", { allowEmptyCatch: true }],
    "prettier/prettier": ["error", { endOfLine: "auto" }],
  },
  ignorePatterns: ["esm/*.js", "__test__/apps/*/*.html"],
};
