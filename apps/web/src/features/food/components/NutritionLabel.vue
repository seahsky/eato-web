<template>
  <ion-card>
    <ion-card-header>
      <ion-card-subtitle>Nutrition</ion-card-subtitle>
    </ion-card-header>
    <ion-card-content>
      <div class="nutrition-row highlight">
        <span>Calories</span>
        <strong>{{ nutrition.calories }} kcal</strong>
      </div>
      <div class="nutrition-row">
        <span>Protein</span>
        <span>{{ nutrition.protein }}g</span>
      </div>
      <div class="nutrition-row">
        <span>Carbs</span>
        <span>{{ nutrition.carbs }}g</span>
      </div>
      <div class="nutrition-row">
        <span>Fat</span>
        <span>{{ nutrition.fat }}g</span>
      </div>
      <div class="nutrition-row" v-if="nutrition.fiber">
        <span>Fiber</span>
        <span>{{ nutrition.fiber }}g</span>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { IonCard, IonCardHeader, IonCardSubtitle, IonCardContent } from '@ionic/vue'

defineProps<{
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
}>()
</script>

<style scoped>
.nutrition-row {
  display: flex;
  justify-content: space-between;
  padding: 0.35rem 0;
  border-bottom: 1px solid var(--ion-color-light-shade);
}

.nutrition-row:last-child {
  border-bottom: none;
}

.nutrition-row.highlight {
  font-size: 1.1rem;
}
</style>
