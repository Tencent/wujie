<template>
  <WujieVue
    class="angular-container"
    name="angular12"
    :url="url"
    :attrs="attrs"
    :fetch="fetch"
    :sync="true"
    :degrade="degrade"
    :beforeLoad="lifecycles.beforeLoad"
    :beforeMount="lifecycles.beforeMount"
    :afterMount="lifecycles.afterMount"
    :beforeUnmount="lifecycles.beforeUnmount"
    :afterUnmount="lifecycles.afterUnmount"
    :activated="lifecycles.activated"
    :deactivated="lifecycles.deactivated"
    :loadError="lifecycles.loadError"
  ></WujieVue>
</template>

<script>
import hostMap from "../hostMap";
import fetch from "../fetch";
import lifecycles from "../lifecycle";

export default {
  data() {
    return {
      url: hostMap("//localhost:7400"),
      // 修正iframe的url，防止github pages csp报错
      attrs: process.env.NODE_ENV === "production" ? { src: hostMap("//localhost:7400") } : {},
      fetch,
      degrade: window.localStorage.getItem("degrade") === "true",
      lifecycles,
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
