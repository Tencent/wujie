import Wujie from "./sandbox";
import { baseOptions, lifecycles } from "./types";

export type cacheOptions = baseOptions & {
  /** 预执行 */
  exec?: boolean;
  /** 渲染的容器 */
  el?: HTMLElement | string;
  /** 路由同步开关 */
  sync?: boolean;
  /** 子应用短路径替换，路由同步时生效 */
  prefix?: { [key: string]: string };
  /** 子应用加载时loading元素 */
  loading?: HTMLElement;
  lifecycles?: lifecycles;
};

export interface SandboxCache {
  wujie?: Wujie;
  options?: cacheOptions;
}

// 全部无界实例和配置存储map
export const idToSandboxCacheMap = window.__POWERED_BY_WUJIE__
  ? window.__WUJIE.inject.idToSandboxMap
  : new Map<String, SandboxCache>();

export function getWujieById(id: String): Wujie | null {
  return idToSandboxCacheMap.get(id)?.wujie || null;
}

export function getOptionsById(id: String): cacheOptions | null {
  return idToSandboxCacheMap.get(id)?.options || null;
}

export function addSandboxCacheWithWujie(id: string, sandbox: Wujie): void {
  const wujieCache = idToSandboxCacheMap.get(id);
  if (wujieCache) idToSandboxCacheMap.set(id, { ...wujieCache, wujie: sandbox });
  else idToSandboxCacheMap.set(id, { wujie: sandbox });
}

export function deleteWujieById(id: string) {
  const wujieCache = idToSandboxCacheMap.get(id);
  if (wujieCache?.options) idToSandboxCacheMap.set(id, { options: wujieCache.options });
  idToSandboxCacheMap.delete(id);
}

export function addSandboxCacheWithOptions(id: string, options: cacheOptions): void {
  const wujieCache = idToSandboxCacheMap.get(id);
  if (wujieCache) idToSandboxCacheMap.set(id, { ...wujieCache, options });
  else idToSandboxCacheMap.set(id, { options });
}
