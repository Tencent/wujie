# 路由跳转
::: tip 提示
无界支持子应用间的路由的跳转，下面分场景来举例路由间如何跳转的
:::
## 主应用为 history 模式

### 子应用 A 要打开子应用 B

以 vue 主应用为例，子应用 A 的 name 为 A， 主应用 A 页面的路径为`/pathA`，子应用 B 的 name 为 B，主应用 B 页面的路径为`/pathB`

主应用 A 页面：

```vue
<template>
  <!-- 子应用 A -->
  <wujie-vue name="A" url="//hostA.com" :props="{jump}" ></WujieVue>
</template>

<script>
export default {
  methods: {
    jump(location) {
      this.$router.push(location);
    }
}
</script>
```

子应用 A 通过调用主应用传递的 jump 函数，跳转到子应用 B 的页面

```javascript
// 子应用 A 点击跳转处理函数
function handleJump() {
  window.$wujie?.props.jump({ path: "/pathB" });
}
```

### 子应用 A 要打开子应用 B 的指定路由

上面的方法，A 应用只能跳转到应用 B 的在主应用的默认路由，如果需要跳转到 B 应用的指定路由比如 `/test`：

1. 子应用 B 开启路由同步能力

2. 子应用的点击跳转函数：

```javascript
// 子应用 A 点击跳转处理函数
function handleJump() {
  window.$wujie?.props.jump({ path: "/pathB", query: { B: window.encodeURIComponent("/test") } });
}
```

由于跳转后的链接的查询参数带上了 B 应用的路径信息，而子应用 B 开启了路由同步的能力，所以能从 url 上读回需要同步的路径

### 子应用 B 为保活应用

如果子应用 B 是保活应用并且没有被打开过，也就是还没有实例化，上述的打开指定路由的方式可以正常工作，但如果子应用 B 已经实例化，保活应用的内部数据和路由状态都会保存下来不随子应用切换而丢失。

这时如果要打开子应用 B 的指定路由可以使用通信的方式 ：

子应用 A 点击跳转处理函数

```javascript
// 子应用 A 点击跳转处理函数
function handleJump() {
  window.$wujie?.bus.$emit("routeChange", "/test");
}
```

子应用 B

```javascript
// 子应用 B 监听并跳转
window.$wujie?.bus.$on("routeChange", (path) => this.$router.push({ path }));
```

## 主应用为 hash 模式

当主应用为 hash 模式时，主应用路由的 query 参数会挂载到 hash 的值后面，而无界路由同步读取的是 url 的 query 查询参数，所以需要手动的挂载查询参数

### 子应用 A 要打开子应用 B

[同上](#子应用-a-要打开子应用-b)

### 子应用 A 要打开子应用 B 的指定路由

1. 主应用 的 jump 修改：

```vue
<template>
  <wujie-vue name="A" url="//hostA.com" :props="{jump}" ></WujieVue>
</template>

<script>
export default {
  methods: {
    jump(location, query) {
      // 跳转到主应用B页面
      this.$router.push(location);
      const url = new URL(window.location.href);
      url.search = query
      // 手动的挂载url查询参数
      window.history.replaceState(null, "", url.href);
    }
}
</script>
```

2. 子应用 B 开启路由同步能力

3. 子应用的点击跳转函数：

```javascript
function handleJump() {
  window.$wujie?.props.jump({ path: "/pathB" } , `?B=${window.encodeURIComponent("/test")}`});
}
```

### 子应用 B 为保活应用

[同上](#子应用-b-为保活应用)
