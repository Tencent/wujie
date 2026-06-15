<template>
  <section class="issue-block">
    <h3>{{ title }}</h3>
    <el-alert :closable="false" show-icon :type="alertType" class="issue-alert">
      <div slot="title">{{ issueLabel }}</div>
      <p class="issue-desc">{{ description }}</p>
      <p class="issue-steps">{{ steps }}</p>
      <a class="issue-link" :href="issueUrl" target="_blank" rel="noopener noreferrer">{{ issueUrl }}</a>
    </el-alert>

    <div class="tinymce-host">
      <textarea ref="editorHost" class="tinymce-textarea"></textarea>
    </div>
    <p v-if="ready" class="init-ok">编辑器与皮肤已正常加载。</p>
    <p v-if="initError" class="init-error">{{ initError }}</p>
  </section>
</template>

<script>
import hostMap from "@/hostMap";

export default {
  name: "TinyMceDemoBlock",
  props: {
    title: { type: String, required: true },
    issueLabel: { type: String, required: true },
    issueUrl: { type: String, required: true },
    description: { type: String, required: true },
    steps: { type: String, required: true },
    alertType: { type: String, default: "info" },
  },
  data() {
    return {
      editor: null,
      ready: false,
      initError: "",
    };
  },
  mounted() {
    this.initEditor();
  },
  beforeDestroy() {
    this.destroyEditor();
  },
  methods: {
    async initEditor() {
      try {
        const tinymce = window.tinymce;
        if (!tinymce) {
          throw new Error("未找到 window.tinymce，请确认 public/tinymce/tinymce.min.js 已正确加载");
        }

        const host = hostMap("//localhost:7200/");
        const editors = await tinymce.init({
          target: this.$refs.editorHost,
          height: 320,
          menubar: false,
          branding: false,
          promotion: false,
          skin_url: `${host}tinymce/skins/ui/oxide`,
          content_css: `${host}tinymce/skins/content/default/content.min.css`,
          plugins: "lists link",
          toolbar: "undo redo | bold italic | bullist numlist | link",
        });
        this.editor = Array.isArray(editors) ? editors[0] : editors;
        this.ready = true;
      } catch (err) {
        this.initError = `TinyMCE 初始化失败：${err?.message || err}`;
      }
    },
    destroyEditor() {
      if (this.editor) {
        this.editor.destroy();
        this.editor = null;
      }
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

.tinymce-host {
  min-height: 320px;
}

.tinymce-textarea {
  width: 100%;
  min-height: 280px;
}

.init-ok {
  margin-top: 10px;
  color: #67c23a;
  font-size: 13px;
}

.init-error {
  color: #f56c6c;
  font-size: 13px;
}
</style>
