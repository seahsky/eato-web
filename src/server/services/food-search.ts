import { searchProducts, normalizeProduct } from "./open-food-facts";
import { searchUSDA, normalizeUSDAProduct } from "./usda-food-data";
import { getCachedResults, cacheResults } from "./search-cache";
import { translateToEnglish, mightNeedTranslation } from "./translation";
import type { FoodProduct, FoodSearchResult, TranslationInfo } from "@/types/food";

// Keywords that indicate whole/fresh foods (prioritize USDA)
const WHOLE_FOOD_PATTERNS = [
  // Proteins
  /\b(egg|chicken|beef|pork|lamb|fish|salmon|tuna|shrimp|turkey|duck|bacon|sausage|steak|ham)\b/i,
  // Fruits
  /\b(apple|banana|orange|grape|berry|strawberry|blueberry|raspberry|mango|peach|pear|plum|cherry|melon|watermelon|lemon|lime|avocado|kiwi|pineapple|papaya|coconut|fig|date)\b/i,
  // Vegetables
  /\b(lettuce|spinach|kale|broccoli|carrot|tomato|potato|onion|garlic|pepper|cucumber|celery|cabbage|cauliflower|zucchini|squash|mushroom|corn|pea|bean|asparagus|eggplant|beet|radish|turnip)\b/i,
  // Grains & Staples
  /\b(rice|oat|wheat|flour|quinoa|barley|lentil|chickpea|pasta|noodle|bread)\b/i,
  // Dairy basics
  /\b(milk|cheese|yogurt|butter|cream|egg)\b/i,
  // Nuts & Seeds
  /\b(almond|walnut|peanut|cashew|pecan|pistachio|sunflower|chia|flax|hazelnut|macadamia)\b/i,
  // Generic whole food terms
  /\b(raw|fresh|whole|plain|cooked|boiled|baked|grilled|roasted)\b/i,
];

// Keywords that indicate branded/packaged foods (prioritize Open Food Facts)
const BRANDED_FOOD_PATTERNS = [
  // Packaged foods
  /\b(bar|cereal|chips|cookie|cracker|snack|candy|chocolate|soda|drink|juice|protein powder|supplement|granola|muesli)\b/i,
  // Brand indicators
  /\b(brand|gluten.?free|vegan|keto|low.?fat|sugar.?free|diet)\b/i,
  // Processed foods
  /\b(frozen|canned|instant|ready.?to.?eat|microwave|packaged)\b/i,
];

// Known brand names - queries containing these should show branded results
const KNOWN_BRANDS = [
  // Major food conglomerates
  "nestle",
  "kraft",
  "heinz",
  "kellogg",
  "general mills",
  "post",
  "quaker",
  "nabisco",
  "mondelez",
  "unilever",
  "pepsico",
  "frito-lay",
  "campbells",
  "conagra",
  // Beverage brands
  "coca-cola",
  "coke",
  "pepsi",
  "sprite",
  "fanta",
  "gatorade",
  "tropicana",
  "minute maid",
  "snapple",
  "lipton",
  "starbucks",
  "dunkin",
  "red bull",
  "monster",
  // Snack brands
  "doritos",
  "lays",
  "pringles",
  "cheetos",
  "ruffles",
  "tostitos",
  "oreo",
  "chips ahoy",
  "ritz",
  "triscuit",
  // Candy/chocolate
  "hershey",
  "mars",
  "snickers",
  "twix",
  "m&m",
  "reese",
  "kit kat",
  "milky way",
  "skittles",
  "haribo",
  "ferrero",
  "lindt",
  "ghirardelli",
  "godiva",
  // Cereal brands
  "cheerios",
  "frosted flakes",
  "froot loops",
  "lucky charms",
  "cinnamon toast crunch",
  "honey bunches",
  "special k",
  "raisin bran",
  "grape nuts",
  "life cereal",
  // Dairy brands
  "yoplait",
  "dannon",
  "chobani",
  "oikos",
  "fage",
  "activia",
  "philadelphia",
  "velveeta",
  "sargento",
  "babybel",
  // Meat/protein brands
  "tyson",
  "perdue",
  "oscar mayer",
  "hillshire",
  "jimmy dean",
  "hormel",
  "spam",
  "ball park",
  "hebrew national",
  "johnsonville",
  "smithfield",
  "butterball",
  // Bread/bakery brands
  "wonder bread",
  "sara lee",
  "pepperidge farm",
  "arnold",
  "thomas",
  "entenmann",
  "little debbie",
  "hostess",
  // Frozen food brands
  "stouffer",
  "lean cuisine",
  "marie callender",
  "banquet",
  "hungry man",
  "hot pocket",
  "totino",
  "digiorno",
  "eggo",
  "birds eye",
  "green giant",
  // Condiment/sauce brands
  "hellmann",
  "best foods",
  "french's",
  "hidden valley",
  "ranch",
  "tabasco",
  "sriracha",
  "frank's",
  "a1",
  "lea & perrins",
  // Produce brands
  "dole",
  "del monte",
  "sunkist",
  "driscoll",
  "chiquita",
  "ocean spray",
  // Fast food (in case people search)
  "mcdonald",
  "burger king",
  "wendy",
  "subway",
  "taco bell",
  "kfc",
  "chick-fil-a",
  "popeye",
  "domino",
  "pizza hut",
  "papa john",
  // Health/organic brands
  "clif",
  "kind bar",
  "rxbar",
  "larabar",
  "think thin",
  "quest",
  "garden of life",
  "nature valley",
  "kashi",
  "annie's",
  "amy's",
  "earth's best",
  // International brands
  "barilla",
  "san pellegrino",
  "evian",
  "perrier",
  "nutella",
  "bonne maman",
  "president",
  "laughing cow",
];

// Check if query explicitly mentions a known brand
function isBrandedQuery(query: string): boolean {
  const queryLower = query.toLowerCase();
  return KNOWN_BRANDS.some((brand) => queryLower.includes(brand));
}

// Filter out products with brand names (for whole food queries)
function filterBrandedProducts(products: FoodProduct[]): FoodProduct[] {
  return products.filter((product) => {
    // Keep products without a brand name
    if (!product.brand) return true;
    // Filter out products with brand names
    return false;
  });
}

type QueryClassification = "whole_food" | "branded" | "unknown";

function classifyQuery(query: string): QueryClassification {
  const queryLower = query.toLowerCase();

  // Check for whole food indicators
  for (const pattern of WHOLE_FOOD_PATTERNS) {
    if (pattern.test(queryLower)) {
      return "whole_food";
    }
  }

  // Check for branded food indicators
  for (const pattern of BRANDED_FOOD_PATTERNS) {
    if (pattern.test(queryLower)) {
      return "branded";
    }
  }

  return "unknown";
}

function interleaveArrays<T>(arr1: T[], arr2: T[]): T[] {
  const result: T[] = [];
  const maxLen = Math.max(arr1.length, arr2.length);

  for (let i = 0; i < maxLen; i++) {
    if (i < arr1.length) result.push(arr1[i]);
    if (i < arr2.length) result.push(arr2[i]);
  }

  return result;
}

export async function searchFoods(
  query: string,
  page = 1,
  pageSize = 20
): Promise<FoodSearchResult> {
  // Step 1: Translate if needed
  let searchQuery = query;
  let translationInfo: TranslationInfo | undefined;

  if (mightNeedTranslation(query)) {
    const translation = await translateToEnglish(query);
    if (translation.wasTranslated) {
      searchQuery = translation.translatedText;
      translationInfo = {
        originalQuery: translation.originalText,
        translatedQuery: translation.translatedText,
        detectedLanguage: translation.detectedLang,
        fromCache: translation.fromCache,
      };
    }
  }

  // Check cache first (only for page 1, using translated query)
  if (page === 1) {
    const cached = await getCachedResults(searchQuery);
    if (cached) {
      return {
        ...cached,
        page: 1,
        hasMore: cached.totalCount > pageSize,
        translationInfo,
      };
    }
  }

  const classification = classifyQuery(searchQuery);

  // Determine which source to prioritize
  const prioritizeUSDA = classification === "whole_food";
  const prioritizeOFF = classification === "branded";

  // Fetch from both sources in parallel
  // Request half from each to merge into pageSize total
  const halfSize = Math.ceil(pageSize / 2);

  const [usdaResult, offResult] = await Promise.allSettled([
    searchUSDA(searchQuery, page, halfSize),
    searchProducts(searchQuery, page, halfSize),
  ]);

  // Process USDA results
  let usdaProducts: FoodProduct[] = [];
  let usdaCount = 0;
  let usdaError: string | undefined;

  if (usdaResult.status === "fulfilled") {
    usdaProducts = usdaResult.value.foods.map(normalizeUSDAProduct);
    usdaCount = usdaResult.value.totalHits;
  } else {
    usdaError = usdaResult.reason?.message || "USDA search failed";
  }

  // Process Open Food Facts results
  let offProducts: FoodProduct[] = [];
  let offCount = 0;
  let offError: string | undefined;

  if (offResult.status === "fulfilled") {
    offProducts = offResult.value.products.map((p) => ({
      ...normalizeProduct(p),
      id: `off_${p.code}`,
      dataSource: "OPEN_FOOD_FACTS" as const,
      fdcId: null,
    }));
    offCount = offResult.value.count;
  } else {
    offError = offResult.reason?.message || "Open Food Facts search failed";
  }

  // Filter out branded products for whole food queries (unless user searched for a brand)
  const isExplicitBrandSearch = isBrandedQuery(searchQuery);
  if (!isExplicitBrandSearch && classification !== "branded") {
    offProducts = filterBrandedProducts(offProducts);
  }

  // Merge results based on priority
  let mergedProducts: FoodProduct[];

  if (prioritizeUSDA) {
    // USDA first, then OFF
    mergedProducts = [...usdaProducts, ...offProducts];
  } else if (prioritizeOFF) {
    // OFF first, then USDA
    mergedProducts = [...offProducts, ...usdaProducts];
  } else {
    // Interleave results for unknown classification
    mergedProducts = interleaveArrays(usdaProducts, offProducts);
  }

  // Limit to pageSize
  mergedProducts = mergedProducts.slice(0, pageSize);

  const result: FoodSearchResult = {
    products: mergedProducts,
    totalCount: usdaCount + offCount,
    page,
    hasMore: page * pageSize < usdaCount + offCount,
    sources: {
      usda: { count: usdaCount, error: usdaError },
      openFoodFacts: { count: offCount, error: offError },
    },
    translationInfo,
  };

  // Cache results for page 1 only (fire-and-forget, using translated query)
  if (page === 1 && mergedProducts.length > 0) {
    cacheResults(searchQuery, result).catch(console.error);
  }

  return result;
}

// Fast search - returns cached results or races APIs for fastest response
export async function searchFoodsFast(
  query: string,
  pageSize = 20
): Promise<FoodSearchResult & { fromCache?: boolean }> {
  // Step 1: Translate if needed
  let searchQuery = query;
  let translationInfo: TranslationInfo | undefined;

  if (mightNeedTranslation(query)) {
    const translation = await translateToEnglish(query);
    if (translation.wasTranslated) {
      searchQuery = translation.translatedText;
      translationInfo = {
        originalQuery: translation.originalText,
        translatedQuery: translation.translatedText,
        detectedLanguage: translation.detectedLang,
        fromCache: translation.fromCache,
      };
    }
  }

  // Check cache first (using translated query)
  const cached = await getCachedResults(searchQuery);
  if (cached) {
    return {
      ...cached,
      page: 1,
      hasMore: cached.totalCount > pageSize,
      translationInfo,
    };
  }

  const classification = classifyQuery(searchQuery);
  const halfSize = Math.ceil(pageSize / 2);

  // Race both APIs - return whichever responds first
  const fastestResult = await Promise.race([
    searchUSDA(searchQuery, 1, halfSize).then((r) => ({
      source: "usda" as const,
      foods: r.foods,
      totalHits: r.totalHits,
    })),
    searchProducts(searchQuery, 1, halfSize).then((r) => ({
      source: "off" as const,
      products: r.products,
      count: r.count,
    })),
  ]);

  // Normalize the fastest result
  let products: FoodProduct[];
  let totalCount: number;
  let sources: FoodSearchResult["sources"];

  // Check if user explicitly searched for a brand
  const isExplicitBrandSearch = isBrandedQuery(searchQuery);

  if (fastestResult.source === "usda") {
    products = fastestResult.foods.map(normalizeUSDAProduct);
    totalCount = fastestResult.totalHits;
    sources = {
      usda: { count: fastestResult.totalHits },
      openFoodFacts: { count: 0, error: "Pending..." },
    };
  } else {
    products = fastestResult.products.map((p) => ({
      ...normalizeProduct(p),
      id: `off_${p.code}`,
      dataSource: "OPEN_FOOD_FACTS" as const,
      fdcId: null,
    }));

    // Filter out branded products for whole food queries
    if (!isExplicitBrandSearch && classification !== "branded") {
      products = filterBrandedProducts(products);
    }

    totalCount = fastestResult.count;
    sources = {
      usda: { count: 0, error: "Pending..." },
      openFoodFacts: { count: fastestResult.count },
    };
  }

  // Prioritize based on classification
  const shouldReorder =
    (classification === "whole_food" && fastestResult.source !== "usda") ||
    (classification === "branded" && fastestResult.source !== "off");

  return {
    products: products.slice(0, pageSize),
    totalCount,
    page: 1,
    hasMore: totalCount > pageSize,
    sources,
    fromCache: false,
    translationInfo,
  };
}
