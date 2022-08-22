import Theme from 'vitepress/theme'
import { h } from 'vue'
import './styles/vars.css'
export default {
  ...Theme,
  Layout() {
    return h(Theme.Layout, null, {
    })
  }
}
