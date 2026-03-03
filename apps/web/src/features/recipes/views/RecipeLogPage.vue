<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/recipes/${route.params.id}`" />
        </ion-buttons>
        <ion-title>Log Recipe</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div v-if="recipeStore.loading" class="loading-state">
        <ion-spinner name="crescent" />
      </div>

      <template v-if="recipeStore.currentRecipe">
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ recipeStore.currentRecipe.name }}</ion-card-title>
          </ion-card-header>
        </ion-card>

        <ion-list>
          <ion-item>
            <ion-input v-model.number="portionGrams" type="number" label="Portion size (g)" label-placement="stacked" :min="1" />
          </ion-item>
          <ion-item>
            <ion-select v-model="mealType" label="Meal" interface="popover">
              <ion-select-option v-for="m in mealOptions" :key="m.value" :value="m.value">
                {{ m.label }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>

        <!-- Nutrition preview for this portion -->
        <ion-card v-if="portionGrams > 0">
          <ion-card-header>
            <ion-card-subtitle>Nutrition for {{ portionGrams }}g portion</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <div class="nutrition-row">
              <span>Calories</span>
              <strong>{{ Math.round(recipeStore.currentRecipe.caloriesPer100g * portionGrams / 100) }} kcal</strong>
            </div>
            <div class="nutrition-row">
              <span>Protein</span>
              <span>{{ Math.round(recipeStore.currentRecipe.proteinPer100g * portionGrams / 100 * 10) / 10 }}g</span>
            </div>
            <div class="nutrition-row">
              <span>Carbs</span>
              <span>{{ Math.round(recipeStore.currentRecipe.carbsPer100g * portionGrams / 100 * 10) / 10 }}g</span>
            </div>
            <div class="nutrition-row">
              <span>Fat</span>
              <span>{{ Math.round(recipeStore.currentRecipe.fatPer100g * portionGrams / 100 * 10) / 10 }}g</span>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-button expand="block" :disabled="!portionGrams || recipeStore.saving" @click="handleLog">
          <ion-spinner v-if="recipeStore.saving" name="crescent" />
          <span v-else>Log Recipe</span>
        </ion-button>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonList, IonItem, IonInput, IonSelect, IonSelectOption, IonButton, IonSpinner,
} from '@ionic/vue'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MealType, MealTypeDisplay } from '../../../api/types'
import { useRecipeStore } from '../../../stores/recipe'
import { useDashboardStore } from '../../../stores/dashboard'
import { useToast } from '../../../composables/useToast'
import { formatDate } from '../../../utils/date'

const route = useRoute()
const router = useRouter()
const recipeStore = useRecipeStore()
const dashboard = useDashboardStore()
const { showSuccess, showError } = useToast()

const portionGrams = ref(100)
const mealType = ref<MealType>(MealType.LUNCH)
const mealOptions = Object.values(MealType).map((v) => ({ value: v, label: MealTypeDisplay[v] }))

onMounted(() => {
  recipeStore.loadRecipe(route.params.id as string)
})

async function handleLog() {
  const ok = await recipeStore.logRecipe({
    recipeId: route.params.id as string,
    portionGrams: portionGrams.value,
    mealType: mealType.value,
    consumedAt: formatDate(dashboard.selectedDate),
  })
  if (ok) {
    showSuccess('Recipe logged!')
    dashboard.loadDailySummary()
    router.replace('/dashboard')
  } else {
    showError('Failed to log recipe')
  }
}
</script>

<style scoped>
.loading-state {
  display: flex;
  justify-content: center;
  padding: 3rem;
}

.nutrition-row {
  display: flex;
  justify-content: space-between;
  padding: 0.35rem 0;
}
</style>
