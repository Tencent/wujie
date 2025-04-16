<script setup>
import Theme from "vitepress/theme";
import { useData } from "vitepress";
import Documate from "@documate/vue";
import "@documate/vue/dist/style.css";
import WujieContent from "./wujie-content.vue";
const { frontmatter } = useData();
const { Layout } = Theme;
</script>

<template>
  <Layout>
    <template #nav-bar-content-before>
      <Documate endpoint="https://6gxr8z72bh.us.aircode.run/ask" />
    </template>
    <template #aside-ads-before>
      <a class="ad-card" href="https://wujicode.cn" target="_blank">
        <div>
            <img
              src="https://wfiles.gtimg.cn/wuji_material/starter/xza5fd60ot.png"
              border="0"
              width="60px"
              style="margin-bottom: 12px;border-radius:5px"
            />
        </div>
        <div class="ad-text">
          <span>腾讯无极低代码平台</span>
        </div>
      </a>
      
    </template>
  </Layout>
</template>

<style>
.image-bg {
  width: 100px !important;
  height: 100px !important;
}
.image-src {
  max-width: 100px !important;
}
.ad-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px;
  border-radius: 12px;
  min-height: 220px;
  text-align: center;
  line-height: 18px;
  font-size: 14px;
  font-weight: 500;
  background-color: var(--vp-c-bg-soft);
  transition: color 0.5s, background-color 0.5s;
}
.ad-text {
  display: block;
  margin: 0 auto;
  padding-top: 5px;
  color: var(--vp-c-text-1);
  transition: color 0.25s;
}

@media (min-width: 640px) {
  .image-bg {
    width: 200px !important;
    height: 200px !important;
  }
  .image-src {
    max-width: 200px !important;
  }
}

@media (min-width: 960px) {
  .image-bg {
    width: 200px !important;
    height: 200px !important;
  }
  .image-src {
    max-width: 200px !important;
  }
}
</style>
