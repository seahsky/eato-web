<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/recipes" />
        </ion-buttons>
        <ion-searchbar v-model="query" placeholder="Search recipes..." :debounce="300" @ionInput="handleSearch" />
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div v-if="searching" class="loading-state">
        <ion-spinner name="crescent" />
      </div>

      <ion-list v-if="results.length > 0">
        <ion-item v-for="recipe in results" :key="recipe.id" button @click="router.push(`/recipes/${recipe.id}`)">
          <ion-label>
            <h2>{{ recipe.name }}</h2>
            <p>{{ Math.round(recipe.caloriesPer100g) }} kcal/100g</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <div v-if="!searching && query && results.length === 0" class="empty-state">
        <p>No recipes found</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonSearchbar,
  IonContent, IonList, IonItem, IonLabel, IonSpinner,
} from '@ionic/vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Recipe } from '../../../api/types'
import { searchRecipes } from '../../../api/endpoints/recipe'

const router = useRouter()
const query = ref('')
const results = ref<Recipe[]>([])
const searching = ref(false)

async function handleSearch(event: CustomEvent) {
  const q = (event.detail.value ?? '').trim()
  if (!q) {
    results.value = []
    return
  }
  searching.value = true
  try {
    results.value = await searchRecipes(q)
  } catch {
    // Ignore
  } finally {
    searching.value = false
  }
}
</script>

<style scoped>
.loading-state, .empty-state {
  display: flex;
  justify-content: center;
  padding: 3rem;
  color: var(--ion-color-medium);
}
</style>
