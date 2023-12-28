// 携带登录态credentials必须为include
export function credentialsFetch(url: RequestInfo, options?: RequestInit): Promise<Response> {
  return window.fetch(url, {...options, credentials: 'omit'});
}
