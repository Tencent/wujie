<template>
  <div class="inline-event-demo">
    <h2>内联事件处理器测试</h2>
    <p>测试 wujie 双沙箱架构中内联事件处理器的作用域绑定功能</p>

    <div class="test-section">
      <h3>测试场景</h3>
      <p>以下按钮使用传统的 onclick 内联事件，验证是否能在子应用作用域中正常执行</p>

      <div class="test-cases">
        <div class="test-case">
          <h4>场景 1: 基本功能测试</h4>
          <button onclick="basicTest('hello from inline event')">基本测试</button>
          <div class="result" id="result1">等待测试...</div>
        </div>

        <div class="test-case">
          <h4>场景 2: 多参数测试</h4>
          <button onclick="multiParams('param1', 'param2', 123)">多参数测试</button>
          <div class="result" id="result2">等待测试...</div>
        </div>

        <div class="test-case">
          <h4>场景 3: 访问全局变量</h4>
          <button onclick="accessGlobal()">访问全局变量</button>
          <div class="result" id="result3">等待测试...</div>
        </div>

        <div class="test-case">
          <h4>场景 4: 复杂表达式</h4>
          <button onclick="complexExpression(10, 20)">复杂表达式</button>
          <div class="result" id="result4">等待测试...</div>
        </div>

        <div class="test-case">
          <h4>场景 5: 事件对象访问</h4>
          <button onclick="eventObjectTest(event)">事件对象测试</button>
          <div class="result" id="result5">等待测试...</div>
        </div>

        <div class="test-case">
          <h4>场景 6: 多个内联事件</h4>
          <button onclick="multiEvent('click')" onmouseover="multiEvent('mouseover')"
            onmouseout="multiEvent('mouseout')">
            多事件测试
          </button>
          <div class="result" id="result6">等待测试...</div>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h3>测试说明</h3>
      <ul>
        <li>✅ 如果所有按钮都能正常工作，说明内联事件处理器编译成功</li>
        <li>❌ 如果出现 "xxx is not defined" 错误，说明作用域绑定失败</li>
        <li>📝 所有函数都定义在子应用的全局作用域中</li>
      </ul>
    </div>

    <div class="test-section">
      <h3>实现原理</h3>
      <p>编译前：<code>&lt;button onclick="greet()"&gt;</code></p>
      <p>编译后：<code>&lt;button onclick='with(window.__getWujieWindow__("appId")){ greet() }'&gt;</code></p>
    </div>
  </div>
</template>

<script>
export default {
  name: "InlineEvent",
  mounted() {
    // 在子应用的全局作用域中定义测试函数
    window.basicTest = (msg) => {
      document.getElementById("result1").textContent = `✅ 成功: ${msg}`;
      document.getElementById("result1").style.color = "green";
    };

    window.multiParams = (p1, p2, p3) => {
      document.getElementById("result2").textContent = `✅ 成功: ${p1}, ${p2}, ${p3}`;
      document.getElementById("result2").style.color = "green";
    };

    // 定义全局变量
    window.testGlobalVar = "我是全局变量";

    window.accessGlobal = () => {
      document.getElementById("result3").textContent = `✅ 成功: ${window.testGlobalVar}`;
      document.getElementById("result3").style.color = "green";
    };

    window.complexExpression = (a, b) => {
      const result = a + b;
      document.getElementById("result4").textContent = `✅ 成功: ${a} + ${b} = ${result}`;
      document.getElementById("result4").style.color = "green";
    };

    window.eventObjectTest = (event) => {
      document.getElementById("result5").textContent = `✅ 成功: 事件类型=${event.type}, 目标=${event.target.tagName}`;
      document.getElementById("result5").style.color = "green";
    };

    window.multiEvent = (eventType) => {
      const resultEl = document.getElementById("result6");
      resultEl.textContent = `✅ 成功: ${eventType} 事件触发`;
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
