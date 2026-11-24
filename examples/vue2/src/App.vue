<template>
  <a-config-provider :locale="antLocale">
    <div id="app">
      <div id="nav" v-if="$route.name !== 'postmessage'">
        <router-link to="/home">{{ $t("nav.home") }}</router-link> |
        <router-link to="/dialog">{{ $t("nav.dialog") }}</router-link> |
        <router-link to="/location">{{ $t("nav.location") }}</router-link> |
        <router-link to="/communication">{{ $t("nav.communication") }}</router-link> |
        <router-link to="/rich-text">{{ $t("nav.richText") }}</router-link>
      </div>
      <router-view />
    </div>
  </a-config-provider>
</template>

<script>
import antZhCN from "ant-design-vue/es/locale-provider/zh_CN";
import antEnUS from "ant-design-vue/es/locale-provider/en_US";
import { setLang, syncLangFromHost } from "./i18n";

export default {
  computed: {
    antLocale() {
      return this.$lang === "en" ? antEnUS : antZhCN;
    },
  },
  watch: {
    // 在 vue2-sub 路由下主动告知主应用路由跳转，主应用也跳到相应路由高亮菜单栏
    $route() {
      window.$wujie?.bus.$emit("sub-route-change", "vue2", this.$route.path);
    },
  },
  mounted() {
    syncLangFromHost();
    this._handleLangChange = (lang) => setLang(lang);
    window.$wujie?.bus.$on("lang-change", this._handleLangChange);
  },
  beforeDestroy() {
    if (this._handleLangChange) {
      window.$wujie?.bus.$off("lang-change", this._handleLangChange);
    }
  },
};
</script>
