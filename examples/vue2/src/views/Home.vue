<template>
  <div>
    <HelloWorld msg="Vue2示例"></HelloWorld>
    <div class="content" style="text-align: center">
      <p>
        当前vue版本
        <el-tag style="vertical-align: text-top" size="small">2.6.11</el-tag>
      </p>
      <p>
        当前element版本
        <el-tag style="vertical-align: text-top" size="small">2.15.6</el-tag>
      </p>
      <p>
        当前ant-design-vue版本
        <el-tag style="vertical-align: text-top" size="small">1.7.8</el-tag>
      </p>
      <p>
        <el-button @click="open('https://github.com/Tencent/wujie/tree/master/examples/vue2')">仓库地址</el-button>
      </p>
    </div>
  </div>
</template>

<script>
  import HelloWorld from "@/components/HelloWorld.vue";
  export default {
    data() {
      return {
        open: window.open,
      };
    },
    components: {
      HelloWorld,
    },
  };
</script>

<style>
  :root {
    --host-color: #f16b5f;
  }
</style>