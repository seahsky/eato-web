import { ref, computed } from 'vue'
import { formatDate, addDays, isToday } from '../utils/date'

export function useDateNavigation() {
  const currentDate = ref(new Date())

  const dateString = computed(() => formatDate(currentDate.value))
  const isCurrentDay = computed(() => isToday(currentDate.value))

  function goToPreviousDay() {
    currentDate.value = addDays(currentDate.value, -1)
  }

  function goToNextDay() {
    if (!isCurrentDay.value) {
      currentDate.value = addDays(currentDate.value, 1)
    }
  }

  function goToToday() {
    currentDate.value = new Date()
  }

  return {
    currentDate,
    dateString,
    isCurrentDay,
    goToPreviousDay,
    goToNextDay,
    goToToday,
  }
}
