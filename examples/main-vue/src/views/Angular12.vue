<template>
  <WujieVue class="angular-container" name="angular12" :url="url" :attrs="attrs" :sync="true"></WujieVue>
</template>

<script>
import hostMap from "../hostMap";

export default {
  data() {
    return {
      url: hostMap("//localhost:7400/"),
      // 修正iframe的url，防止github pages csp报错
      attrs: process.env.NODE_ENV === "production" ? { src: hostMap("//localhost:7400/") } : {},
    };
  },
};
</script>

<style lang="css" scoped>
.angular-container {
  width: 100%;
  height: 100%;
}
</style>
