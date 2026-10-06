# FiFi web app

FiFi plans meals for people who train around a daily nutrition target and an average daily grocery budget. The planner converts that daily budget into a total for the selected 1, 2, 3, or 7 day period, then estimates the cost of buying whole ingredient packs in Ho Chi Minh City. It shows meals, recipe instructions, cooking time, macros, and a consolidated shopping list.

## Current scope

- User app at `/`: meal planner with 2 or 3 meals per day, daily kcal/protein/carbohydrate/fat goals, cook-now or meal-prep preference, recipe swaps, day-by-day results, and shopping list.
- Admin app at `/admin`: authenticated editors can add, update, publish, unpublish, and delete custom recipes. Ingredients use product IDs and raw/as-sold grams. Published recipes require an HTTPS photo URL, image credit, and explicit permission confirmation.
- The starter catalog contains 22 illustrative HCMC products and 8 standardized recipes in `worker/data.js`. Prices and nutrients are demo estimates, not live retailer or verified clinical data. UI labels this clearly.
- Future work: connect an authorized Đi Chợ product feed, map retailer SKUs and pack sizes, reconcile nutrient values with USDA FoodData Central, add location/date freshness, then improve optimization and validation. Do not treat a publicly accessible endpoint as a licensed feed or expose an API key in the browser.

## Run and deploy

This is a Cloudflare Worker ESM app packaged for ChatGPT Sites. It has no npm dependencies.

```bash
npm run build
npm run validate
```

The build creates `dist/server/index.js` and a D1 migration from `drizzle/0000_fifi_recipes.sql`. Configure a D1 binding called `DB` and set `FIFI_ADMIN_EMAILS` to a comma-separated allowlist of trusted account email addresses in the hosting environment. Run the D1 migration before using recipe writes. Sites deployment reads `.openai/hosting.json`; do not commit secrets. The admin endpoint only accepts a trusted hosting-auth identity header and the allowlist, so deploy behind the host's authentication boundary. For local testing, pass the header through a trusted test harness rather than treating a client-supplied header as authentication.

## Data shape

`PRODUCTS`: stable ID, category, pack weight in grams, pack price in VND, per-100g `kcal/protein/carbs/fat`, region/source/date. `SAMPLE_RECIPES`: stable ID, meal slot, prep/cook minutes, servings, ingredient product IDs with grams, ordered steps, photo URL and credit, cooking mode. `custom_recipes` stores reviewed admin entries as JSON in D1. Nutrition is calculated from ingredient grams; checkout price rounds required grams up to whole packs. The planner reports both consumed-ingredient cost and checkout cost because those differ.

## Data and image references

- [USDA FoodData Central](https://fdc.nal.usda.gov/) for a future verified nutrient mapping.
- [Đi Chợ API portal](https://app.dicho.site/api_portal/guide.php) and [API pools](https://app.dicho.site/api/pools.php): prospective grocery source, subject to key/access and usage terms.
- [Unsplash license](https://unsplash.com/license): illustration photo sources credited in `worker/data.js`. Do not imply a photo depicts the exact recipe.
- [Doobydobap recipes](https://doobydobap.com/recipes): research inspiration only; recipes and images are not copied into the catalog.

The training-calendar and health tracking features are later phases, outside this prototype.
