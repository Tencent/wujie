import { bus, preloadApp, startApp as rawStartApp, destroyApp, setupApp, startOptions } from 'wujie'
import { h, defineComponent, PropType, App } from 'vue'

const WujieVue = defineComponent({
  name: 'WujieVue',
  props: {
    width: { type: String, default: '' },
    height: { type: String, default: '' },
    name: { type: String, default: '' },
    loading: { type: HTMLElement, default: undefined },
    url: { type: String, default: '' },
    sync: { type: Boolean, default: undefined },
    prefix: { type: Object, default: undefined },
    alive: { type: Boolean, default: undefined },
    props: { type: Object, default: undefined },
    attrs: { type: Object, default: undefined },
    replace: { type: Function as PropType<startOptions['replace']>, default: undefined },
    fetch: { type: Function as PropType<startOptions['fetch']>, default: undefined },
    fiber: { type: Boolean, default: undefined },
    degrade: { type: Boolean, default: undefined },
    plugins: { type: Array as PropType<startOptions['plugins']>, default: null },
    beforeLoad: { type: Function as PropType<startOptions['beforeLoad']>, default: null },
    beforeMount: { type: Function as PropType<startOptions['beforeMount']>, default: null },
    afterMount: { type: Function as PropType<startOptions['afterMount']>, default: null },
    beforeUnmount: { type: Function as PropType<startOptions['beforeUnmount']>, default: null },
    afterUnmount: { type: Function as PropType<startOptions['afterUnmount']>, default: null },
    activated: { type: Function as PropType<startOptions['activated']>, default: null },
    deactivated: { type: Function as PropType<startOptions['deactivated']>, default: null },
    loadError: { type: Function as PropType<startOptions['loadError']>, default: null }
  },
  data () {
    return {
      startAppQueue: Promise.resolve()
    }
  },
  mounted () {
    bus.$onAll(this.handleEmit)
    this.execStartApp()
    this.$watch(
      () => this.name + this.url,
      () => this.execStartApp()
    )
  },
  beforeUnmount () {
    bus.$offAll(this.handleEmit)
  },
  methods: {
    handleEmit (event: string, ...args: any[]) {
      this.$emit(event, ...args)
    },
    async startApp () {
      try {
        await rawStartApp({
          name: this.name,
          url: this.url,
          el: this.$refs.wujie as HTMLElement,
          loading: this.loading,
          alive: this.alive,
          fetch: this.fetch,
          props: this.props,
          attrs: this.attrs,
          replace: this.replace,
          sync: this.sync,
          prefix: this.prefix,
          fiber: this.fiber,
          degrade: this.degrade,
          plugins: this.plugins,
          beforeLoad: this.beforeLoad,
          beforeMount: this.beforeMount,
          afterMount: this.afterMount,
          beforeUnmount: this.beforeUnmount,
          afterUnmount: this.afterUnmount,
          activated: this.activated,
          deactivated: this.deactivated,
          loadError: this.loadError
        })
      } catch (error) {
        console.log(error)
      }
    },
    execStartApp () {
      this.startAppQueue = this.startAppQueue.then(this.startApp)
    },
    destroy () {
      destroyApp(this.name)
    }
  },
  render () {
    return h('div', {
      style: {
        width: this.width,
        height: this.height
      },
      ref: 'wujie'
    })
  }
})

WujieVue.setupApp = setupApp
WujieVue.preloadApp = preloadApp
WujieVue.bus = bus
WujieVue.destroyApp = destroyApp
WujieVue.install = function (app: App) {
  app.component('WujieVue', WujieVue)
}

type WithInstall<T> = T & {
  bus: typeof bus
  setupApp: typeof setupApp
  preloadApp: typeof preloadApp
  destroyApp: typeof destroyApp
  install(app: App): void
}

export default WujieVue as WithInstall<typeof WujieVue>

declare module 'vue' {
  export interface GlobalComponents {
    WujieVue: WithInstall<typeof WujieVue>
  }
}
