<script setup lang="ts">
import { watch, ref } from "vue";

const emit = defineEmits<{
  (e: "update:url", value: string): void;
}>();
const props = withDefaults(
  defineProps<{
    url?: string;
    flag?: boolean;
  }>(),
  {}
);
const wujieUrl = ref<string>("https://ant.design/components/drawer-cn/");

watch(
  () => props.flag,
  () => {
    wujieUrl.value = props.url!;
  }
);

const loading = document.createElement("div");
loading.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="30px" viewBox="0 0 24 30">
<rect x="0" y="13" width="4" height="5" fill="#f16b5f">
  <animate attributeName="height" attributeType="XML" values="5;21;5" begin="0s" dur="0.6s" repeatCount="indefinite"></animate>
  <animate attributeName="y" attributeType="XML" values="13; 5; 13" begin="0s" dur="0.6s" repeatCount="indefinite"></animate>
</rect>
<rect x="10" y="13" width="4" height="5" fill="#f16b5f">
  <animate attributeName="height" attributeType="XML" values="5;21;5" begin="0.15s" dur="0.6s" repeatCount="indefinite"></animate>
  <animate attributeName="y" attributeType="XML" values="13; 5; 13" begin="0.15s" dur="0.6s" repeatCount="indefinite"></animate>
</rect>
<rect x="20" y="13" width="4" height="5" fill="#f16b5f">
  <animate attributeName="height" attributeType="XML" values="5;21;5" begin="0.3s" dur="0.6s" repeatCount="indefinite"></animate>
  <animate attributeName="y" attributeType="XML" values="13; 5; 13" begin="0.3s" dur="0.6s" repeatCount="indefinite"></animate>
</rect>
</svg>`;

const attrs = process.env.NODE_ENV === "production" ? { src: "//wujie-micro.github.io/doc" } : {};
</script>

<template>
  <div class="baseContainer">
    <div class="onlineContainer">
      <WujieVue
        class="wujieContainer"
        :key="wujieUrl"
        v-if="wujieUrl"
        :name="wujieUrl"
        :attrs="attrs"
        alive
        :url="wujieUrl"
        :loading="loading"
      ></WujieVue>
    </div>
  </div>
</template>

<style>
.onlineContainer {
  width: 100%;
  /* border: v-bind(isBorder); */
  border-radius: 6px;
  /* height: 100vh; */
  overflow: hidden;
}
.baseContainer {
  margin: 20px auto 50px;
  transition: all 0.2s ease-out;
  display: flex;
  gap: 50px;
  width: 90vw;
}
.wujieContainer {
  width: 100%;
  min-height: 500px;
}

.wujieItem:hover {
  opacity: 1;
}

.content {
  max-width: 100vw;
}
</style>
