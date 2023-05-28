declare module 'vue' {
  export interface GlobalComponents {
    WujieVue: typeof import('./component')['WujieComponent']
  }
}

export {}