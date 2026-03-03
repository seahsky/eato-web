<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/dashboard" />
        </ion-buttons>
        <ion-title>Streaks</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <div v-if="!gamification.streak" class="loading-state">
        <ion-spinner name="crescent" />
      </div>

      <template v-if="gamification.streak">
        <div class="streak-cards">
          <ion-card>
            <ion-card-content class="streak-card">
              <span class="streak-value">{{ gamification.streak.currentStreak }}</span>
              <span class="streak-label">Day Streak</span>
              <span class="streak-best">Best: {{ gamification.streak.longestStreak }}</span>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-content class="streak-card">
              <span class="streak-value">{{ gamification.streak.goalStreak }}</span>
              <span class="streak-label">Goal Streak</span>
              <span class="streak-best">Best: {{ gamification.streak.longestGoalStreak }}</span>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-content class="streak-card">
              <span class="streak-value">{{ gamification.streak.weeklyStreak }}</span>
              <span class="streak-label">Weekly Streak</span>
              <span class="streak-best">Best: {{ gamification.streak.longestWeeklyStreak }}</span>
            </ion-card-content>
          </ion-card>
        </div>

        <ion-card>
          <ion-card-header>
            <ion-card-subtitle>This Week</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <p>{{ gamification.streak.currentWeekDays }} / 5 days logged (for weekly streak)</p>
            <p>{{ gamification.streak.restDaysRemaining }} rest days remaining this month</p>
          </ion-card-content>
        </ion-card>

        <!-- Shield status -->
        <ion-card v-if="gamification.shieldStatus">
          <ion-card-header>
            <ion-card-subtitle>Partner Shields</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <p>{{ gamification.shieldStatus.shieldsRemaining }} shields available</p>
            <ion-button v-if="gamification.shieldStatus.canUseShield && gamification.shieldStatus.partnerStreakAtRisk" size="small" @click="handleUseShield">
              Use Shield
            </ion-button>
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
  IonCardSubtitle, IonCardContent, IonButton, IonSpinner,
} from '@ionic/vue'
import { onMounted } from 'vue'
import { useGamificationStore } from '../../../stores/gamification'
import { useAuthStore } from '../../../stores/auth'
import { useToast } from '../../../composables/useToast'
import { formatDate } from '../../../utils/date'

const gamification = useGamificationStore()
const auth = useAuthStore()
const { showSuccess, showError } = useToast()

onMounted(async () => {
  await gamification.loadStreak()
  if (auth.hasPartner) {
    await gamification.loadShieldStatus()
  }
})

async function onRefresh(event: CustomEvent) {
  await gamification.loadStreak()
  if (auth.hasPartner) await gamification.loadShieldStatus()
  ;(event.target as any).complete()
}

async function handleUseShield() {
  try {
    await gamification.useShield(formatDate(new Date()))
    showSuccess('Shield used!')
  } catch {
    showError('Failed to use shield')
  }
}
</script>

<style scoped>
.streak-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.streak-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.streak-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--ion-color-primary);
}

.streak-label {
  font-weight: 600;
  font-size: 0.875rem;
}

.streak-best {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 3rem;
}
</style>
