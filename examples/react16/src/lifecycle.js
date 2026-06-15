const lifecycles = {
  beforeLoad: (appWindow) => console.log(`${appWindow.__WUJIE.id} beforeLoad 生命周期`),
  beforeMount: (appWindow) => console.log(`${appWindow.__WUJIE.id} beforeMount 生命周期`),
  afterMount: (appWindow) => console.log(`${appWindow.__WUJIE.id} afterMount 生命周期`),
  beforeUnmount: (appWindow) => console.log(`${appWindow.__WUJIE.id} beforeUnmount 生命周期`),
  afterUnmount: (appWindow) => console.log(`${appWindow.__WUJIE.id} afterUnmount 生命周期`),
};

export default lifecycles;
