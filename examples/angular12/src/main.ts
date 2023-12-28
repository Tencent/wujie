import { enableProdMode } from '@angular/core'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'

import { AppModule } from './app/app.module'
import { environment } from './environments/environment'

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
