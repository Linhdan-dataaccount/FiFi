const ALLERGEN_OPTIONS=["sữa","trứng","đậu phộng","đậu nành","lúa mì","cá"];
const SAMPLE_ALLERGENS={yogurt:["sữa"],milk:["sữa"],peanut:["đậu phộng"],egg:["trứng"],bread:["lúa mì"],tofu:["đậu nành"],tuna:["cá"],pasta:["lúa mì"],wrap:["lúa mì"]};
const SAMPLE_PRODUCTS=PRODUCTS.map(p=>({...p,allergens:SAMPLE_ALLERGENS[p.id]||[],region:"TP.HCM",priceAsOf:SAMPLE_DATE,enabled:true}));
const sourceDefaults={
  dicho:{provider:"dicho",label:"Đi Chợ",region:"TP.HCM",endpoint:"https://app.dicho.site/api/pools.php",note:"Chờ API key, đặc tả trường dữ liệu và quyền sử dụng. Giá hiện nhập thủ công."},
  usda:{provider:"usda",label:"USDA FoodData Central",region:"Nutrient reference",endpoint:"https://api.nal.usda.gov/fdc/v1",note:"Chờ đối chiếu mã thực phẩm và dữ liệu per 100g."}
};
function identity(request){return {id:request.headers.get("oai-authenticated-user-id")||"",email:request.headers.get("oai-authenticated-user-email")||""};}
function requireStore(env){if(!env.DB)throw new Error("Chưa kết nối database FiFi.");return env.DB;}
async function allProducts(env){
  const merged=new Map(SAMPLE_PRODUCTS.map(p=>[p.id,p]));
  if(env.DB){const {results}=await env.DB.prepare("SELECT payload FROM product_records ORDER BY updated_at DESC").all();
    for(const row of results){const p=JSON.parse(row.payload);merged.set(p.id,p);}}
  return [...merged.values()];
}
function validateProduct(body,existingId){
  if(!body||typeof body!=="object")throw new Error("Sản phẩm không hợp lệ.");
  const id=existingId||`item-${crypto.randomUUID()}`;
  const name=String(body.name||"").trim().slice(0,80),category=String(body.category||"").trim().slice(0,40);
  const packGrams=Number(body.packGrams),priceVnd=Number(body.priceVnd);
  if(name.length<2||!category)throw new Error("Cần tên và nhóm thực phẩm.");
  if(!Number.isFinite(packGrams)||packGrams<=0||packGrams>20000||!Number.isInteger(priceVnd)||priceVnd<0||priceVnd>10000000)throw new Error("Kiểm tra trọng lượng gói và giá VND.");
  const nutrition={};for(const key of ["kcal","protein","carbs","fat"]){const n=Number(body.nutrition?.[key]);if(!Number.isFinite(n)||n<0||n>1000)throw new Error("Dinh dưỡng phải theo 100g.");nutrition[key]=n;}
  const allergens=Array.isArray(body.allergens)?body.allergens.filter(x=>ALLERGEN_OPTIONS.includes(x)):[];
  const priceAsOf=String(body.priceAsOf||SAMPLE_DATE).trim().slice(0,30);
  const source=String(body.source||"Giá nhập thủ công TP.HCM").trim().slice(0,100);
  return {id,name,category,packGrams,priceVnd,nutrition,allergens:[...new Set(allergens)],source,priceAsOf,region:"TP.HCM",enabled:body.enabled!==false};
}
function validateProfile(body,products){
  if(!body||typeof body!=="object")throw new Error("Hồ sơ không hợp lệ.");
  const goal=["maintain","gain","cut"].includes(body.goal)?body.goal:"maintain";
  const training=!!body.training,trainingDays=training?Math.min(7,Math.max(0,Math.round(Number(body.trainingDays)||0))):0;
  const ageRange=["under18","18-25","26-40","41-60","over60","skip"].includes(body.ageRange)?body.ageRange:"skip";
  const weightKg=body.weightKg===""||body.weightKg==null?null:Number(body.weightKg);
  if(weightKg!==null&&(!Number.isFinite(weightKg)||weightKg<30||weightKg>300))throw new Error("Cân nặng cần trong khoảng 30–300 kg hoặc để trống.");
  const healthFlag=["none","specific","skip"].includes(body.healthFlag)?body.healthFlag:"skip";
  const allergens=Array.isArray(body.allergens)?body.allergens.filter(x=>ALLERGEN_OPTIONS.includes(x)):[];
  const available=new Set(products.map(p=>p.id));
  const avoidProductIds=Array.isArray(body.avoidProductIds)?body.avoidProductIds.filter(x=>available.has(x)).slice(0,30):[];
  return {goal,training,trainingDays,ageRange,weightKg,healthFlag,allergens:[...new Set(allergens)],avoidProductIds:[...new Set(avoidProductIds)],vegetarian:!!body.vegetarian};
}
async function ownData(env,userId){
  const db=requireStore(env);
  const row=await db.prepare("SELECT email,payload,consent_at,updated_at FROM user_profiles WHERE user_id=?").bind(userId).first();
  const {results}=await db.prepare("SELECT id,payload,created_at FROM plan_history WHERE user_id=? ORDER BY created_at DESC LIMIT 10").bind(userId).all();
  return {profile:row?{...JSON.parse(row.payload),email:row.email,consentAt:row.consent_at,updatedAt:row.updated_at}:null,
    plans:results.map(x=>({id:x.id,...JSON.parse(x.payload),createdAt:x.created_at}))};
}
async function saveOwnPlan(env,user,profile,input,plan){
  const db=requireStore(env),now=new Date().toISOString(),id=crypto.randomUUID();
  await db.batch([
    db.prepare("INSERT INTO user_profiles(user_id,email,payload,consent_at,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET email=excluded.email,payload=excluded.payload,updated_at=excluded.updated_at")
      .bind(user.id,user.email,JSON.stringify(profile),now,now),
    db.prepare("INSERT INTO plan_history(id,user_id,payload,created_at) VALUES(?,?,?,?)")
      .bind(id,user.id,JSON.stringify({input,plan}),now)
  ]);
  return id;
}
async function deleteOwnData(env,userId){
  const db=requireStore(env);
  await db.batch([db.prepare("DELETE FROM plan_history WHERE user_id=?").bind(userId),db.prepare("DELETE FROM user_profiles WHERE user_id=?").bind(userId)]);
}
async function customerData(env){
  const db=requireStore(env);
  const {results:profiles}=await db.prepare("SELECT user_id,email,payload,consent_at,updated_at FROM user_profiles ORDER BY updated_at DESC").all();
  const {results:plans}=await db.prepare("SELECT id,user_id,payload,created_at FROM plan_history ORDER BY created_at DESC").all();
  return profiles.map(row=>({userId:row.user_id,email:row.email,profile:JSON.parse(row.payload),consentAt:row.consent_at,updatedAt:row.updated_at,
    plans:plans.filter(p=>p.user_id===row.user_id).map(p=>({id:p.id,...JSON.parse(p.payload),createdAt:p.created_at}))}));
}
async function sourceSettings(env){
  const saved={};if(env.DB){const {results}=await env.DB.prepare("SELECT payload FROM integration_sources").all();for(const row of results){const p=JSON.parse(row.payload);saved[p.provider]=p;}}
  return Object.values(sourceDefaults).map(base=>({...base,...saved[base.provider],keyConfigured:!!(base.provider==="dicho"?env.DICHO_API_KEY:env.USDA_API_KEY),live:false}));
}
function validateSource(body){
  const provider=String(body?.provider||"");if(!sourceDefaults[provider])throw new Error("Nguồn dữ liệu không hợp lệ.");
  const endpoint=String(body.endpoint||sourceDefaults[provider].endpoint).trim().slice(0,300);
  const url=new URL(endpoint);if(url.protocol!=="https:"||!(["app.dicho.site","api.nal.usda.gov"].includes(url.hostname)))throw new Error("Endpoint phải thuộc nhà cung cấp đã chọn và dùng HTTPS.");
  return {provider,region:provider==="dicho"?"TP.HCM":"Nutrient reference",endpoint,note:String(body.note||"").trim().slice(0,300)};
}
