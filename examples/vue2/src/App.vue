<template>
  <div id="app">
    <div id="nav">
      <router-link to="/home">首页</router-link> | <router-link to="/dialog">弹窗</router-link> |
      <router-link to="/location">路由</router-link> | <router-link to="/communication">通信</router-link>
    </div>
    <router-view />
  </div>
</template>

<script>
export default {
};
</script>
