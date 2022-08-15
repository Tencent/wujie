<template>
  <div style="height: 100%; width: 100%">
    <WujieVue class="item" name="react16" :url="react16Url" :sync="true"></WujieVue>
    <WujieVue class="item" name="react17" :url="react17Url" :sync="true"></WujieVue>
    <WujieVue class="item" name="vue2" :url="vue2Url" :sync="true"></WujieVue>
    <WujieVue class="item" name="vue3" :url="vue3Url" :sync="true"></WujieVue>
    <WujieVue class="item" name="vite" :url="vite" :sync="true"></WujieVue>
    <WujieVue class="item" name="angular12" :url="angular12Url" :sync="true"></WujieVue>
  </div>
</template>

<script>
import hostMap from "../hostMap";

export default {
  data() {
    return {
      react16Url: hostMap("//localhost:7600/"),
      react17Url: hostMap("//localhost:7100/"),
      vue2Url: hostMap("//localhost:7200/"),
      vue3Url: hostMap("//localhost:7300/"),
      vite: hostMap("//localhost:7500/"),
      angular12Url: hostMap("//localhost:7400/"),
    };
  },
  methods: {
    jump(name) {
      this.$router.push({ name });
    },
  },
};
</script>

<style scoped>
.item {
  display: inline-block;
  border: 1px dashed #ccc;
  border-radius: 8px;
  width: 45%;
  height: 45%;
  margin: 20px;
  overflow: scroll;
}
</style>
