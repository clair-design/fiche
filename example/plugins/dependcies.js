import Clair from 'clair'
import Header from './components/header.vue'
import Footer from './components/footer.vue'

export default {
  install (Vue) {
    Vue.use(Clair)
    Vue.component('c-header', Header)
    Vue.component('c-footer', Footer)
  }
}
