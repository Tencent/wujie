<template>
  <div>
    <HelloWorld :msg="$t('dialog.title')"></HelloWorld>
    <div class="content">
      <p>{{ $t("dialog.intro") }}</p>
      <h3>{{ $t("dialog.step1") }}</h3>
      <p>
        <el-button @click="dialogVisible = true">{{ $t("dialog.openElDialog") }}</el-button>
        <a-button @click="modalVisible = true" style="margin-left: 20px">{{ $t("dialog.openAntModal") }}</a-button>
      </p>
      <h3>{{ $t("dialog.step2") }}</h3>
      <p>
        <el-select v-model="value" placeholder="el-select" :popper-append-to-body="false">
          <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"></el-option>
        </el-select>
        <a-select placeholder="ant-select" style="margin-left: 20px; width: 200px">
          <a-select-option value="jack">Jack</a-select-option>
          <a-select-option value="lucy">Lucy</a-select-option>
          <a-select-option value="disabled" disabled>Disabled</a-select-option>
          <a-select-option value="Yiminghe">yiminghe</a-select-option>
        </a-select>
      </p>
      <h3>{{ $t("dialog.step3") }}</h3>
      <p>
        <el-popover
          placement="top-start"
          :title="$t('dialog.popoverTitle')"
          width="200"
          trigger="hover"
          :content="$t('dialog.popoverContent')"
        >
          <el-button slot="reference">{{ $t("dialog.elPopoverHover") }}</el-button>
        </el-popover>
        <a-popover title="Title" style="margin-left: 15px">
          <template slot="content">
            <p>Content</p>
            <p>Content</p>
          </template>
          <a-button>ant-popover Hover me </a-button>
        </a-popover>
      </p>
      <h3>{{ $t("dialog.step4") }}</h3>
      <p>
        <AppendBody />
      </p>
      <h3>{{ $t("dialog.step5") }}</h3>
      <NativePopperDemo :context="$t('dialog.routePageCtx')" />
      <div class="demo-scroll-spacer" aria-hidden="true"></div>
    </div>
    <el-dialog :title="$t('dialog.tipsTitle')" :visible.sync="dialogVisible" width="760px">
      <div class="demo-dialog-scroll-body">
        <span>{{ $t("dialog.tipsBody") }}</span>
        <h4 style="margin: 16px 0 8px; font-size: 14px">{{ $t("dialog.innerElSelectTitle") }}</h4>
        <p class="dialog-modal-row">
          <el-select v-model="dialogElValue" :placeholder="$t('dialog.innerElSelectPlaceholder')" style="width: 220px">
            <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </p>
        <h4 style="margin: 16px 0 8px; font-size: 14px">{{ $t("dialog.innerElPopoverTitle") }}</h4>
        <p class="dialog-modal-row">
          <el-popover
            placement="top-start"
            :title="$t('dialog.popoverTitle')"
            width="200"
            trigger="hover"
            :content="$t('dialog.innerElPopoverContent')"
          >
            <el-button slot="reference">{{ $t("dialog.innerElPopoverBtn") }}</el-button>
          </el-popover>
        </p>
        <NativePopperDemo :context="$t('dialog.elDialogCtx')" :visible="dialogVisible" />
        <div class="demo-scroll-spacer" aria-hidden="true"></div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">{{ $t("dialog.cancel") }}</el-button>
        <el-button type="primary" @click="dialogVisible = false">{{ $t("dialog.confirm") }}</el-button>
      </span>
    </el-dialog>
    <a-modal v-model="modalVisible" title="ant Modal" width="760px" @ok="modalVisible = false">
      <div class="demo-dialog-scroll-body">
        <h4 style="margin: 0 0 8px; font-size: 14px">{{ $t("dialog.innerAntSelectTitle") }}</h4>
        <p class="dialog-modal-row">
          <a-select v-model="modalAntValue" :placeholder="$t('dialog.innerAntSelectPlaceholder')" style="width: 200px">
            <a-select-option value="jack">Jack</a-select-option>
            <a-select-option value="lucy">Lucy</a-select-option>
            <a-select-option value="disabled" disabled>Disabled</a-select-option>
            <a-select-option value="Yiminghe">yiminghe</a-select-option>
          </a-select>
        </p>
        <h4 style="margin: 16px 0 8px; font-size: 14px">{{ $t("dialog.innerAntPopoverHeading") }}</h4>
        <p class="dialog-modal-row">
          <a-popover :title="$t('dialog.innerAntPopoverTitle')">
            <template slot="content">
              <p>{{ $t("dialog.innerAntPopoverContent") }}</p>
              <p>Content</p>
            </template>
            <a-button>{{ $t("dialog.innerAntPopoverBtn") }}</a-button>
          </a-popover>
        </p>
        <div class="demo-scroll-spacer" aria-hidden="true"></div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import HelloWorld from "@/components/HelloWorld.vue";
import AppendBody from "@/components/AppendBody.vue";
import NativePopperDemo from "@/components/NativePopperDemo.vue";
export default {
  components: {
    HelloWorld,
    AppendBody,
    NativePopperDemo,
  },
  computed: {
    options() {
      return [
        { value: "选项1", label: this.$t("dialog.opt1") },
        { value: "选项2", label: this.$t("dialog.opt2") },
        { value: "选项3", label: this.$t("dialog.opt3") },
        { value: "选项4", label: this.$t("dialog.opt4") },
        { value: "选项5", label: this.$t("dialog.opt5") },
      ];
    },
  },
  data() {
    return {
      dialogVisible: false,
      modalVisible: false,
      value: "",
      dialogElValue: "",
      modalAntValue: undefined,
    };
  },
  mounted() {
    console.log("vue2 dialog mounted");
  },
};
</script>

<style>
:root {
  --host-color: #0239d0;
}

.dialog-modal-row {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 12px;
  margin: 0 0 8px;
}

.demo-scroll-spacer {
  height: 520px;
}

.demo-dialog-scroll-body {
  max-height: 60vh;
  overflow: auto;
  padding-right: 8px;
}
</style>
