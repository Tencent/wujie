<template>
  <div id="nav">
    <router-link to="/home">首页</router-link> | <router-link to="/dialog">弹窗</router-link> |
    <router-link to="/location">路由</router-link> | <router-link to="/contact">通信</router-link>
     <!-- |
    <router-link to="/state">状态</router-link> -->
  </div>
  <router-view />
</template>

<script>
export default {
  watch: {
    // 在 vite-sub 路由下主动告知主应用路由跳转，主应用也跳到相应路由高亮菜单栏
    $route() {
      window.$wujie?.bus.$emit("sub-route-change", "vite", this.$route.path);
    },
  },
};
</script>
