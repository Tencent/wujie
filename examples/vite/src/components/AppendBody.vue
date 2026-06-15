<template>
  <div>
    <el-button @click="handleAdd">点击插入body</el-button>
    <el-button @click="handleRemove">点击删除body</el-button>
  </div>
</template>

<script>
export default {
  setup() {
    return {};
  },
  data() {
    return {
      dialog: null,
    };
  },
  methods: {
    handleAdd() {
      fetch("./about");
      if (this.dialog) return;
      let ele = document.createElement("div");
      ele.innerHTML = "body中插入position为fixed元素";
      ele.style.cssText =
        "position: fixed; z-index: 100; top: 0; left: 0; width: 400px; text-align: center; height: 100px; line-height: 100px; background-color: #41b883";
      document.body.appendChild(ele);
      this.dialog = ele;
    },
    handleRemove() {
      if (this.dialog) document.body.removeChild(this.dialog);
      this.dialog = null;
    },
  },
};
</script>

<style lang="scss" scoped></style>
