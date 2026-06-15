<template>
  <!--单例模式，name相同则复用一个无界实例，改变url则子应用重新渲染实例到对应路由 -->
  <div>
    <div class="title">vue2-子应用</div>
    <div class="main-content">
      <div style="padding-bottom: 10px">接收的消息：{{ message }}</div>
      <el-button @click="postMessageToMain">发消息给主应用</el-button>
      <el-button @click="postMessageToIframe">发消息给iframe</el-button>
    </div>
    <div>
      <iframe width="100%" height="100%" :src="url"></iframe>
    </div>
  </div>
</template>

<script>
import hostMap from "../hostMap";
export default {
  data() {
    return {
      message: "",
      url: hostMap("//localhost:7300/") + "postmessage",
    };
  },
  methods: {
    handleMessage(e) {
      try {
        let res = JSON.parse(e.data);
        if (res.type === "vue2") {
          this.message = res.message;
        }
      } catch (err) {
        return;
      }
    },
    postMessageToMain() {
      const mainWindow = window.parent;
      const data = { type: "main", message: "hello, i'm sub app" };
      mainWindow.postMessage(JSON.stringify(data), "*");
    },
    postMessageToIframe() {
      const iframe = document.querySelector("iframe").contentWindow;
      const data = { type: "vue3", message: "hello, i'm sub app" };
      iframe.postMessage(JSON.stringify(data), "*");
    },
  },
  mounted() {
    window.addEventListener("message", this.handleMessage);
  },
  onMounted() {
    window.removeEventListener("message", this.handleMessage);
  },
};
</script>

<style lang="css" scoped>
.title {
  margin-top: 20px;
  text-align: center;
  font-size: 20px;
  font-weight: 800;
}
.main-content {
  margin: 40px;
  font-size: 16px;
}
</style>
