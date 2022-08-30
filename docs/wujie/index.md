---
layout: page
---

<script setup>
import { ref } from "vue";
import WujieOnline from "./components/wujie-online.vue";
import WujieConnect from "./components/wujie-connect.vue";
const url = ref("");
function changeUrl(value) {
  url.value = value;
}
</script>

<ClientOnly>
    <WujieConnect @changeUrl="changeUrl" />
    <WujieOnline :baseUrl="url"/>
</ClientOnly>
