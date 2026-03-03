import { createRouter, createWebHistory } from '@ionic/vue-router'
import routes from './routes'
import { setupGuards } from './guards'

const router = createRouter({
  history: createWebHistory(),
  routes,
})

setupGuards(router)

export default router
