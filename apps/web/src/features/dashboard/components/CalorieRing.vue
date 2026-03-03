<template>
  <div class="calorie-ring-container">
    <div class="ring-wrapper">
      <svg viewBox="0 0 120 120" class="ring-svg">
        <!-- Background ring -->
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--ion-color-light)" stroke-width="10" />
        <!-- Progress ring -->
        <circle
          cx="60" cy="60" r="52"
          fill="none"
          :stroke="ringColor"
          stroke-width="10"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          transform="rotate(-90 60 60)"
          class="progress-ring"
        />
      </svg>
      <div class="ring-center">
        <span class="ring-value">{{ Math.round(consumed) }}</span>
        <span class="ring-unit">kcal</span>
      </div>
    </div>
    <div class="ring-legend">
      <span class="legend-remaining" v-if="remaining > 0">{{ Math.round(remaining) }} remaining</span>
      <span class="legend-over" v-else>{{ Math.round(Math.abs(remaining)) }} over</span>
      <span class="legend-goal">of {{ Math.round(goal) }} goal</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  consumed: number
  goal: number
}>()

const circumference = 2 * Math.PI * 52 // ~326.7
const percentage = computed(() => Math.min(props.consumed / (props.goal || 1), 1.5))
const dashOffset = computed(() => circumference * (1 - percentage.value))
const remaining = computed(() => props.goal - props.consumed)

const ringColor = computed(() => {
  if (props.consumed > props.goal * 1.1) return 'var(--ion-color-danger)'
  if (props.consumed >= props.goal * 0.9) return 'var(--ion-color-success)'
  return 'var(--ion-color-primary)'
})
</script>

<style scoped>
.calorie-ring-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0;
}

.ring-wrapper {
  position: relative;
  width: 160px;
  height: 160px;
}

.ring-svg {
  width: 100%;
  height: 100%;
}

.progress-ring {
  transition: stroke-dashoffset 0.5s ease;
}

.ring-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.ring-value {
  display: block;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
}

.ring-unit {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
}

.ring-legend {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 0.5rem;
  gap: 0.15rem;
}

.legend-remaining {
  font-weight: 600;
  color: var(--ion-color-primary);
}

.legend-over {
  font-weight: 600;
  color: var(--ion-color-danger);
}

.legend-goal {
  font-size: 0.875rem;
  color: var(--ion-color-medium);
}
</style>
