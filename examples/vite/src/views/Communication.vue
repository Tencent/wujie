<template>
  <HelloWorld :msg="$t('comm.title')"></HelloWorld>
  <div class="content">
    <p>{{ $t("comm.intro") }}</p>
    <h3>{{ $t("comm.step1Title") }}</h3>
    <p>{{ $t("comm.step1Desc") }}</p>
    <p>
      <el-button @click="handleClick">{{ $t("comm.jumpReact17") }}</el-button>
    </p>
    <h3>{{ $t("comm.step2Title") }}</h3>
    <p>{{ $t("comm.step2Desc") }}</p>
    <p>
      <el-button @click="handleAlert">{{ $t("comm.showAlert") }}</el-button>
    </p>
    <h3>{{ $t("comm.step3Title") }}</h3>
    <p>{{ $t("comm.step3Desc1") }}</p>
    <p>{{ $t("comm.step3Desc2") }}</p>
    <p>
      <el-button @click="handleEmit">{{ $t("comm.emitBtn") }}</el-button>
    </p>
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
      window?.parent.alert(this.$t("comm.mainAlertMsg"));
    },
    handleEmit() {
      window?.$wujie.bus.$emit("click", "vue3");
    },
  },
};
</script>
