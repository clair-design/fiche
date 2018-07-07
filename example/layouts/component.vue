<template lang="pug">
  #main
    c-header
    c-box.main.no-gap
      c-box-item.sidebar(xs=12 sm=4 md=3 lg=2)
        .navbar.is-stacked
          .subnav(v-for="item in menu")
            .subnav__title
              c-icon(:name="item.icon" size="12")
              span  {{ item.title }}
            router-link.navbar__item(
              v-for="sub in item.children",
              :to="sub.link || '/component/' + sub.name",
              :key="sub.title"
            )
              | {{sub.title}}
              span.is-text-gray-6.has-margin-left-sm(v-if="sub.name") {{ sub.name }}
      c-box-item.content(xs=12 sm=8 md=9 lg=10)
        transition(name='fade')
          router-view.c-container.is-lg
        c-footer
    c-button(
      primary
      outline
      round
      icon="navigation-2"
      style="position: fixed; right: 50px; bottom: 100px; z-index: 999"
      @click="scrollToTop"
      title="回到顶部"
      v-show="showToTop"
    )
</template>

<script>
import throttle from 'lodash/throttle'
export default {
  data () {
    return {
      showToTop: false,
      scrollBox: null,
      menu: [
        {
          title: '使用说明',
          icon: 'book',
          children: [
            { title: '安装和使用', link: '/component/install' },
            { title: '自定义样式', link: '/component/theme' }
          ]
        },
        {
          title: '基础样式',
          icon: 'layout',
          children: [
            { title: '颜色', name: 'color' },
            { title: '文本样式', name: 'typography' },
            { title: '图标', name: 'icon' }
          ]
        }
      ]
    }
  },
  methods: {
    scrollToTop () {
      if (typeof window === 'object') {
        const obj = { top: 0 }
        const maxSmoothHeight = this.scrollBox.clientHeight * 2
        if (this.scrollBox.scrollTop < maxSmoothHeight) {
          obj.behavior = 'smooth'
        }
        this.scrollBox.scroll(obj)
      }
    },
    onScroll () {
      if (typeof window === 'object') {
        const threshold = 80
        this.showToTop = this.scrollBox.scrollTop > threshold
      }
    }
  },
  mounted () {
    if (typeof window === 'object') {
      this.scrollBox = document.querySelector('.content')
      const throttleTime = 200
      this.onScroll = throttle(this.onScroll.bind(this), throttleTime)
      this.scrollBox.addEventListener('scroll', this.onScroll)
    }
  },
  destroyed () {
    if (typeof window === 'object') {
      this.scrollBox.removeEventListener('scroll', this.onScroll)
    }
  }
}
</script>
