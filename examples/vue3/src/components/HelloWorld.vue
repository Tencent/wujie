<template>
  <div class="hello">
    <img alt="Vue logo" src="@/assets/logo.png" />
    <h2 class="vue-title">{{ msg }}</h2>
  </div>
</template>

<script>
export default {
  name: "HelloWorld",
  props: {
    msg: String,
  },
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
