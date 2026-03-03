<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/recipes" />
        </ion-buttons>
        <ion-title>{{ isEdit ? 'Edit Recipe' : 'New Recipe' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list>
        <ion-item>
          <ion-input v-model="form.name" label="Recipe name" label-placement="stacked" placeholder="e.g., Banana bread" />
        </ion-item>
        <ion-item>
          <ion-textarea v-model="form.description" label="Description (optional)" label-placement="stacked" :auto-grow="true" />
        </ion-item>
        <ion-item>
          <ion-input v-model.number="form.yieldWeight" type="number" label="Yield weight (g)" label-placement="stacked" :min="1" />
        </ion-item>
      </ion-list>

      <h3>Ingredients</h3>
      <ion-list>
        <ion-item v-for="(ing, i) in form.ingredients" :key="i">
          <ion-label>
            <h3>{{ ing.name }}</h3>
            <p>{{ ing.quantity }}{{ ing.unit }} &middot; {{ Math.round(ing.caloriesPer100g) }} kcal/100g</p>
          </ion-label>
          <ion-button slot="end" fill="clear" color="danger" @click="removeIngredient(i)">
            <ion-icon :icon="trashOutline" />
          </ion-button>
        </ion-item>
      </ion-list>

      <!-- Add ingredient inline -->
      <ion-card>
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-input v-model="newIng.name" label="Ingredient name" label-placement="stacked" />
            </ion-item>
            <ion-item>
              <ion-input v-model.number="newIng.quantity" type="number" label="Quantity" label-placement="stacked" :min="0" step="0.1" />
            </ion-item>
            <ion-item>
              <ion-select v-model="newIng.unit" label="Unit" interface="popover">
                <ion-select-option value="g">g</ion-select-option>
                <ion-select-option value="ml">ml</ion-select-option>
                <ion-select-option value="kg">kg</ion-select-option>
                <ion-select-option value="L">L</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-input v-model.number="newIng.caloriesPer100g" type="number" label="Calories/100g" label-placement="stacked" :min="0" />
            </ion-item>
            <ion-item>
              <ion-input v-model.number="newIng.proteinPer100g" type="number" label="Protein/100g" label-placement="stacked" :min="0" step="0.1" />
            </ion-item>
            <ion-item>
              <ion-input v-model.number="newIng.carbsPer100g" type="number" label="Carbs/100g" label-placement="stacked" :min="0" step="0.1" />
            </ion-item>
            <ion-item>
              <ion-input v-model.number="newIng.fatPer100g" type="number" label="Fat/100g" label-placement="stacked" :min="0" step="0.1" />
            </ion-item>
          </ion-list>
          <ion-button expand="block" fill="outline" size="small" :disabled="!newIng.name || !newIng.quantity" @click="addIngredient">
            Add Ingredient
          </ion-button>
        </ion-card-content>
      </ion-card>

      <ion-button expand="block" :disabled="!form.name || form.ingredients.length === 0 || !form.yieldWeight || recipeStore.saving" @click="handleSave" class="ion-margin-top">
        <ion-spinner v-if="recipeStore.saving" name="crescent" />
        <span v-else>{{ isEdit ? 'Save Changes' : 'Create Recipe' }}</span>
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonContent, IonList, IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonLabel, IonButton, IonIcon, IonCard, IonCardContent, IonSpinner,
} from '@ionic/vue'
import { trashOutline } from 'ionicons/icons'
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RecipeIngredientInput } from '../../../api/types'
import { useRecipeStore } from '../../../stores/recipe'
import { useToast } from '../../../composables/useToast'

const route = useRoute()
const router = useRouter()
const recipeStore = useRecipeStore()
const { showSuccess, showError } = useToast()

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  name: '',
  description: '',
  yieldWeight: 500,
  ingredients: [] as RecipeIngredientInput[],
})

const newIng = reactive({
  name: '',
  quantity: null as number | null,
  unit: 'g',
  caloriesPer100g: null as number | null,
  proteinPer100g: 0,
  carbsPer100g: 0,
  fatPer100g: 0,
})

onMounted(async () => {
  if (isEdit.value) {
    await recipeStore.loadRecipe(route.params.id as string)
    if (recipeStore.currentRecipe) {
      form.name = recipeStore.currentRecipe.name
      form.description = recipeStore.currentRecipe.description ?? ''
      form.yieldWeight = recipeStore.currentRecipe.yieldWeight
      form.ingredients = recipeStore.currentRecipe.ingredients.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        caloriesPer100g: i.caloriesPer100g,
        proteinPer100g: i.proteinPer100g,
        carbsPer100g: i.carbsPer100g,
        fatPer100g: i.fatPer100g,
        fiberPer100g: i.fiberPer100g,
        sortOrder: i.sortOrder,
      }))
    }
  }
})

function addIngredient() {
  if (!newIng.name || !newIng.quantity) return
  form.ingredients.push({
    name: newIng.name,
    quantity: newIng.quantity,
    unit: newIng.unit,
    caloriesPer100g: newIng.caloriesPer100g ?? 0,
    proteinPer100g: newIng.proteinPer100g,
    carbsPer100g: newIng.carbsPer100g,
    fatPer100g: newIng.fatPer100g,
    sortOrder: form.ingredients.length,
  })
  // Reset
  newIng.name = ''
  newIng.quantity = null
  newIng.caloriesPer100g = null
  newIng.proteinPer100g = 0
  newIng.carbsPer100g = 0
  newIng.fatPer100g = 0
}

function removeIngredient(index: number) {
  form.ingredients.splice(index, 1)
}

async function handleSave() {
  const input = {
    name: form.name,
    description: form.description || undefined,
    yieldWeight: form.yieldWeight,
    ingredients: form.ingredients,
  }

  if (isEdit.value) {
    const recipe = await recipeStore.updateRecipe(route.params.id as string, input)
    if (recipe) {
      showSuccess('Recipe updated')
      router.back()
    } else {
      showError('Failed to update recipe')
    }
  } else {
    const recipe = await recipeStore.createRecipe(input)
    if (recipe) {
      showSuccess('Recipe created')
      router.replace(`/recipes/${recipe.id}`)
    } else {
      showError('Failed to create recipe')
    }
  }
}
</script>
