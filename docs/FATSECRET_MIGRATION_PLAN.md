# Migration Plan: OFF + USDA → FatSecret API

## Overview
Complete replacement of Open Food Facts and USDA APIs with FatSecret Platform API (Basic tier). Maintain existing caching and translation infrastructure.

## Key API Changes

### FatSecret API Details (Basic Tier)
- **Auth**: OAuth 2.0 client credentials flow
- **Token Endpoint**: `https://oauth.fatsecret.com/connect/token`
- **Token Lifetime**: 24 hours (86,400 seconds)
- **Search Endpoint**: `POST https://platform.fatsecret.com/rest/server.api` with `method=foods.search.v3`
- **Barcode Endpoint**: `GET https://platform.fatsecret.com/rest/food/barcode/find-by-id/v1`
- **Food Details**: `GET https://platform.fatsecret.com/rest/food/v1`
- **Max Results**: 50 per page (vs current 20)
- **Scope Required**: `basic` (barcode needs `barcode` scope)

### Data Mapping: FatSecret → FoodProduct

| FatSecret Field | FoodProduct Field | Notes |
|-----------------|-------------------|-------|
| `food_id` | `id` | Prefix with `fs_` |
| `food_name` | `name` | - |
| `brand_name` | `brand` | Only for food_type="Brand" |
| `food_type` | - | "Brand" or "Generic" |
| `serving.calories` | Calculate per 100g | Use metric_serving_amount |
| `serving.protein` | Calculate per 100g | - |
| `serving.carbohydrate` | Calculate per 100g | - |
| `serving.fat` | Calculate per 100g | - |
| `serving.fiber` | Calculate per 100g | - |
| `serving.sugar` | Calculate per 100g | - |
| `serving.sodium` | Calculate per 100g | In mg, convert to g |
| `serving.metric_serving_amount` | `servingSize` | - |
| `serving.metric_serving_unit` | `servingUnit` | g/ml/oz |
| `serving.serving_description` | `servingSizeText` | - |

---

## Implementation Steps

### Step 1: Update Types and Enums
**Files to modify:**
- `/src/types/food.ts`
- `/prisma/schema.prisma`

**Changes:**
1. Add `FATSECRET` to `FoodDataSource` type
2. Add `fatSecretId` field (string) alongside existing `fdcId` and `barcode`
3. Update `FoodSearchResult.sources` to use `fatsecret` key

```typescript
// src/types/food.ts
export type FoodDataSource = "FATSECRET" | "MANUAL";

export interface FoodProduct {
  id: string; // "fs_{food_id}"
  dataSource: FoodDataSource;
  fatSecretId: string | null; // NEW
  barcode: string | null; // Keep for barcode lookups
  fdcId: null; // Deprecated, keep for backward compatibility
  // ... rest unchanged
}
```

### Step 2: Create FatSecret Auth Service
**New file:** `/src/server/services/fatsecret-auth.ts`

**Implementation:**
```typescript
// Token caching with automatic refresh before expiry
interface TokenCache {
  accessToken: string;
  expiresAt: number; // Unix timestamp
}

let tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token if valid (with 5-min buffer)
  if (tokenCache && Date.now() < tokenCache.expiresAt - 300000) {
    return tokenCache.accessToken;
  }

  // Request new token
  const credentials = Buffer.from(
    `${process.env.FATSECRET_CLIENT_ID}:${process.env.FATSECRET_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic barcode',
  });

  const data = await response.json();
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };

  return tokenCache.accessToken;
}
```

### Step 3: Create FatSecret Food Service
**New file:** `/src/server/services/fatsecret.ts`

**Functions to implement:**
1. `searchProducts(query, page, pageSize)` - Food search
2. `getProductByBarcode(barcode)` - Barcode lookup (GTIN-13 format)
3. `getProductById(foodId)` - Get full food details
4. `normalizeProduct(food)` - Convert to FoodProduct format

**Key implementation details:**
- Use POST requests with `method` parameter
- Convert nutrition values to per-100g using `metric_serving_amount`
- Handle foods with multiple servings (use first with metric data)
- Format barcodes to GTIN-13 (pad with leading zeros)

```typescript
// Normalize serving nutrition to per-100g
function calculatePer100g(value: number, servingAmount: number): number {
  if (!servingAmount || servingAmount <= 0) return 0;
  return Math.round((value / servingAmount) * 100 * 10) / 10;
}
```

### Step 4: Update Food Search Service
**File to modify:** `/src/server/services/food-search.ts`

**Changes:**
1. Replace imports from OFF/USDA with FatSecret
2. Remove query classification logic (no longer needed for source prioritization)
3. Remove `interleaveArrays` and merging logic
4. Simplify to single-source search
5. Update cache sources structure

```typescript
// Before
import { searchProducts, normalizeProduct } from "./open-food-facts";
import { searchUSDA, normalizeUSDAProduct } from "./usda-food-data";

// After
import { searchProducts, normalizeProduct } from "./fatsecret";
```

### Step 5: Update Food Router
**File to modify:** `/src/server/routers/food.ts`

**Changes:**
1. Update `getByBarcode` to use FatSecret
2. Remove `getByFdcId` procedure (deprecated)
3. Update data source handling in `log` procedure
4. Update source references throughout

### Step 6: Update Prisma Schema
**File to modify:** `/prisma/schema.prisma`

**Changes:**
```prisma
enum FoodDataSource {
  FATSECRET  // NEW - primary
  MANUAL
  // Keep OLD values for backward compatibility with existing data
  OPEN_FOOD_FACTS
  USDA
}

model FoodEntry {
  // ... existing fields
  fatSecretId     String?  // NEW
  // Keep deprecated fields for existing data
  openFoodFactsId String?
  usdaFdcId       Int?
}

model FavoriteFood {
  fatSecretId     String?  // NEW
  openFoodFactsId String?
  usdaFdcId       Int?
}

model FoodProductCache {
  fatSecretId     String?  // NEW
  // ... existing fields
}
```

### Step 7: Update Frontend Components
**Files to modify:**
- `/src/components/food/food-search.tsx` - Update source badges
- `/src/components/food/food-quick-access.tsx` - Update ID generation

**Changes:**
1. Replace USDA/OFF badges with FatSecret badge
2. Update source indicator colors (suggest: blue for FatSecret)
3. Update ID prefix handling (`fs_` instead of `off_`/`usda_`)

### Step 8: Update Search Cache
**File to modify:** `/src/server/services/search-cache.ts`

**Changes:**
- Update sources structure in cache storage
- Maintain backward compatibility for reading old cache entries

### Step 9: Environment Variables
**File to modify:** `.env.example` and `.env.local`

**Add:**
```
FATSECRET_CLIENT_ID=your_client_id
FATSECRET_CLIENT_SECRET=your_client_secret
```

**Remove (optional, keep for reference):**
```
# USDA_API_KEY=deprecated
# OPEN_FOOD_FACTS_USER_AGENT=deprecated
```

### Step 10: Clean Up Deprecated Files
**Files to delete:**
- `/src/server/services/open-food-facts.ts`
- `/src/server/services/usda-food-data.ts`

---

## Database Migration Notes

### Backward Compatibility
- Keep `openFoodFactsId` and `usdaFdcId` fields in schema for existing data
- Existing entries with OFF/USDA sources will continue to display correctly
- New entries will use `FATSECRET` dataSource and `fatSecretId`

### Cache Migration
- Existing search cache will be invalidated naturally (24-hour TTL)
- No explicit migration needed

---

## Testing Checklist

- [ ] OAuth token acquisition and refresh
- [ ] Food search with various queries
- [ ] Barcode scanning (GTIN-13 conversion)
- [ ] Per-100g nutrition calculation accuracy
- [ ] Search caching works with new source
- [ ] Translation still works for non-English queries
- [ ] Existing food entries still display correctly
- [ ] New food logging works with FatSecret source
- [ ] Favorites work with new source
- [ ] Recent/Frequent foods work correctly
- [ ] Build passes with no TypeScript errors

---

## File Change Summary

| Action | File Path |
|--------|-----------|
| CREATE | `/src/server/services/fatsecret-auth.ts` |
| CREATE | `/src/server/services/fatsecret.ts` |
| MODIFY | `/src/types/food.ts` |
| MODIFY | `/prisma/schema.prisma` |
| MODIFY | `/src/server/services/food-search.ts` |
| MODIFY | `/src/server/routers/food.ts` |
| MODIFY | `/src/server/services/search-cache.ts` |
| MODIFY | `/src/components/food/food-search.tsx` |
| MODIFY | `/src/components/food/food-quick-access.tsx` |
| MODIFY | `.env.example` |
| DELETE | `/src/server/services/open-food-facts.ts` |
| DELETE | `/src/server/services/usda-food-data.ts` |

---

## API Documentation Sources
- [FatSecret Platform API Guides](https://platform.fatsecret.com/docs/guides)
- [Foods Search v3](https://platform.fatsecret.com/docs/v3/foods.search)
- [OAuth 2.0 Authentication](https://platform.fatsecret.com/docs/guides/authentication/oauth2)
- [Barcode Lookup](https://platform.fatsecret.com/docs/v1/food.find_id_for_barcode)
