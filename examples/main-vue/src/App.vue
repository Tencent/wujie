<template>
  <div id="app">
    <div id="nav" :class="active ? 'active' : ''" @click="close">
      <router-link to="/home">介绍</router-link>
      <!-- react16相关路由 -->
      <router-link to="/react16">
        react16
        <a-icon :class="['main-icon', { active: react16Flag }]" type="caret-up" @click.native="handleFlag('react16')" />
      </router-link>
      <div class="sub-menu" v-show="react16Flag">
        <router-link to="/react16-sub/home">home</router-link>
        <router-link to="/react16-sub/dialog">dialog</router-link>
        <router-link to="/react16-sub/location">location</router-link>
        <router-link to="/react16-sub/communication">communication</router-link>
        <router-link to="/react16-sub/nest">nest</router-link>
        <router-link to="/react16-sub/font">font</router-link>
      </div>
      <!-- react17相关路由 -->
      <router-link to="/react17">
        react17
        <span class="alive">保活</span>
        <a-icon :class="['main-icon', { active: react17Flag }]" type="caret-up" @click.native="handleFlag('react17')" />
      </router-link>
      <div class="sub-menu" v-show="react17Flag">
        <router-link to="/react17-sub/home">home</router-link>
        <router-link to="/react17-sub/dialog">dialog</router-link>
        <router-link to="/react17-sub/location">location</router-link>
        <router-link to="/react17-sub/communication">communication</router-link>
        <router-link to="/react17-sub/state">state</router-link>
      </div>
      <!-- vue2相关路由 -->
      <router-link to="/vue2">
        vue2
        <a-icon :class="['main-icon', { active: vue2Flag }]" type="caret-up" @click.native="handleFlag('vue2')" />
      </router-link>
      <div class="sub-menu" v-show="vue2Flag">
        <router-link to="/vue2-sub/home">home</router-link>
        <router-link to="/vue2-sub/dialog">dialog</router-link>
        <router-link to="/vue2-sub/location">location</router-link>
        <router-link to="/vue2-sub/communication">communication</router-link>
      </div>
      <!-- vue3相关路由 -->
      <router-link to="/vue3">
        vue3
        <span class="alive">保活</span>
        <a-icon :class="['main-icon', { active: vue3Flag }]" type="caret-up" @click.native="handleFlag('vue3')" />
      </router-link>
      <div class="sub-menu" v-show="vue3Flag">
        <router-link to="/vue3-sub/home">home</router-link>
        <router-link to="/vue3-sub/dialog">dialog</router-link>
        <router-link to="/vue3-sub/location">location</router-link>
        <router-link to="/vue3-sub/contact">contact</router-link>
        <router-link to="/vue3-sub/state">state</router-link>
      </div>
      <router-link to="/vite"
        >vite <a-icon :class="['main-icon', { active: viteFlag }]" type="caret-up" @click.native="handleFlag('vite')"
      /></router-link>
      <div class="sub-menu" v-show="viteFlag">
        <router-link to="/vite-sub/home">home</router-link>
        <router-link to="/vite-sub/dialog">dialog</router-link>
        <router-link to="/vite-sub/location">location</router-link>
        <router-link to="/vite-sub/contact">contact</router-link>
      </div>
      <router-link to="/angular12">angular12</router-link>
      <router-link to="/all">all</router-link>
      <a-button class="menu-icon" type="primary" icon="unordered-list" size="large" @click.stop="active = !active" />
    </div>
    <div class="content" @click="active = false">
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      active: false,
      react16Flag: this.$route.name === "react16-sub",
      react17Flag: this.$route.name === "react17-sub",
      vue2Flag: this.$route.name === "vue2-sub",
      vue3Flag: this.$route.name === "vue3-sub",
      viteFlag: this.$route.name === "vite-sub",
    };
  },
  methods: {
    close() {
      if (this.active) this.active = false;
    },
    handleFlag(name) {
      this[name + "Flag"] = !this[name + "Flag"];
    },
  },
};
</script>

<style>
html,
body {
  margin: 0;
  padding: 0;
  font-size: 20px;
  height: 100vh;
  --theme: rgb(241, 107, 95);
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  width: 100vw;
}

#nav {
  background-color: white;
  flex-shrink: 0;
  font-size: 20px;
  display: flex;
  position: relative;
  z-index: 1;
  flex-direction: column;
  padding: 30px 0;
  width: 210px;
  height: 100vh;
  box-sizing: border-box;
  box-shadow: 3px 0px 9px 2px #e6e6e6;
  transition: transform 0.1s linear;
  transform: translate(0, 0);
  overflow: auto;
}

#nav .menu-icon {
  display: none;
  border: none;
  background: var(--theme) !important;
}

.main-icon {
  padding: 0 10px;
  transition: transform 0.2s ease-in;
}

.main-icon.active {
  transform: rotate(180deg);
}

.sub-menu {
  font-size: 16px;
  padding: 0 10px;
}

@media screen and (max-width: 768px) {
  #nav {
    position: absolute;
    box-shadow: none;
    transform: translate(-100%, 0);
  }

  #nav.active {
    transform: translate(0, 0);
    box-shadow: 3px 0px 9px 2px #e6e6e6;
  }
  #nav .menu-icon {
    position: absolute;
    left: 100%;
    display: block;
  }
}

.wujie_iframe {
  width: 100%;
  height: 100%;
}

iframe {
  border: none;
}

h3 {
  padding-bottom: 0.3rem;
  border-bottom: 1px solid #eaecef;
}

.content {
  flex: 1;
  height: 100vh;
  overflow: hidden scroll;
  width: 1px;
}

#nav a {
  display: flex;
  align-items: center;
  padding: 10px 30px;
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
  transition: all 0.2s linear;
}

#nav a:hover {
  color: var(--theme);
}

.alive {
  display: inline-block;
  white-space: nowrap;
  background-color: var(--theme);
  border-radius: 8px;
  margin-left: 4px;
  font-size: 10px;
  vertical-align: top;
  padding: 1px 4px;
  color: white;
}

#nav a.router-link-active {
  color: var(--theme);
  background: rgba(0, 0, 0, 0.05);
}
</style>
