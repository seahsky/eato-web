<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="dashboard" href="/dashboard">
          <ion-icon :icon="homeOutline" />
          <ion-label>Home</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="search" href="/search">
          <ion-icon :icon="searchOutline" />
          <ion-label>Search</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="add" href="/add">
          <ion-icon :icon="addCircleOutline" />
          <ion-label>Log</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="partner" href="/partner">
          <ion-icon :icon="heartOutline" />
          <ion-label>Partner</ion-label>
          <ion-badge v-if="pendingCount > 0" color="danger">{{ pendingCount }}</ion-badge>
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/profile">
          <ion-icon :icon="personOutline" />
          <ion-label>Profile</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonBadge,
} from '@ionic/vue'
import {
  homeOutline,
  searchOutline,
  addCircleOutline,
  heartOutline,
  personOutline,
} from 'ionicons/icons'
import { ref, onMounted } from 'vue'
import { getPendingApprovalCount } from '../api/endpoints/food'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const pendingCount = ref(0)

onMounted(async () => {
  if (auth.hasPartner) {
    try {
      pendingCount.value = await getPendingApprovalCount()
    } catch {
      // Ignore errors loading badge count
    }
  }
})
</script>
