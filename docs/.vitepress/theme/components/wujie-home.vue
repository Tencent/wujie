<script setup>
import Theme from "vitepress/theme";
import { useData } from "vitepress";
import WujieContent from "./wujie-content.vue";
const { frontmatter } = useData();
const { Layout } = Theme;
</script>

<template>
  <Layout>
    <template #home-hero-before></template>
    <template #home-hero-after></template>
    <template #home-features-before>
      <WujieContent :introduction="frontmatter.hero.Introduction" />
    </template>
    <template #home-features-after></template>
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
