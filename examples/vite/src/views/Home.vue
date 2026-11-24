<template>
  <div>
    <HelloWorld :msg="$t('home.title')"></HelloWorld>
    <div class="content" style="text-align: center">
      <p>
        {{ $t("home.viteVersion") }}
        <el-tag style="vertical-align: text-top" size="small">2.7.2</el-tag>
      </p>
      <p>
        {{ $t("home.vueVersion") }}
        <el-tag style="vertical-align: text-top" size="small">3.2.26</el-tag>
      </p>
      <p>
        {{ $t("home.elVersion") }}
        <el-tag style="vertical-align: text-top" size="small">2.2.6</el-tag>
      </p>
      <p>
        {{ $t("home.antVersion") }}
        <el-tag style="vertical-align: text-top" size="small">2.2.8</el-tag>
      </p>
      <p>
        <el-button @click="handleOpen">{{ $t("home.repo") }}</el-button>
      </p>
    </div>
  </div>
</template>

<script>
import HelloWorld from "../components/HelloWorld.vue";
export default {
  components: {
    HelloWorld,
  },
  methods: {
    handleOpen() {
      window.open("https://github.com/Tencent/wujie/tree/master/examples/vite");
    },
  },
};
</script>

<style>
:root {
  --host-color: #f16b5f;
}
</style>
