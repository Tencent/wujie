<template>
  <WujieVue
    width="100%"
    height="100%"
    name="react17"
    :url="react17Url"
    :sync="true"
    :alive="true"
    :fetch="fetch"
    :degrade="degrade"
    :props="props"
    :attrs="attrs"
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
      react17Url: hostMap("//localhost:7100"),
      props: { jump: this.jump },
      // 修正iframe的url，防止github pages csp报错
      attrs: process.env.NODE_ENV === "production" ? { src: hostMap("//localhost:7100") } : {},
      fetch,
      lifecycles,
      degrade: window.localStorage.getItem("degrade") === "true",
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
