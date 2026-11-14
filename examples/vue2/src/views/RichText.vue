<template>
  <div class="rich-text-page">
    <HelloWorld msg="富文本"></HelloWorld>
    <div class="content">
      <p class="intro">
        对照
        <a href="https://github.com/Tencent/wujie/issues" target="_blank" rel="noopener noreferrer">wujie Issues</a>
        中 wangEditor / TinyMCE
        的常见问题。建议在<strong>无界主应用嵌入子应用</strong>与<strong>子应用单独打开</strong>两种环境下分别验证。
      </p>
      <el-tag v-if="inWujie" type="warning" size="small">当前运行在无界子应用环境</el-tag>
      <el-tag v-else type="success" size="small">当前为子应用独立运行</el-tag>

      <el-tabs v-model="activeTab" class="editor-tabs">
        <el-tab-pane label="wangEditor" name="wangEditor">
          <WangEditorDemoBlock
            title="预填内容删改（#218）"
            issue-label="已验证 · Issue #218"
            issue-url="https://github.com/Tencent/wujie/issues/218"
            description="子应用使用 wangEditor 初始化已有 HTML 后，聚焦编辑、删除预填文字、在中段插入内容均正常。"
            steps="操作：点击下方编辑器，删除预填文字或在「预填」二字前插入新内容，确认光标与删改行为符合预期。"
            :initial-html="wangPrefillHtml"
            editor-height="240px"
            alert-type="success"
          />
          <WangEditorDemoBlock
            title="快速输入不失焦（#513）"
            issue-label="已验证 · Issue #513"
            issue-url="https://github.com/Tencent/wujie/issues/513"
            description="wangEditor 5.x 在无界环境（含降级）下快速连续输入时编辑器保持聚焦。框架侧：getSelection / ownerDocument 指向渲染 iframe，patchDegradeInstanceofAcrossRealms 修复跨 iframe instanceof。"
            steps="操作：建议在主应用降级模式下验证——在下方编辑器快速连续打字（含输入法），确认无失焦、光标跳动；可选观察上方 LO/RO 面板均为 true。"
            editor-height="200px"
            :show-lo-ro-panel="true"
            alert-type="success"
          />
          <WangEditorDemoBlock
            title="Selection / DOM 一致（#450、#770）"
            issue-label="已验证 · Issue #450、#770"
            issue-url="https://github.com/Tencent/wujie/issues/450"
            description="选区与 DOM 映射正常，无 Cannot resolve a Slate range from DOM range；getSelection() 指向正确的 document / shadowRoot。"
            steps="操作：在编辑器中点击、选中文字并编辑，确认无控制台报错，选区行为正常。"
            editor-height="220px"
            alert-type="success"
          />
          <WangEditorDemoBlock
            title="复制粘贴（#479）"
            issue-label="已验证 · Issue #479"
            issue-url="https://github.com/Tencent/wujie/issues/479"
            description="paste 事件的 clipboardData 来自主应用 realm，需修复 DataTransfer 的 instanceof 跨 realm 判断；否则复制正常但粘贴进编辑器无响应。"
            steps="操作：在下方编辑器中选中文字 Ctrl+C，再 Ctrl+V 粘贴；或从外部复制一段文字后粘贴进编辑器，确认内容出现。"
            :initial-html="wangPasteHtml"
            editor-height="200px"
            alert-type="success"
          />
          <WangEditorDemoBlock
            title="isCollapsed 判断正常（#489 等）"
            issue-label="已验证 · Selection.isCollapsed"
            issue-url="https://github.com/Tencent/wujie/issues/489"
            description="无界环境下 Selection.isCollapsed 不再恒为 true：仅光标折叠时为 true，拖选文字时为 false。该问题曾导致 wangEditor 误判选区、删改与粘贴异常。"
            steps="操作：点击编辑器定位光标，确认 isCollapsed 为 true；再拖选一段文字，确认 isCollapsed 变为 false，且与 anchor/focus 偏移一致。"
            :initial-html="wangSelectionHtml"
            :show-selection-panel="true"
            editor-height="200px"
            alert-type="success"
          />
        </el-tab-pane>

        <el-tab-pane label="TinyMCE" name="tinymce">
          <TinyMceDemoBlock
            title="本地自托管 TinyMCE：显式配置 skin_url / content_css（#224 / #974）"
            issue-label="关联 Issue #224、#974"
            issue-url="https://github.com/Tencent/wujie/issues/974"
            description="不使用远端 CDN，直接加载本地 public/tinymce/tinymce.min.js，并在 init 时按 TinyMCE 常规接入方式显式配置 skin_url 和 content_css。"
            steps="验证：下方编辑器若能完整显示 oxide 皮肤（工具栏、边框、编辑区样式齐全），说明 TinyMCE 的皮肤与内容样式在无界子应用内都能正常加载。可在 Network 过滤 tinymce / skin 确认资源请求。"
            alert-type="success"
          />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import HelloWorld from "@/components/HelloWorld.vue";
import WangEditorDemoBlock from "@/components/rich-text/WangEditorDemoBlock.vue";
import TinyMceDemoBlock from "@/components/rich-text/TinyMceDemoBlock.vue";

const WANG_PREFILL_HTML =
  "<p>这是<strong>预填内容</strong>，请尝试删除本段文字或在「预填」二字前插入新内容。</p>";

const WANG_SELECTION_HTML =
  "<p>请<strong>拖选这段文字</strong>，观察上方 isCollapsed 从 true 变为 false。</p>";

const WANG_PASTE_HTML =
  "<p>请选中本段文字并复制，再粘贴到下方空白处；或从外部复制文字后粘贴到此处。</p>";

export default {
  name: "RichText",
  components: {
    HelloWorld,
    WangEditorDemoBlock,
    TinyMceDemoBlock,
  },
  data() {
    return {
      activeTab: "wangEditor",
      wangPrefillHtml: WANG_PREFILL_HTML,
      wangSelectionHtml: WANG_SELECTION_HTML,
      wangPasteHtml: WANG_PASTE_HTML,
      inWujie: Boolean(window.__POWERED_BY_WUJIE__),
    };
  },
};
</script>

<style scoped>
.rich-text-page .content {
  max-width: 900px;
}

.intro {
  line-height: 1.6;
  margin-bottom: 12px;
}

.editor-tabs {
  margin-top: 20px;
}
</style>
