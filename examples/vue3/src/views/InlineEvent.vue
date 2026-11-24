<template>
  <div class="inline-event-demo">
    <h2>{{ $t("inline.title") }}</h2>
    <p>{{ $t("inline.subtitle") }}</p>

    <div class="test-section">
      <h3>{{ $t("inline.sectionCases") }}</h3>
      <p>{{ $t("inline.sectionCasesDesc") }}</p>

      <div class="test-cases">
        <div class="test-case">
          <h4>{{ $t("inline.case1Title") }}</h4>
          <button onclick="basicTest('hello from inline event')">{{ $t("inline.case1Btn") }}</button>
          <div class="result" id="result1">{{ $t("inline.waiting") }}</div>
        </div>

        <div class="test-case">
          <h4>{{ $t("inline.case2Title") }}</h4>
          <button onclick="multiParams('param1', 'param2', 123)">{{ $t("inline.case2Btn") }}</button>
          <div class="result" id="result2">{{ $t("inline.waiting") }}</div>
        </div>

        <div class="test-case">
          <h4>{{ $t("inline.case3Title") }}</h4>
          <button onclick="accessGlobal()">{{ $t("inline.case3Btn") }}</button>
          <div class="result" id="result3">{{ $t("inline.waiting") }}</div>
        </div>

        <div class="test-case">
          <h4>{{ $t("inline.case4Title") }}</h4>
          <button onclick="complexExpression(10, 20)">{{ $t("inline.case4Btn") }}</button>
          <div class="result" id="result4">{{ $t("inline.waiting") }}</div>
        </div>

        <div class="test-case">
          <h4>{{ $t("inline.case5Title") }}</h4>
          <button onclick="eventObjectTest(event)">{{ $t("inline.case5Btn") }}</button>
          <div class="result" id="result5">{{ $t("inline.waiting") }}</div>
        </div>

        <div class="test-case">
          <h4>{{ $t("inline.case6Title") }}</h4>
          <button
            onclick="multiEvent('click')"
            onmouseover="multiEvent('mouseover')"
            onmouseout="multiEvent('mouseout')"
          >
            {{ $t("inline.case6Btn") }}
          </button>
          <div class="result" id="result6">{{ $t("inline.waiting") }}</div>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h3>{{ $t("inline.sectionNotes") }}</h3>
      <ul>
        <li>{{ $t("inline.note1") }}</li>
        <li>{{ $t("inline.note2") }}</li>
        <li>{{ $t("inline.note3") }}</li>
      </ul>
    </div>

    <div class="test-section">
      <h3>{{ $t("inline.sectionImpl") }}</h3>
      <p>{{ $t("inline.beforeCompile") }}<code>&lt;button onclick="greet()"&gt;</code></p>
      <p>
        {{ $t("inline.afterCompile")
        }}<code>&lt;button onclick='with(window.__getWujieWindow__("appId")){ greet() }'&gt;</code>
      </p>
    </div>
  </div>
</template>

<script>
import { t } from "../i18n";

export default {
  name: "InlineEvent",
  mounted() {
    // 在子应用的全局作用域中定义测试函数
    window.basicTest = (msg) => {
      document.getElementById("result1").textContent = `${t("inline.successPrefix")} ${msg}`;
      document.getElementById("result1").style.color = "green";
    };

    window.multiParams = (p1, p2, p3) => {
      document.getElementById("result2").textContent = `${t("inline.successPrefix")} ${p1}, ${p2}, ${p3}`;
      document.getElementById("result2").style.color = "green";
    };

    // 定义全局变量
    window.testGlobalVar = t("inline.globalVarValue");

    window.accessGlobal = () => {
      window.testGlobalVar = t("inline.globalVarValue");
      document.getElementById("result3").textContent = `${t("inline.successPrefix")} ${window.testGlobalVar}`;
      document.getElementById("result3").style.color = "green";
    };

    window.complexExpression = (a, b) => {
      const result = a + b;
      document.getElementById("result4").textContent = `${t("inline.successPrefix")} ${a} + ${b} = ${result}`;
      document.getElementById("result4").style.color = "green";
    };

    window.eventObjectTest = (event) => {
      document.getElementById("result5").textContent = `${t("inline.successPrefix")} ${t("inline.eventType")}=${
        event.type
      }, ${t("inline.eventTarget")}=${event.target.tagName}`;
      document.getElementById("result5").style.color = "green";
    };

    window.multiEvent = (eventType) => {
      const resultEl = document.getElementById("result6");
      resultEl.textContent = `${t("inline.successPrefix")} ${eventType} ${t("inline.eventTriggered")}`;
      resultEl.style.color = "green";
    };
  },
};
</script>

<style scoped>
.inline-event-demo {
  padding: 20px;
}

.test-section {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.test-cases {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.test-case {
  padding: 15px;
  background: #f5f5f5;
  border-radius: 5px;
}

.test-case h4 {
  margin-top: 0;
  color: #333;
}

.test-case button {
  padding: 10px 20px;
  margin: 10px 0;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.test-case button:hover {
  background: #3aa876;
}

.result {
  margin-top: 10px;
  padding: 10px;
  background: white;
  border-radius: 3px;
  font-family: monospace;
  color: #666;
}

.test-section ul {
  line-height: 1.8;
}

.test-section code {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}
</style>
