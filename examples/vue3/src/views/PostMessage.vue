<template>
  <!--单例模式，name相同则复用一个无界实例，改变url则子应用重新渲染实例到对应路由 -->
  <div>
    <div class="title">vue3-iframe</div>
    <div style="padding-bottom: 10px">{{ $t("pm.received") }}{{ message }}</div>
    <el-button @click="postMessageToMain">{{ $t("pm.sendMain") }}</el-button>
    <el-button @click="postMessageToSubApp">{{ $t("pm.sendVue2") }}</el-button>
    <el-button @click="postMessageToIframe">{{ $t("pm.sendSelf") }}</el-button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: "",
    };
  },
  methods: {
    jump(name) {
      this.$router.push({ name });
    },
    handleMessage(e) {
      try {
        let res = JSON.parse(e.data);
        if (res.type === "vue3") {
          this.message = res.message;
        }
      } catch (err) {
        return;
      }
    },
    postMessageToMain() {
      const mainWindow = window.parent;
      const data = { type: "main", message: "hello, i'm sub app's iframe" };
      mainWindow.postMessage(JSON.stringify(data), "*");
    },
    postMessageToSubApp() {
      const iframe = window.parent;
      const data = { type: "vue2", message: "hello, i'm sub app's iframe" };
      iframe.postMessage(JSON.stringify(data), "*");
    },
    postMessageToIframe() {
      const iframe = window.parent;
      const data = { type: "vue3", message: "hello, i'm sub app's iframe" };
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
</style>
