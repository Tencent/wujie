<template>
  <!--单例模式，name相同则复用一个无界实例，改变url则子应用重新渲染实例到对应路由 -->
  <WujieVue
    width="100%"
    height="100%"
    name="react16"
    :url="react16Url"
    :sync="true"
    :fetch="fetch"
    :props="props"
    :attrs="attrs"
    :degrade="degrade"
    :plugins="plugins"
    :prefix="{ 'prefix-dialog': '/dialog', 'prefix-location': '/location' }"
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
import plugins from "../plugin";
export default {
  data() {
    return {
      react16Url: hostMap("//localhost:7600/") + (this.$route.params.path ? `${this.$route.params.path}` : ""),
      props: { jump: this.jump },
      // 修正iframe的url，防止github pages csp报错
      attrs: process.env.NODE_ENV === "production" ? { src: hostMap("//localhost:7600/") } : {},
      fetch,
      lifecycles,
      degrade: window.localStorage.getItem("degrade") === "true",
      plugins,
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
