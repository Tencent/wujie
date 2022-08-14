<template>
  <div style="height: 100%; width: 100%">
    <WujieVue
      class="item"
      name="react16"
      :url="react16Url"
      :sync="true"
      :fetch="fetch"
      :props="props"
      :attrs="react16Attrs"
      :degrade="degrade"
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
    <WujieVue
      class="item"
      name="react17"
      :url="react17Url"
      :sync="true"
      :fetch="fetch"
      :props="props"
      :attrs="react17Attrs"
      :degrade="degrade"
      :alive="true"
      :beforeLoad="lifecycles.beforeLoad"
      :beforeMount="lifecycles.beforeMount"
      :afterMount="lifecycles.afterMount"
      :beforeUnmount="lifecycles.beforeUnmount"
      :afterUnmount="lifecycles.afterUnmount"
      :activated="lifecycles.activated"
      :deactivated="lifecycles.deactivated"
      :loadError="lifecycles.loadError"
    ></WujieVue>
    <WujieVue
      class="item"
      name="vue2"
      :url="vue2Url"
      :props="props"
      :attrs="vue2Attrs"
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
    <WujieVue
      class="item"
      name="vue3"
      :url="vue3Url"
      :sync="true"
      :fetch="vue3Fetch"
      :props="props"
      :attrs="vue3Attrs"
      :degrade="degrade"
      :alive="true"
      :beforeLoad="lifecycles.beforeLoad"
      :beforeMount="lifecycles.beforeMount"
      :afterMount="lifecycles.afterMount"
      :beforeUnmount="lifecycles.beforeUnmount"
      :afterUnmount="lifecycles.afterUnmount"
      :activated="lifecycles.activated"
      :deactivated="lifecycles.deactivated"
      :loadError="lifecycles.loadError"
    ></WujieVue>
    <WujieVue
      class="item"
      name="vite"
      :url="vite"
      :sync="true"
      :fetch="fetch"
      :props="props"
      :attrs="viteAttrs"
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
    <WujieVue
      class="item"
      name="angular12"
      :url="angular12Url"
      :sync="true"
      :fetch="fetch"
      :props="props"
      :attrs="angular12Attrs"
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
  </div>
</template>

<script>
import hostMap from "../hostMap";
import fetch from "../fetch";
import lifecycles from "../lifecycle";

export default {
  data() {
    return {
      react16Url: hostMap("//localhost:7600/"),
      react17Url: hostMap("//localhost:7100/"),
      vue2Url: hostMap("//localhost:7200/"),
      vue3Url: hostMap("//localhost:7300/"),
      vite: hostMap("//localhost:7500/"),
      angular12Url: hostMap("//localhost:7400/"),
      // 修正iframe的url，防止github pages csp报错
      react16Attrs: process.env.NODE_ENV === "production" ? { src: hostMap("//localhost:7600/") } : {},
      react17Attrs: process.env.NODE_ENV === "production" ? { src: hostMap("//localhost:7100/") } : {},
      vue2Attrs: process.env.NODE_ENV === "production" ? { src: hostMap("//localhost:7200/") } : {},
      vue3Attrs: process.env.NODE_ENV === "production" ? { src: hostMap("//localhost:7300/") } : {},
      viteAttrs: process.env.NODE_ENV === "production" ? { src: hostMap("//localhost:7500/") } : {},
      angular12Attrs: process.env.NODE_ENV === "production" ? { src: hostMap("//localhost:7400/") } : {},
      props: { jump: this.jump },
      degrade: window.localStorage.getItem("degrade") === "true",
      fetch,
      lifecycles,
      vue3Fetch: (url, options) =>
        url.includes(hostMap("//localhost:7300/")) ? fetch(url, options) : window.fetch(url, options),
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
