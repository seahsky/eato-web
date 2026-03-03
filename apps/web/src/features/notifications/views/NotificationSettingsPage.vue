<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/profile" />
        </ion-buttons>
        <ion-title>Notification Settings</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- Push subscription toggle -->
      <ion-card>
        <ion-card-header>
          <ion-card-subtitle>Push Notifications</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-item lines="none">
            <ion-label>Push notifications</ion-label>
            <ion-toggle
              :checked="notifStore.isSubscribed"
              @ionChange="handleToggleSubscription($event)"
            />
          </ion-item>
        </ion-card-content>
      </ion-card>

      <!-- Notification preferences -->
      <template v-if="notifStore.settings">
        <ion-card>
          <ion-card-header>
            <ion-card-subtitle>Partner Notifications</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              <ion-item>
                <ion-label>Partner logged food</ion-label>
                <ion-toggle
                  :checked="notifStore.settings.partnerFoodLogged"
                  @ionChange="updateSetting('partnerFoodLogged', $event.detail.checked)"
                />
              </ion-item>
              <ion-item>
                <ion-label>Partner reached goal</ion-label>
                <ion-toggle
                  :checked="notifStore.settings.partnerGoalReached"
                  @ionChange="updateSetting('partnerGoalReached', $event.detail.checked)"
                />
              </ion-item>
              <ion-item>
                <ion-label>Receive nudges</ion-label>
                <ion-toggle
                  :checked="notifStore.settings.receiveNudges"
                  @ionChange="updateSetting('receiveNudges', $event.detail.checked)"
                />
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Meal reminders -->
        <ion-card>
          <ion-card-header>
            <ion-card-subtitle>Meal Reminders</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              <ion-item>
                <ion-label>Breakfast</ion-label>
                <ion-input
                  type="time"
                  :value="notifStore.settings.breakfastReminderTime ?? ''"
                  @ionChange="updateSetting('breakfastReminderTime', ($event.detail.value as string) || null)"
                  slot="end"
                  class="time-input"
                />
              </ion-item>
              <ion-item>
                <ion-label>Lunch</ion-label>
                <ion-input
                  type="time"
                  :value="notifStore.settings.lunchReminderTime ?? ''"
                  @ionChange="updateSetting('lunchReminderTime', ($event.detail.value as string) || null)"
                  slot="end"
                  class="time-input"
                />
              </ion-item>
              <ion-item>
                <ion-label>Dinner</ion-label>
                <ion-input
                  type="time"
                  :value="notifStore.settings.dinnerReminderTime ?? ''"
                  @ionChange="updateSetting('dinnerReminderTime', ($event.detail.value as string) || null)"
                  slot="end"
                  class="time-input"
                />
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonContent, IonRefresher, IonRefresherContent, IonCard, IonCardHeader,
  IonCardSubtitle, IonCardContent, IonList, IonItem, IonLabel, IonToggle,
  IonInput,
} from '@ionic/vue'
import { onMounted } from 'vue'
import type { NotificationSettingsInput } from '../../../api/types'
import { useNotificationStore } from '../../../stores/notification'
import { useToast } from '../../../composables/useToast'

const notifStore = useNotificationStore()
const { showError } = useToast()

onMounted(async () => {
  await Promise.all([notifStore.loadSettings(), notifStore.checkSubscription()])
})

async function onRefresh(event: CustomEvent) {
  await Promise.all([notifStore.loadSettings(), notifStore.checkSubscription()])
  ;(event.target as any).complete()
}

async function handleToggleSubscription(event: CustomEvent) {
  const enabled = event.detail.checked
  if (enabled) {
    const ok = await notifStore.subscribe()
    if (!ok) showError('Failed to enable notifications')
  } else {
    await notifStore.unsubscribe()
  }
}

async function updateSetting(key: string, value: boolean | string | null) {
  try {
    await notifStore.updateSettings({ [key]: value } as NotificationSettingsInput)
  } catch {
    showError('Failed to update setting')
  }
}
</script>

<style scoped>
.time-input {
  max-width: 120px;
}
</style>
