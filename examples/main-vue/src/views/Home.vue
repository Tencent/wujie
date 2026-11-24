<template>
  <div class="home">
    <div class="tool">
      <a-button style="visibility: hidden" class="button-gap" type="primary" icon="unordered-list" size="large" />
      <div class="button-list">
        <a-tooltip placement="top">
          <template slot="title">{{ $t("home.degradeTip") }}</template>
          <a-switch
            class="switch button-gap"
            :disabled="disable"
            :checked-children="$t('home.degradeOn')"
            :un-checked-children="$t('home.degradeOff')"
            v-model="degrade"
          />
        </a-tooltip>
        <a-tooltip placement="top">
          <template slot="title">{{ $t("home.preloadTip") }}</template>
          <a-switch
            class="switch button-gap"
            :checked-children="$t('home.preloadOn')"
            :un-checked-children="$t('home.preloadOff')"
            v-model="preload"
          />
        </a-tooltip>
        <a-tooltip placement="top">
          <template slot="title">{{ $t("home.reactMainTip") }}</template>
          <a :href="reactMainUrl" target="_blank" class="docs button-gap">{{ $t("home.reactMain") }}</a>
        </a-tooltip>
        <a href="https://github.com/Tencent/wujie" target="_blank" class="docs button-gap">{{ $t("home.repo") }}</a>
        <a :href="docsUrl" target="_blank" class="docs button-gap">{{ $t("home.docs") }}</a>
        <button type="button" class="docs button-gap lang-btn" @click="$toggleLang()">
          {{ $lang === "en" ? "中文" : "EN" }}
        </button>
      </div>
    </div>
    <h1 class="header">
      <img
        :style="{ width: '70px', height: '70px', 'margin-right': '15px' }"
        src="https://vfiles.gtimg.cn/wuji_dashboard/xy/test_wuji_damy/XC5WMbxE.svg"
      />
      <span class="bland">{{ $t("home.brand") }}</span>
    </h1>
    <h2 class="subtitle">{{ $t("home.subtitle") }}</h2>

    <div class="detail-content">
      <div class="item">
        <div class="title">{{ $t("home.fastTitle") }}</div>
        <div class="detail">
          <ul>
            <li>{{ $t("home.fast1") }}</li>
            <li>{{ $t("home.fast2") }}</li>
            <li>{{ $t("home.fast3") }}</li>
          </ul>
        </div>
      </div>
      <div class="item">
        <div class="title">{{ $t("home.powerTitle") }}</div>
        <div class="detail">
          <ul>
            <li>{{ $t("home.power1") }}</li>
            <li>{{ $t("home.power2") }}</li>
            <li>{{ $t("home.power3") }}</li>
          </ul>
        </div>
      </div>
      <div class="item">
        <div class="title">{{ $t("home.simpleTitle") }}</div>
        <div class="detail">
          <ul>
            <li>{{ $t("home.simple1") }}</li>
            <li>{{ $t("home.simple2") }}</li>
            <li>{{ $t("home.simple3") }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Home",
  data() {
    return {
      preload: window.localStorage.getItem("preload") !== "false",
      degrade: window.localStorage.getItem("degrade") === "true" || !window.Proxy || !window.CustomElementRegistry,
      disable: !window.Proxy || !window.CustomElementRegistry,
    };
  },
  computed: {
    docsUrl() {
      return this.$lang === "en" ? "https://wujie-micro.github.io/doc/en/" : "https://wujie-micro.github.io/doc/";
    },
    reactMainUrl() {
      return this.$lang === "en"
        ? "https://wujie-micro.github.io/demo-main-react/?lang=en"
        : "https://wujie-micro.github.io/demo-main-react/?lang=zh";
    },
  },
  watch: {
    preload(val) {
      window.localStorage.setItem("preload", val);
      setTimeout(() => window.location.reload(), 1000);
    },
    degrade(val) {
      window.localStorage.setItem("degrade", val);
      setTimeout(() => window.location.reload(), 1000);
    },
  },
};
</script>

<style scoped>
.button-gap {
  margin-bottom: 10px;
}
.button-list {
  flex: 1;
  display: flex;
  flex-direction: row-reverse;
  flex-wrap: wrap;
}
.tool {
  margin: 30px 20px 30px 0;
  display: flex;
  flex-direction: row;
  align-items: top;
}
.header {
  font-size: 70px;
  margin-top: 100px;
  text-align: center;
  font-weight: 300;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 200px;
}
.subtitle {
  font-size: 50px;
  margin-left: 250px;
  text-align: center;
  font-weight: 300;
  font-style: italic;
}

.bland {
  display: inline-block;
  font-weight: 400;
}

.title {
  font-size: 30px;
  color: var(--theme);
  text-align: center;
}

.switch {
  margin-left: 15px;
  padding: 5px;
  height: 40px;
}

.switch.ant-switch::after {
  top: 6px;
  width: 25px;
  height: 25px;
}

.docs {
  font-size: 20px;
  border: 1px solid rgb(217, 217, 217);
  box-shadow: 0 2px #00000004;
  color: rgb(44, 62, 80);
  padding: 5px 20px;
  border-radius: 20px;
  margin-left: 15px;
  cursor: pointer;
  text-decoration: none;
  background: transparent;
  transition: all 0.1s linear;
}
.docs:hover {
  color: var(--theme);
  border: 1px solid var(--theme);
}

.detail-content {
  width: 900px;
  margin: 150px auto 0 auto;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.detail-content .item ul {
  margin: 15px 0;
}

.home {
  font-size: 20px;
}
.home .ant-switch-checked {
  background-color: rgb(241, 107, 95);
}
span.switch {
  margin-left: 0;
  padding: 0;
}

@media screen and (max-width: 768px) {
  .subtitle {
    font-size: 35px;
    margin-left: 0;
    font-weight: 150;
  }
  .header {
    margin-right: 0;
  }
  .detail-content {
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: auto;
  }
  .item {
    width: 220px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

<style>
.switch .ant-switch-inner {
  font-size: 20px;
}
</style>
