<template>
  <div class="content-container VPFeature VPHero">
    <div class="content-container-title">{{ title }}</div>
    <div class="content-container-subTitle">{{ subTitle }}</div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  introduction: String,
});
const [title, subTitle] = props.introduction.split("|");
</script>
<style scoped>
.content-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  width: 100%;
  /* border: 1px solid var(--vp-c-bg-soft); */
  border-radius: 12px;
  height: 100%;
  margin: 0 auto;
  max-width: 1152px;
  background: linear-gradient(to right, var(--vp-c-brand) 1%);
}
.content-container-title {
  font-size: 24px;
  letter-spacing: 1px;
  font-weight: bold;
  margin-bottom: 28px;
  background: var(--vp-home-hero-name-background-title);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: var(--vp-home-hero-name-color);
}
.content-container-subTitle {
}
.VPHero {
  margin-bottom: calc(var(--vp-nav-height) - 10px);
  padding: calc(var(--vp-nav-height)) 24px 48px;
}

@media (min-width: 640px) {
  .VPHero {
    padding: calc(var(--vp-nav-height) / 2) 48px calc(var(--vp-nav-height) / 2);
  }
}

@media (min-width: 960px) {
  .VPHero {
    padding: calc(var(--vp-nav-height) / 2) 64px calc(var(--vp-nav-height) / 2);
  }
}
</style>
