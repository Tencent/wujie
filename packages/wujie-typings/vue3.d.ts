declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    WujieVue: typeof import('./component')['WujieComponent']
  }
}

export {}
