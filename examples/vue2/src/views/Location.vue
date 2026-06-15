<template>
  <div>
    <HelloWorld msg="location处理"></HelloWorld>
    <div class="content">
      <p>当用户访问location来获取当前的url时，wujie统一拦截并回填子应用正确的地址</p>
      <h3>1、获取 location.host 的值</h3>
      <blockquote>
        <div>{{ host }}</div>
      </blockquote>
      <h3>2、获取 window.location.host 的值</h3>
      <blockquote>
        <div>{{ windowHost }}</div>
      </blockquote>
      <h3>3、修改window.location.href</h3>
      <el-button type="warning" @click="handleClick">跳转无极</el-button>
      <p>子应用修改location.href，会将当前的子应用的shadow删除并且替换成一个iframe</p>
      <blockquote>
        <div>如果子应用配置路由同步，浏览器可通过回退回到子应用</div>
      </blockquote>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from "@/components/HelloWorld.vue";
const host = location.host;
const windowHost = window.location.host;
export default {
  name: "About",
  components: {
    HelloWorld,
  },
  data() {
    return {
      host,
      windowHost,
    };
  },
  mounted() {
    console.log("vue2 location mounted");
  },
  methods: {
    handleClick() {
      if (window.__WUJIE?.degrade || !window.Proxy || !window.CustomElementRegistry) {
        window.$wujie.location.href = "https://v2.vuejs.org/";
      } else window.location.href = "https://wujicode.cn/xy/app/prod/official/index";
    },
  },
};
</script>

<style scoped>
.about {
  text-align: center;
}
img {
  width: 200px;
  height: 200px;
}
</style>
