<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Notifications</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="permission-container">
        <ion-icon :icon="notificationsOutline" size="large" color="primary" />
        <h2>Stay Connected</h2>
        <p>Get notified when your partner logs food, reaches their goals, or sends you a nudge.</p>

        <ion-button expand="block" @click="handleEnable" :disabled="enabling">
          <ion-spinner v-if="enabling" name="crescent" />
          <span v-else>Enable Notifications</span>
        </ion-button>

        <ion-button expand="block" fill="clear" @click="handleSkip">
          Maybe Later
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonSpinner } from '@ionic/vue'
import { notificationsOutline } from 'ionicons/icons'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotificationStore } from '../../../stores/notification'
import { useToast } from '../../../composables/useToast'

const route = useRoute()
const router = useRouter()
const notifStore = useNotificationStore()
const { showSuccess } = useToast()
const enabling = ref(false)

const redirectTo = (route.query.redirectTo as string) || '/dashboard'

async function handleEnable() {
  enabling.value = true
  const ok = await notifStore.subscribe()
  enabling.value = false
  if (ok) showSuccess('Notifications enabled!')
  router.replace(redirectTo)
}

function handleSkip() {
  router.replace(redirectTo)
}
</script>

<style scoped>
.permission-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 70vh;
  gap: 1rem;
  max-width: 400px;
  margin: 0 auto;
}

h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

p {
  color: var(--ion-color-medium);
  margin: 0 0 1rem;
}
</style>
