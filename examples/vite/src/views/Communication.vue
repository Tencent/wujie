<template>
  <HelloWorld msg="通信处理"></HelloWorld>
  <div class="content">
    <p>应用可以有三种方式进行通信：</p>
    <h3>1、主应用通过 props 属性注入的方法</h3>
    <p>主应用通过 props 注入 jump（跳转页面）方法，子应用通过 $wujie.props.jump(xxx) 来使用</p>
    <p><el-button @click="handleClick">点击跳转react17</el-button></p>
    <h3>2、通过 window.parent 方法拿到主应用的全局方法</h3>
    <p>子应用调用 window.parent.alert 来调用主应用的 alert方法</p>
    <p><el-button @click="handleAlert">显示alert</el-button></p>
    <h3>3、通过 bus 方法发送去中心化的事件</h3>
    <p>主应用 bus.$on("click", (msg) => window.alert(msg)) 监听子应用的 click 事件</p>
    <p>子应用点击按钮 $wujie.bus.$emit('click', 'vue3') 发送 click 事件</p>
    <p><el-button @click="handleEmit">点击emit</el-button></p>
  </div>
</template>

<script>
import HelloWorld from "../components/HelloWorld.vue";
export default {
  components: {
    HelloWorld,
  },
  data() {
    return {
      dialogVisible: false,
    };
  },
  methods: {
    handleClick() {
      window?.$wujie.props.jump("react17");
    },
    handleAlert() {
      window?.parent.alert("主应用alert");
    },
    handleEmit() {
      window?.$wujie.bus.$emit("click", "vue3");
    },
  },
};
</script>
