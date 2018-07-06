import Vue from 'vue'
import VueMeta from 'vue-meta'
import VueRouter from 'vue-router'
import commonAssets from './common.assets'

Vue.use(VueMeta)
Vue.use(VueRouter)

const { plugins, layouts, routes } = commonAssets
plugins.forEach(p => Vue.use(p))
layouts.forEach(l => Vue.use(l))

const createRouter = () =>
  new VueRouter({
    mode: 'history',
    routes: [
      ...routes,
      { path: '*', redirect: '404' }
    ]
  })

const createApp = () => {
  const router = createRouter()
  const app = new Vue({
    router,
    render (h) {
      const layout = this.$route.meta.layout || 'default'
      return h(`layout-${layout}`)
    }
  })
  return { app, router }
}

if (typeof window !== 'undefined') {
  const { app } = createApp()
  app.$mount('#app')
}

export {
  routes,
  createApp
}
