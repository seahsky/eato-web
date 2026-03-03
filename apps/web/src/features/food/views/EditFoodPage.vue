<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/dashboard" />
        </ion-buttons>
        <ion-title>Edit Food</ion-title>
        <ion-buttons slot="end">
          <ion-button color="danger" @click="handleDelete">Delete</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div v-if="loading" class="loading-state">
        <ion-spinner name="crescent" />
      </div>

      <template v-if="entry">
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ entry.name }}</ion-card-title>
            <ion-card-subtitle v-if="entry.brand">{{ entry.brand }}</ion-card-subtitle>
          </ion-card-header>
        </ion-card>

        <ion-list>
          <ion-item>
            <ion-input v-model.number="form.servingSize" type="number" label="Serving size" label-placement="stacked" :min="1" />
          </ion-item>
          <ion-item>
            <ion-input :value="entry.servingUnit" label="Unit" label-placement="stacked" readonly />
          </ion-item>
          <ion-item>
            <ion-select v-model="form.mealType" label="Meal" interface="popover">
              <ion-select-option v-for="m in mealOptions" :key="m.value" :value="m.value">
                {{ m.label }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>

        <!-- Nutrition preview -->
        <ion-card>
          <ion-card-content>
            <div class="nutrition-row">
              <span>Calories</span>
              <strong>{{ Math.round(entry.calories) }} kcal</strong>
            </div>
            <div class="nutrition-row" v-if="entry.protein != null">
              <span>Protein</span>
              <span>{{ entry.protein }}g</span>
            </div>
            <div class="nutrition-row" v-if="entry.carbs != null">
              <span>Carbs</span>
              <span>{{ entry.carbs }}g</span>
            </div>
            <div class="nutrition-row" v-if="entry.fat != null">
              <span>Fat</span>
              <span>{{ entry.fat }}g</span>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-button expand="block" :disabled="saving" @click="handleSave">
          <ion-spinner v-if="saving" name="crescent" />
          <span v-else>Save Changes</span>
        </ion-button>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonButton,
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonList, IonItem, IonInput, IonSelect, IonSelectOption, IonSpinner,
} from '@ionic/vue'
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MealType, MealTypeDisplay } from '../../../api/types'
import type { FoodEntry } from '../../../api/types'
import { getFoodEntry, updateFoodEntry, deleteFoodEntry } from '../../../api/endpoints/food'
import { useDashboardStore } from '../../../stores/dashboard'
import { useToast } from '../../../composables/useToast'

const route = useRoute()
const router = useRouter()
const dashboard = useDashboardStore()
const { showSuccess, showError, confirm } = useToast()

const entry = ref<FoodEntry | null>(null)
const loading = ref(true)
const saving = ref(false)

const form = reactive({
  servingSize: 0,
  mealType: MealType.BREAKFAST as MealType,
})

const mealOptions = Object.values(MealType).map((v) => ({ value: v, label: MealTypeDisplay[v] }))

onMounted(async () => {
  const id = route.params.id as string
  try {
    entry.value = await getFoodEntry(id)
    form.servingSize = entry.value.servingSize
    form.mealType = entry.value.mealType
  } catch {
    showError('Failed to load entry')
    router.back()
  } finally {
    loading.value = false
  }
})

async function handleSave() {
  if (!entry.value) return
  saving.value = true
  try {
    await updateFoodEntry(entry.value.id, {
      servingSize: form.servingSize,
      mealType: form.mealType,
    })
    showSuccess('Entry updated')
    dashboard.loadDailySummary()
    router.back()
  } catch {
    showError('Failed to update entry')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!entry.value) return
  const confirmed = await confirm('Delete Entry', 'Are you sure you want to delete this food entry?')
  if (!confirmed) return
  try {
    await deleteFoodEntry(entry.value.id)
    showSuccess('Entry deleted')
    dashboard.loadDailySummary()
    router.replace('/dashboard')
  } catch {
    showError('Failed to delete entry')
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
