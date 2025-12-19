import { BaseScraper, type ScrapeResult } from "./base-scraper";

const USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1";

// USDA Nutrient Numbers
const NUTRIENT_IDS = {
  ENERGY: "208", // Energy (kcal) - SR Legacy
  ENERGY_ATWATER_GENERAL: "957", // Energy (Atwater General Factors) - Foundation
  ENERGY_ATWATER_SPECIFIC: "958", // Energy (Atwater Specific Factors) - Foundation
  ENERGY_KJ: "268", // Energy (kJ) - fallback
  PROTEIN: "203",
  FAT: "204",
  CARBS: "205",
  FIBER: "291",
  SUGAR: "269",
  SODIUM: "307",
};

const KJ_TO_KCAL = 1 / 4.184;

interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
}

interface USDAFood {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string;
  foodCategory?: string;
  foodNutrients: USDANutrient[];
  servingSize?: number;
  servingSizeUnit?: string;
}

interface USDAListResponse {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  foods: USDAFood[];
}

export class USDAcraper extends BaseScraper {
  private pageSize = 200;

  constructor(maxProductsPerRun = 5000) {
    super("USDA", maxProductsPerRun);
  }

  async scrapeIncremental(cursor?: string): Promise<ScrapeResult> {
    const apiKey = process.env.USDA_API_KEY;
    if (!apiKey) {
      console.error("[USDA] API key not set");
      return {
        productsProcessed: 0,
        productsUpserted: 0,
        productsSkipped: 0,
        errors: 1,
        nextCursor: cursor ?? null,
      };
    }

    // Cursor is the page number for USDA
    let page = cursor ? parseInt(cursor, 10) : 1;
    let productsProcessed = 0;
    let productsUpserted = 0;
    let productsSkipped = 0;
    let errors = 0;

    console.log(`[USDA] Starting incremental scrape from page ${page}`);

    while (productsProcessed < this.maxProductsPerRun) {
      try {
        const data = await this.fetchPage(page, apiKey);

        if (!data.foods || data.foods.length === 0) {
          console.log(`[USDA] No more products at page ${page}`);
          break;
        }

        for (const food of data.foods) {
          if (productsProcessed >= this.maxProductsPerRun) break;

          productsProcessed++;

          // Skip products without valid nutrition
          if (!this.hasValidNutrition(food)) {
            productsSkipped++;
            continue;
          }

          const normalized = this.normalizeProduct(food);
          const success = await this.upsertProduct(normalized);

          if (success) {
            productsUpserted++;
          } else {
            errors++;
          }
        }

        await this.updateJobProgress({
          productsScraped: data.foods.length,
          productsUpdated: productsUpserted,
          lastCursor: String(page),
        });

        console.log(
          `[USDA] Page ${page}: processed ${data.foods.length}, upserted ${productsUpserted}, skipped ${productsSkipped}`
        );

        // Check if more pages
        if (page >= data.totalPages) {
          console.log(`[USDA] Reached last page ${page}/${data.totalPages}`);
          break;
        }

        page++;
      } catch (error) {
        console.error(`[USDA] Error on page ${page}:`, error);
        errors++;
        await this.updateJobProgress({
          errorCount: 1,
          lastError: error instanceof Error ? error.message : String(error),
        });

        page++;
        if (errors > 10) {
          console.error(`[USDA] Too many errors, stopping`);
          break;
        }
      }
    }

    return {
      productsProcessed,
      productsUpserted,
      productsSkipped,
      errors,
      nextCursor: String(page),
    };
  }

  async scrapeByQuery(query: string): Promise<number> {
    const apiKey = process.env.USDA_API_KEY;
    if (!apiKey) {
      console.error("[USDA] API key not set");
      return 0;
    }

    console.log(`[USDA] Scraping by query: ${query}`);

    const url = `${USDA_BASE_URL}/foods/search?api_key=${apiKey}`;
    const response = await this.rateLimitedFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        dataType: ["Foundation", "SR Legacy"],
        pageSize: 50,
        pageNumber: 1,
      }),
    });

    const data = await response.json();

    let upserted = 0;
    for (const food of data.foods || []) {
      if (!this.hasValidNutrition(food)) continue;

      const normalized = this.normalizeProduct(food);
      const success = await this.upsertProduct(normalized);
      if (success) upserted++;
    }

    console.log(`[USDA] Query "${query}": upserted ${upserted} products`);
    return upserted;
  }

  private async fetchPage(page: number, apiKey: string): Promise<USDAListResponse> {
    // Use foods/list endpoint for bulk retrieval
    const url = `${USDA_BASE_URL}/foods/list?api_key=${apiKey}`;

    const response = await this.rateLimitedFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dataType: ["Foundation", "SR Legacy"], // Whole foods only
        pageSize: this.pageSize,
        pageNumber: page,
        sortBy: "fdcId",
        sortOrder: "asc",
      }),
    });

    const foods: USDAFood[] = await response.json();

    // foods/list returns an array directly, not wrapped object
    // We need to estimate total pages
    return {
      foods: Array.isArray(foods) ? foods : [],
      totalHits: 50000, // Approximate, will stop when no more results
      currentPage: page,
      totalPages: Math.ceil(50000 / this.pageSize), // Approximate
    };
  }

  private hasValidNutrition(food: USDAFood): boolean {
    const nutrients = food.foodNutrients;
    if (!nutrients || nutrients.length === 0) return false;

    // Must have at least energy data
    const energy = this.getEnergyValue(nutrients);
    return energy > 0;
  }

  private getNutrientValue(nutrients: USDANutrient[], nutrientNumber: string): number {
    const nutrient = nutrients.find((n) => n.nutrientNumber === nutrientNumber);
    return nutrient?.value ?? 0;
  }

  private getEnergyValue(nutrients: USDANutrient[]): number {
    // Try standard energy first (SR Legacy)
    let energy = this.getNutrientValue(nutrients, NUTRIENT_IDS.ENERGY);
    if (energy > 0) return energy;

    // Fall back to Atwater General (Foundation foods)
    energy = this.getNutrientValue(nutrients, NUTRIENT_IDS.ENERGY_ATWATER_GENERAL);
    if (energy > 0) return energy;

    // Fall back to Atwater Specific (Foundation foods)
    energy = this.getNutrientValue(nutrients, NUTRIENT_IDS.ENERGY_ATWATER_SPECIFIC);
    if (energy > 0) return energy;

    // Final fallback: convert from kJ
    const energyKj = this.getNutrientValue(nutrients, NUTRIENT_IDS.ENERGY_KJ);
    if (energyKj > 0) return Math.round(energyKj * KJ_TO_KCAL);

    return 0;
  }

  private normalizeProduct(food: USDAFood) {
    const nutrients = food.foodNutrients;
    const name = food.description;
    const brand = food.brandOwner || null;

    const caloriesPer100g = this.getEnergyValue(nutrients);
    const proteinPer100g = this.getNutrientValue(nutrients, NUTRIENT_IDS.PROTEIN);
    const carbsPer100g = this.getNutrientValue(nutrients, NUTRIENT_IDS.CARBS);
    const fatPer100g = this.getNutrientValue(nutrients, NUTRIENT_IDS.FAT);
    const fiberPer100g = this.getNutrientValue(nutrients, NUTRIENT_IDS.FIBER);
    const sugarPer100g = this.getNutrientValue(nutrients, NUTRIENT_IDS.SUGAR);
    const sodiumMg = this.getNutrientValue(nutrients, NUTRIENT_IDS.SODIUM);

    // Determine if it's a whole food based on data type
    const isWholeFood = food.dataType === "Foundation" || food.dataType === "SR Legacy";

    // Extract category as array
    const categories: string[] = [];
    if (food.foodCategory) {
      categories.push(food.foodCategory.toLowerCase());
    }

    return {
      sourceId: `usda_${food.fdcId}`,
      dataSource: "USDA" as const,
      barcode: null,
      fdcId: food.fdcId,
      name,
      nameLower: name.toLowerCase(),
      brand,
      brandLower: brand?.toLowerCase() ?? null,
      imageUrl: null, // USDA doesn't provide images
      categories,
      isWholeFood,
      caloriesPer100g,
      proteinPer100g,
      carbsPer100g,
      fatPer100g,
      fiberPer100g,
      sugarPer100g,
      sodiumPer100g: sodiumMg / 1000, // Convert mg to g
      servingSize: food.servingSize || 100,
      servingUnit: food.servingSizeUnit || "g",
      servingSizeText: food.servingSize
        ? `${food.servingSize}${food.servingSizeUnit || "g"}`
        : "100g",
      hasCompleteNutrition: this.hasCompleteNutrition({
        caloriesPer100g,
        proteinPer100g,
        carbsPer100g,
        fatPer100g,
      }),
      qualityScore: this.calculateQualityScore({
        name,
        caloriesPer100g,
        proteinPer100g,
        carbsPer100g,
        fatPer100g,
        fiberPer100g,
      }),
      scrapedAt: new Date(),
      popularity: 0,
      lastSearchedAt: null,
    };
  }
}
