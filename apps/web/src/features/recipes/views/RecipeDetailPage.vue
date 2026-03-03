<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/recipes" />
        </ion-buttons>
        <ion-title>Recipe</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="recipeStore.currentRecipe" @click="router.push(`/recipes/${recipeStore.currentRecipe.id}/edit`)">
            <ion-icon :icon="createOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div v-if="recipeStore.loading" class="loading-state">
        <ion-spinner name="crescent" />
      </div>

      <template v-if="recipeStore.currentRecipe">
        <h1>{{ recipeStore.currentRecipe.name }}</h1>
        <p v-if="recipeStore.currentRecipe.description" class="description">{{ recipeStore.currentRecipe.description }}</p>

        <ion-card>
          <ion-card-header>
            <ion-card-subtitle>Nutrition per 100g</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <div class="nutrition-grid">
              <div class="nutrition-item">
                <span class="value">{{ Math.round(recipeStore.currentRecipe.caloriesPer100g) }}</span>
                <span class="label">kcal</span>
              </div>
              <div class="nutrition-item">
                <span class="value">{{ Math.round(recipeStore.currentRecipe.proteinPer100g * 10) / 10 }}</span>
                <span class="label">Protein</span>
              </div>
              <div class="nutrition-item">
                <span class="value">{{ Math.round(recipeStore.currentRecipe.carbsPer100g * 10) / 10 }}</span>
                <span class="label">Carbs</span>
              </div>
              <div class="nutrition-item">
                <span class="value">{{ Math.round(recipeStore.currentRecipe.fatPer100g * 10) / 10 }}</span>
                <span class="label">Fat</span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <h3>Ingredients ({{ recipeStore.currentRecipe.yieldWeight }}{{ recipeStore.currentRecipe.yieldUnit }} yield)</h3>
        <ion-list>
          <ion-item v-for="ing in recipeStore.currentRecipe.ingredients" :key="ing.id">
            <ion-label>
              <h3>{{ ing.name }}</h3>
              <p>{{ ing.quantity }}{{ ing.unit }}</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <div class="action-buttons">
          <ion-button expand="block" @click="router.push(`/recipes/${recipeStore.currentRecipe.id}/log`)">
            Log This Recipe
          </ion-button>
          <ion-button expand="block" fill="outline" color="danger" @click="handleDelete">
            Delete Recipe
          </ion-button>
        </div>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonButton,
  IonIcon, IonContent, IonCard, IonCardHeader, IonCardSubtitle, IonCardContent,
  IonList, IonItem, IonLabel, IonSpinner,
} from '@ionic/vue'
import { createOutline } from 'ionicons/icons'
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecipeStore } from '../../../stores/recipe'
import { useToast } from '../../../composables/useToast'

const route = useRoute()
const router = useRouter()
const recipeStore = useRecipeStore()
const { showSuccess, showError, confirm } = useToast()

onMounted(() => {
  recipeStore.loadRecipe(route.params.id as string)
})

async function handleDelete() {
  const confirmed = await confirm('Delete Recipe', 'Are you sure? This cannot be undone.')
  if (!confirmed) return
  const ok = await recipeStore.deleteRecipe(route.params.id as string)
  if (ok) {
    showSuccess('Recipe deleted')
    router.replace('/recipes')
  } else {
    showError('Failed to delete recipe')
  }
}
</script>

<style scoped>
.description {
  color: var(--ion-color-medium);
  margin-bottom: 1rem;
}

.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  text-align: center;
}

.nutrition-item .value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
}

.nutrition-item .label {
  display: block;
  font-size: 0.75rem;
  color: var(--ion-color-medium);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 3rem;
}

.action-buttons {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>
