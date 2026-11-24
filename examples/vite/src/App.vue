<template>
  <el-config-provider :locale="elLocale">
    <a-config-provider :locale="antLocale">
      <div id="nav">
        <router-link to="/home">{{ $t("nav.home") }}</router-link> |
        <router-link to="/dialog">{{ $t("nav.dialog") }}</router-link> |
        <router-link to="/location">{{ $t("nav.location") }}</router-link> |
        <router-link to="/contact">{{ $t("nav.contact") }}</router-link>
        <!-- |
        <router-link to="/state">{{ $t("nav.state") }}</router-link> -->
      </div>
      <router-view />
    </a-config-provider>
  </el-config-provider>
</template>

<script>
import elZhCn from "element-plus/es/locale/lang/zh-cn";
import elEn from "element-plus/es/locale/lang/en";
import antZhCN from "ant-design-vue/es/locale/zh_CN";
import antEnUS from "ant-design-vue/es/locale/en_US";
import { setLang, syncLangFromHost } from "./i18n";

export default {
  computed: {
    elLocale() {
      return this.$lang === "en" ? elEn : elZhCn;
    },
    antLocale() {
      return this.$lang === "en" ? antEnUS : antZhCN;
    },
  },
  watch: {
    // 在 vite-sub 路由下主动告知主应用路由跳转，主应用也跳到相应路由高亮菜单栏
    $route() {
      window.$wujie?.bus.$emit("sub-route-change", "vite", this.$route.path);
    },
  },
  mounted() {
    syncLangFromHost();
    this._handleLangChange = (lang) => setLang(lang);
    window.$wujie?.bus.$on("lang-change", this._handleLangChange);
  },
  beforeUnmount() {
    if (this._handleLangChange) {
      window.$wujie?.bus.$off("lang-change", this._handleLangChange);
    }
  },
};
</script>
