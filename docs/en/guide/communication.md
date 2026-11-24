# Communication

Wujie provides three built-in ways for applications to communicate with each other.

## Props Communication

The main app can inject data and methods into a sub-app via [props](/en/api/startApp.html#props):

```vue
<WujieVue name="xxx" url="xxx" :props="{ data: xxx, methods: xxx }"></WujieVue>
```

The sub-app reads them via [$wujie](/en/api/wujie.html#wujie-props):

```javascript
const props = window.$wujie?.props; // { data: xxx, methods: xxx }
```

## Window Communication

Because a sub-app's `iframe` shares the same origin as the main app, they can access each other's globals directly.

Main app reading a sub-app's global property:

```javascript
window.document.querySelector("iframe[name=sub-app-id]").contentWindow.xxx;
```

Sub-app reading a main app's global property:

```javascript
window.parent.xxx;
```

## EventBus Communication

Wujie provides a decentralized `EventBus` so the main app and sub-apps — as well as multiple sub-apps — can communicate effortlessly. See the [bus API](/en/api/bus.html#bus) for details.

Main app usage:

```javascript
// Using wujie directly
import { bus } from "wujie";

// Using wujie-vue2 or wujie-vue3
import WujieVue from "wujie-vue3";
const { bus } = WujieVue;

// Using wujie-react
import WujieReact from "wujie-react";
const { bus } = WujieReact;

// Listen for an event in the main app
bus.$on("event-name", function (arg1, arg2, ...) {});
// Emit an event from the main app
bus.$emit("event-name", arg1, arg2, ...);
// Unsubscribe from an event in the main app
bus.$off("event-name", function (arg1, arg2, ...) {});
```

Sub-app usage:

```javascript
// Listen for an event in the sub-app
window.$wujie?.bus.$on("event-name", function (arg1, arg2, ...) {});
// Emit an event from the sub-app
window.$wujie?.bus.$emit("event-name", arg1, arg2, ...);
// Unsubscribe from an event in the sub-app
window.$wujie?.bus.$off("event-name", function (arg1, arg2, ...) {});
```
