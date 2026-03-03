<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/profile" />
        </ion-buttons>
        <ion-title>Badges</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- Summary -->
      <div v-if="gamification.summary" class="summary-bar">
        <span>{{ gamification.summary.unlockedBadges }} / {{ gamification.summary.totalBadges }} unlocked</span>
      </div>

      <div v-if="gamification.loading" class="loading-state">
        <ion-spinner name="crescent" />
      </div>

      <!-- Badges by category -->
      <template v-for="(badges, category) in gamification.badgesByCategory" :key="category">
        <h3>{{ category }}</h3>
        <div class="badge-grid">
          <div
            v-for="badge in badges"
            :key="badge.badgeId"
            class="badge-card"
            :class="{ unlocked: badge.unlocked }"
          >
            <span class="badge-icon">{{ badge.icon }}</span>
            <span class="badge-name">{{ badge.name }}</span>
            <span class="badge-desc">{{ badge.description }}</span>
          </div>
        </div>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonContent, IonRefresher, IonRefresherContent, IonSpinner,
} from '@ionic/vue'
import { onMounted } from 'vue'
import { useGamificationStore } from '../../../stores/gamification'

const gamification = useGamificationStore()

onMounted(() => {
  gamification.loadBadgesByCategory()
  gamification.loadSummary()
})

async function onRefresh(event: CustomEvent) {
  await Promise.all([gamification.loadBadgesByCategory(), gamification.loadSummary()])
  ;(event.target as any).complete()
}
</script>

<style scoped>
.summary-bar {
  text-align: center;
  padding: 0.75rem;
  font-weight: 600;
  color: var(--ion-color-primary);
}

.badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.badge-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border-radius: 12px;
  background: var(--ion-color-light);
  text-align: center;
  opacity: 0.4;
}

.badge-card.unlocked {
  opacity: 1;
}

.badge-icon {
  font-size: 2rem;
  margin-bottom: 0.25rem;
}

.badge-name {
  font-weight: 600;
  font-size: 0.875rem;
}

.badge-desc {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 3rem;
}
</style>
