<template>
  <div id="nav">
    <router-link to="/home">首页</router-link> | <router-link to="/dialog">弹窗</router-link> |
    <router-link to="/location">路由</router-link> | <router-link to="/contact">通信</router-link> |
    <router-link to="/state">状态</router-link>
  </div>
  <router-view />
</template>

<script>
export default {
  watch: {
  },
  mounted() {
    // 防止
    window.$wujie?.bus.$on("vue3-router-change", (path) => this.$router.replace(path));
  },
};
</script>
