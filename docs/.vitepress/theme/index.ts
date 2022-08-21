import Theme from 'vitepress/theme'
import { h } from 'vue'
import AsideSponsors from './components/AsideSponsors.vue'
import HomeSponsors from './components/HomeSponsors.vue'
import './styles/vars.css'
export default {
  ...Theme,
  Layout() {
    return h(Theme.Layout, null, {
      'home-features-after': () => h(HomeSponsors),
      'aside-ads-before': () => h(AsideSponsors)
    })
  }
}
