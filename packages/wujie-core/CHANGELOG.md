# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-rc.19](https://github.com/Tencent/wujie/compare/v1.0.0-rc.18...v1.0.0-rc.19) (2022-09-23)

### Bug Fixes

* 修复async脚本导致脚本执行顺序错乱问题 ([#173](https://github.com/Tencent/wujie/issues/173)) ([60a3e0c](https://github.com/Tencent/wujie/commit/60a3e0c5644ace3fadd88474c3b11c4193ebdbb3))
* 修复defer脚本无法关闭fiber模式 ([#166](https://github.com/Tencent/wujie/issues/166)) ([ef58f48](https://github.com/Tencent/wujie/commit/ef58f4855080da275e969f5043fbf0d298eb1290))
* 修复destroy没有清除子应用dom的问题 ([#175](https://github.com/Tencent/wujie/issues/175)) ([3180d16](https://github.com/Tencent/wujie/commit/3180d16b1cfdb7d5a805c1cd5cc5d003a0872bf3)), closes [#170](https://github.com/Tencent/wujie/issues/170)
* 修复js文件下载失败会导致子应用运行失败 ([#174](https://github.com/Tencent/wujie/issues/174)) ([7575de4](https://github.com/Tencent/wujie/commit/7575de44067cdde00c21947ddeaf1ca670330a84)), closes [#172](https://github.com/Tencent/wujie/issues/172)

# [1.0.0-rc.18](https://github.com/Tencent/wujie/compare/v1.0.0-rc.17...v1.0.0-rc.18) (2022-09-22)

### Bug Fixes

* 修复子应用切换插件样式重复问题 ([#163](https://github.com/Tencent/wujie/issues/163)) ([bf0fb18](https://github.com/Tencent/wujie/commit/bf0fb18f579707bd1774ce941f4149f10507c0d7)), closes [#161](https://github.com/Tencent/wujie/issues/161)
* 修复子应用切换模板样式重复问题 ([#164](https://github.com/Tencent/wujie/issues/164)) ([80e1b4b](https://github.com/Tencent/wujie/commit/80e1b4b60ab6b54b1f61d1988ee66d92d794d133))

### Features

* 去除removeEventListener无回调函数告警 ([149e8e9](https://github.com/Tencent/wujie/commit/149e8e97095d286e4cdc6505c3cc0c4973396a8f))

# [1.0.0-rc.17](https://github.com/Tencent/wujie/compare/v1.0.0-rc.16...v1.0.0-rc.17) (2022-09-20)

### Bug Fixes

* 修复preload 没有使用自定义fetch ([#160](https://github.com/Tencent/wujie/issues/160)) ([136a41c](https://github.com/Tencent/wujie/commit/136a41cf944a8434a2f75ffca1a207bb34d1dddc))
* 修复react hash 模式下异常 ([#155](https://github.com/Tencent/wujie/issues/155)) ([085687c](https://github.com/Tencent/wujie/commit/085687c954f14a908ca07abcc9549308716d99b0)), closes [#151](https://github.com/Tencent/wujie/issues/151)

# [1.0.0-rc.16](https://github.com/Tencent/wujie/compare/v1.0.0-rc.14...v1.0.0-rc.16) (2022-09-12)

### Bug Fixes

* 修复绝对路径对hash路由的影响 ([#140](https://github.com/Tencent/wujie/issues/140)) ([cb62f2f](https://github.com/Tencent/wujie/commit/cb62f2f7bb733f6d4bfc2c7d5e4b1b8f8a58e78b)), closes [#136](https://github.com/Tencent/wujie/issues/136)
* 修复react16 scroll合成事件无法触发问题 ([#144](https://github.com/Tencent/wujie/issues/144)) ([454606c](https://github.com/Tencent/wujie/commit/454606c053777a2519e4016942cdd5c5ab7240bb))
* 修正 destroy 后 unmount 报错 ([#129](https://github.com/Tencent/wujie/issues/129)) ([7c31393](https://github.com/Tencent/wujie/commit/7c31393550877a8d5ac02126db37708dc7de9e2c))

# [1.0.0-rc.15](https://github.com/Tencent/wujie/compare/v1.0.0-rc.14...v1.0.0-rc.15) (2022-09-09)

### Bug Fixes

* 修复绝对路径对hash路由的影响 ([#140](https://github.com/Tencent/wujie/issues/140)) ([cb62f2f](https://github.com/Tencent/wujie/commit/cb62f2f7bb733f6d4bfc2c7d5e4b1b8f8a58e78b)), closes [#136](https://github.com/Tencent/wujie/issues/136)
* 修正 destroy 后 unmount 报错 ([#129](https://github.com/Tencent/wujie/issues/129)) ([7c31393](https://github.com/Tencent/wujie/commit/7c31393550877a8d5ac02126db37708dc7de9e2c))

# [1.0.0-rc.14](https://github.com/Tencent/wujie/compare/v1.0.0-rc.13...v1.0.0-rc.14) (2022-09-06)

### Bug Fixes

* 修复使用twind切换应用样式丢失的问题 ([#131](https://github.com/Tencent/wujie/issues/131)) ([71d81b7](https://github.com/Tencent/wujie/commit/71d81b7bdee1d921c0c6d1e6e043462526d477d5)), closes [#116](https://github.com/Tencent/wujie/issues/116)
* 修复svg在append到元素之后ownerdocument失效问题 ([#132](https://github.com/Tencent/wujie/issues/132)) ([be205d2](https://github.com/Tencent/wujie/commit/be205d243cdeffddaecbeedb3dc6b2c27d806233))

# [1.0.0-rc.13](https://github.com/Tencent/wujie/compare/v1.0.0-rc.12...v1.0.0-rc.13) (2022-09-02)

### Bug Fixes

* 修复空连接或者hash链接也被转换成绝对地址 ([#113](https://github.com/Tencent/wujie/issues/113)) ([3d4232d](https://github.com/Tencent/wujie/commit/3d4232d58ff25ffb26f187b06fb0134bccd4c9fc)), closes [#107](https://github.com/Tencent/wujie/issues/107)
* 修复window被proxy导致作用域错误 ([#106](https://github.com/Tencent/wujie/issues/106)) ([4895297](https://github.com/Tencent/wujie/commit/48952979e71af2df1b97c43650a824a656baf5ab)), closes [#102](https://github.com/Tencent/wujie/issues/102)
* **plugin:** fix cssLoader to exclude a data URL ([#103](https://github.com/Tencent/wujie/issues/103)) ([61546fb](https://github.com/Tencent/wujie/commit/61546fbd5a9e627f87c5de16c3fe98470a36f0ac))

### Features

* 添加默认loading的能力和api ([#121](https://github.com/Tencent/wujie/issues/121)) ([841385f](https://github.com/Tencent/wujie/commit/841385f06e1c6a806e58d0392cef713626b222f9)), closes [#111](https://github.com/Tencent/wujie/issues/111) [#120](https://github.com/Tencent/wujie/issues/120)
* monorepo采用pnpm方案 ([#109](https://github.com/Tencent/wujie/issues/109)) ([34d460d](https://github.com/Tencent/wujie/commit/34d460d36f0df6b12fab79abbf98aa45aab9826d)), closes [#108](https://github.com/Tencent/wujie/issues/108) [#10](https://github.com/Tencent/wujie/issues/10)

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
