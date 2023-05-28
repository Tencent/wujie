import { WujieProps } from './component';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ['wujie-vue']: WujieProps
    }
  }
}

export {}
