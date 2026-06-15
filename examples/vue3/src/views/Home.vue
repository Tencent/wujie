<template>
  <div>
    <HelloWorld msg="Vue3示例"></HelloWorld>
    <div class="content" style="text-align: center">
      <p>
        当前vue版本
        <el-tag style="vertical-align: text-top" size="small">3.2.24</el-tag>
      </p>
      <p>
        当前element-plus版本
        <el-tag style="vertical-align: text-top" size="small">2.2.6</el-tag>
      </p>
      <p>
        当前ant-design-vue版本
        <el-tag style="vertical-align: text-top" size="small">2.2.8</el-tag>
      </p>
      <p>
        <el-button @click="() => open('https://github.com/Tencent/wujie/tree/master/examples/vue3')"
          >仓库地址</el-button
        >
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
