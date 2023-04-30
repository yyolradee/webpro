import Vue from 'vue'
import VueRouter from 'vue-router'
import HomePage from './views/HomePage.vue'
import CreateBlog from './views/blogs/CreateBlog.vue'
import BlogDetail from './views/blogs/BlogDetail.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage // set home as path '/'
  },{
    path: '/blog/create',
    name: 'Create blog',
    component: CreateBlog
  },{
    path: '/detail/:id',
    name: 'blog detail',
    component: BlogDetail
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router