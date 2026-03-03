<template>
  <ion-page>
    <ion-content class="ion-padding" :fullscreen="true">
      <div class="login-container">
        <div class="login-header">
          <img src="/icons/Icon-192.png" alt="Eato" class="logo" />
          <h1>Eato</h1>
          <p>Track calories together with your partner</p>
        </div>

        <div class="clerk-auth">
          <SignIn v-if="!isSignedIn" routing="hash" />
          <div v-else class="loading-state">
            <ion-spinner name="crescent" />
            <p>Signing you in...</p>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonSpinner } from '@ionic/vue'
import { SignIn, useAuth, useClerk } from '@clerk/vue'
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'

const { isSignedIn, getToken } = useAuth()
const clerk = useClerk()
const auth = useAuthStore()
const router = useRouter()

// Wire Clerk helpers into the auth store
auth.setClerkHelpers(
  () => getToken.value({ template: undefined as any }) as Promise<string | null>,
  async () => {
    await clerk.value?.signOut()
  },
)

// React to Clerk session changes
watch(
  isSignedIn,
  async (signedIn) => {
    if (signedIn) {
      await auth.handleSignedIn()
      if (auth.needsOnboarding) {
        router.replace('/profile-setup')
      } else {
        router.replace('/dashboard')
      }
    } else {
      auth.handleSignedOut()
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 2rem;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  margin-bottom: 1rem;
}

.login-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--ion-color-primary);
  margin: 0 0 0.5rem;
}

.login-header p {
  color: var(--ion-color-medium);
  margin: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}
</style>
