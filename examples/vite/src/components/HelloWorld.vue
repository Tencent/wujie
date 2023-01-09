<template>
  <div class="hello">
    <img alt="Vue logo" src="../assets/logo.png" />
    <div :style="`background: url(${logo}) no-repeat center; height: 200px`"></div>
    <h2 class="vue-title">{{ msg }}</h2>
  </div>
</template>

<script>
import logo from '../assets/logo.png'
export default {
  name: "HelloWorld",
  props: {
    msg: String,
  },
  data() {
    return {
      logo
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.hello {
  text-align: center;
  margin-bottom: 50px;
}
img {
  width: 200px;
  height: 200px;
}
.vue-title {
  color: var(--host-color);
}
</style>
