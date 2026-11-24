# Global Variables

Wujie injects several global variables onto the sub-app's `window` object:

```typescript
declare global {
  interface Window {
    // Whether running inside Wujie
    __POWERED_BY_WUJIE__?: boolean;
    // Public base URL of the sub-app
    __WUJIE_PUBLIC_PATH__: string;
    // Native unproxied querySelector
    __WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__: typeof Document.prototype.querySelector;
    // Native unproxied querySelectorAll
    __WUJIE_RAW_DOCUMENT_QUERY_SELECTOR_ALL__: typeof Document.prototype.querySelectorAll;
    // Native unproxied window object
    __WUJIE_RAW_WINDOW__: Window;
    // Sub-app sandbox instance
    __WUJIE: WuJie;
    // Sub-app mount lifecycle function
    __WUJIE_MOUNT: () => void;
    // Sub-app unmount lifecycle function
    __WUJIE_UNMOUNT: () => void | Promise<void>;
    // Injected Wujie runtime object
    $wujie: {
      bus: EventBus;
      shadowRoot?: ShadowRoot;
      props?: { [key: string]: any };
      location?: Object;
    };
  }
}
```

## `__POWERED_BY_WUJIE__`

- **Type:** `boolean`

- **Description:** Indicates whether the sub-app is currently running inside a Wujie micro-frontend environment.

## `__WUJIE_PUBLIC_PATH__`

- **Type:** `string`

- **Description:** The public base path of the sub-app.

## `__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__`

- **Type:** `typeof Document.prototype.querySelector`

- **Description:** Because the sub-app's `document.querySelector` is proxied to the Web Component ShadowRoot, use this variable when you need the original unproxied `querySelector`.

## `__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR_ALL__`

- **Type:** `typeof Document.prototype.querySelectorAll`

- **Description:** Because the sub-app's `document.querySelectorAll` is proxied to the Web Component ShadowRoot, use this variable when you need the original unproxied `querySelectorAll`.

## `__WUJIE_RAW_WINDOW__`

- **Type:** `Window`

- **Description:** The sub-app's native, unproxied `window` object.

## `__WUJIE`

- **Type:** `WuJie`

- **Description:** Internal Wujie sandbox instance for the sub-app. Application code should not rely on internal properties directly.

## `__WUJIE_MOUNT`

- **Type:** `Function`

- **Description:** User-defined sub-app mount lifecycle hook.

## `__WUJIE_UNMOUNT`

- **Type:** `Function`

- **Description:** User-defined sub-app unmount lifecycle hook.

## $wujie

See [$wujie API](/en/api/wujie.html#wujie).
