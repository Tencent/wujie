---
layout: page
---

<script setup>
import { ref } from "vue";
import WujieOnline from "../../wujie/components/wujie-online.vue";
import WujieConnect from "../../wujie/components/wujie-connect.vue";
const url = ref("");
const flag = ref(null);
function changeUrl(value) {
  url.value = value[0];
  flag.value = value[1];
}
</script>

<ClientOnly>
  <WujieConnect @changeUrl="changeUrl" :baseUrl="url" />
  <WujieOnline v-model:url="url" :flag="flag" />
</ClientOnly>
