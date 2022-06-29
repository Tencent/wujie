export const wujiFetch = function (url, options) {
  const exclude = ["//cdn-go.cn", "//vfiles.gtimg.cn", "//pingjs.qq.com"];
  return window
    .fetch(url, {
      ...options,
      mode: "cors",
      credentials: exclude.some((host) => url.includes(host)) ? "omit" : "include",
    })
    .then(
      (response) => response,
      (error) => {
        console.error(error);
        const loginHTML = `<html>
<body>
  <div>点击登录链接完成登录后刷新</div>
  <div>
    <a target="_blank" href='https://passport.oa.com/modules/passport/signin.ashx?url=http%3A%2F%2Fd.wuji.woa.com%2F_sp_login_%2F%3Furl%3D%252Fxy%252Fapp%252Fdev%252Ftest_wuji_damy%252Fdamyxu-wujie-alive%26app%3D'>点击登录</a>
  </div>
</body>
</html>`;
        let needLogin = false;
        if (url.includes("//d.wuji.woa.com/xy/app/dev/test_wuji_damy/damyxu-wujie-alive")) needLogin = true;
        return {
          text: () => (needLogin ? loginHTML : ""),
        };
      }
    );
};

export const props = {
  version: "1.0.0",
  authId: "wujie",
  authKey: "d0938c84a7434cd1b0607a4324dff4d8",
};
