<template>
  <div class="rich-text-page">
    <HelloWorld :msg="$t('rt.title')"></HelloWorld>
    <div class="content">
      <p class="intro">
        {{ $t("rt.introPrefix") }}
        <a href="https://github.com/Tencent/wujie/issues" target="_blank" rel="noopener noreferrer">wujie Issues</a>
        {{ $t("rt.introMid") }}<strong>{{ $t("rt.introEmbed") }}</strong
        >{{ $t("rt.introAnd") }}<strong>{{ $t("rt.introStandalone") }}</strong
        >{{ $t("rt.introSuffix") }}
      </p>
      <el-tag v-if="inWujie" type="warning" size="small">{{ $t("rt.envWujie") }}</el-tag>
      <el-tag v-else type="success" size="small">{{ $t("rt.envStandalone") }}</el-tag>

      <el-tabs v-model="activeTab" class="editor-tabs">
        <el-tab-pane label="wangEditor" name="wangEditor">
          <WangEditorDemoBlock
            :key="`case218-${$lang}`"
            :title="$t('rt.case218Title')"
            :issue-label="$t('rt.case218Label')"
            issue-url="https://github.com/Tencent/wujie/issues/218"
            :description="$t('rt.case218Desc')"
            :steps="$t('rt.case218Steps')"
            :initial-html="$t('rt.case218Html')"
            editor-height="240px"
            alert-type="success"
          />
          <WangEditorDemoBlock
            :key="`case513-${$lang}`"
            :title="$t('rt.case513Title')"
            :issue-label="$t('rt.case513Label')"
            issue-url="https://github.com/Tencent/wujie/issues/513"
            :description="$t('rt.case513Desc')"
            :steps="$t('rt.case513Steps')"
            editor-height="200px"
            :show-lo-ro-panel="true"
            alert-type="success"
          />
          <WangEditorDemoBlock
            :key="`case450-${$lang}`"
            :title="$t('rt.case450Title')"
            :issue-label="$t('rt.case450Label')"
            issue-url="https://github.com/Tencent/wujie/issues/450"
            :description="$t('rt.case450Desc')"
            :steps="$t('rt.case450Steps')"
            editor-height="220px"
            alert-type="success"
          />
          <WangEditorDemoBlock
            :key="`case479-${$lang}`"
            :title="$t('rt.case479Title')"
            :issue-label="$t('rt.case479Label')"
            issue-url="https://github.com/Tencent/wujie/issues/479"
            :description="$t('rt.case479Desc')"
            :steps="$t('rt.case479Steps')"
            :initial-html="$t('rt.case479Html')"
            editor-height="200px"
            alert-type="success"
          />
          <WangEditorDemoBlock
            :key="`case489-${$lang}`"
            :title="$t('rt.case489Title')"
            :issue-label="$t('rt.case489Label')"
            issue-url="https://github.com/Tencent/wujie/issues/489"
            :description="$t('rt.case489Desc')"
            :steps="$t('rt.case489Steps')"
            :initial-html="$t('rt.case489Html')"
            :show-selection-panel="true"
            editor-height="200px"
            alert-type="success"
          />
        </el-tab-pane>

        <el-tab-pane label="TinyMCE" name="tinymce">
          <TinyMceDemoBlock
            :title="$t('rt.tinymceTitle')"
            :issue-label="$t('rt.tinymceLabel')"
            issue-url="https://github.com/Tencent/wujie/issues/974"
            :description="$t('rt.tinymceDesc')"
            :steps="$t('rt.tinymceSteps')"
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
