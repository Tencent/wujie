<script setup lang="ts">
import { ref, watch } from "vue";
const emit = defineEmits(["changeUrl"]);
const url = ref("https://wujicode.cn/xy/app/prod/official/index");
const flag = ref(false);
function preventDefault(event) {
  event.preventDefault;
  const reg = /(https):\/\/([\w.]+\/?)\S*/;
  if (reg.test(url.value)) {
    flag.value = !flag.value;
    emit("changeUrl", [url.value, flag.value]);
  }
}
const props = defineProps<{
  baseUrl?: string;
}>();
watch(
  () => props.baseUrl,
  (newValue) => {
    url.value = newValue;
  }
);
</script>
<template>
  <section id="newsletter" class="NewsLetter">
    <div class="container">
      <h2 class="title"><span class="link">开箱即用</span> , 用最简单的方式体验<span class="link">无界</span></h2>
      <div class="form">
        <form class="box" action="javascript:">
          <input
            class="input"
            placeholder="Your Website"
            required
            pattern="https:\/\/([\w.]+\/?)\S*"
            title="请输入允许跨域的并且是https协议的网站"
            v-model="url"
          />
          <div class="action">
            <input class="button" type="submit" @click="preventDefault" value="Magic" />
          </div>
        </form>
      </div>
      <p class="help">
        您可以输入一个允许跨域访问的<span class="link">https</span>协议网站来在线体验<span class="link">无界</span>
      </p>
    </div>
  </section>
</template>

<style scoped>
.NewsLetter {
  border-top: 1px solid transparent;
  border-bottom: 1px solid var(--vp-c-divider-light);
  padding: 32px 24px;
  background: var(--vp-c-bg-soft);
  transition: border-color 0.5s, background-color 0.5s;
}
.dark .NewsLetter {
  border-top-color: var(--vp-c-divider-light);
  border-bottom-color: transparent;
  background: var(--vp-c-bg);
}
@media (min-width: 768px) {
  .NewsLetter {
    padding: 48px 32px;
  }
}
.container {
  margin: 0 auto;
  padding-top: 20px;
  max-width: 552px;
}
.title {
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  transition: color 0.5s;
}
@media (min-width: 375px) {
  .title {
    font-size: 18px;
  }
}
.form {
  padding-top: 8px;
}
@media (min-width: 375px) {
  .form {
    padding-top: 16px;
  }
}
.box {
  position: relative;
  width: 100%;
}
.input {
  border: 3px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 11px 128px 11px 16px;
  font-size: 16px;
  width: 100%;
  color: var(--vp-c-text-1);
  transition: border-color 0.25s, background-color 0.25s;
}
.input:hover,
.input:focus {
  border-color: var(--vp-c-brand);
}
.input::placeholder {
  font-weight: 500;
  color: var(--vp-c-text-3);
  transition: color 0.25s;
}
.action {
  position: absolute;
  top: 7px;
  right: 6px;
}
.button {
  border-radius: 4px;
  padding: 0 12px;
  letter-spacing: 0.8px;
  line-height: 36px;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-dark-1);
  background-color: var(--vp-c-brand);
  transition: background-color 0.25s;
  cursor: pointer;
}
.button:hover {
  background-color: var(--vp-c-brand-dark);
}
.help {
  margin: 0 auto;
  padding: 8px;
  max-width: 480px;
  text-align: center;
  line-height: 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  transition: color 0.5s;
}
@media (min-width: 375px) {
  .help {
    padding-top: 16px;
  }
}
.link {
  color: var(--vp-c-brand);
  transition: color 0.25s;
}
.link:hover {
  color: var(--vp-c-brand-dark);
}
</style>
