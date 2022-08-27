<script setup>
import Theme from "vitepress/theme";
import { useData, withBase } from "vitepress";
import WujieContent from "./wujie-content.vue";
const { site, frontmatter } = useData();
const { Layout } = Theme;
console.log(frontmatter);
</script>

<template>
  <Layout>
    <template #home-hero-before> </template>
    <template #home-hero-after> </template>
    <template #home-features-before>
      <WujieContent :introduction="frontmatter.hero.Introduction" />
    </template>
    <template #home-features-after> </template>
  </Layout>
</template>
