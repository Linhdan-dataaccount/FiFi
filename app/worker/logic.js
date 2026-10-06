const SLOTS = {2:["lunch","dinner"],3:["breakfast","lunch","dinner"]};
const SLOT_LABELS = {breakfast:"Bữa sáng",lunch:"Bữa trưa",dinner:"Bữa tối"};
const cap=(n,min,max)=>Math.min(max,Math.max(min,Number(n)||min));
const zero=()=>({kcal:0,protein:0,carbs:0,fat:0});
function addMacro(a,b) { return {kcal:a.kcal+b.kcal,protein:a.protein+b.protein,carbs:a.carbs+b.carbs,fat:a.fat+b.fat}; }
function groceryFor(meals,productMap) {
  const grams={};
  for(const m of meals) for(const i of m.recipe.ingredients)
    grams[i.productId]=(grams[i.productId]||0)+i.grams/m.recipe.servings;
  const items=Object.entries(grams).map(([productId,requiredGrams])=>{
    const product=productMap[productId];
    if(!product) return null;
    const packs=Math.ceil(requiredGrams/product.packGrams);
    return {productId,name:product.name,category:product.category,requiredGrams:Math.round(requiredGrams),
      packGrams:product.packGrams,packs,unitPrice:product.priceVnd,checkoutCost:packs*product.priceVnd,
      usedCost:requiredGrams/product.packGrams*product.priceVnd,source:product.source,photo:shopPhoto(product)};
  }).filter(Boolean).sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name));
  return {items,checkout:items.reduce((a,i)=>a+i.checkoutCost,0),used:items.reduce((a,i)=>a+i.usedCost,0)};
}
function buildPlan(input,allRecipes,products=PRODUCTS) {
  const productMap=Object.fromEntries(products.filter(p=>p.enabled!==false).map(p=>[p.id,p]));
  const blocked=new Set([...(input.allergens||[]),...(input.profile?.allergens||[])]);
  const avoided=new Set([...(input.avoidProductIds||[]),...(input.profile?.avoidProductIds||[])]);
  const days=cap(input.days,1,7),mealsPerDay=input.mealsPerDay===2?2:3;
  const dailyBudget=cap(input.dailyBudget,30000,1000000);
  const targets={kcal:cap(input.kcal,800,4000),protein:cap(input.protein,20,250),
    carbs:cap(input.carbs,30,500),fat:cap(input.fat,20,180)};
  const style=["both","prep","cook"].includes(input.style)?input.style:"both";
  const vegetarian=!!(input.vegetarian||input.profile?.vegetarian);
  const overrides=typeof input.overrides==="object"&&input.overrides?input.overrides:{};
  const slots=SLOTS[mealsPerDay],selected=[],available=allRecipes.filter(r=>r.status==="published");
  for(let day=0;day<days;day++){
    for(const slot of slots) {
      const pool=available.filter(r=>r.slot===slot&&(!vegetarian||r.vegetarian)
        &&r.ingredients.length>0&&r.ingredients.every(i=>productMap[i.productId]&&!avoided.has(i.productId)
          &&!(productMap[i.productId].allergens||[]).some(a=>blocked.has(a))));
      if(!pool.length) throw new Error("Không còn công thức phù hợp với các nguyên liệu đã loại trừ. Hãy chỉnh lựa chọn hoặc bổ sung món trong admin.");
      const forced=pool.find(r=>r.id===overrides[`${day}:${slot}`]);
      const ranked=pool.map(r=>{
        const m=recipeMacro(r,productMap),future=groceryFor([...selected,{day,slot,recipe:r}],productMap);
        const already=selected.filter(x=>x.recipe.id===r.id).length;
        const daily=selected.filter(x=>x.day===day).reduce((a,x)=>addMacro(a,recipeMacro(x.recipe,productMap)),zero());
        const remaining=slots.length-selected.filter(x=>x.day===day).length;
        const kcalGoal=(targets.kcal-daily.kcal)/remaining;
        const proteinGoal=(targets.protein-daily.protein)/remaining;
        const targetCost=(day+1)*dailyBudget;
        const current=groceryFor(selected,productMap).checkout;
        const incremental=future.checkout-current;
        const gap=Math.abs(m.kcal-kcalGoal)/Math.max(kcalGoal,250)*40+
          Math.abs(m.protein-proteinGoal)/Math.max(proteinGoal,20)*45;
        const costPressure=Math.max(0,future.checkout-targetCost)/dailyBudget*40+
          incremental/dailyBudget*15;
        return {recipe:r,score:gap+costPressure+already*9+(style!=="both"&&r.mode!==style?20:0)};
      }).sort((a,b)=>a.score-b.score);
      const chosen=forced||ranked[0].recipe;
      selected.push({day,slot,recipe:chosen,
        alternatives:ranked.filter(x=>x.recipe.id!==chosen.id).slice(0,3).map(x=>({id:x.recipe.id,title:x.recipe.title}))});
    }
  }
  const shopping=groceryFor(selected,productMap);
  const dayPlans=Array.from({length:days},(_,day)=>{
    const meals=selected.filter(x=>x.day===day);
    return {day:day+1,meals:meals.map(x=>({slot:x.slot,slotLabel:SLOT_LABELS[x.slot],recipe:x.recipe,
      macro:recipeMacro(x.recipe,productMap),usedCost:recipeConsumedCost(x.recipe,productMap),alternatives:x.alternatives})),
      macros:meals.reduce((a,x)=>addMacro(a,recipeMacro(x.recipe,productMap)),zero()),
      cookingMinutes:meals.reduce((a,x)=>a+x.recipe.prepMinutes+x.recipe.cookMinutes,0),
      usedCost:meals.reduce((a,x)=>a+recipeConsumedCost(x.recipe,productMap),0)};
  });
  const batches=Object.values(selected.filter(x=>x.recipe.mode==="prep").reduce((acc,x)=>{
    const k=x.recipe.id;
    acc[k]??={title:x.recipe.title,count:0,minutes:x.recipe.prepMinutes+x.recipe.cookMinutes};
    acc[k].count++;
    return acc;
  },{})).filter(x=>x.count>1);
  return {days,mealsPerDay,dailyBudget,totalBudget:dailyBudget*days,targets,dayPlans,shopping,
    averageDailyCheckout:shopping.checkout/days,batches,priceDate:SAMPLE_DATE,priceRegion:"TP.HCM",
    priceNotice:"Giá mẫu/giá do admin nhập và dinh dưỡng ước tính; chưa đồng bộ API Đi Chợ hoặc đối chiếu USDA."};
}
