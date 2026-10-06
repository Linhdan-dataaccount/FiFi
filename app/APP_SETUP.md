# FiFi web app

FiFi plans meals for people who train around a daily nutrition target and an average daily grocery budget. The planner converts that daily budget into a total for the selected 1, 2, 3, or 7 day period, then estimates the cost of buying whole ingredient packs in Ho Chi Minh City. It shows meals, recipe instructions, cooking time, macros, and a consolidated shopping list.

## Current scope

- User app at `/`: five guided steps ask about goals, exercise, optional age/weight and dietary cautions, daily macros, food preferences, cooking style and budget. It filters declared allergens and avoided ingredients, then shows a meal plan, recipe swaps and a shopping list. A user may generate without saving; with explicit consent, a signed-in user can save a profile and plan history and delete both later.
- Admin app at `/admin`: allowlisted editors manage custom recipes, product records with prices/pack sizes/nutrition/allergens, source metadata, and consenting users' profiles and saved plan history. Published recipes require an HTTPS photo URL, image credit and explicit permission confirmation.
- The starter catalog contains 22 illustrative HCMC products and 8 standardized recipes in `worker/data.js`. Prices and nutrients are demo estimates, not live retailer or verified clinical data. Shopping list photos illustrate food groups, not exact retailer SKUs. UI labels this clearly.
- Future work: connect an authorized Đi Chợ product feed, map retailer SKUs and pack sizes, reconcile nutrient values with USDA FoodData Central, add location/date freshness, then improve optimization and validation. Do not treat a publicly accessible endpoint as a licensed feed or expose an API key in the browser.

## Run and deploy

This is a Cloudflare Worker ESM app packaged for ChatGPT Sites. It has no npm dependencies.

```bash
npm run build
npm run validate
```

The build creates `dist/server/index.js` and includes two D1 migrations in `drizzle/`. Configure a D1 binding called `DB` and set `FIFI_ADMIN_EMAILS` to a comma-separated allowlist of trusted account email addresses in the hosting environment. Apply both migrations in order before writes. `npm run smoke` checks the main API flows against an in-memory SQLite database. `npm run preview` serves a local developer preview with a simulated identity; it binds only to localhost and is never packaged into the deployed Worker. Sites deployment reads `.openai/hosting.json`; do not commit secrets. The real Site uses platform-authenticated user headers and remains private unless its owner changes access.

## Data shape

`PRODUCTS`: stable ID, category, pack weight in grams, pack price in VND, per-100g `kcal/protein/carbs/fat`, allergen tags, region/source/date. `SAMPLE_RECIPES`: stable ID, meal slot, prep/cook minutes, servings, ingredient product IDs with grams, ordered steps, photo URL and credit, cooking mode. D1 tables: `custom_recipes`, `product_records` (sample overrides and added products), `user_profiles` (consented self-report), `plan_history` (saved inputs/results), `integration_sources` (non-secret connector metadata). Nutrition is calculated from ingredient grams; checkout price rounds required grams up to whole packs. The planner reports consumed-ingredient and checkout cost separately.

The admin source panel only stores endpoint/mapping notes and reports whether an environment key exists. It **does not fetch live API data**. Do not enter keys in the browser or claim the listed prices are retailer prices. The live connector needs approved access, a verified schema/SKU mapping, refresh rules and a source/date label before enabling it. The nutrition and health questionnaire is a prototype for meal preference filtering, not medical advice; individual clinical diets require professional review. Allergen tags in the demo are unverified and cannot establish a food's safety for someone with an allergy. Avoid collecting diagnoses in free text.

## Data and image references

- [USDA FoodData Central](https://fdc.nal.usda.gov/) for a future verified nutrient mapping.
- [Đi Chợ API portal](https://app.dicho.site/api_portal/guide.php) and [API pools](https://app.dicho.site/api/pools.php): prospective grocery source, subject to key/access and usage terms.
- [Unsplash license](https://unsplash.com/license): illustration photo sources credited in `worker/data.js`. Do not imply a photo depicts the exact recipe.
- [Doobydobap recipes](https://doobydobap.com/recipes): research inspiration only; recipes and images are not copied into the catalog.

The training-calendar and health tracking features are later phases, outside this prototype.
