# 路由同步
## 路由同步

路由同步会将子应用路径的`path+query+hash`通过`window.encodeURIComponent`编码后挂载在主应用`url`的查询参数上，其中`key`值为子应用的 [name](/api/startApp.html#name)。

开启路由同步后，刷新浏览器或者将`url`分享出去子应用的路由状态都不会丢失，当一个页面存在多个子应用时无界支持所有子应用路由同步，浏览器刷新、前进、后退子应用路由状态也都不会丢失

开启参数 [sync](/api/startApp.html#sync)

::: warning 注意
只有无界实例在初次实例化的时候才会从`url`上读回路由信息，一旦实例化完成后续只会单向的将子应用路由同步到主应用`url`上
:::

## 短路径

无界提供短路径的能力，当子应用的`url`过长时，可以通过配置 [prefix](/api/startApp.html#prefix) 来缩短子应用同步到主应用的路径，无界在选取短路径的时候，按照匹配最长路径原则选取短路径。

完成匹配后子应用匹配到的路径将被`{短路径} + 剩余路径`的方式挂载到主应用`url`上，注意在匹配路径的时候请不要带上域名

**示例**

```vue
<WujieVue
  width="100%"
  height="100%"
  name="xxx"
  :url="xxx"
  :sync="true"
  :prefix="{
    prod: '/example/prod',
    test: '/example/test'
    prodId: '/example/prod/debug?id=',
  }"
></WujieVue>

```

此时子应用不同路径将转换如下：

```
/example/prod/name  => {prod}/hello

/example/test/name => {test}/name

/example/prod/debug?id=5&age=10 => {prodId}5&age=10
```
