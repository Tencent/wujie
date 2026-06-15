<template>
  <div>
    <HelloWorld msg="弹窗处理"></HelloWorld>
    <div class="content">
      <p>弹窗无需子应用做任何处理就可使用</p>
      <h3>1、打开弹窗</h3>
      <p>
        <el-button @click="dialogVisible = true">点击打开el-dialog</el-button>
        <a-button @click="modalVisible = true" style="margin-left: 20px">点击打开ant-modal</a-button>
      </p>
      <h3>2、打开选择器</h3>
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
      <h3>3、打开气泡卡片</h3>
      <p>
        <el-popover
          placement="top-start"
          title="标题"
          width="200"
          trigger="hover"
          content="这是一段内容,这是一段内容,这是一段内容,这是一段内容。"
        >
          <el-button slot="reference">el-popover hover 激活</el-button>
        </el-popover>
        <a-popover title="Title" style="margin-left: 15px">
          <template slot="content">
            <p>Content</p>
            <p>Content</p>
          </template>
          <a-button>ant-popover Hover me </a-button>
        </a-popover>
      </p>
      <h3>4、手动向body中append弹窗</h3>
      <p>
        <AppendBody />
      </p>
      <h3>5、原生 Popper/Floating 弹出层</h3>
      <NativePopperDemo context="路由页面" />
      <div class="demo-scroll-spacer" aria-hidden="true"></div>
    </div>
    <el-dialog title="提示" :visible.sync="dialogVisible" width="760px">
      <div class="demo-dialog-scroll-body">
        <span>这是一段信息</span>
        <h4 style="margin: 16px 0 8px; font-size: 14px">弹窗内：element 选择器</h4>
        <p class="dialog-modal-row">
          <el-select v-model="dialogElValue" placeholder="el-select（弹窗内）" style="width: 220px">
            <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </p>
        <h4 style="margin: 16px 0 8px; font-size: 14px">弹窗内：element 气泡卡片</h4>
        <p class="dialog-modal-row">
          <el-popover
            placement="top-start"
            title="标题"
            width="200"
            trigger="hover"
            content="这是一段内容（弹窗内）,这是一段内容,这是一段内容,这是一段内容。"
          >
            <el-button slot="reference">el-popover hover（弹窗内）</el-button>
          </el-popover>
        </p>
        <NativePopperDemo context="el-dialog 弹窗内" :visible="dialogVisible" />
        <div class="demo-scroll-spacer" aria-hidden="true"></div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="dialogVisible = false">确 定</el-button>
      </span>
    </el-dialog>
    <a-modal v-model="modalVisible" title="ant Modal" width="760px" @ok="modalVisible = false">
      <div class="demo-dialog-scroll-body">
        <h4 style="margin: 0 0 8px; font-size: 14px">弹窗内：ant 选择器</h4>
        <p class="dialog-modal-row">
          <a-select v-model="modalAntValue" placeholder="ant-select（弹窗内）" style="width: 200px">
            <a-select-option value="jack">Jack</a-select-option>
            <a-select-option value="lucy">Lucy</a-select-option>
            <a-select-option value="disabled" disabled>Disabled</a-select-option>
            <a-select-option value="Yiminghe">yiminghe</a-select-option>
          </a-select>
        </p>
        <h4 style="margin: 16px 0 8px; font-size: 14px">弹窗内：ant 气泡卡片</h4>
        <p class="dialog-modal-row">
          <a-popover title="Title（弹窗内）">
            <template slot="content">
              <p>Content（弹窗内）</p>
              <p>Content</p>
            </template>
            <a-button>ant-popover Hover me（弹窗内）</a-button>
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
  data() {
    return {
      dialogVisible: false,
      modalVisible: false,
      options: [
        {
          value: "选项1",
          label: "黄金糕",
        },
        {
          value: "选项2",
          label: "双皮奶",
        },
        {
          value: "选项3",
          label: "蚵仔煎",
        },
        {
          value: "选项4",
          label: "龙须面",
        },
        {
          value: "选项5",
          label: "北京烤鸭",
        },
      ],
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
