<template>
  <HelloWorld msg="location处理"></HelloWorld>
  <div class="content">
    <p>当采用 vite 编译框架时，由于 script 的标签 type 为 module，所以无法采用闭包的方式将 location 劫持代理，这里将代理的 location 挂载到 $wujie 上，子应用所有采用 window.location 的代码需要统一修改成 $wujie.location</p>
    <h3>1、获取 window.location.host 的值</h3>
    <blockquote>
      <div>{{ windowHost }}</div>
    </blockquote>
    <h3>2、获取 $wujie.location.host 的值</h3>
    <blockquote>
      <div>{{ wujieHost }}</div>
    </blockquote>
    <h3>3、修改 $wujie.location.href</h3>
    <el-button type="warning" @click="handleClick">跳转无极</el-button>
    <p>子应用修改 $wujie.location.href，会将当前的子应用的shadow删除并且替换成一个iframe</p>
    <blockquote>
      <div>如果子应用配置路由同步，浏览器可通过回退回到子应用</div>
    </blockquote>
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from "../components/HelloWorld.vue";
const windowHost = window.location.href;
const wujieHost = window?.$wujie?.location.href || `$wujie不存在`;
export default {
  name: "About",
  components: {
    HelloWorld,
  },
  data() {
    return {
      windowHost,
      wujieHost,
    };
  },
  mounted() {
    console.log("vite location mounted");
  },
  methods: {
    handleClick() {
      window.$wujie.location.href = "https://wujicode.cn/xy/app/prod/official/index";
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
