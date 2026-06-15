<template>
  <div class="native-popper-demo">
    <h4>{{ context }}：原生定位库弹出层</h4>
    <p class="native-popper-demo__desc">
      点击按钮打开 append 到 document.body 的原生弹出层，用于观察无界子应用内是否发生漂移。
    </p>
    <div class="native-popper-demo__grid">
      <div v-for="item in demoCases" :key="item.key" class="native-popper-demo__item">
        <button :ref="`reference-${item.key}`" class="native-popper-demo__button" @click="toggle(item.key)">
          {{ item.label }}
        </button>
        <div v-show="activeKey === item.key" :ref="`popper-${item.key}`" class="native-popper-demo__popper">
          <strong>{{ item.title }}</strong>
          <span>{{ context }}</span>
          <small>placement: top / appendTo: body / gpu transform</small>
          <div class="native-popper-demo__arrow" data-popper-arrow></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PopperV1 from "popper.js";
import { createPopper } from "@popperjs/core";
import { autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";

const DEMO_CASES = [
  {
    key: "popper1",
    label: "打开 Popper.js 1.x",
    title: "Popper.js 1.16.1",
  },
  {
    key: "popper2",
    label: "打开 Popper.js 2.x",
    title: "@popperjs/core 2.11.8",
  },
  {
    key: "floating",
    label: "打开 Floating UI",
    title: "@floating-ui/dom 0.5.4",
  },
];

export default {
  name: "NativePopperDemo",
  props: {
    context: {
      type: String,
      default: "",
    },
    visible: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      activeKey: "",
      demoCases: DEMO_CASES,
      instances: {},
    };
  },
  watch: {
    visible(value) {
      if (!value) {
        this.hideActive();
      } else {
        this.$nextTick(this.updateActive);
      }
    },
  },
  mounted() {
    this.appendPopperElements();
  },
  beforeDestroy() {
    this.destroyAll();
    this.removePopperElements();
  },
  methods: {
    toggle(key) {
      if (this.activeKey === key) {
        this.hideActive();
        return;
      }
      this.show(key);
    },
    show(key) {
      this.hideActive();
      this.activeKey = key;
      this.$nextTick(() => {
        this.appendPopperElements();
        const referenceEl = this.getReferenceEl(key);
        const popperEl = this.getPopperEl(key);
        if (!referenceEl || !popperEl) return;
        popperEl.style.display = "block";
        this.instances[key] = this.createInstance(key, referenceEl, popperEl);
        this.updateActive();
      });
    },
    hideActive() {
      const key = this.activeKey;
      if (!key) return;
      this.destroyInstance(key);
      const popperEl = this.getPopperEl(key);
      if (popperEl) popperEl.style.display = "none";
      this.activeKey = "";
    },
    updateActive() {
      const instance = this.instances[this.activeKey];
      if (instance && instance.update) instance.update();
    },
    createInstance(key, referenceEl, popperEl) {
      if (key === "popper1") {
        return new PopperV1(referenceEl, popperEl, {
          placement: "top",
          gpuAcceleration: true,
          modifiers: {
            offset: {
              offset: "0, 8",
            },
            preventOverflow: {
              boundariesElement: "viewport",
              padding: 8,
            },
          },
        });
      }

      if (key === "popper2") {
        return createPopper(referenceEl, popperEl, {
          placement: "top",
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, 8],
              },
            },
            {
              name: "flip",
            },
            {
              name: "preventOverflow",
              options: {
                boundary: "viewport",
                padding: 8,
              },
            },
            {
              name: "computeStyles",
              options: {
                gpuAcceleration: true,
              },
            },
          ],
        });
      }

      return this.createFloatingInstance(referenceEl, popperEl);
    },
    createFloatingInstance(referenceEl, popperEl) {
      const update = () => {
        computePosition(referenceEl, popperEl, {
          placement: "top",
          strategy: "absolute",
          middleware: [offset(8), flip(), shift({ padding: 8 })],
        }).then(({ x, y, strategy }) => {
          Object.assign(popperEl.style, {
            position: strategy,
            left: "0",
            top: "0",
            transform: `translate3d(${x}px, ${y}px, 0)`,
            willChange: "transform",
          });
        });
      };
      const cleanup = autoUpdate(referenceEl, popperEl, update);
      update();
      return {
        update,
        destroy: cleanup,
      };
    },
    destroyInstance(key) {
      const instance = this.instances[key];
      if (!instance) return;
      if (instance.destroy) instance.destroy();
      this.$delete(this.instances, key);
    },
    destroyAll() {
      Object.keys(this.instances).forEach(this.destroyInstance);
    },
    appendPopperElements() {
      this.demoCases.forEach((item) => {
        const popperEl = this.getPopperEl(item.key);
        if (popperEl && popperEl.parentNode !== document.body) {
          document.body.appendChild(popperEl);
        }
      });
    },
    removePopperElements() {
      this.demoCases.forEach((item) => {
        const popperEl = this.getPopperEl(item.key);
        if (popperEl && popperEl.parentNode) {
          popperEl.parentNode.removeChild(popperEl);
        }
      });
    },
    getReferenceEl(key) {
      return this.getRef(`reference-${key}`);
    },
    getPopperEl(key) {
      return this.getRef(`popper-${key}`);
    },
    getRef(name) {
      const ref = this.$refs[name];
      return Array.isArray(ref) ? ref[0] : ref;
    },
  },
};
</script>

<style scoped>
.native-popper-demo {
  margin-top: 18px;
  padding: 14px;
  border: 1px dashed #9fb7ff;
  border-radius: 6px;
  background: #f7faff;
}

.native-popper-demo h4 {
  margin: 0 0 8px;
  font-size: 14px;
}

.native-popper-demo__desc {
  margin: 0 0 12px;
  color: #666;
}

.native-popper-demo__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.native-popper-demo__button {
  padding: 7px 12px;
  color: #0239d0;
  cursor: pointer;
  background: #fff;
  border: 1px solid #b9c9ff;
  border-radius: 4px;
}

.native-popper-demo__popper {
  z-index: 3000;
  display: none;
  box-sizing: border-box;
  width: 220px;
  padding: 10px 12px;
  color: #fff;
  text-align: left;
  background: #1f2d3d;
  border-radius: 4px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
}

.native-popper-demo__popper strong,
.native-popper-demo__popper span,
.native-popper-demo__popper small {
  display: block;
}

.native-popper-demo__popper small {
  margin-top: 6px;
  color: #c8d3e0;
}

.native-popper-demo__arrow,
.native-popper-demo__arrow::before {
  position: absolute;
  width: 8px;
  height: 8px;
  background: inherit;
}

.native-popper-demo__arrow {
  visibility: hidden;
}

.native-popper-demo__arrow::before {
  visibility: visible;
  content: "";
  transform: rotate(45deg);
}

.native-popper-demo__popper[x-placement^="top"] .native-popper-demo__arrow,
.native-popper-demo__popper[data-popper-placement^="top"] .native-popper-demo__arrow {
  bottom: -4px;
}
</style>
