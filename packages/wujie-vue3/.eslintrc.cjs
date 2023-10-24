const { defineConfig } = require('eslint-define-config')

module.exports = defineConfig({
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 13,
    parser: '@typescript-eslint/parser',
    sourceType: 'module'
  },
  plugins: [
    'vue'
  ],
  ignorePatterns: [
    '**/*.json',
    'dist'
  ]
})
