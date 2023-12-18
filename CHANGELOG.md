# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.0.22](https://github.com/Tencent/wujie/compare/v1.0.20...v1.0.22) (2023-12-18)

### Bug Fixes

* 解决子应用销毁时,主应用监听事件内存未被释放 [#752](https://github.com/Tencent/wujie/issues/752) ([#753](https://github.com/Tencent/wujie/issues/753)) ([5fa87a8](https://github.com/Tencent/wujie/commit/5fa87a8b4440658c947f71126cd432c337dd8a26)), closes [#568](https://github.com/Tencent/wujie/issues/568)
* 修复降级模式会丢失事件监听器 ([#758](https://github.com/Tencent/wujie/issues/758)) ([534e865](https://github.com/Tencent/wujie/commit/534e8653c266df0373cbe3a924a79f92f4f604b8))
* 修复在safari下scriptElement的src下不可写的问题 ([84b2378](https://github.com/Tencent/wujie/commit/84b2378d952814b3112ba2b16b91db940807e2d5))
* 修复重复Object.defineProperties导致的报错 ([94bbfa6](https://github.com/Tencent/wujie/commit/94bbfa6eb879b156eeef68cd4aa68ac32d772fe3))

## [1.0.21](https://github.com/Tencent/wujie/compare/v1.0.20...v1.0.21) (2023-12-18)

### Bug Fixes

* 解决子应用销毁时,主应用监听事件内存未被释放 [#752](https://github.com/Tencent/wujie/issues/752) ([#753](https://github.com/Tencent/wujie/issues/753)) ([5fa87a8](https://github.com/Tencent/wujie/commit/5fa87a8b4440658c947f71126cd432c337dd8a26)), closes [#568](https://github.com/Tencent/wujie/issues/568)
* 修复降级模式会丢失事件监听器 ([#758](https://github.com/Tencent/wujie/issues/758)) ([534e865](https://github.com/Tencent/wujie/commit/534e8653c266df0373cbe3a924a79f92f4f604b8))
* 修复在safari下scriptElement的src下不可写的问题 ([84b2378](https://github.com/Tencent/wujie/commit/84b2378d952814b3112ba2b16b91db940807e2d5))
* 修复重复Object.defineProperties导致的报错 ([94bbfa6](https://github.com/Tencent/wujie/commit/94bbfa6eb879b156eeef68cd4aa68ac32d772fe3))

## [1.0.20](https://github.com/Tencent/wujie/compare/v1.0.18...v1.0.20) (2023-11-08)

### Bug Fixes

* 兼容部分浏览器script src不可配置 ([3eab5cf](https://github.com/Tencent/wujie/commit/3eab5cf9f5db01bbc3ac8b06699853edadb422db)), closes [#648](https://github.com/Tencent/wujie/issues/648)
* appendChildOrInsertBefore effect ignore css error ([#643](https://github.com/Tencent/wujie/issues/643)) ([17179fb](https://github.com/Tencent/wujie/commit/17179fbca76b23ee9b05eeec88818b65cc1e7daa))
* **proxy:** protect the program when getElementById throws an exception error ([#693](https://github.com/Tencent/wujie/issues/693)) ([37dc95b](https://github.com/Tencent/wujie/commit/37dc95bd45b68b1dee56f60b5cb2b7bebeb99de2))
* wujie-react watch props change, restart app ([#689](https://github.com/Tencent/wujie/issues/689)) ([1b39612](https://github.com/Tencent/wujie/commit/1b39612cab45906aa130817c940f556c48ed4f12))

**Note:** Version bump only for package wujie-project

## [1.0.18](https://github.com/Tencent/wujie/compare/v1.0.17...v1.0.18) (2023-07-11)

### Bug Fixes

* 兼容子应用定义不可修改的全局函数 ([#574](https://github.com/Tencent/wujie/issues/574)) ([79c4ee0](https://github.com/Tencent/wujie/commit/79c4ee0e44bba5c1c7341bf322be045fafcf41ed))
* 修复wujie-react偶现无法加载子应用元素 ([#599](https://github.com/Tencent/wujie/issues/599)) ([f927505](https://github.com/Tencent/wujie/commit/f92750529a06615c44c5e765bb6b5ceaac68f4e0))
* 修复wujie子应用无法监听error事件 ([#616](https://github.com/Tencent/wujie/issues/616)) ([2f9b65c](https://github.com/Tencent/wujie/commit/2f9b65c795dd6ab87a27d9d46e008e7679979eb5))
* 修改wujie子应用无监听unhandledrejection问题 ([#617](https://github.com/Tencent/wujie/issues/617)) ([9f53471](https://github.com/Tencent/wujie/commit/9f534718f90b58b6dd5e67de7a176fc2393d2be8))
* **documentProxyProperties:** add caretPositionFromPoint to document`s proxy methods ([#595](https://github.com/Tencent/wujie/issues/595)) ([8e1b446](https://github.com/Tencent/wujie/commit/8e1b4462715dbc8ead74626dc8ce1237bb7925fc))
* **iframe:** 修复 handler 为 undefined 时执行 addEventListener 错误 ([#514](https://github.com/Tencent/wujie/issues/514)) ([30bf8c1](https://github.com/Tencent/wujie/commit/30bf8c192636159a405e806722c99645ea34d17b))

### Features

* 修正css时序及重复patch的问题([#568](https://github.com/Tencent/wujie/issues/568)) ([#570](https://github.com/Tencent/wujie/issues/570)) ([f9d222c](https://github.com/Tencent/wujie/commit/f9d222c75ff21d48250a452dde943663f164ab57))

## [1.0.17](https://github.com/Tencent/wujie/compare/v1.0.16...v1.0.17) (2023-05-30)

### Bug Fixes

* 子应用window事件监听增加message事件，增加事件监听target可选参数 ([#555](https://github.com/Tencent/wujie/issues/555)) ([2255301](https://github.com/Tencent/wujie/commit/22553016a782149f259d4385be44eafc21d48fa1)), closes [#549](https://github.com/Tencent/wujie/issues/549)

## [1.0.16](https://github.com/Tencent/wujie/compare/v1.0.15...v1.0.16) (2023-05-17)

### Bug Fixes

* **proxy:** protect the program when querySelectorAll throws an exception ([#547](https://github.com/Tencent/wujie/issues/547)) ([a7f83fc](https://github.com/Tencent/wujie/commit/a7f83fc909cf7ac70cba59590f340e201639fe4e))

## [1.0.15](https://github.com/Tencent/wujie/compare/v1.0.14...v1.0.15) (2023-05-04)

### Features

* 修改umd暴露模块 ([0c4e434](https://github.com/Tencent/wujie/commit/0c4e4341bb2db904532d387ac7080c396e4df001))
* **docs:** add create-wujie md ([#537](https://github.com/Tencent/wujie/issues/537)) ([99c191a](https://github.com/Tencent/wujie/commit/99c191a9f0326b6f9ca7b106ed37ce264e892d2c))

## [1.0.14](https://github.com/Tencent/wujie/compare/v1.0.13...v1.0.14) (2023-03-31)

### Bug Fixes

* 修复获取html入口文件时，因为接口异常不能正常触发loadError生命周期 ([#481](https://github.com/Tencent/wujie/issues/481)) ([1b45d30](https://github.com/Tencent/wujie/commit/1b45d3066ef5acbcdd7aa1dcb00d01298ff3a3b8))
* 修复子应用嵌套页面空白问题 ([#492](https://github.com/Tencent/wujie/issues/492)) ([ff9714f](https://github.com/Tencent/wujie/commit/ff9714fab57b059746765f540a9f37d0db573ab5)), closes [#487](https://github.com/Tencent/wujie/issues/487) [#485](https://github.com/Tencent/wujie/issues/485)
* **iframe:** 修复 handler 为 undefined 时添加到 handlerCallbackMap 报错 ([#483](https://github.com/Tencent/wujie/issues/483)) ([9b5a7fb](https://github.com/Tencent/wujie/commit/9b5a7fb397bc8d6bc49d4d8ee5b5a4a9c8dbac00))
* **iframe:** 修复多层嵌套找不到渲染节点问题 ([#491](https://github.com/Tencent/wujie/issues/491)) ([6f54797](https://github.com/Tencent/wujie/commit/6f54797a95920aa21673b66c247e7a2ca672ebb2))

## [1.0.13](https://github.com/Tencent/wujie/compare/v1.0.12...v1.0.13) (2023-03-29)

### Bug Fixes

* 修复降级后页面无法渲染的问题 ([1883f59](https://github.com/Tencent/wujie/commit/1883f59a48e666d0533df852b60454fc0c2a476e))
* 运行主应用代码主动报错 ([#482](https://github.com/Tencent/wujie/issues/482)) ([8981b7b](https://github.com/Tencent/wujie/commit/8981b7b0168208afd316bc7956f0b79ab54dcd20))

## [1.0.12](https://github.com/Tencent/wujie/compare/v1.0.11...v1.0.12) (2023-03-28)

### Bug Fixes

* 修复属性获取问题导致代码运行报错 ([09419fd](https://github.com/Tencent/wujie/commit/09419fde6f431114c51e61a5d80484162f9a8cb2))

## [1.0.11](https://github.com/Tencent/wujie/compare/v1.0.10...v1.0.11) (2023-03-24)

### Bug Fixes

* 修复appendChild执行顺序的问题 ([#470](https://github.com/Tencent/wujie/issues/470)) ([af054da](https://github.com/Tencent/wujie/commit/af054da4e2431dc9f010db49593ff2b584299419)), closes [#465](https://github.com/Tencent/wujie/issues/465)
* 修复script脚本属性丢失的问题 ([#472](https://github.com/Tencent/wujie/issues/472)) ([300f4a7](https://github.com/Tencent/wujie/commit/300f4a7317a483364b8a82366243bfd48fdd7754)), closes [#374](https://github.com/Tencent/wujie/issues/374)

## [1.0.10](https://github.com/Tencent/wujie/compare/v1.0.9...v1.0.10) (2023-03-23)

### Bug Fixes

* 修复esm脚本执行顺序问题 ([#469](https://github.com/Tencent/wujie/issues/469)) ([998d16d](https://github.com/Tencent/wujie/commit/998d16dc4c8096bad5ff07a965520bb883cde544))

## [1.0.9](https://github.com/Tencent/wujie/compare/v1.0.8...v1.0.9) (2023-03-23)

### Bug Fixes

* 适配子应用处理script标签 ([#453](https://github.com/Tencent/wujie/issues/453)) ([f7e83b8](https://github.com/Tencent/wujie/commit/f7e83b88b0007143d60374197ec3f9e6d4c3c178))
* 修复子应用html默认属性 ([#462](https://github.com/Tencent/wujie/issues/462)) ([08e6fd2](https://github.com/Tencent/wujie/commit/08e6fd27b8f5facf4e11bdfdc3426706dca646f9))
* 修复chrome85以下版本window.window报错问题 ([#444](https://github.com/Tencent/wujie/issues/444)) ([0905c28](https://github.com/Tencent/wujie/commit/0905c284b52368aaef10f97fc501e28e2556ee4b)), closes [#280](https://github.com/Tencent/wujie/issues/280)
* 修复js执行顺序的问题 ([#468](https://github.com/Tencent/wujie/issues/468)) ([dfc1cd2](https://github.com/Tencent/wujie/commit/dfc1cd237fe8736f37e2f37504bf74808d653676)), closes [#424](https://github.com/Tencent/wujie/issues/424)

### Features

* **doc:** add algolia search ([#447](https://github.com/Tencent/wujie/issues/447)) ([c8c022a](https://github.com/Tencent/wujie/commit/c8c022ac4b61377d7711d33fb19eef2fe5760dde))

## [1.0.8](https://github.com/Tencent/wujie/compare/v1.0.6...v1.0.8) (2023-03-14)

### Bug Fixes

* 回退style属性 ([87540da](https://github.com/Tencent/wujie/commit/87540da4ed76510a1150398d7314c03a7d3e2912))
## [1.0.7](https://github.com/Tencent/wujie/compare/v1.0.6...v1.0.7) (2023-03-14)

### Bug Fixes

* 修复 vue3 组件注册时类型错误 ([#393](https://github.com/Tencent/wujie/issues/393)) ([#394](https://github.com/Tencent/wujie/issues/394)) ([6487308](https://github.com/Tencent/wujie/commit/6487308236c50e1a99d714728bc6c7118581034a))
* 修复子应用媒体元素资源路径错误的问题 ([#439](https://github.com/Tencent/wujie/issues/439)) ([68f85a8](https://github.com/Tencent/wujie/commit/68f85a8cc7089367db4f0bdfc4620135540dbd92))
* iframe的style允许被覆盖 ([#430](https://github.com/Tencent/wujie/issues/430)) ([a7c0bcd](https://github.com/Tencent/wujie/commit/a7c0bcdaa51558a55f2f80a0d85dc56fda7cb2e0))
* ignore的 link 未正确设置 ([#432](https://github.com/Tencent/wujie/issues/432)) ([ba57da9](https://github.com/Tencent/wujie/commit/ba57da9aee153652372a048bde7974672340d265))

### Features

* 执行hooks托底逻辑 ([#403](https://github.com/Tencent/wujie/issues/403)) ([2d0ba7e](https://github.com/Tencent/wujie/commit/2d0ba7ef9d03dead6bbcf5f24157325bfa878009))
* wujie dom support style props ([#375](https://github.com/Tencent/wujie/issues/375)) ([3e72e68](https://github.com/Tencent/wujie/commit/3e72e68352dde07046e1dbe7bc5ad9d0ebd87d84))

## [1.0.6](https://github.com/Tencent/wujie/compare/v1.0.5...v1.0.6) (2023-02-08)

### Bug Fixes

* 修复预加载js资源没有下载 ([#363](https://github.com/Tencent/wujie/issues/363)) ([e41c217](https://github.com/Tencent/wujie/commit/e41c2170d7a4fa48ebab59004e1fbcdc41e1fa9a))
* **chore:** 修复 Vue.use(WujieVue) 时类型错误 ([#382](https://github.com/Tencent/wujie/issues/382)) ([f293697](https://github.com/Tencent/wujie/commit/f293697e9174cee5485c09871fb9cdbbf2e89686))

## [1.0.5](https://github.com/Tencent/wujie/compare/v1.0.4...v1.0.5) (2023-01-10)

### Features

* 添加patchElementHook钩子 ([#347](https://github.com/Tencent/wujie/issues/347)) ([2a89bdb](https://github.com/Tencent/wujie/commit/2a89bdb728ade8a4ab569b1e06c00dad48756068))

## [1.0.4](https://github.com/Tencent/wujie/compare/v1.0.3...v1.0.4) (2022-12-30)

### Bug Fixes

* 适配domain修改 ([#310](https://github.com/Tencent/wujie/issues/310)) ([ac18816](https://github.com/Tencent/wujie/commit/ac1881632fe6bc8c4b019fd95e0a957a637c37d9))
* 修复子应用html加载失败后无法重试 ([#339](https://github.com/Tencent/wujie/issues/339)) ([86d93ba](https://github.com/Tencent/wujie/commit/86d93ba3fd3c93a813088face6caf81c1ab94a73))

## [1.0.3](https://github.com/Tencent/wujie/compare/v1.0.2...v1.0.3) (2022-12-12)

### Bug Fixes

* 修复保活模式下路由参数丢失的问题 ([#323](https://github.com/Tencent/wujie/issues/323)) ([ffd2d60](https://github.com/Tencent/wujie/commit/ffd2d60663ca53ccebb326afe53be90f67bdd551))
* 修复降级场景下文档非标准模式问题 ([#312](https://github.com/Tencent/wujie/issues/312)) ([d21365a](https://github.com/Tencent/wujie/commit/d21365a815e9caa48f736ab63f3de1206e86e0b5)), closes [#302](https://github.com/Tencent/wujie/issues/302)

## [1.0.2](https://github.com/Tencent/wujie/compare/v1.0.1...v1.0.2) (2022-12-06)

### Bug Fixes

* 子应用KeyboardEvent不生效 ([#305](https://github.com/Tencent/wujie/issues/305)) ([a4e1775](https://github.com/Tencent/wujie/commit/a4e17753b6224bd4bff93f21e696251030ab7cc4)), closes [#304](https://github.com/Tencent/wujie/issues/304)

### Features

* 添加子应用可以直接读取html的能力 ([#307](https://github.com/Tencent/wujie/issues/307)) ([f45e57e](https://github.com/Tencent/wujie/commit/f45e57e150b9ecb83ed593331bb7ac03cb848ee2))

## [1.0.1](https://github.com/Tencent/wujie/compare/v1.0.0...v1.0.1) (2022-11-25)

### Bug Fixes

* 兼容主应用拦截原生的createElement ([#275](https://github.com/Tencent/wujie/issues/275)) ([9d657ee](https://github.com/Tencent/wujie/commit/9d657ee98470089071c2e906848c7476105343c9)), closes [#274](https://github.com/Tencent/wujie/issues/274)
* 修正其他document调用获取元素函数无法获取的问题 ([#263](https://github.com/Tencent/wujie/issues/263)) ([9c7cccd](https://github.com/Tencent/wujie/commit/9c7cccd3f3d63e19fcc335bd855b187bdb2a50c3)), closes [#262](https://github.com/Tencent/wujie/issues/262)

### Features

* 增加degradeAttrs参数用于控制降级时的Iframe属性 ([#272](https://github.com/Tencent/wujie/issues/272)) ([16adfd4](https://github.com/Tencent/wujie/commit/16adfd41c7ec75830f908cd7e4a7ae31fbb1364d)), closes [#271](https://github.com/Tencent/wujie/issues/271)

# [1.0.0](https://github.com/Tencent/wujie/compare/v1.0.0-rc.25...v1.0.0) (2022-11-10)

### Features

* ie11 compatibility ([#248](https://github.com/Tencent/wujie/issues/248)) ([f6fd307](https://github.com/Tencent/wujie/commit/f6fd307c3365801a300ea22050aca1447f81b197)), closes [#185](https://github.com/Tencent/wujie/issues/185) [#185](https://github.com/Tencent/wujie/issues/185)

# [1.0.0-rc.25](https://github.com/Tencent/wujie/compare/v1.0.0-rc.24...v1.0.0-rc.25) (2022-11-01)

### Bug Fixes

* 修复无界主应用内嵌在iframe内部报错 ([#246](https://github.com/Tencent/wujie/issues/246)) ([56ff61e](https://github.com/Tencent/wujie/commit/56ff61e4784b140a68a57a1489d6a1a647f7c4e8))

# [1.0.0-rc.24](https://github.com/Tencent/wujie/compare/v1.0.0-rc.23...v1.0.0-rc.24) (2022-10-20)

### Bug Fixes

* 修复内嵌场景下createElement重复覆盖的问题 ([#232](https://github.com/Tencent/wujie/issues/232)) ([6a39043](https://github.com/Tencent/wujie/commit/6a390439c8f06c4a827627e26c8a33ee1a63b4c9))

# [1.0.0-rc.23](https://github.com/Tencent/wujie/compare/v1.0.0-rc.22...v1.0.0-rc.23) (2022-10-14)

### Features

* 钩子appendOrInsertElementHook添加原生元素参数 ([#220](https://github.com/Tencent/wujie/issues/220)) ([7873911](https://github.com/Tencent/wujie/commit/7873911dc7554b239a188c985dcc85395918fc49))

# [1.0.0-rc.22](https://github.com/Tencent/wujie/compare/v1.0.0-rc.21...v1.0.0-rc.22) (2022-10-13)

### Features

* 插件添加appendOrInsertElementHook钩子 ([#217](https://github.com/Tencent/wujie/issues/217)) ([fbffe68](https://github.com/Tencent/wujie/commit/fbffe6815e7d49c5051e2d1d09bf8eeddd6e8537))

# [1.0.0-rc.21](https://github.com/Tencent/wujie/compare/v1.0.0-rc.20...v1.0.0-rc.21) (2022-10-10)

### Bug Fixes

* 修复esm和jsIgnores脚本的onload事件没有触发 ([#211](https://github.com/Tencent/wujie/issues/211)) ([7846853](https://github.com/Tencent/wujie/commit/7846853830357fc87b9a8ce2f95843fa6fce210c)), closes [#210](https://github.com/Tencent/wujie/issues/210)

# [1.0.0-rc.20](https://github.com/Tencent/wujie/compare/v1.0.0-rc.19...v1.0.0-rc.20) (2022-09-30)

### Bug Fixes

* 修复异步JavaScript文件加载异常 ([#188](https://github.com/Tencent/wujie/issues/188)) ([928bb32](https://github.com/Tencent/wujie/commit/928bb3269ff204c0b52fa879e4d191feac023cc0)), closes [#184](https://github.com/Tencent/wujie/issues/184)
* 修复子应用location.origin为主应用地址问题 ([#194](https://github.com/Tencent/wujie/issues/194)) ([ed5c518](https://github.com/Tencent/wujie/commit/ed5c5182a97bcefc388554894c30274edead98a4)), closes [#193](https://github.com/Tencent/wujie/issues/193)
* 修复cacheOptions类型不正确的问题 ([#191](https://github.com/Tencent/wujie/issues/191)) ([2051e01](https://github.com/Tencent/wujie/commit/2051e01c9569ba5a8b8429537f42a0390102341d)), closes [#179](https://github.com/Tencent/wujie/issues/179)
* 依赖使用 pnpm workspace 协议 ([#186](https://github.com/Tencent/wujie/issues/186)) ([ef34944](https://github.com/Tencent/wujie/commit/ef349446937082924f47d6cd2f1f22798ea81fa4))

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

* 解决 data 与 methods 存在相同属性导致 vue 警告 ([#147](https://github.com/Tencent/wujie/issues/147)) ([bf37422](https://github.com/Tencent/wujie/commit/bf37422e939acc0425eeb0860954431efd564c57))
* 修复preload 没有使用自定义fetch ([#160](https://github.com/Tencent/wujie/issues/160)) ([136a41c](https://github.com/Tencent/wujie/commit/136a41cf944a8434a2f75ffca1a207bb34d1dddc))
* 修复react hash 模式下异常 ([#155](https://github.com/Tencent/wujie/issues/155)) ([085687c](https://github.com/Tencent/wujie/commit/085687c954f14a908ca07abcc9549308716d99b0)), closes [#151](https://github.com/Tencent/wujie/issues/151)

### Features

* **docs:** add Customized demo cli ([#148](https://github.com/Tencent/wujie/issues/148)) ([6878f24](https://github.com/Tencent/wujie/commit/6878f24f5bcf771bff4173e2ea0f6b7d867b2eb4))

# [1.0.0-rc.16](https://github.com/Tencent/wujie/compare/v1.0.0-rc.14...v1.0.0-rc.16) (2022-09-12)

### Bug Fixes

* 修复 destroy 丢失 this 上下文的问题 ([#128](https://github.com/Tencent/wujie/issues/128)) ([c4c42a3](https://github.com/Tencent/wujie/commit/c4c42a30cdd99dac2a1a405b3c3f85e0e30844be)), closes [#138](https://github.com/Tencent/wujie/issues/138) [#139](https://github.com/Tencent/wujie/issues/139)
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
* **docs:** 实时体验页面, url 回显功能 ([#122](https://github.com/Tencent/wujie/issues/122)) ([9a4f04c](https://github.com/Tencent/wujie/commit/9a4f04c0bf187563abd0a3a7c31acf4fbafff06c))
* **docs:** Experience wujie on the official website ([#110](https://github.com/Tencent/wujie/issues/110)) ([d6a004f](https://github.com/Tencent/wujie/commit/d6a004f4c1afa2f7442090b8e1d8567e30be628b))
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
