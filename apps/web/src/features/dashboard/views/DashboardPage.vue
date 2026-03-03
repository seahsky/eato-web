<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Eato</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- Offline Banner -->
      <OfflineBanner v-if="dashboard.isOffline" />

      <!-- Date Navigator -->
      <DateNavigator />

      <!-- Calorie Ring -->
      <CalorieRing
        v-if="dashboard.dailySummary"
        :consumed="dashboard.dailySummary.totalCalories"
        :goal="dashboard.dailySummary.calorieGoal"
      />

      <!-- Loading skeleton -->
      <div v-if="dashboard.loading && !dashboard.dailySummary" class="loading-state">
        <ion-spinner name="crescent" />
        <p>Loading...</p>
      </div>

      <!-- Error state -->
      <ion-card v-if="dashboard.error" color="danger">
        <ion-card-content>{{ dashboard.error }}</ion-card-content>
      </ion-card>

      <!-- Meal Sections -->
      <template v-if="dashboard.dailySummary">
        <MealSection
          v-for="meal in meals"
          :key="meal.type"
          :meal-type="meal.type"
          :label="meal.label"
          :entries="meal.entries"
        />
      </template>

      <!-- Empty state -->
      <ion-card v-if="dashboard.dailySummary && dashboard.dailySummary.entries.length === 0 && !dashboard.loading">
        <ion-card-content class="empty-state">
          <ion-icon :icon="fastFoodOutline" size="large" color="medium" />
          <p>No food logged yet today</p>
          <ion-button size="small" router-link="/add">Log Food</ion-button>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher,
  IonRefresherContent, IonSpinner, IonCard, IonCardContent, IonButton, IonIcon,
} from '@ionic/vue'
import { fastFoodOutline } from 'ionicons/icons'
import { computed, onMounted } from 'vue'
import { MealType, MealTypeDisplay } from '../../../api/types'
import { useDashboardStore } from '../../../stores/dashboard'
import DateNavigator from '../components/DateNavigator.vue'
import CalorieRing from '../components/CalorieRing.vue'
import MealSection from '../components/MealSection.vue'
import OfflineBanner from '../components/OfflineBanner.vue'

const dashboard = useDashboardStore()

const meals = computed(() => {
  const entries = dashboard.dailySummary?.entries ?? []
  return [
    { type: MealType.BREAKFAST, label: MealTypeDisplay[MealType.BREAKFAST], entries: entries.filter(e => e.mealType === MealType.BREAKFAST) },
    { type: MealType.LUNCH, label: MealTypeDisplay[MealType.LUNCH], entries: entries.filter(e => e.mealType === MealType.LUNCH) },
    { type: MealType.DINNER, label: MealTypeDisplay[MealType.DINNER], entries: entries.filter(e => e.mealType === MealType.DINNER) },
    { type: MealType.SNACK, label: MealTypeDisplay[MealType.SNACK], entries: entries.filter(e => e.mealType === MealType.SNACK) },
  ]
})

onMounted(() => {
  dashboard.loadDailySummary()
})

async function onRefresh(event: CustomEvent) {
  await dashboard.loadDailySummary()
  ;(event.target as any).complete()
}
</script>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 0;
  gap: 1rem;
  color: var(--ion-color-medium);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
  color: var(--ion-color-medium);
}
</style>
