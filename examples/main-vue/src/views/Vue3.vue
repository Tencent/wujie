<template>
  <!--保活模式，name相同则复用一个子应用实例，改变url无效，必须采用通信的方式告知路由变化 -->
  <WujieVue
    width="100%"
    height="100%"
    name="vue3"
    :url="vue3Url"
    :sync="true"
    :fetch="fetch"
    :alive="true"
    :props="props"
    :attrs="attrs"
    :degrade="degrade"
    :beforeLoad="lifecycles.beforeLoad"
    :beforeMount="lifecycles.beforeMount"
    :afterMount="lifecycles.afterMount"
    :beforeUnmount="lifecycles.beforeUnmount"
    :afterUnmount="lifecycles.afterUnmount"
    :activated="lifecycles.activated"
    :deactivated="lifecycles.deactivated"
    :loadError="lifecycles.loadError"
    :plugins="[{ cssExcludes: ['https://stackpath.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css'] }]"
  ></WujieVue>
</template>

<script>
import hostMap from "../hostMap";
import fetch from "../fetch";
import lifecycles from "../lifecycle";
import wujieVue from "wujie-vue2";
export default {
  data() {
    return {
      vue3Url: hostMap("//localhost:7300/"),
      props: { jump: this.jump },
      // 修正iframe的url，防止github pages csp报错
      attrs: process.env.NODE_ENV === "production" ? { src: hostMap("//localhost:7300/") } : {},
      lifecycles,
      // 引入了的第三方样式不需要添加credentials
      fetch: (url, options) =>
        url.includes(hostMap("//localhost:7300/")) ? fetch(url, options) : window.fetch(url, options),
      degrade: window.localStorage.getItem("degrade") === "true",
    };
  },
  mounted() {
    // 告诉子应用要跳转哪个路由
    this.$route.params.path && wujieVue.bus.$emit("vue3-router-change", `/${this.$route.params.path}`);
  },
  methods: {
    jump(name) {
      this.$router.push({ name });
    },
  },
};
</script>

<style lang="scss" scoped></style>
