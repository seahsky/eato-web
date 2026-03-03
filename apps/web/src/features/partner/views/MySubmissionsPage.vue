<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/partner" />
        </ion-buttons>
        <ion-title>My Submissions</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <div v-if="approval.loading" class="loading-state">
        <ion-spinner name="crescent" />
      </div>

      <ion-list v-if="approval.mySubmissions.length > 0">
        <ion-item v-for="entry in approval.mySubmissions" :key="entry.id">
          <ion-label>
            <h2>{{ entry.name }}</h2>
            <p>{{ entry.servingSize }}{{ entry.servingUnit }} &middot; {{ Math.round(entry.calories) }} kcal</p>
          </ion-label>
          <ion-chip slot="end" :color="statusColor(entry.approvalStatus)">
            {{ entry.approvalStatus }}
          </ion-chip>
        </ion-item>
      </ion-list>

      <div v-if="!approval.loading && approval.mySubmissions.length === 0" class="empty-state">
        <p>No submissions</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonContent, IonRefresher, IonRefresherContent, IonList, IonItem,
  IonLabel, IonChip, IonSpinner,
} from '@ionic/vue'
import { onMounted } from 'vue'
import { ApprovalStatus } from '../../../api/types'
import { useApprovalStore } from '../../../stores/approval'

const approval = useApprovalStore()

onMounted(() => approval.loadMySubmissions())

async function onRefresh(event: CustomEvent) {
  await approval.loadMySubmissions()
  ;(event.target as any).complete()
}

function statusColor(status: ApprovalStatus) {
  if (status === ApprovalStatus.APPROVED) return 'success'
  if (status === ApprovalStatus.REJECTED) return 'danger'
  return 'warning'
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
