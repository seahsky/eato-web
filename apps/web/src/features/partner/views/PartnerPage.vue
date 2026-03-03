<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Partner</ion-title>
        <ion-buttons slot="end" v-if="partner.hasPartner">
          <ion-button @click="router.push('/partner/approvals')">
            <ion-icon :icon="checkmarkCircleOutline" />
            <ion-badge v-if="approval.pendingCount > 0" color="danger">{{ approval.pendingCount }}</ion-badge>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- No partner: link/generate -->
      <template v-if="!partner.hasPartner">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Connect with your partner</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>Share your code with your partner, or enter theirs to connect.</p>

            <ion-button expand="block" @click="handleGenerateCode" :disabled="partner.loading" class="ion-margin-top">
              Generate Link Code
            </ion-button>

            <div v-if="partner.partnerCode" class="code-display">
              <h2>{{ partner.partnerCode }}</h2>
              <p>Share this code with your partner (expires in 24h)</p>
            </div>

            <div class="divider">or</div>

            <ion-item>
              <ion-input v-model="linkCode" label="Enter partner's code" label-placement="stacked" placeholder="ABC123" maxlength="6" />
            </ion-item>
            <ion-button expand="block" fill="outline" :disabled="linkCode.length < 6 || partner.loading" @click="handleLink" class="ion-margin-top">
              Link Partner
            </ion-button>
          </ion-card-content>
        </ion-card>
      </template>

      <!-- Has partner: show summary -->
      <template v-else>
        <ion-card v-if="partner.partnerDailySummary">
          <ion-card-header>
            <ion-card-subtitle>Partner's Day</ion-card-subtitle>
            <ion-card-title>{{ Math.round(partner.partnerDailySummary.totalCalories) }} kcal</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>Goal: {{ Math.round(partner.partnerDailySummary.calorieGoal) }} kcal</p>
            <p>{{ partner.partnerDailySummary.entries.length }} entries logged</p>
          </ion-card-content>
        </ion-card>

        <ion-list>
          <ion-item button detail @click="router.push('/partner/approvals')">
            <ion-icon :icon="checkmarkCircleOutline" slot="start" />
            <ion-label>Pending Approvals</ion-label>
            <ion-badge v-if="approval.pendingCount > 0" slot="end" color="danger">{{ approval.pendingCount }}</ion-badge>
          </ion-item>
          <ion-item button detail @click="router.push('/partner/submissions')">
            <ion-icon :icon="sendOutline" slot="start" />
            <ion-label>My Submissions</ion-label>
          </ion-item>
          <ion-item button detail @click="router.push('/partner/weekly')">
            <ion-icon :icon="barChartOutline" slot="start" />
            <ion-label>Weekly Comparison</ion-label>
          </ion-item>
        </ion-list>

        <ion-button expand="block" @click="handleNudge" :disabled="partner.loading" class="ion-margin-top">
          <ion-icon :icon="notificationsOutline" slot="start" />
          Nudge Partner
        </ion-button>

        <ion-button expand="block" fill="outline" color="danger" @click="handleUnlink" class="ion-margin-top">
          Unlink Partner
        </ion-button>
      </template>

      <ion-card v-if="partner.error" color="danger">
        <ion-card-content>{{ partner.error }}</ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent,
  IonRefresher, IonRefresherContent, IonCard, IonCardHeader, IonCardTitle,
  IonCardSubtitle, IonCardContent, IonList, IonItem, IonLabel, IonIcon,
  IonBadge, IonInput,
} from '@ionic/vue'
import { checkmarkCircleOutline, sendOutline, barChartOutline, notificationsOutline } from 'ionicons/icons'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePartnerStore } from '../../../stores/partner'
import { useApprovalStore } from '../../../stores/approval'
import { useDashboardStore } from '../../../stores/dashboard'
import { useToast } from '../../../composables/useToast'
import { formatDate } from '../../../utils/date'

const router = useRouter()
const partner = usePartnerStore()
const approval = useApprovalStore()
const dashboard = useDashboardStore()
const { showSuccess, showError, confirm } = useToast()

const linkCode = ref('')

onMounted(async () => {
  if (partner.hasPartner) {
    approval.loadPendingCount()
    partner.loadPartnerDaily(formatDate(dashboard.selectedDate))
  }
})

async function onRefresh(event: CustomEvent) {
  if (partner.hasPartner) {
    await Promise.all([
      approval.loadPendingCount(),
      partner.loadPartnerDaily(formatDate(dashboard.selectedDate)),
    ])
  }
  ;(event.target as any).complete()
}

async function handleGenerateCode() {
  await partner.generateCode()
}

async function handleLink() {
  try {
    await partner.linkPartner(linkCode.value)
    showSuccess('Partner linked!')
    linkCode.value = ''
  } catch {
    showError(partner.error ?? 'Failed to link partner')
  }
}

async function handleNudge() {
  try {
    await partner.sendNudge()
    showSuccess('Nudge sent!')
  } catch {
    showError(partner.error ?? 'Failed to send nudge')
  }
}

async function handleUnlink() {
  const confirmed = await confirm('Unlink Partner', 'Are you sure? This will remove the partner connection for both of you.')
  if (!confirmed) return
  await partner.unlinkPartner()
  showSuccess('Partner unlinked')
}
</script>

<style scoped>
.code-display {
  text-align: center;
  padding: 1.5rem;
  margin: 1rem 0;
  background: var(--ion-color-light);
  border-radius: 12px;
}

.code-display h2 {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.3em;
  color: var(--ion-color-primary);
  margin: 0 0 0.5rem;
}

.divider {
  text-align: center;
  color: var(--ion-color-medium);
  margin: 1.5rem 0;
  position: relative;
}
</style>
