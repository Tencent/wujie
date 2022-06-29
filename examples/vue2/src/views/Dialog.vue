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
        <el-select v-model="value" placeholder="el-select">
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
    </div>
    <el-dialog title="提示" :visible.sync="dialogVisible" width="30%">
      <span>这是一段信息</span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="dialogVisible = false">确 定</el-button>
      </span>
    </el-dialog>
    <a-modal v-model="modalVisible" title="ant Modal" @ok="modalVisible = false">
      <p>Some contents...</p>
      <p>Some contents...</p>
      <p>Some contents...</p>
    </a-modal>
  </div>
</template>

<script>
import HelloWorld from "@/components/HelloWorld.vue";
import AppendBody from "@/components/AppendBody.vue";
export default {
  components: {
    HelloWorld,
    AppendBody,
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
</style>
