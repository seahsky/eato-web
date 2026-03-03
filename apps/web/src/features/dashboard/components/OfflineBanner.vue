<template>
  <ion-card color="warning">
    <ion-card-content class="offline-banner">
      <ion-icon :icon="cloudOfflineOutline" />
      <span>You're offline. Showing cached data.</span>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { IonCard, IonCardContent, IonIcon } from '@ionic/vue'
import { cloudOfflineOutline } from 'ionicons/icons'
</script>

<style scoped>
.offline-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  padding: 0.75rem 1rem;
}
</style>
