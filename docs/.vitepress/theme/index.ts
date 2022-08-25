import Theme from 'vitepress/theme'
// import Theme from '../wujie-theme'
import wujieHome from './components/wujie-home.vue'
import { h } from 'vue'
import './styles/vars.css'
console.log(Theme)

export default {
  ...Theme,
  Layout() {
    return h(wujieHome, null, {
      // 'home-hero-before': () => h(wujieHome)
      'nav-bar-title-before': () => h(wujieHome)
    })
  }
}
