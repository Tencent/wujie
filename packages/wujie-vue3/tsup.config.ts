import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['index.ts'],
  format: ['esm', 'iife'],
  target: 'es6',
  sourcemap: true,
  clean: true,
  dts: true
})
