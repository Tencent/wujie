<template>
  <!--保活模式，name相同则复用一个子应用实例，改变url无效，必须采用通信的方式告知路由变化 -->
  <WujieVue width="100%" height="100%" name="vue3" :url="vue3Url" :sync="true"></WujieVue>
</template>

<script>
import hostMap from "../hostMap";
export default {
  data() {
    return {
      vue3Url: hostMap("//localhost:7300/"),
    };
  },
};
</script>

<style lang="scss" scoped></style>
