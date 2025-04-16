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
      <a class="ad-card" href="https://wujicode.cn" title="腾讯无极低代码" target="_blank">
        <div>
            <img
              src="https://wfiles.gtimg.cn/wuji_material/starter/xza5fd60ot.png"
              border="0"
              width="60px"
              style="margin-bottom: 12px;border-radius:5px"
            />
        </div>
        <div class="ad-text">
          <span>腾讯无极低代码</span>
        </div>
      </a>
    </template>
    <template #layout-bottom>
      <footer
        v-if="frontmatter.layout === 'home'" class="footer">
          <div class="footer-container">
            <div class="wuji-link-container">
              <span>源自</span>
              <a title="腾讯无极低代码" href="https://wujicode.cn?ref=wujie" target="_blank" class="wuji-link" />
            </div>
            <div>Released the MIT License.</div>
          </div>
        </footer>
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
.footer{
  padding: 32px;
  position: relative;
  z-index: var(--vp-z-index-footer);
  border-top: 1px solid var(--vp-c-gutter);
  background-color: var(--vp-c-bg);
}
.footer-container {
  margin: 0 auto;
  max-width: var(--vp-layout-max-width);
  text-align: center;
  line-height: 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}
.wuji-link-container {
  display: inline-flex;
  align-items: center;
  margin-bottom: 10px;
  
  span {
    display:inline-block;
    margin-right: 10px;
  }
}
.wuji-link {
  display: inline-block;
  width: 170px;
  height: 20px;
  background: url("https://wfiles.gtimg.cn/wuji_material/starter/l13y3vdcyg.png") no-repeat center / cover;
}
.dark{
  .wuji-link {
    background-image: url("https://wfiles.gtimg.cn/wuji_material/starter/q9nr6045wn.png");
  }
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