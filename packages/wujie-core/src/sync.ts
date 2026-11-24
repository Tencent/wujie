import { anchorElementGenerator, getAnchorElementQueryMap, getSyncUrl, appRouteParse, getDegradeIframe } from "./utils";
import { renderIframeReplaceApp, patchEventTimeStamp } from "./iframe";
import { renderElementToContainer, initRenderIframeAndContainer } from "./shadow";
import { getWujieById, rawDocumentQuerySelector } from "./common";

const decodeQueryKey = (key: string): string => {
  try {
    return window.decodeURIComponent(key.replace(/\+/g, " "));
  } catch {
    return key;
  }
};

/**
 * 在原始 search 上只改写子应用自己的参数，其余参数保持原文
 * 主应用参数经 URLSearchParams 解析再编码并非无损：+ 会变成 %20、flag 会变成 flag=、重复键只剩一个
 * @param updates 值为 null 表示删除该参数
 * @returns 参数全部删除时返回空串，避免在主应用 url 末尾留下一个孤立的 ?
 */
const updateSearch = (search: string, updates: { [id: string]: string | null }): string => {
  const written = new Set<string>();
  const segments = search
    .replace(/^\?/, "")
    .split("&")
    .filter(Boolean)
    .map((segment) => {
      const key = decodeQueryKey(segment.split("=")[0]);
      if (!Object.prototype.hasOwnProperty.call(updates, key)) return segment;
      if (written.has(key) || updates[key] === null) return "";
      written.add(key);
      return `${key}=${window.encodeURIComponent(updates[key])}`;
    })
    .filter(Boolean);
  Object.keys(updates).forEach((key) => {
    if (!written.has(key) && updates[key] !== null) segments.push(`${key}=${window.encodeURIComponent(updates[key])}`);
  });
  return segments.length ? `?${segments.join("&")}` : "";
};

/**
 * 同步子应用路由到主应用路由
 */
export function syncUrlToWindow(iframeWindow: Window): void {
  const { sync, id, prefix } = iframeWindow.__WUJIE;
  let winUrlElement = anchorElementGenerator(window.location.href);
  const queryMap = getAnchorElementQueryMap(winUrlElement);
  // 非同步且url上没有当前id的查询参数，否则就要同步参数或者清理参数
  if (!sync && !queryMap[id]) return (winUrlElement = null);
  const curUrl = iframeWindow.location.pathname + iframeWindow.location.search + iframeWindow.location.hash;
  let validShortPath = "";
  // 处理短路径
  if (prefix) {
    Object.keys(prefix).forEach((shortPath) => {
      const longPath = prefix[shortPath];
      // 找出最长匹配路径
      if (curUrl.startsWith(longPath) && (!validShortPath || longPath.length > prefix[validShortPath].length)) {
        validShortPath = shortPath;
      }
    });
  }
  // 同步，否则清理
  const appUrl = validShortPath ? curUrl.replace(prefix[validShortPath], `{${validShortPath}}`) : curUrl;
  winUrlElement.search = updateSearch(winUrlElement.search, { [id]: sync ? appUrl : null });
  if (winUrlElement.href !== window.location.href) {
    // replaceState 的第 1 个参数是新的 history.state：传 null 会清掉主应用存进去的数据
    // （Vue Router 把 back / current / forward / position / scroll 都放在这里），
    // 导致 router.back() 的位置恢复、scrollBehavior 的 savedPosition 失效
    window.history.replaceState(window.history.state, "", winUrlElement.href);
  }
  winUrlElement = null;
}

/**
 * 同步主应用路由到子应用
 */
export function syncUrlToIframe(iframeWindow: Window): void {
  // 获取当前路由路径
  const { pathname, search, hash } = iframeWindow.location;
  const { id, url, sync, execFlag, prefix, inject } = iframeWindow.__WUJIE;

  // 只在浏览器刷新或者第一次渲染时同步
  const idUrl = sync && !execFlag ? getSyncUrl(id, prefix) : url;
  // 排除href跳转情况
  const syncUrl = (/^http/.test(idUrl) ? null : idUrl) || url;
  const { appRoutePath } = appRouteParse(syncUrl);

  const preAppRoutePath = pathname + search + hash;
  if (preAppRoutePath !== appRoutePath) {
    iframeWindow.history.replaceState(null, "", inject.mainHostPath + appRoutePath);
  }
}

/**
 * 清理非激活态的子应用同步参数
 * 主应用采用hash模式时，切换子应用后已销毁的子应用同步参数还存在需要手动清理
 */
export function clearInactiveAppUrl(): void {
  let winUrlElement = anchorElementGenerator(window.location.href);
  const queryMap = getAnchorElementQueryMap(winUrlElement);
  const updates: { [id: string]: null } = {};
  Object.keys(queryMap).forEach((id) => {
    const sandbox = getWujieById(id);
    if (!sandbox) return;
    // 子应用执行过并且已经失活才需要清除
    if (sandbox.execFlag && sandbox.sync && !sandbox.hrefFlag && !sandbox.activeFlag) {
      updates[id] = null;
    }
  });
  winUrlElement.search = updateSearch(winUrlElement.search, updates);
  if (winUrlElement.href !== window.location.href) {
    // replaceState 的第 1 个参数是新的 history.state：传 null 会清掉主应用存进去的数据
    // （Vue Router 把 back / current / forward / position / scroll 都放在这里），
    // 导致 router.back() 的位置恢复、scrollBehavior 的 savedPosition 失效
    window.history.replaceState(window.history.state, "", winUrlElement.href);
  }
  winUrlElement = null;
}

/**
 * 推送指定url到主应用路由，replace 为 true 时替换当前历史记录
 */
export function pushUrlToWindow(id: string, url: string, replace = false): void {
  let winUrlElement = anchorElementGenerator(window.location.href);
  winUrlElement.search = updateSearch(winUrlElement.search, { [id]: url });
  if (replace) window.history.replaceState(window.history.state, "", winUrlElement.href);
  else window.history.pushState(null, "", winUrlElement.href);
  winUrlElement = null;
}

/**
 * 应用跳转(window.location.href)情况路由处理
 */
export function processAppForHrefJump(): void {
  window.addEventListener("popstate", () => {
    let winUrlElement = anchorElementGenerator(window.location.href);
    const queryMap = getAnchorElementQueryMap(winUrlElement);
    winUrlElement = null;
    Object.keys(queryMap)
      .map((id) => getWujieById(id))
      .filter((sandbox) => sandbox)
      .forEach((sandbox) => {
        const url = queryMap[sandbox.id];
        const iframeBody = rawDocumentQuerySelector.call(sandbox.iframe.contentDocument, "body");
        // 前进href
        if (/http/.test(url)) {
          if (sandbox.degrade) {
            renderElementToContainer(sandbox.document.documentElement, iframeBody);
            renderIframeReplaceApp(url, getDegradeIframe(sandbox.id).parentElement, sandbox.degradeAttrs);
          } else renderIframeReplaceApp(url, sandbox.shadowRoot.host.parentElement, sandbox.degradeAttrs);
          sandbox.hrefFlag = true;
          // href后退
        } else if (sandbox.hrefFlag) {
          if (sandbox.degrade) {
            // 走全套流程，但是事件恢复不需要
            const { iframe } = initRenderIframeAndContainer(sandbox.id, sandbox.el, sandbox.degradeAttrs);
            patchEventTimeStamp(iframe.contentWindow, sandbox.iframe.contentWindow);
            iframe.contentWindow.onunload = () => {
              sandbox.unmount();
            };
            iframe.contentDocument.replaceChild(iframeBody.firstElementChild, iframe.contentDocument.documentElement);
            sandbox.document = iframe.contentDocument;
          } else renderElementToContainer(sandbox.shadowRoot.host, sandbox.el);
          sandbox.hrefFlag = false;
        }
      });
  });
}
