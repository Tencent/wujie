declare module '@vue/runtime-dom' {
  export interface GlobalComponents {
    WujieVue: typeof import('./component')['WujieComponent']
  }
}

export {}