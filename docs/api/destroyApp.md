# destroyApp

- 类型： `Function`

- 参数： `string`，子应用`name`

- 返回值： `void`

主动销毁子应用，承载子应用的`iframe`和`shadowRoot`都会被销毁，无界实例也会被销毁，相当于所有的缓存都被清空，除非后续不会再使用子应用，否则都不应该主动销毁。
