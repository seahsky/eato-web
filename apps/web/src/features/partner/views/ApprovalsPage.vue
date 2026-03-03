<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/partner" />
        </ion-buttons>
        <ion-title>Pending Approvals</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <div v-if="approval.loading" class="loading-state">
        <ion-spinner name="crescent" />
      </div>

      <ion-list v-if="approval.pendingApprovals.length > 0">
        <ion-item-sliding v-for="entry in approval.pendingApprovals" :key="entry.id">
          <ion-item>
            <ion-label>
              <h2>{{ entry.name }}</h2>
              <p>{{ entry.servingSize }}{{ entry.servingUnit }} &middot; {{ Math.round(entry.calories) }} kcal</p>
            </ion-label>
          </ion-item>
          <ion-item-options side="start">
            <ion-item-option color="success" @click="handleApprove(entry.id)">Approve</ion-item-option>
          </ion-item-options>
          <ion-item-options side="end">
            <ion-item-option color="danger" @click="handleReject(entry.id)">Reject</ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <div v-if="!approval.loading && approval.pendingApprovals.length === 0" class="empty-state">
        <p>No pending approvals</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonContent, IonRefresher, IonRefresherContent, IonList, IonItem,
  IonItemSliding, IonItemOptions, IonItemOption, IonLabel, IonSpinner,
} from '@ionic/vue'
import { onMounted } from 'vue'
import { useApprovalStore } from '../../../stores/approval'
import { useToast } from '../../../composables/useToast'

const approval = useApprovalStore()
const { showSuccess, showError } = useToast()

onMounted(() => approval.loadPendingApprovals())

async function onRefresh(event: CustomEvent) {
  await approval.loadPendingApprovals()
  ;(event.target as any).complete()
}

async function handleApprove(id: string) {
  try {
    await approval.approve(id)
    showSuccess('Entry approved')
  } catch {
    showError('Failed to approve entry')
  }
}

async function handleReject(id: string) {
  try {
    await approval.reject(id)
    showSuccess('Entry rejected')
  } catch {
    showError('Failed to reject entry')
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
