# wujie-react

Official React wrapper component for [Wujie](https://github.com/Tencent/wujie), a micro-frontend framework powered by **Web Components** and **iframes**.

## Installation

```bash
npm install wujie-react
```

## Quick Start

```jsx
import React, { useRef } from "react";
import WujieReact from "wujie-react";

const { bus, setupApp, preloadApp, destroyApp, refreshApp, clearAssetsCache } = WujieReact;

export default function App() {
  const wujieRef = useRef(null);

  return (
    <WujieReact
      ref={wujieRef}
      width="100%"
      height="100%"
      name="sub-app"
      url="https://sub-app.example.com/"
      sync={true}
      props={{ user: "alice" }}
    />
  );
}
```

## Props & Methods

- Accepts all `startApp` options (except `el`) as component props, plus `width`, `height`, and `style`.
- Exposes static helpers: `WujieReact.bus`, `WujieReact.setupApp`, `WujieReact.preloadApp`, `WujieReact.destroyApp`, `WujieReact.refreshApp`, and `WujieReact.clearAssetsCache`.
- Instance method `wujieRef.current.refresh()` destroys and rebuilds the sub-app reusing its current props.

## Documentation & Links

- [React Wrapper Guide](https://wujie-micro.github.io/doc/en/pack/react.html)
- [Documentation (English)](https://wujie-micro.github.io/doc/en/)
- [React Main App Demo](https://wujie-micro.github.io/demo-main-react/?lang=en)
- [GitHub Repository](https://github.com/Tencent/wujie)
- [License: MIT](https://github.com/Tencent/wujie/blob/master/LICENSE)
