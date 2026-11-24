# Route Navigation

::: tip Tip
Wujie supports cross-sub-app route navigation. Below are examples for different routing scenarios.
:::

## Main App in History Mode

### Sub-app A Opens Sub-app B

Using a Vue main app as an example: suppose Sub-app A has `name="A"` mounted at main app path `/pathA`, and Sub-app B has `name="B"` mounted at main app path `/pathB`.

Main app page hosting Sub-app A:

```vue
<template>
  <!-- Sub-app A -->
  <WujieVue name="A" url="//hostA.com" :props="{ jump }"></WujieVue>
</template>

<script>
export default {
  methods: {
    jump(location) {
      this.$router.push(location);
    },
  },
};
</script>
```

Sub-app A invokes the `jump` method passed from the main app to navigate to Sub-app B's page:

```javascript
// Click handler inside Sub-app A
function handleJump() {
  window.$wujie?.props.jump({ path: "/pathB" });
}
```

### Sub-app A Opens a Specific Route in Sub-app B

The method above navigates to Sub-app B's default route. To navigate to a specific route in Sub-app B (for example, `/test`):

1. Enable Route Sync (`sync: true`) on Sub-app B.

2. Pass Sub-app B's target route in the query parameter when jumping from Sub-app A:

```javascript
// Click handler inside Sub-app A
function handleJump() {
  window.$wujie?.props.jump({ path: "/pathB", query: { B: "/test" } });
}
```

Because the target URL includes Sub-app B's route in its query string and Sub-app B has Route Sync enabled, Sub-app B will read and restore that route on startup. Note that this approach only takes effect when Sub-app B has not yet been activated.

### Sub-app B Is in Keep-Alive Mode

If Sub-app B uses Keep-Alive Mode and has not been opened yet (i.e., not yet instantiated), the query-parameter approach above works as expected. However, once Sub-app B has been instantiated, its internal state and route are preserved across switches.

In that case, use `EventBus` communication to navigate Sub-app B to a specific route:

Click handler inside Sub-app A:

```javascript
// Emit route change event from Sub-app A
function handleJump() {
  window.$wujie?.bus.$emit("routeChange", "/test");
}
```

Listener inside Sub-app B:

```javascript
// Listen and navigate inside Sub-app B
window.$wujie?.bus.$on("routeChange", (path) => this.$router.push({ path }));
```

## Main App in Hash Mode

When the main app uses `hash` routing mode, router query parameters are appended after `#`, whereas Wujie's Route Sync reads from the URL's standard query string (`window.location.search`). You therefore need to attach the query string manually.

### Sub-app A Opens Sub-app B

[Same as above](#sub-app-a-opens-sub-app-b)

### Sub-app A Opens a Specific Route in Sub-app B

1. Update the main app's `jump` method:

```vue
<template>
  <WujieVue name="A" url="//hostA.com" :props="{ jump }"></WujieVue>
</template>

<script>
export default {
  methods: {
    jump(location, query) {
      // Navigate to the main app page hosting Sub-app B
      this.$router.push(location);
      const url = new URL(window.location.href);
      url.search = query;
      // Manually attach the URL search query
      window.history.replaceState(null, "", url.href);
    },
  },
};
</script>
```

2. Enable Route Sync (`sync: true`) on Sub-app B.

3. Update Sub-app A's click handler:

```javascript
function handleJump() {
  window.$wujie?.props.jump({ path: "/pathB" }, `?B=${window.encodeURIComponent("/test")}`);
}
```

### Sub-app B Is in Keep-Alive Mode

[Same as above](#sub-app-b-is-in-keep-alive-mode)
