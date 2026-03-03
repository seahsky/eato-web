<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/profile" />
        </ion-buttons>
        <ion-title>Avatar Frame</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h2>Choose your avatar frame</h2>
      <div class="frame-grid">
        <ion-card
          v-for="frame in frames"
          :key="frame.id"
          :class="{ selected: currentFrame === frame.id }"
          button
          @click="selectFrame(frame.id)"
        >
          <ion-card-content class="frame-card">
            <span class="frame-icon">{{ frame.icon }}</span>
            <span class="frame-name">{{ frame.name }}</span>
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

const currentFrame = ref(auth.user?.avatarFrame ?? 'none')

const frames = [
  { id: 'none', name: 'None', icon: '👤' },
  { id: 'fire', name: 'Fire', icon: '🔥' },
  { id: 'star', name: 'Star', icon: '⭐' },
  { id: 'heart', name: 'Heart', icon: '❤️' },
  { id: 'crown', name: 'Crown', icon: '👑' },
  { id: 'diamond', name: 'Diamond', icon: '💎' },
]

async function selectFrame(frameId: string) {
  try {
    await gamification.updateAvatarFrame(frameId)
    currentFrame.value = frameId
    showSuccess('Avatar frame updated!')
  } catch {
    showError('Failed to update avatar frame')
  }
}
</script>

<style scoped>
.frame-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.frame-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 0.5rem;
}

.frame-icon {
  font-size: 2rem;
}

.frame-name {
  font-weight: 600;
  font-size: 0.875rem;
}

ion-card.selected {
  border: 3px solid var(--ion-color-primary);
}
</style>
