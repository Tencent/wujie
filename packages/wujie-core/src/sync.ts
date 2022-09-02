import { anchorElementGenerator, getAnchorElementQueryMap, getSyncUrl, appRouteParse, getDegradeIframe } from "./utils";
import { renderIframeReplaceApp, patchEventTimeStamp } from "./iframe";
import { renderElementToContainer, createIframeContainer, clearChild } from "./shadow";
import { getWujieById, rawDocumentQuerySelector } from "./common";

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
  // 同步
  if (sync) {
    queryMap[id] = window.encodeURIComponent(
      validShortPath ? curUrl.replace(prefix[validShortPath], `{${validShortPath}}`) : curUrl
    );
    // 清理
  } else {
    delete queryMap[id];
  }
  const newQuery =
    "?" +
    Object.keys(queryMap)
      .map((key) => key + "=" + queryMap[key])
      .join("&");
  winUrlElement.search = newQuery;
  if (winUrlElement.href !== window.location.href) {
    window.history.replaceState(null, "", winUrlElement.href);
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
  Object.keys(queryMap).forEach((id) => {
    const sandbox = getWujieById(id);
    if (!sandbox) return;
    // 子应用执行过并且已经卸载才需要清除
    const clearFlag = sandbox.degrade
      ? !window.document.contains(getDegradeIframe(sandbox.id))
      : !window.document.contains(sandbox?.shadowRoot?.host);
    if (sandbox.execFlag && sandbox.sync && !sandbox.hrefFlag && clearFlag) {
      delete queryMap[id];
    }
  });
  const newQuery =
    "?" +
    Object.keys(queryMap)
      .map((key) => key + "=" + queryMap[key])
      .join("&");
  winUrlElement.search = newQuery;
  if (winUrlElement.href !== window.location.href) {
    window.history.replaceState(null, "", winUrlElement.href);
  }
  winUrlElement = null;
}

/**
 * 推送指定url到主应用路由
 */
export function pushUrlToWindow(id: string, url: string): void {
  let winUrlElement = anchorElementGenerator(window.location.href);
  const queryMap = getAnchorElementQueryMap(winUrlElement);
  queryMap[id] = window.encodeURIComponent(url);
  const newQuery =
    "?" +
    Object.keys(queryMap)
      .map((key) => key + "=" + queryMap[key])
      .join("&");
  winUrlElement.search = newQuery;
  window.history.pushState(null, "", winUrlElement.href);
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
            renderElementToContainer(sandbox.document.firstElementChild, iframeBody);
            renderIframeReplaceApp(window.decodeURIComponent(url), getDegradeIframe(sandbox.id).parentElement);
          } else renderIframeReplaceApp(window.decodeURIComponent(url), sandbox.shadowRoot.host.parentElement);
          sandbox.hrefFlag = true;
          // href后退
        } else if (sandbox.hrefFlag) {
          if (sandbox.degrade) {
            // 走全套流程，但是事件恢复不需要
            const iframe = createIframeContainer(sandbox.id);
            renderElementToContainer(iframe, sandbox.el);
            clearChild(iframe.contentDocument);
            patchEventTimeStamp(iframe.contentWindow, sandbox.iframe.contentWindow);
            iframe.contentWindow.onunload = () => {
              sandbox.unmount();
            };
            iframe.contentDocument.appendChild(iframeBody.firstElementChild);
            sandbox.document = iframe.contentDocument;
          } else renderElementToContainer(sandbox.shadowRoot.host, sandbox.el);
          sandbox.hrefFlag = false;
        }
      });
  });
}
