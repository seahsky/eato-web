import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue } from '@ionic/vue'
import { clerkPlugin } from '@clerk/vue'

import App from './App.vue'
import router from './router'

/* Ionic CSS */
import '@ionic/vue/css/ionic.bundle.css'

const app = createApp(App)

app.use(IonicVue)
app.use(createPinia())
app.use(clerkPlugin, {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string,
})
app.use(router)

router.isReady().then(() => {
  app.mount('#app')
})
