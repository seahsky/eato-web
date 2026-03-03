<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/search" />
        </ion-buttons>
        <ion-title>Add Food</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <!-- Product selected from search -->
      <template v-if="foodStore.selectedProduct">
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ foodStore.selectedProduct.name }}</ion-card-title>
            <ion-card-subtitle v-if="foodStore.selectedProduct.brand">{{ foodStore.selectedProduct.brand }}</ion-card-subtitle>
          </ion-card-header>
        </ion-card>

        <ServingSizeCalc />
        <NutritionLabel :nutrition="foodStore.calculatedNutrition()" />

        <!-- Meal Type -->
        <ion-list>
          <ion-item>
            <ion-select v-model="foodStore.mealType" label="Meal" interface="popover">
              <ion-select-option v-for="m in mealOptions" :key="m.value" :value="m.value">
                {{ m.label }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>

        <ion-button expand="block" :disabled="foodStore.saving" @click="handleSave">
          <ion-spinner v-if="foodStore.saving" name="crescent" />
          <span v-else>Log Food</span>
        </ion-button>
      </template>

      <!-- Manual entry when no product selected -->
      <template v-else>
        <h2>Manual Entry</h2>
        <ion-list>
          <ion-item>
            <ion-input v-model="manualForm.name" label="Food name" label-placement="stacked" placeholder="e.g., Chicken breast" />
          </ion-item>
          <ion-item>
            <ion-input v-model="manualForm.brand" label="Brand (optional)" label-placement="stacked" />
          </ion-item>
          <ion-item>
            <ion-input v-model.number="manualForm.calories" type="number" label="Calories (kcal)" label-placement="stacked" :min="0" />
          </ion-item>
          <ion-item>
            <ion-input v-model.number="manualForm.protein" type="number" label="Protein (g)" label-placement="stacked" :min="0" step="0.1" />
          </ion-item>
          <ion-item>
            <ion-input v-model.number="manualForm.carbs" type="number" label="Carbs (g)" label-placement="stacked" :min="0" step="0.1" />
          </ion-item>
          <ion-item>
            <ion-input v-model.number="manualForm.fat" type="number" label="Fat (g)" label-placement="stacked" :min="0" step="0.1" />
          </ion-item>
          <ion-item>
            <ion-input v-model.number="manualForm.servingSize" type="number" label="Serving size" label-placement="stacked" :min="1" />
          </ion-item>
          <ion-item>
            <ion-select v-model="manualForm.servingUnit" label="Unit" interface="popover">
              <ion-select-option value="g">g</ion-select-option>
              <ion-select-option value="ml">ml</ion-select-option>
              <ion-select-option value="serving">serving</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-select v-model="manualForm.mealType" label="Meal" interface="popover">
              <ion-select-option v-for="m in mealOptions" :key="m.value" :value="m.value">
                {{ m.label }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>

        <ion-button expand="block" :disabled="!manualForm.name || !manualForm.calories || foodStore.saving" @click="handleManualSave">
          <ion-spinner v-if="foodStore.saving" name="crescent" />
          <span v-else>Log Food</span>
        </ion-button>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonList, IonItem, IonInput, IonSelect, IonSelectOption, IonButton, IonSpinner,
} from '@ionic/vue'
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { MealType, MealTypeDisplay } from '../../../api/types'
import { useFoodStore } from '../../../stores/food'
import { useDashboardStore } from '../../../stores/dashboard'
import { useToast } from '../../../composables/useToast'
import { formatDate } from '../../../utils/date'
import ServingSizeCalc from '../components/ServingSizeCalc.vue'
import NutritionLabel from '../components/NutritionLabel.vue'

const router = useRouter()
const foodStore = useFoodStore()
const dashboard = useDashboardStore()
const { showSuccess, showError } = useToast()

const mealOptions = Object.values(MealType).map((v) => ({ value: v, label: MealTypeDisplay[v] }))

const manualForm = reactive({
  name: '',
  brand: '',
  calories: null as number | null,
  protein: null as number | null,
  carbs: null as number | null,
  fat: null as number | null,
  servingSize: 100,
  servingUnit: 'g',
  mealType: MealType.BREAKFAST,
})

async function handleSave() {
  const ok = await foodStore.saveEntry(formatDate(dashboard.selectedDate))
  if (ok) {
    showSuccess('Food logged!')
    foodStore.resetForm()
    router.replace('/dashboard')
  } else {
    showError('Failed to log food')
  }
}

async function handleManualSave() {
  if (!manualForm.name || manualForm.calories == null) return
  const ok = await foodStore.saveManualEntry({
    name: manualForm.name,
    brand: manualForm.brand || undefined,
    calories: manualForm.calories,
    protein: manualForm.protein,
    carbs: manualForm.carbs,
    fat: manualForm.fat,
    servingSize: manualForm.servingSize,
    servingUnit: manualForm.servingUnit,
    mealType: manualForm.mealType,
    consumedAt: formatDate(dashboard.selectedDate),
  })
  if (ok) {
    showSuccess('Food logged!')
    router.replace('/dashboard')
  } else {
    showError('Failed to log food')
  }
}
</script>
