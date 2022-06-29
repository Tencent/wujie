// woa环境携带登录态必须添加credential
export default function fetch(url, options) {
  const includeFlag = process.env.NODE_ENV === "production" && !url.includes("//vfiles.gtimg.cn/");
  return window.fetch(url, { ...options, credentials: includeFlag ? "include" : "omit" });
}
