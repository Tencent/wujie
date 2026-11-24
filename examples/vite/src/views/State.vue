<template>
  <HelloWorld :msg="$t('state.title')"></HelloWorld>
  <div class="content">
    <p>{{ $t("state.intro") }}</p>
    <h3>{{ $t("state.step1") }}</h3>
    <p class="number-content">
      <el-button @click="count -= 1">-</el-button>
      <span class="number">{{ count }}</span>
      <el-button @click="count += 1">+</el-button>
      <el-button style="margin-left: 20px" @click="handleClick">{{ $t("state.jumpReact17") }}</el-button>
    </p>
  </div>
</template>

<script>
import HelloWorld from "../components/HelloWorld.vue";
export default {
  components: {
    HelloWorld,
  },
  mounted() {
    window?.$wujie?.bus.$on("add", () => (this.count += 1));
  },
  data() {
    return {
      count: 10,
    };
  },
  methods: {
    handleClick() {
      window?.$wujie.props.jump("react17");
    },
  },
};
</script>

<style scoped>
.number {
  display: inline-block;
  margin: 0 20px;
  width: 100px;
  text-align: center;
  font-size: 50px;
  font-weight: bold;
  color: #0239d0;
}

.number-content {
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

p {
  margin: 0;
  padding: 30px 0;
}
</style>
