<script setup>
import WujieVue from "wujie-vue3";
const props = defineProps({
  baseUrl: String | Object,
});
</script>

<template>
  <WujieVue
    class="baseContainer"
    v-if="baseUrl"
    width="70%"
    height="100%"
    name="vite"
    :url="baseUrl.value"
    :sync="true"
  ></WujieVue>
</template>

<style>
.baseContainer {
  margin: 50px auto;
  border-radius: 20px;
  transition: all 0.5s ease-out;
  border: 10px solid #f16b5f;
}
.content {
  max-width: 100vw;
}
</style>
