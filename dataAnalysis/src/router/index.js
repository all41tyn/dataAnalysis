import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/analysis',
    name: 'DataAnalysis',
    component: () => import('../views/DataAnalysis.vue'),
    meta: { title: '数据分析' }
  },
  {
    path: '/history',
    name: 'AnalysisHistory',
    component: () => import('../views/AnalysisHistory.vue'),
    meta: { title: '分析记录' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
