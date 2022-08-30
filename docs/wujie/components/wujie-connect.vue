<script setup>
import { ref } from "vue";
const emit = defineEmits(["changeUrl"]);
const value = ref("");
function wujieClickUrl() {
  emit("changeUrl", value);
}
</script>

<template>
  <div class="query">
    <div class="inputBox">
      <input type="text" required="required" v-model="value" />
      <span>请输入一个Url</span>
    </div>
    <button class="button-magic" @click="wujieClickUrl">Magic</button>
  </div>
</template>

<style>
.query {
  display: flex;
  justify-content: center;
  margin: 30px auto;
  box-sizing: border-box;
}
.button-magic {
  padding: 0 10px;
  height: 100%;
  line-height: 40px;
  background: #f16b5f;
  border: 1px solid #f16b5f;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}
.inputBox {
  position: relative;
}
.inputBox input {
  width: 350px;
  padding: 8px;
  border: 1px solid #f16b5f;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
  outline: none;
  font-size: 1rem;
  transition: all 0.5s ease-in;
}
.inputBox span {
  position: absolute;
  left: 0;
  padding: 10px;
  pointer-events: none;
  font-size: 1rem;
  transition: all 0.2s ease-in;
}

.inputBox input:valid ~ span,
.inputBox input:focus ~ span {
  transform: translateX(10px) translateY(-10px);
  font-size: 0.7rem;
  padding: 0 10px;
  background: var(--vp-custom-block-info-code-bg);
  border-radius: 6px;
  letter-spacing: 0.1rem;
}

.inputBox input:valid,
.inputBox input:focus {
  border: 1px solid #f16b5f;
}
</style>
