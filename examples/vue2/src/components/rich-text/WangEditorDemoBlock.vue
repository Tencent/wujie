<template>
  <section class="issue-block">
    <h3>{{ title }}</h3>
    <el-alert :closable="false" show-icon :type="alertType" class="issue-alert">
      <div slot="title">{{ issueLabel }}</div>
      <p class="issue-desc">{{ description }}</p>
      <p class="issue-steps">{{ steps }}</p>
      <a class="issue-link" :href="issueUrl" target="_blank" rel="noopener noreferrer">{{ issueUrl }}</a>
    </el-alert>
    <div v-if="showSelectionPanel || showLoRoPanel" class="selection-panel">
      <template v-if="showSelectionPanel">
        <p><strong>Selection.isCollapsed</strong>（编辑时实时刷新）</p>
        <p class="selection-hint">光标折叠时应为 <code>true</code>，拖选文字时应为 <code>false</code>。</p>
        <pre>{{ selectionDebug }}</pre>
        <p v-if="selectionOk" class="selection-ok">isCollapsed 表现正常</p>
      </template>
      <template v-if="showLoRoPanel">
        <p><strong>wangEditor LO / RO</strong>（#513 降级快速输入）</p>
        <p class="selection-hint">
          <code>LO</code> / <code>RO</code> 为 true 时 Slate 选区同步正常；快速输入时若变为 false 易失焦。
        </p>
        <pre>{{ loRoDebug }}</pre>
        <p v-if="loRoOk" class="selection-ok">LO / RO 校验通过</p>
      </template>
    </div>
    <div class="editor-shell">
      <Toolbar v-if="editor" :editor="editor" :defaultConfig="toolbarConfig" mode="default" />
      <Editor
        v-model="html"
        class="wang-editor-body"
        :style="{ height: editorHeight }"
        :defaultConfig="editorConfig"
        :mode="mode"
        @onCreated="onCreated"
        @onChange="refreshSelection"
        @onFocus="refreshSelection"
        @onBlur="refreshSelection"
      />
    </div>
    <p v-if="!showSelectionPanel" class="init-ok">编辑器已正常加载，上述场景验证通过。</p>
  </section>
</template>

<script>
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import "@wangeditor/editor/dist/css/style.css";

export default {
  name: "WangEditorDemoBlock",
  components: { Editor, Toolbar },
  props: {
    title: { type: String, required: true },
    issueLabel: { type: String, required: true },
    issueUrl: { type: String, required: true },
    description: { type: String, required: true },
    steps: { type: String, required: true },
    initialHtml: { type: String, default: "" },
    showSelectionPanel: { type: Boolean, default: false },
    showLoRoPanel: { type: Boolean, default: false },
    editorHeight: { type: String, default: "220px" },
    alertType: { type: String, default: "success" },
  },
  data() {
    return {
      editor: null,
      html: this.initialHtml,
      mode: "default",
      toolbarConfig: {},
      editorConfig: {
        placeholder: "请在此输入内容进行验证…",
      },
      selectionDebug: "（尚未聚焦编辑器）",
      selectionOk: false,
      loRoDebug: "（尚未聚焦编辑器）",
      loRoOk: false,
    };
  },
  watch: {
    initialHtml(val) {
      if (val !== this.html) {
        this.html = val;
      }
    },
  },
  mounted() {
    if (this.showSelectionPanel || this.showLoRoPanel) {
      this.onSelectionChange = () => this.refreshSelection();
      document.addEventListener("selectionchange", this.onSelectionChange);
    }
  },
  beforeDestroy() {
    if (this.onSelectionChange) {
      document.removeEventListener("selectionchange", this.onSelectionChange);
      this.onSelectionChange = null;
    }
    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
    }
  },
  methods: {
    onCreated(editor) {
      this.editor = Object.seal(editor);
    },
    refreshSelection() {
      const selection = window.getSelection();
      if (this.showSelectionPanel) {
        if (!selection || selection.rangeCount === 0) {
          this.selectionDebug = "getSelection() 为空或 rangeCount = 0";
          this.selectionOk = false;
        } else {
          const range = selection.getRangeAt(0);
          const collapsedByOffset =
            selection.anchorNode === selection.focusNode && selection.anchorOffset === selection.focusOffset;
          this.selectionOk = selection.isCollapsed === collapsedByOffset;
          this.selectionDebug = JSON.stringify(
            {
              isCollapsed: selection.isCollapsed,
              anchorOffset: selection.anchorOffset,
              focusOffset: selection.focusOffset,
              rangeCollapsed: range.collapsed,
              collapsedByOffset,
              inWujie: Boolean(window.__POWERED_BY_WUJIE__),
              degrade: Boolean(window.__WUJIE?.degrade),
            },
            null,
            2
          );
        }
      }
      if (this.showLoRoPanel) {
        this.refreshLoRo(selection);
      }
    },
    refreshLoRo(selection) {
      if (!selection || selection.rangeCount === 0) {
        this.loRoDebug = "getSelection() 为空或 rangeCount = 0";
        this.loRoOk = false;
        return;
      }
      const NO = (node) => node?.ownerDocument?.defaultView || null;
      const LO = (node) => {
        const view = NO(node);
        return Boolean(view && node instanceof view.Node);
      };
      const RO = (sel) => {
        const view = sel?.anchorNode && NO(sel.anchorNode);
        return Boolean(view && sel instanceof view.Selection);
      };
      const renderDoc = window.__WUJIE?.document;
      const anchor = selection.anchorNode;
      const focus = selection.focusNode;
      this.loRoOk = RO(selection) && LO(anchor) && LO(focus);
      this.loRoDebug = JSON.stringify(
        {
          RO: RO(selection),
          LO_anchor: LO(anchor),
          LO_focus: LO(focus),
          anchorOwnerIsRenderDoc: Boolean(renderDoc && anchor?.ownerDocument === renderDoc),
          focusOwnerIsRenderDoc: Boolean(renderDoc && focus?.ownerDocument === renderDoc),
          degrade: Boolean(window.__WUJIE?.degrade),
          inWujie: Boolean(window.__POWERED_BY_WUJIE__),
        },
        null,
        2
      );
    },
  },
};
</script>

<style scoped>
.issue-block {
  margin-bottom: 40px;
}

.issue-block h3 {
  margin: 0 0 12px;
  font-size: 16px;
}

.issue-alert {
  margin-bottom: 12px;
}

.issue-desc,
.issue-steps {
  margin: 6px 0;
  line-height: 1.5;
  font-size: 14px;
}

.issue-link {
  font-size: 13px;
  word-break: break-all;
}

.selection-panel {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #f6f8fa;
  border-radius: 4px;
  font-size: 13px;
}

.selection-hint {
  margin: 6px 0;
  color: #606266;
  line-height: 1.5;
}

.selection-panel pre {
  margin: 8px 0 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.selection-ok {
  margin: 8px 0 0;
  color: #67c23a;
}

.editor-shell {
  border: 1px solid #e8e8e8;
}

.wang-editor-body {
  overflow-y: hidden;
}

.init-ok {
  margin-top: 10px;
  color: #67c23a;
  font-size: 13px;
}
</style>
