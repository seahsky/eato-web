<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Setup Your Profile</ion-title>
      </ion-toolbar>
      <ion-progress-bar :value="(step + 1) / 4" />
    </ion-header>
    <ion-content class="ion-padding">
      <!-- Step 0: Gender -->
      <div v-if="step === 0" class="step">
        <h2>What's your gender?</h2>
        <p class="subtitle">This helps us calculate your metabolic rate</p>
        <div class="selection-grid">
          <ion-card
            v-for="g in genderOptions"
            :key="g.value"
            :class="{ selected: form.gender === g.value }"
            button
            @click="form.gender = g.value"
          >
            <ion-card-content class="selection-card">
              <ion-icon :icon="g.icon" size="large" />
              <span>{{ g.label }}</span>
            </ion-card-content>
          </ion-card>
        </div>
        <ion-button expand="block" :disabled="!form.gender" @click="step++">Continue</ion-button>
      </div>

      <!-- Step 1: Body Metrics -->
      <div v-if="step === 1" class="step">
        <h2>Your body metrics</h2>
        <p class="subtitle">We'll use this for BMR calculation</p>
        <ion-list>
          <ion-item>
            <ion-input v-model.number="form.age" type="number" label="Age" label-placement="stacked" placeholder="25" :min="13" :max="120" />
          </ion-item>
          <ion-item>
            <ion-input v-model.number="form.weight" type="number" label="Weight (kg)" label-placement="stacked" placeholder="70" :min="30" :max="300" step="0.1" />
          </ion-item>
          <ion-item>
            <ion-input v-model.number="form.height" type="number" label="Height (cm)" label-placement="stacked" placeholder="170" :min="100" :max="250" />
          </ion-item>
        </ion-list>
        <div class="step-buttons">
          <ion-button fill="outline" @click="step--">Back</ion-button>
          <ion-button :disabled="!form.age || !form.weight || !form.height" @click="step++">Continue</ion-button>
        </div>
      </div>

      <!-- Step 2: Activity Level -->
      <div v-if="step === 2" class="step">
        <h2>How active are you?</h2>
        <ion-list>
          <ion-radio-group v-model="form.activityLevel">
            <ion-item v-for="al in activityOptions" :key="al.value">
              <ion-radio :value="al.value" label-placement="end">
                <div>
                  <strong>{{ al.label }}</strong>
                  <p class="activity-desc">{{ al.description }}</p>
                </div>
              </ion-radio>
            </ion-item>
          </ion-radio-group>
        </ion-list>
        <div class="step-buttons">
          <ion-button fill="outline" @click="step--">Back</ion-button>
          <ion-button :disabled="!form.activityLevel" @click="calculatePreview(); step++">Continue</ion-button>
        </div>
      </div>

      <!-- Step 3: Calorie Goal -->
      <div v-if="step === 3" class="step">
        <h2>Set your daily goal</h2>
        <div v-if="bmrPreview" class="metrics-preview">
          <div class="metric">
            <span class="metric-label">BMR</span>
            <span class="metric-value">{{ Math.round(bmrPreview) }} kcal</span>
          </div>
          <div class="metric">
            <span class="metric-label">TDEE</span>
            <span class="metric-value">{{ Math.round(tdeePreview) }} kcal</span>
          </div>
        </div>

        <p class="subtitle">Choose a calorie target or set your own</p>
        <div class="goal-chips">
          <ion-chip
            v-for="option in goalOptions"
            :key="option.label"
            :color="form.calorieGoal === option.value ? 'primary' : 'medium'"
            @click="form.calorieGoal = option.value"
          >
            {{ option.label }} ({{ option.value }} kcal)
          </ion-chip>
        </div>
        <ion-item>
          <ion-input v-model.number="form.calorieGoal" type="number" label="Custom goal (kcal)" label-placement="stacked" :min="800" :max="10000" />
        </ion-item>

        <div class="step-buttons">
          <ion-button fill="outline" @click="step--">Back</ion-button>
          <ion-button :disabled="!form.calorieGoal || saving" @click="saveProfile">
            <ion-spinner v-if="saving" name="crescent" />
            <span v-else>Complete Setup</span>
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonProgressBar,
  IonCard, IonCardContent, IonIcon, IonButton, IonList, IonItem, IonInput,
  IonRadioGroup, IonRadio, IonChip, IonSpinner,
} from '@ionic/vue'
import { maleOutline, femaleOutline } from 'ionicons/icons'
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Gender, ActivityLevel, ActivityLevelDisplay } from '../../../api/types'
import { useProfileStore } from '../../../stores/profile'
import { useAuthStore } from '../../../stores/auth'
import { useToast } from '../../../composables/useToast'

const router = useRouter()
const profileStore = useProfileStore()
const authStore = useAuthStore()
const { showError } = useToast()

const step = ref(0)
const saving = ref(false)
const bmrPreview = ref(0)
const tdeePreview = ref(0)

const form = reactive({
  gender: null as Gender | null,
  age: null as number | null,
  weight: null as number | null,
  height: null as number | null,
  activityLevel: null as ActivityLevel | null,
  calorieGoal: null as number | null,
})

const genderOptions = [
  { value: Gender.MALE, label: 'Male', icon: maleOutline },
  { value: Gender.FEMALE, label: 'Female', icon: femaleOutline },
]

const activityOptions = [
  { value: ActivityLevel.SEDENTARY, label: ActivityLevelDisplay[ActivityLevel.SEDENTARY], description: 'Little or no exercise' },
  { value: ActivityLevel.LIGHTLY_ACTIVE, label: ActivityLevelDisplay[ActivityLevel.LIGHTLY_ACTIVE], description: 'Light exercise 1-3 days/week' },
  { value: ActivityLevel.MODERATELY_ACTIVE, label: ActivityLevelDisplay[ActivityLevel.MODERATELY_ACTIVE], description: 'Moderate exercise 3-5 days/week' },
  { value: ActivityLevel.ACTIVE, label: ActivityLevelDisplay[ActivityLevel.ACTIVE], description: 'Hard exercise 6-7 days/week' },
  { value: ActivityLevel.VERY_ACTIVE, label: ActivityLevelDisplay[ActivityLevel.VERY_ACTIVE], description: 'Very hard exercise, physical job' },
]

function calculatePreview() {
  if (!form.weight || !form.height || !form.age || !form.gender || !form.activityLevel) return
  bmrPreview.value = profileStore.calculateBmr(form.weight, form.height, form.age, form.gender)
  tdeePreview.value = profileStore.calculateTdee(bmrPreview.value, form.activityLevel)
  // Default goal to TDEE
  if (!form.calorieGoal) {
    form.calorieGoal = Math.round(tdeePreview.value)
  }
}

const goalOptions = [
  { label: 'Lose weight', get value() { return Math.round(tdeePreview.value - 500) } },
  { label: 'Maintain', get value() { return Math.round(tdeePreview.value) } },
  { label: 'Gain weight', get value() { return Math.round(tdeePreview.value + 500) } },
]

async function saveProfile() {
  if (!form.gender || !form.age || !form.weight || !form.height || !form.activityLevel || !form.calorieGoal) return
  saving.value = true
  try {
    await profileStore.updateProfile({
      gender: form.gender,
      age: form.age,
      weight: form.weight,
      height: form.height,
      activityLevel: form.activityLevel,
      calorieGoal: form.calorieGoal,
    })
    // Refresh user to update profileCompleted flag
    await authStore.refreshUser()
    router.replace('/notification-permission?redirectTo=/dashboard')
  } catch {
    showError('Failed to save profile. Please try again.')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.step {
  max-width: 480px;
  margin: 0 auto;
}

h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 1rem 0 0.25rem;
}

.subtitle {
  color: var(--ion-color-medium);
  margin: 0 0 1.5rem;
}

.selection-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.selection-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  font-weight: 600;
}

ion-card.selected {
  border: 2px solid var(--ion-color-primary);
}

.step-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.step-buttons ion-button {
  flex: 1;
}

.metrics-preview {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.metric {
  flex: 1;
  text-align: center;
  padding: 1rem;
  border-radius: 12px;
  background: var(--ion-color-light);
}

.metric-label {
  display: block;
  font-size: 0.875rem;
  color: var(--ion-color-medium);
}

.metric-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ion-color-primary);
}

.goal-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.activity-desc {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  margin: 0;
}
</style>
