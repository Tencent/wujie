# Nested Apps

Wujie supports nesting sub-apps inside other sub-apps. Nested apps behave identically to top-level sub-apps, with full support for preloading, Keep-Alive mode, route synchronization, and communication.

[bus](/en/api/bus.html#bus) enables decentralized communication across all applications (including nested sub-apps), and [destroyApp](/en/api/destroyApp.html#destroyapp) can destroy any sub-app (including nested ones).

::: warning Warning
Nested sub-apps should also use globally unique `name` identifiers unless you intentionally want to reuse an already rendered sub-app instance.
:::
