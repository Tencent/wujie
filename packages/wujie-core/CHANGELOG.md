# 1.0.0-rc.12 (2022-08-25)


### Bug Fixes

* 修复集成测试失败 ([#86](https://github.com/Tencent/wujie/issues/86)) ([38fc786](https://github.com/Tencent/wujie/commit/38fc786efcf957cfff07203bde4a549afe25e4f2))
* 修复子应用加载页面生命周期无法触发 ([#85](https://github.com/Tencent/wujie/issues/85)) ([ea8efcb](https://github.com/Tencent/wujie/commit/ea8efcb2c8ac0c2378f9154e684d883497ef9a45))
* wujie-core package has eslint error ([#81](https://github.com/Tencent/wujie/issues/81)) ([f169411](https://github.com/Tencent/wujie/commit/f16941149c37f2e82bb8b884fc87393c76a4441f))


### Features

* 添加jsIgnores和cssIgnores两个插件 ([#95](https://github.com/Tencent/wujie/issues/95)) ([7631e7c](https://github.com/Tencent/wujie/commit/7631e7cfca996ff030becdf8e986e4779b6e7142))
* 修复style标签被重复代理的情况 ([#80](https://github.com/Tencent/wujie/issues/80)) ([1769506](https://github.com/Tencent/wujie/commit/1769506738222dcb3ac5fcd762030f97869b0521))



# 1.0.0-rc.11 (2022-08-17)


### Features

* 子应用判断window.window为window ([#69](https://github.com/Tencent/wujie/issues/69)) ([66c528b](https://github.com/Tencent/wujie/commit/66c528bb840111ac32c0b7bcfe4d2d3ffca186ce))



# 1.0.0-rc.10 (2022-08-16)


### Features

* 将createApp改名为setupApp ([#66](https://github.com/Tencent/wujie/issues/66)) ([8aa3218](https://github.com/Tencent/wujie/commit/8aa3218bf9fd557e8bac7cc979f56a5e344007a1))



# 1.0.0-rc.9 (2022-08-15)


### Bug Fixes

* 修复子应用window.window指向问题 ([#57](https://github.com/Tencent/wujie/issues/57)) ([1938892](https://github.com/Tencent/wujie/commit/1938892f4d3f6e462a040d90671ee381e4bca8ac))


### Features

* 添加createApp全局配置缓存 ([#64](https://github.com/Tencent/wujie/issues/64)) ([dd3d687](https://github.com/Tencent/wujie/commit/dd3d68714fe2d0d57de9d6fe359cb39d7623e36b))



# 1.0.0-rc.8 (2022-08-11)


### Bug Fixes

* 修复head和body被应用缓存的问题 ([#50](https://github.com/Tencent/wujie/issues/50)) ([0959ce4](https://github.com/Tencent/wujie/commit/0959ce4cad247b4e9ad3e64f99b2feffa9a1a071))



# 1.0.0-rc.7 (2022-08-08)


### Bug Fixes

* 修复子应用字体无法加载的问题 ([#33](https://github.com/Tencent/wujie/issues/33)) ([a33dec5](https://github.com/Tencent/wujie/commit/a33dec57de1beb0198d6d00c11c77fb984e3abe2))
* 修复url解析错误问题 ([#37](https://github.com/Tencent/wujie/issues/37)) ([027c442](https://github.com/Tencent/wujie/commit/027c4422a7f592a1cfdb744d3be7ee1a820d3d47))


### Features

* 将子应用样式中相对地址默认转换成绝对地址 ([#35](https://github.com/Tencent/wujie/issues/35)) ([a74f236](https://github.com/Tencent/wujie/commit/a74f236af978e2e9a4db58881d49fae5f78a56b6))
* jsExcludes 和 cssExcludes 支持正则 ([#21](https://github.com/Tencent/wujie/issues/21)) ([8c902a4](https://github.com/Tencent/wujie/commit/8c902a48c5a14804cb8d74e20142c578ca7b6015))



# 1.0.0-rc.6 (2022-07-28)


### Bug Fixes

* dynamic append js-module script error ([#18](https://github.com/Tencent/wujie/issues/18)) ([1181351](https://github.com/Tencent/wujie/commit/1181351507d9efd92633c625f3a8a1b99b9cae1d))



# 1.0.0-rc.5 (2022-07-27)


### Bug Fixes

* 修复webpack publicPath为auto无法加载资源问题 ([7e2fd28](https://github.com/Tencent/wujie/commit/7e2fd28d71db57984f1584983106e600c8cfca23))



# 1.0.0-rc.4 (2022-07-15)


### Bug Fixes

* 修复vite子应用css3变量没有生效 ([#12](https://github.com/Tencent/wujie/issues/12)) ([261bc01](https://github.com/Tencent/wujie/commit/261bc01a135fe2a91b679c18313ec143454c00e0))



# 1.0.0-rc.3 (2022-07-08)


### Bug Fixes

* 添加onEvent回调事件类型判断 ([a52238e](https://github.com/Tencent/wujie/commit/a52238ead1a8b2ddd14f16da6be11f679a98d626))



# 1.0.0-rc.2 (2022-07-07)


### Bug Fixes

* 修复document无法设置事件回调 ([aba63ed](https://github.com/Tencent/wujie/commit/aba63ed9d1610e140221cf1be202814c364e389f))



# 1.0.0-rc.1 (2022-07-05)


### Features

* init ([30397aa](https://github.com/Tencent/wujie/commit/30397aaa675a4d07bde278aa9d30447c7efe6625))



