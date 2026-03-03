<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Profile</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- User Info -->
      <ion-card v-if="auth.user">
        <ion-card-content>
          <div class="user-info">
            <ion-avatar>
              <div class="avatar-placeholder">{{ initials }}</div>
            </ion-avatar>
            <div>
              <h2>{{ auth.user.name || 'User' }}</h2>
              <p>{{ auth.user.email }}</p>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Body Metrics -->
      <ion-card v-if="profileStore.profile">
        <ion-card-header>
          <ion-card-title>Body Metrics</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="none">
            <ion-item>
              <ion-label>Age</ion-label>
              <ion-note slot="end">{{ profileStore.profile.age }}</ion-note>
            </ion-item>
            <ion-item>
              <ion-label>Weight</ion-label>
              <ion-note slot="end">{{ profileStore.profile.weight }} kg</ion-note>
            </ion-item>
            <ion-item>
              <ion-label>Height</ion-label>
              <ion-note slot="end">{{ profileStore.profile.height }} cm</ion-note>
            </ion-item>
            <ion-item>
              <ion-label>Activity Level</ion-label>
              <ion-note slot="end">{{ ActivityLevelDisplay[profileStore.profile.activityLevel] }}</ion-note>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Calculated Values -->
      <ion-card v-if="profileStore.profile">
        <ion-card-header>
          <ion-card-title>Daily Goals</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="none">
            <ion-item>
              <ion-label>BMR</ion-label>
              <ion-note slot="end">{{ Math.round(profileStore.profile.bmr) }} kcal</ion-note>
            </ion-item>
            <ion-item>
              <ion-label>TDEE</ion-label>
              <ion-note slot="end">{{ Math.round(profileStore.profile.tdee) }} kcal</ion-note>
            </ion-item>
            <ion-item>
              <ion-label><strong>Calorie Goal</strong></ion-label>
              <ion-note slot="end"><strong>{{ Math.round(profileStore.profile.calorieGoal) }} kcal</strong></ion-note>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Settings Links -->
      <ion-list>
        <ion-item button detail @click="router.push('/notifications/settings')">
          <ion-icon :icon="notificationsOutline" slot="start" />
          <ion-label>Notification Settings</ion-label>
        </ion-item>
        <ion-item button detail @click="router.push('/badges')">
          <ion-icon :icon="ribbonOutline" slot="start" />
          <ion-label>Badges & Achievements</ion-label>
        </ion-item>
        <ion-item button detail @click="router.push('/theme')">
          <ion-icon :icon="colorPaletteOutline" slot="start" />
          <ion-label>Theme</ion-label>
        </ion-item>
      </ion-list>

      <!-- Sign Out -->
      <ion-button expand="block" fill="outline" color="danger" class="signout-btn" @click="handleSignOut">
        Sign Out
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonList, IonItem, IonLabel, IonNote, IonAvatar,
  IonButton, IonIcon, IonRefresher, IonRefresherContent,
} from '@ionic/vue'
import { notificationsOutline, ribbonOutline, colorPaletteOutline } from 'ionicons/icons'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { useProfileStore } from '../../../stores/profile'
import { ActivityLevelDisplay } from '../../../api/types'

const router = useRouter()
const auth = useAuthStore()
const profileStore = useProfileStore()

const initials = computed(() => {
  const name = auth.user?.name || auth.user?.email || '?'
  return name.slice(0, 2).toUpperCase()
})

onMounted(() => {
  profileStore.loadProfile()
})

async function onRefresh(event: CustomEvent) {
  await profileStore.loadProfile()
  ;(event.target as any).complete()
}

async function handleSignOut() {
  await auth.signOut(true)
  router.replace('/login')
}
</script>

<style scoped>
.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.user-info p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.875rem;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-primary);
  color: white;
  font-weight: 700;
  font-size: 1.25rem;
}

.signout-btn {
  margin-top: 2rem;
}
</style>
