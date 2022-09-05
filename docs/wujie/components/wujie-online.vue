<script setup lang="ts">
import { watch, ref, computed } from "vue";
import { wujieList } from "./data";

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
const wujieUrl = ref<string>("https://wujicode.cn/xy/app/prod/official/index");

watch(
  () => props.flag,
  (newValue) => {
    wujieUrl.value = props.url;
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

function changeWujieUrl(item) {
  wujieUrl.value = item.url;
  emit("update:url", item.url);
}
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
    <div class="wujieList">
      <h1>快速前往</h1>
      <div v-for="item in wujieList" class="wujieItem" @click="changeWujieUrl(item)">{{ item.name }}</div>
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
.wujieItem {
  color: var(--vt-c-text-2);
  cursor: pointer;
  opacity: 0.7;
}
.wujieItem:hover {
  opacity: 1;
}
.wujieList {
  padding: 15px 25px;
  max-width: 10vw;
  height: 100%;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: space-around;
  flex-direction: column;
}
.content {
  max-width: 100vw;
}
</style>
