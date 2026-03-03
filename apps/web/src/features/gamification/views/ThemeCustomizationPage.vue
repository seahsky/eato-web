<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/profile" />
        </ion-buttons>
        <ion-title>Theme</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h2>Choose your theme</h2>
      <div class="theme-grid">
        <ion-card
          v-for="theme in themes"
          :key="theme.id"
          :class="{ selected: currentTheme === theme.id }"
          button
          @click="selectTheme(theme.id)"
        >
          <ion-card-content class="theme-card" :style="{ background: theme.color }">
            <span class="theme-name">{{ theme.name }}</span>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonContent, IonCard, IonCardContent,
} from '@ionic/vue'
import { ref } from 'vue'
import { useAuthStore } from '../../../stores/auth'
import { useGamificationStore } from '../../../stores/gamification'
import { useToast } from '../../../composables/useToast'

const auth = useAuthStore()
const gamification = useGamificationStore()
const { showSuccess, showError } = useToast()

const currentTheme = ref(auth.user?.unlockedTheme ?? 'default')

const themes = [
  { id: 'default', name: 'Default', color: 'var(--ion-color-primary)' },
  { id: 'ocean', name: 'Ocean', color: '#0ea5e9' },
  { id: 'sunset', name: 'Sunset', color: '#f97316' },
  { id: 'forest', name: 'Forest', color: '#22c55e' },
  { id: 'berry', name: 'Berry', color: '#a855f7' },
  { id: 'midnight', name: 'Midnight', color: '#1e293b' },
]

async function selectTheme(themeId: string) {
  try {
    await gamification.updateTheme(themeId)
    currentTheme.value = themeId
    showSuccess('Theme updated!')
  } catch {
    showError('Failed to update theme')
  }
}
</script>

<style scoped>
.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.theme-card {
  height: 80px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  border-radius: 12px;
  color: white;
  font-weight: 600;
}

ion-card.selected {
  border: 3px solid var(--ion-color-primary);
}

.theme-name {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
</style>
