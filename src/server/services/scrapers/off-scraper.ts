import { BaseScraper, type ScrapeResult } from "./base-scraper";
import type { OpenFoodFactsProduct } from "../open-food-facts";

const V1_SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";

// Conversion factor: 1 kcal = 4.184 kJ
const KJ_TO_KCAL = 1 / 4.184;

// Countries to prioritize (major markets)
const PRIORITY_COUNTRIES = ["us", "gb", "au", "sg", "ca", "de", "fr", "nz"];

export class OFFScraper extends BaseScraper {
  private pageSize = 100;

  constructor(maxProductsPerRun = 5000) {
    super("OPEN_FOOD_FACTS", maxProductsPerRun);
  }

  async scrapeIncremental(cursor?: string): Promise<ScrapeResult> {
    let page = cursor ? parseInt(cursor, 10) : 1;
    let productsProcessed = 0;
    let productsUpserted = 0;
    let productsSkipped = 0;
    let errors = 0;

    console.log(`[OFF] Starting incremental scrape from page ${page}`);

    while (productsProcessed < this.maxProductsPerRun) {
      try {
        const data = await this.fetchPage(page);

        if (!data.products || data.products.length === 0) {
          console.log(`[OFF] No more products at page ${page}`);
          break;
        }

        for (const product of data.products) {
          if (productsProcessed >= this.maxProductsPerRun) break;

          productsProcessed++;

          // Skip products without nutrition data or name
          if (!this.hasValidNutrition(product) || !product.product_name) {
            productsSkipped++;
            continue;
          }

          const normalized = this.normalizeProduct(product);
          const success = await this.upsertProduct(normalized);

          if (success) {
            productsUpserted++;
          } else {
            errors++;
          }
        }

        // Update progress every page
        await this.updateJobProgress({
          productsScraped: data.products.length,
          productsUpdated: productsUpserted,
          lastCursor: String(page),
        });

        console.log(
          `[OFF] Page ${page}: processed ${data.products.length}, upserted ${productsUpserted}, skipped ${productsSkipped}`
        );

        // Check if there are more pages
        const totalPages = Math.ceil(data.count / this.pageSize);
        if (page >= totalPages) {
          console.log(`[OFF] Reached last page ${page}/${totalPages}`);
          break;
        }

        page++;
      } catch (error) {
        console.error(`[OFF] Error on page ${page}:`, error);
        errors++;
        await this.updateJobProgress({
          errorCount: 1,
          lastError: error instanceof Error ? error.message : String(error),
        });

        // Continue to next page on error
        page++;
        if (errors > 10) {
          console.error(`[OFF] Too many errors, stopping`);
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
    console.log(`[OFF] Scraping by query: ${query}`);

    const fields = [
      "code",
      "product_name",
      "brands",
      "image_small_url",
      "nutriments",
      "serving_size",
      "serving_quantity",
      "categories_tags",
    ].join(",");

    const url =
      `${V1_SEARCH_URL}?` +
      new URLSearchParams({
        search_terms: query,
        action: "process",
        json: "1",
        page_size: "50",
        fields,
      });

    const response = await this.rateLimitedFetch(url);
    const data = await response.json();

    let upserted = 0;
    for (const product of data.products || []) {
      if (!this.hasValidNutrition(product) || !product.product_name) continue;

      const normalized = this.normalizeProduct(product);
      const success = await this.upsertProduct(normalized);
      if (success) upserted++;
    }

    console.log(`[OFF] Query "${query}": upserted ${upserted} products`);
    return upserted;
  }

  private async fetchPage(page: number): Promise<{
    products: OpenFoodFactsProduct[];
    count: number;
    page: number;
  }> {
    const fields = [
      "code",
      "product_name",
      "brands",
      "image_small_url",
      "nutriments",
      "serving_size",
      "serving_quantity",
      "categories_tags",
    ].join(",");

    // Sort by popularity (unique_scans_n) to get most popular products first
    const url =
      `${V1_SEARCH_URL}?` +
      new URLSearchParams({
        action: "process",
        json: "1",
        page: String(page),
        page_size: String(this.pageSize),
        sort_by: "unique_scans_n",
        fields,
        // Only get products with nutrition data
        tagtype_0: "nutrition_grades_tags",
        tag_contains_0: "contains",
        tag_0: "-",
      });

    const response = await this.rateLimitedFetch(url);
    const data = await response.json();

    return {
      products: data.products || [],
      count: data.count || 0,
      page: data.page || page,
    };
  }

  private hasValidNutrition(product: OpenFoodFactsProduct): boolean {
    const n = product.nutriments;
    if (!n) return false;

    // Must have at least energy data
    const hasEnergy =
      typeof n["energy-kcal_100g"] === "number" ||
      typeof n["energy-kcal"] === "number" ||
      typeof n["energy-kj_100g"] === "number" ||
      typeof n["energy-kj"] === "number" ||
      typeof n.energy_100g === "number" ||
      typeof n.energy === "number";

    return hasEnergy;
  }

  private getEnergyKcal(nutriments: OpenFoodFactsProduct["nutriments"]): number {
    // Try kcal fields first
    const kcal100g = nutriments["energy-kcal_100g"];
    if (typeof kcal100g === "number") return kcal100g;

    const kcal = nutriments["energy-kcal"];
    if (typeof kcal === "number") return kcal;

    // Try kJ fields and convert
    const kj100g = nutriments["energy-kj_100g"];
    if (typeof kj100g === "number") return Math.round(kj100g * KJ_TO_KCAL);

    const kj = nutriments["energy-kj"];
    if (typeof kj === "number") return Math.round(kj * KJ_TO_KCAL);

    // Fallback to generic energy fields (usually kJ)
    const energy100g = nutriments.energy_100g;
    if (typeof energy100g === "number") return Math.round(energy100g * KJ_TO_KCAL);

    const energy = nutriments.energy;
    if (typeof energy === "number") return Math.round(energy * KJ_TO_KCAL);

    return 0;
  }

  private normalizeProduct(product: OpenFoodFactsProduct) {
    const nutriments = product.nutriments;
    const hasServing = !!product.serving_quantity;

    const name = product.product_name || "Unknown";
    const brand = product.brands || null;
    const imageUrl = product.image_small_url || null;

    const caloriesPer100g = this.getEnergyKcal(nutriments);
    const proteinPer100g = nutriments.proteins_100g || 0;
    const carbsPer100g = nutriments.carbohydrates_100g || 0;
    const fatPer100g = nutriments.fat_100g || 0;
    const fiberPer100g = nutriments.fiber_100g || 0;
    const sugarPer100g = nutriments.sugars_100g || 0;
    const sodiumPer100g = nutriments.sodium_100g || 0;

    // Extract categories
    const categories: string[] = [];
    if ("categories_tags" in product && Array.isArray((product as { categories_tags?: string[] }).categories_tags)) {
      categories.push(...(product as { categories_tags: string[] }).categories_tags.slice(0, 10));
    }

    return {
      sourceId: `off_${product.code}`,
      dataSource: "OPEN_FOOD_FACTS" as const,
      barcode: product.code,
      fdcId: null,
      name,
      nameLower: name.toLowerCase(),
      brand,
      brandLower: brand?.toLowerCase() ?? null,
      imageUrl,
      categories,
      isWholeFood: false, // OFF is primarily packaged foods
      caloriesPer100g,
      proteinPer100g,
      carbsPer100g,
      fatPer100g,
      fiberPer100g,
      sugarPer100g,
      sodiumPer100g,
      servingSize: product.serving_quantity || 100,
      servingUnit: hasServing ? "serving" : "g",
      servingSizeText: product.serving_size || "100g",
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
        imageUrl,
      }),
      scrapedAt: new Date(),
      popularity: 0,
      lastSearchedAt: null,
    };
  }
}
