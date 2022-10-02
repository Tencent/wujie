import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { plugins } from './plugin';
import { lifecycles } from './lifecycle';
import { WujieComponent } from 'wujie-angular';
import { hostMap } from './hostMap';
import { credentialsFetch } from './fetch';
import { pathChangeObservable } from './path-change';

const { setupApp, preloadApp, bus } = WujieComponent;
bus.$on('click', (msg: string) => {
  window.alert('来自子应用的消息:' + msg);
});

// 在 xxx-sub 路由下子应用将激活路由同步给主应用，主应用跳转对应路由高亮菜单栏
bus.$on('sub-route-change', (name: string, path: string) => {
  const mainName = `${name}-sub`;
  const mainPath = `/${name}-sub${path}`;
  const currentPath = window.location.hash.replace('#', '');

  if (currentPath.includes(mainName) && currentPath !== mainPath) {
    pathChangeObservable.next(mainPath);
  }
});

const degrade = window.localStorage.getItem('degrade') === 'true' || !window.Proxy || !window.CustomElementRegistry;
const props = {
  jump: (name: string) => {
    console.log('跳转---' + name);
    pathChangeObservable.next(`/${name}`);
  }
};

/**
 * 大部分业务无需设置 attrs
 * 此处修正 iframe 的 src，是防止github pages csp报错
 * 因为默认是只有 host+port，没有携带路径
 */
const attrs = environment.production ? { src: hostMap('//localhost:8200/') } : {};

/**
 * 配置应用，主要是设置默认配置
 * preloadApp、startApp的配置会基于这个配置做覆盖
 */
setupApp({
  name: 'react16',
  url: hostMap('//localhost:7600/'),
  attrs,
  exec: true,
  props,
  fetch: credentialsFetch,
  plugins,
  prefix: { 'prefix-dialog': '/dialog', 'prefix-location': '/location' },
  degrade,
  ...lifecycles
});

setupApp({
  name: 'react17',
  url: hostMap('//localhost:7100/'),
  attrs,
  exec: true,
  alive: true,
  props,
  fetch: credentialsFetch,
  degrade,
  ...lifecycles
});

setupApp({
  name: 'vue2',
  url: hostMap('//localhost:7200/'),
  attrs,
  exec: true,
  props,
  fetch: credentialsFetch,
  degrade,
  ...lifecycles
});

setupApp({
  name: 'vue3',
  url: hostMap('//localhost:7300/'),
  attrs,
  exec: true,
  alive: true,
  plugins: [{ cssExcludes: ['https://stackpath.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css'] }],
  props,
  // 引入了的第三方样式不需要添加credentials
  fetch: (url, options) =>
    (url as string).includes(hostMap('//localhost:7300/'))
      ? credentialsFetch(url, options)
      : window.fetch(url, options),
  degrade,
  ...lifecycles
});

setupApp({
  name: 'angular12',
  url: hostMap('//localhost:7400/'),
  attrs,
  exec: true,
  props,
  fetch: credentialsFetch,
  degrade,
  ...lifecycles
});

setupApp({
  name: 'vite',
  url: hostMap('//localhost:7500/'),
  attrs,
  exec: true,
  props,
  fetch: credentialsFetch,
  degrade,
  ...lifecycles
});

if (window.localStorage.getItem('preload') !== 'false') {
  // @ts-ignore
  preloadApp({ name: 'react16' });
  // @ts-ignore
  preloadApp({ name: 'react17' });
  // @ts-ignore
  preloadApp({ name: 'vue2' });
  // @ts-ignore
  preloadApp({ name: 'vue3' });
  // @ts-ignore
  preloadApp({ name: 'angular12' });
  // @ts-ignore
  preloadApp({ name: 'vite' });
}

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
