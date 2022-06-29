import { enableProdMode } from '@angular/core'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'

import { AppModule } from './app/app.module'
import { environment } from './environments/environment'

declare global {
  interface Window {
    // 是否存在无界
    __POWERED_BY_WUJIE__?: boolean;
    // 子应用公共加载路径
    __WUJIE_PUBLIC_PATH__: string;
    // 子应用mount函数
    __WUJIE_MOUNT: () => void;
    // 子应用unmount函数
    __WUJIE_UNMOUNT: () => void;
  }
}

if (environment.production) {
  enableProdMode()
}

if (window.__POWERED_BY_WUJIE__) {
  let instance: any
  window.__WUJIE_MOUNT = async () => {
    instance = await platformBrowserDynamic().bootstrapModule(AppModule)
  }
  window.__WUJIE_UNMOUNT = () => {
    instance.destroy()
  }
} else {
  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err))
}
