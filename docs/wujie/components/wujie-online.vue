<script setup>
import { watch, ref } from "vue";

const props = defineProps({
  url: String | Object,
});
const wujieList = [
  {
    name: "TurboRepo",
    url: "https://turborepo.org/docs/getting-started",
  },
  {
    name: "React",
    url: "https://reactjs.org/",
  },
  {
    name: "Vercel",
    url: "https://vercel.com/",
  },
  {
    name: "UmiJS",
    url: "https://umijs.org/",
  },
  {
    name: "Webpack",
    url: "https://webpack.js.org/",
  },
  {
    name: "Vuetify",
    url: "https://vuetifyjs.com/en/",
  },
  {
    name: "AntDesign",
    url: "https://ant.design/components/drawer-cn/",
  },

  {
    name: "AntV",
    url: "https://g2.antv.vision/zh",
  },
  {
    name: "NaiveUI",
    url: "https://www.naiveui.com/zh-CN/os-theme/components/button",
  },
];
const wujieUrl = ref("");
watch(
  () => props.url,
  (newValue) => {
    wujieUrl.value = newValue;
  }
);
function changeWujieUrl(item) {
  wujieUrl.value = item.url;
}
</script>

<template>
  <div class="baseContainer">
    <div style="width: 100%">
      <WujieVue
        v-if="wujieUrl"
        width="100%"
        height="100vh"
        :name="wujieUrl"
        alive
        :url="wujieUrl"
        :sync="true"
      ></WujieVue>
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
