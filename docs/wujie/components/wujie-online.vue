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
const wujieUrl = ref<string>("");

watch(
  () => props.flag,
  (newValue) => {
    wujieUrl.value = props.url;
  }
);

function changeWujieUrl(item) {
  wujieUrl.value = item.url;
  emit('update:url', item.url)
}
</script>

<template>
  <div class="baseContainer">
    <div class="onlineContainer">
      <WujieVue v-if="wujieUrl" width="100%" :name="wujieUrl" alive :url="wujieUrl" :sync="true"></WujieVue>
    </div>
    <div class="wujieList">
      <h1>快速前往</h1>
      <div v-for="item in wujieList" class="wujieItem" @click="changeWujieUrl(item)">
        {{ item.name }}
      </div>
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
