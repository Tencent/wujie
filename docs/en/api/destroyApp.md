# destroyApp

- **Type:** `Function`

- **Parameters:** `string` — the sub-app `name`

- **Returns:** `Promise<void>`

Programmatically destroys a sub-app along with its `iframe`, `shadowRoot`, and Wujie sandbox instance, clearing its runtime state. Avoid calling `destroyApp` unless the sub-app will not be reopened later.
