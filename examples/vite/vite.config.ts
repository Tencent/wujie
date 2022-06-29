import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  base:'./',
  server: {
    cors: true,
    host: '0.0.0.0',
    port: 7500
  },
  plugins: [
    vue(),
  ],
});
