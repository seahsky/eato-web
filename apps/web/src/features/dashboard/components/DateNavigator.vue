<template>
  <div class="date-navigator">
    <ion-button fill="clear" size="small" @click="dashboard.previousDay()">
      <ion-icon :icon="chevronBackOutline" />
    </ion-button>
    <button class="date-label" @click="dashboard.goToToday()">
      {{ dashboard.formattedDate }}
    </button>
    <ion-button fill="clear" size="small" :disabled="dashboard.isSelectedDateToday" @click="dashboard.nextDay()">
      <ion-icon :icon="chevronForwardOutline" />
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue'
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons'
import { useDashboardStore } from '../../../stores/dashboard'

const dashboard = useDashboardStore()
</script>

<style scoped>
.date-navigator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.date-label {
  background: none;
  border: none;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ion-text-color);
  cursor: pointer;
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
}

.date-label:active {
  background: var(--ion-color-light);
}
</style>
