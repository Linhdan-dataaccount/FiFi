import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import worker from "../dist/server/index.js";

const sql=new DatabaseSync(":memory:");
for(const migration of ["0000_fifi_recipes.sql","0001_fifi_catalog_users.sql"])
  sql.exec(readFileSync(resolve("drizzle",migration),"utf8"));
const DB={
  prepare(query){
    const statement=sql.prepare(query);
    return {args:[],bind(...args){this.args=args;return this},
      async all(){return {results:statement.all(...this.args)}},
      async first(){return statement.get(...this.args)||null},
      async run(){return statement.run(...this.args)}};
  },
  async batch(statements){for(const statement of statements)await statement.run()}
};
const env={DB,FIFI_ADMIN_EMAILS:"admin@example.com"};
function req(path,method="GET",body,who=""){
  return new Request("https://fifi.test"+path,{method,
    headers:{...(body?{"content-type":"application/json"}:{}),
      ...(who?{"oai-authenticated-user-id":who,"oai-authenticated-user-email":who==="u1"?"user@example.com":"admin@example.com"}:{})},
    body:body?JSON.stringify(body):undefined});
}
const call=async(path,method,body,who)=>{const response=await worker.fetch(req(path,method,body,who),env);return {status:response.status,data:await response.json()}};
const check=(truth,message)=>{if(!truth)throw new Error(message)};
const catalog=await call("/api/catalog","GET");check(catalog.status===200&&catalog.data.products.length===22,"catalog");
const input={days:3,dailyBudget:260000,mealsPerDay:3,kcal:1800,protein:120,carbs:190,fat:55,
  profile:{goal:"gain",training:true,trainingDays:3,ageRange:"18-25",healthFlag:"skip",allergens:["đậu phộng"]}};
const plan=await call("/api/plan","POST",input);
check(plan.status===200&&plan.data.totalBudget===780000&&plan.data.dayPlans.length===3,"guest plan");
check(plan.data.dayPlans.every(d=>d.meals.every(m=>!m.recipe.ingredients.some(i=>i.productId==="peanut"))),"allergen exclusion");
const rejected=await call("/api/plan","POST",{...input,save:true,consent:false},"u1");
check(rejected.status===400,"consent guard");
const saved=await call("/api/plan","POST",{...input,save:true,consent:true},"u1");
check(saved.status===200&&saved.data.savedPlanId,"saved plan");
const own=await call("/api/me","GET",null,"u1");
check(own.data.profile.goal==="gain"&&own.data.plans.length===1,"profile and history");
const noAdmin=await call("/api/admin/customers","GET",null,"u1");check(noAdmin.status===403,"admin gate");
const updated=await call("/api/admin/products","PUT",{...catalog.data.products[0],priceVnd:69000},"admin");
check(updated.status===200,"price update");
const after=await call("/api/catalog","GET");check(after.data.products.find(p=>p.id==="chicken").priceVnd===69000,"catalog override");
const source=await call("/api/admin/sources","PUT",{provider:"dicho",endpoint:"https://app.dicho.site/api/pools.php",note:"Awaiting schema"},"admin");
check(source.status===200,"source setting");
const customers=await call("/api/admin/customers","GET",null,"admin");
check(customers.data.customers.length===1&&customers.data.customers[0].plans.length===1,"customer dashboard");
const deleted=await call("/api/me","DELETE",null,"u1");
const empty=await call("/api/me","GET",null,"u1");
check(deleted.status===200&&empty.data.profile===null&&empty.data.plans.length===0,"user deletion");
console.log("FiFi smoke test passed: catalog, budget, allergy filter, consent, D1 profile/history, admin price/source/customer, deletion");

