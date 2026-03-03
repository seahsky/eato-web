<template>
  <ion-card v-if="entries.length > 0">
    <ion-card-header>
      <ion-card-subtitle>{{ label }}</ion-card-subtitle>
      <ion-card-title class="meal-calories">{{ totalCalories }} kcal</ion-card-title>
    </ion-card-header>
    <ion-list lines="inset">
      <ion-item-sliding v-for="entry in entries" :key="entry.id">
        <ion-item button @click="router.push(`/food/edit/${entry.id}`)">
          <ion-label>
            <h3>{{ entry.name }}</h3>
            <p>{{ entry.servingSize }}{{ entry.servingUnit }} &middot; {{ Math.round(entry.calories) }} kcal</p>
          </ion-label>
          <ion-note slot="end" v-if="entry.brand">{{ entry.brand }}</ion-note>
        </ion-item>
        <ion-item-options side="end">
          <ion-item-option color="danger" @click="handleDelete(entry.id)">Delete</ion-item-option>
        </ion-item-options>
      </ion-item-sliding>
    </ion-list>
  </ion-card>
</template>

<script setup lang="ts">
import {
  IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonList,
  IonItem, IonItemSliding, IonItemOptions, IonItemOption, IonLabel, IonNote,
} from '@ionic/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { FoodEntry } from '../../../api/types'
import type { MealType } from '../../../api/types'
import { useFoodStore } from '../../../stores/food'
import { useToast } from '../../../composables/useToast'

const props = defineProps<{
  mealType: MealType
  label: string
  entries: FoodEntry[]
}>()

const router = useRouter()
const foodStore = useFoodStore()
const { confirm, showSuccess, showError } = useToast()

const totalCalories = computed(() =>
  Math.round(props.entries.reduce((sum, e) => sum + e.calories, 0)),
)

async function handleDelete(id: string) {
  const confirmed = await confirm('Delete Entry', 'Are you sure you want to delete this food entry?')
  if (!confirmed) return
  const ok = await foodStore.deleteEntry(id)
  if (ok) showSuccess('Entry deleted')
  else showError('Failed to delete entry')
}
</script>

<style scoped>
.meal-calories {
  font-size: 1.1rem;
}
</style>
