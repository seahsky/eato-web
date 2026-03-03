<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Recipes</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="router.push('/recipes/search')">
            <ion-icon :icon="searchOutline" />
          </ion-button>
          <ion-button @click="router.push('/recipes/new')">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <div v-if="recipeStore.loading && recipeStore.recipes.length === 0" class="loading-state">
        <ion-spinner name="crescent" />
      </div>

      <ion-list v-if="recipeStore.recipes.length > 0">
        <ion-item v-for="recipe in recipeStore.recipes" :key="recipe.id" button @click="router.push(`/recipes/${recipe.id}`)">
          <ion-label>
            <h2>{{ recipe.name }}</h2>
            <p>{{ Math.round(recipe.caloriesPer100g) }} kcal/100g &middot; {{ recipe.ingredients.length }} ingredients</p>
          </ion-label>
          <ion-note slot="end">{{ recipe.yieldWeight }}{{ recipe.yieldUnit }}</ion-note>
        </ion-item>
      </ion-list>

      <div v-if="!recipeStore.loading && recipeStore.recipes.length === 0" class="empty-state">
        <p>No recipes yet</p>
        <ion-button size="small" @click="router.push('/recipes/new')">Create Recipe</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonRefresher, IonRefresherContent, IonList, IonItem, IonLabel,
  IonNote, IonSpinner,
} from '@ionic/vue'
import { searchOutline, addOutline } from 'ionicons/icons'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRecipeStore } from '../../../stores/recipe'

const router = useRouter()
const recipeStore = useRecipeStore()

onMounted(() => recipeStore.loadRecipes())

async function onRefresh(event: CustomEvent) {
  await recipeStore.loadRecipes()
  ;(event.target as any).complete()
}
</script>

<style scoped>
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
  gap: 0.75rem;
  color: var(--ion-color-medium);
}
</style>
