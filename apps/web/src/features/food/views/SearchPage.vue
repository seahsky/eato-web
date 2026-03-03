<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-searchbar
          v-model="foodStore.query"
          placeholder="Search food..."
          :debounce="300"
          @ionInput="foodStore.search($event.detail.value ?? '')"
          @ionClear="foodStore.clearSearch()"
          show-clear-button="focus"
        />
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <!-- Loading -->
      <div v-if="foodStore.searching" class="loading-state">
        <ion-spinner name="crescent" />
      </div>

      <!-- Results -->
      <ion-list v-if="foodStore.results.length > 0">
        <ion-item
          v-for="product in foodStore.results"
          :key="product.id"
          button
          @click="selectAndAdd(product)"
        >
          <ion-label>
            <h2>{{ product.name }}</h2>
            <p>{{ product.brand || '' }} &middot; {{ Math.round(product.caloriesPer100g) }} kcal/100g</p>
          </ion-label>
          <ion-note slot="end">{{ product.servingSize }}{{ product.servingUnit }}</ion-note>
        </ion-item>
      </ion-list>

      <!-- Empty result -->
      <div v-if="!foodStore.searching && foodStore.query && foodStore.results.length === 0" class="empty-state">
        <p>No results for "{{ foodStore.query }}"</p>
        <ion-button size="small" @click="router.push('/add')">Add Manually</ion-button>
      </div>

      <!-- Error -->
      <ion-card v-if="foodStore.searchError" color="danger">
        <ion-card-content>{{ foodStore.searchError }}</ion-card-content>
      </ion-card>

      <!-- Recent searches when idle -->
      <ion-list v-if="!foodStore.query && foodStore.recentSearches.length > 0">
        <ion-list-header>
          <ion-label>Recent Searches</ion-label>
        </ion-list-header>
        <ion-item
          v-for="recent in foodStore.recentSearches"
          :key="recent"
          button
          @click="foodStore.search(recent)"
        >
          <ion-icon :icon="timeOutline" slot="start" />
          <ion-label>{{ recent }}</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonSearchbar, IonContent, IonList,
  IonListHeader, IonItem, IonLabel, IonNote, IonIcon, IonSpinner,
  IonButton, IonCard, IonCardContent,
} from '@ionic/vue'
import { timeOutline } from 'ionicons/icons'
import { useRouter } from 'vue-router'
import type { FoodProduct } from '../../../api/types'
import { useFoodStore } from '../../../stores/food'

const router = useRouter()
const foodStore = useFoodStore()

function selectAndAdd(product: FoodProduct) {
  foodStore.selectProduct(product)
  router.push('/add')
}
</script>

<style scoped>
.loading-state {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  color: var(--ion-color-medium);
}
</style>
