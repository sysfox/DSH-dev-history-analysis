import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('./pages/HomeView.vue'), meta: { title: '概览' } },
  { path: '/timeline', name: 'timeline', component: () => import('./pages/TimelineView.vue'), meta: { title: '时间线' } },
  { path: '/packages', name: 'packages', component: () => import('./pages/PackagesView.vue'), meta: { title: '包与能力' } },
  { path: '/architecture', name: 'architecture', component: () => import('./pages/ArchitectureView.vue'), meta: { title: '架构决策' } },
  { path: '/infra', name: 'infra', component: () => import('./pages/InfraView.vue'), meta: { title: '基础设施' } },
  { path: '/docs', name: 'docs', component: () => import('./pages/DocsView.vue'), meta: { title: '文档生态' } },
  { path: '/contributors', name: 'contributors', component: () => import('./pages/ContributorsView.vue'), meta: { title: '贡献者' } },
  { path: '/reader', name: 'reader', component: () => import('./pages/ReaderView.vue'), meta: { title: '原文' } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 80 }
    return saved || { top: 0 }
  },
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · dsh 开发历程可视化` : 'dsh 开发历程 · 可视化'
})

export default router
