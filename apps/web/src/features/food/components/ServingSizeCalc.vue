<template>
  <ion-list>
    <ion-item>
      <ion-input
        v-model.number="foodStore.servingSize"
        type="number"
        label="Serving size"
        label-placement="stacked"
        :min="1"
        step="1"
      />
    </ion-item>
    <ion-item>
      <ion-label>{{ foodStore.servingUnit }}</ion-label>
    </ion-item>
  </ion-list>
</template>

<script setup lang="ts">
import { IonList, IonItem, IonInput, IonLabel } from '@ionic/vue'
import { useFoodStore } from '../../../stores/food'

const foodStore = useFoodStore()
</script>
