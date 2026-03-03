<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/partner" />
        </ion-buttons>
        <ion-title>Weekly Comparison</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <div v-if="loading" class="loading-state">
        <ion-spinner name="crescent" />
      </div>

      <!-- My weekly -->
      <ion-card v-if="myWeekly">
        <ion-card-header>
          <ion-card-subtitle>Your Week</ion-card-subtitle>
          <ion-card-title>{{ Math.round(myWeekly.averageCalories) }} avg kcal/day</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>{{ myWeekly.daysLogged }} days logged &middot; {{ myWeekly.daysOnGoal }} on goal</p>
        </ion-card-content>
      </ion-card>

      <!-- Partner weekly -->
      <ion-card v-if="partner.partnerWeeklySummary">
        <ion-card-header>
          <ion-card-subtitle>Partner's Week</ion-card-subtitle>
          <ion-card-title>{{ Math.round(partner.partnerWeeklySummary.averageCalories) }} avg kcal/day</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>{{ partner.partnerWeeklySummary.daysLogged }} days logged &middot; {{ partner.partnerWeeklySummary.daysOnGoal }} on goal</p>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonContent, IonRefresher, IonRefresherContent, IonCard, IonCardHeader,
  IonCardSubtitle, IonCardTitle, IonCardContent, IonSpinner,
} from '@ionic/vue'
import { ref, onMounted } from 'vue'
import type { WeeklySummary } from '../../../api/types'
import { getWeeklySummary } from '../../../api/endpoints/stats'
import { usePartnerStore } from '../../../stores/partner'
import { getWeekStart, formatDate } from '../../../utils/date'

const partner = usePartnerStore()
const myWeekly = ref<WeeklySummary | null>(null)
const loading = ref(true)

async function load() {
  loading.value = true
  const startDate = formatDate(getWeekStart(new Date()))
  try {
    const [mine] = await Promise.all([
      getWeeklySummary(startDate),
      partner.loadPartnerWeekly(startDate),
    ])
    myWeekly.value = mine
  } catch {
    // Ignore
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function onRefresh(event: CustomEvent) {
  await load()
  ;(event.target as any).complete()
}
</script>

<style scoped>
.loading-state {
  display: flex;
  justify-content: center;
  padding: 3rem;
}
</style>
