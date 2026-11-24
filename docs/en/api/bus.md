# bus

- **Type:** `EventBus`

```typescript
type callback = (...args: Array<any>) => any;

export declare class EventBus {
  private id;
  private eventObj;
  constructor(id: string);
  $on(event: string, fn: callback): EventBus;
  /** Triggered on every $emit; the first argument is the event name, followed by the emitted arguments */
  $onAll(fn: (event: string, ...args: Array<any>) => any): EventBus;
  $once(event: string, fn: callback): void;
  $off(event: string, fn: callback): EventBus;
  $offAll(fn: callback): EventBus;
  $emit(event: string, ...args: Array<any>): EventBus;
  $clear(): EventBus;
}
```

- **Details:** A decentralized event hub with a Vue-like event API supporting method chaining. See [EventBus Communication](/en/guide/communication.html#eventbus-communication) for usage examples.

## $on

- **Type:** `(event: string, fn: callback) => EventBus`

- **Parameters:**
  - `{string} event` — Event name
  - `{callback} fn` — Listener callback

- **Details:** Subscribes to an event with the given callback.

## $onAll

- **Type:** `(fn: (event: string, ...args: Array<any>) => any) => EventBus`

- **Parameters:**
  - `{callback} fn` — Listener callback

- **Details:** Subscribes to all events; the callback receives the event name as its first argument followed by the emitted payload.

## $once

- **Type:** `(event: string, fn: callback) => void`

- **Parameters:**
  - `{string} event` — Event name
  - `{callback} fn` — Listener callback

- **Details:** Subscribes to an event once and automatically unsubscribes after the first invocation.

## $off

- **Type:** `(event: string, fn: callback) => EventBus`

- **Parameters:**
  - `{string} event` — Event name
  - `{callback} fn` — Listener callback

- **Details:** Unsubscribes a listener from the specified event.

## $offAll

- **Type:** `(fn: callback) => EventBus`

- **Parameters:**
  - `{callback} fn` — Listener callback

- **Details:** Unsubscribes a listener registered via `$onAll`.

## $emit

- **Type:** `(event: string, ...args: Array<any>) => EventBus`

- **Parameters:**
  - `{string} event` — Event name
  - `{Array<any>} args` — Additional arguments passed to listeners

- **Details:** Emits an event with optional arguments.

## $clear

- **Type:** `Function`

- **Details:** Removes all event listeners registered on this `EventBus` instance.

::: warning Warning

- When a non-keep-alive sub-app is destroyed or re-rendered, Wujie automatically clears all event listeners registered during the previous render.
- If internal components within a sub-app re-render and register listeners repeatedly (for example, calling `$wujie.bus.$on` in `mounted`), be sure to manually unsubscribe with `$wujie.bus.$off` during component `unmount`.

:::
