<template>
  <WujieVue
    width="100%"
    height="100%"
    name="vue2"
    :url="vue2Url"
    :props="props"
    :attrs="attrs"
    :sync="true"
    :fetch="fetch"
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
      vue2Url: hostMap("//localhost:7200"),
      // 修正iframe的url，防止github pages csp报错
      attrs: process.env.NODE_ENV === "production" ? { src: hostMap("//localhost:7200") } : {},
      props: { jump: this.jump },
      fetch,
      degrade: window.localStorage.getItem("degrade") === "true",
      lifecycles,
    };
  },
  methods: {
    jump(name) {
      this.$router.push({ name });
    },
  },
};
</script>

<style lang="scss" scoped></style>
