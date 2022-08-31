<script setup>
const props = defineProps({
  url: String | Object,
});
</script>

<template>
  <WujieVue v-if="url" class="baseContainer" width="90vw" height="100vh" name="vite" alive :url="url" :sync="true"></WujieVue>
</template>

<style>
.baseContainer {
  margin: 0 auto 50px;
  transition: all 0.5s ease-out;
}
.content {
  max-width: 100vw;
}
</style>
