<template>
  <HelloWorld :msg="$t('loc.title')"></HelloWorld>
  <div class="content">
    <p>{{ $t("loc.intro") }}</p>
    <h3>{{ $t("loc.step1") }}</h3>
    <blockquote>
      <div>{{ windowHost }}</div>
    </blockquote>
    <h3>{{ $t("loc.step2") }}</h3>
    <blockquote>
      <div>{{ wujieHost }}</div>
    </blockquote>
    <h3>{{ $t("loc.step3") }}</h3>
    <el-button type="warning" @click="handleClick">{{ $t("loc.jumpWuji") }}</el-button>
    <p>{{ $t("loc.step3Desc1") }}</p>
    <blockquote>
      <div>{{ $t("loc.step3Desc2") }}</div>
    </blockquote>
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from "../components/HelloWorld.vue";
const windowHost = window.location.href;
export default {
  name: "About",
  components: {
    HelloWorld,
  },
  data() {
    return {
      windowHost,
    };
  },
  computed: {
    wujieHost() {
      return window?.$wujie?.location.href || this.$t("loc.noWujie");
    },
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
