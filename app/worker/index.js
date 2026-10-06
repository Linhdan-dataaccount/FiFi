const CLIENT_JS = __CLIENT_JSON__;
const STYLES = __CSS_JSON__;
const LOGO_BASE64 = "__LOGO_BASE64__";
const shell = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#103d38"><meta name="description" content="FiFi giúp lên thực đơn theo macro và ngân sách đi chợ."><title>FiFi · Thực đơn vừa mục tiêu vừa túi tiền</title><link rel="icon" href="/logo.png"><link rel="stylesheet" href="/style.css"></head><body><div id="app"></div><script defer src="/client.js"></script></body></html>`;
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const error=(message,status)=>json({error:message},status);
function adminAllowed(request,env) {
  const email=request.headers.get("oai-authenticated-user-email")?.toLowerCase();
  const allowed=(env.FIFI_ADMIN_EMAILS||"").split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
  return !!email && allowed.includes(email);
}
async function customRecipes(env,includeDrafts=false) {
  if(!env.DB) return [];
  try {
    const {results}=await env.DB.prepare("SELECT payload FROM custom_recipes ORDER BY updated_at DESC").all();
    return results.map(row=>JSON.parse(row.payload)).filter(r=>includeDrafts||r.status==="published");
  } catch(e) {console.error("Recipe store unavailable",e);return [];}
}
function validRecipe(body) {
  if(!body||typeof body!=="object") throw new Error("Dữ liệu công thức không hợp lệ.");
  const title=String(body.title||"").trim().slice(0,100);
  if(title.length<3) throw new Error("Tên món cần ít nhất 3 ký tự.");
  if(!["breakfast","lunch","dinner"].includes(body.slot)) throw new Error("Chọn một bữa ăn.");
  if(!["cook","prep"].includes(body.mode)) throw new Error("Chọn kiểu chuẩn bị.");
  const servings=Number(body.servings),prepMinutes=Number(body.prepMinutes),cookMinutes=Number(body.cookMinutes);
  if(!Number.isInteger(servings)||servings<1||servings>12) throw new Error("Khẩu phần phải từ 1 đến 12.");
  if(!Number.isInteger(prepMinutes)||prepMinutes<0||prepMinutes>240||!Number.isInteger(cookMinutes)||cookMinutes<0||cookMinutes>240) throw new Error("Thời gian phải từ 0 đến 240 phút.");
  const ingredients=Array.isArray(body.ingredients)?body.ingredients:[];
  if(!ingredients.length||ingredients.length>20) throw new Error("Thêm ít nhất một nguyên liệu.");
  const cleanIngredients=ingredients.map(i=>({productId:String(i.productId),grams:Number(i.grams)}));
  if(cleanIngredients.some(i=>!productById[i.productId]||!Number.isFinite(i.grams)||i.grams<=0||i.grams>5000)) throw new Error("Kiểm tra nguyên liệu và lượng gram.");
  const steps=(Array.isArray(body.steps)?body.steps:[]).map(s=>String(s).trim().slice(0,300)).filter(Boolean).slice(0,12);
  if(!steps.length) throw new Error("Thêm ít nhất một bước nấu.");
  const image=String(body.image||"").trim(),imageCredit=String(body.imageCredit||"").trim().slice(0,160);
  if(image) {try {if(new URL(image).protocol!=="https:") throw Error();} catch {throw new Error("Ảnh cần một URL https hợp lệ.");}}
  const status=body.status==="published"?"published":"draft";
  if(status==="published"&&(!image||!imageCredit||body.imageApproved!==true)) throw new Error("Để đăng món, cần URL ảnh, ghi nguồn và xác nhận quyền sử dụng.");
  return {title,slot:body.slot,mode:body.mode,servings,prepMinutes,cookMinutes,
    ingredients:cleanIngredients,steps,image,imageCredit,status,vegetarian:!!body.vegetarian,
    sourceUrl:body.sourceUrl&&/^https:\/\//.test(body.sourceUrl)?String(body.sourceUrl).slice(0,500):""};
}
async function readJson(request) {
  if(!request.headers.get("content-type")?.includes("application/json")) throw new Error("Gửi dữ liệu dạng JSON.");
  if(Number(request.headers.get("content-length")||0)>50000) throw new Error("Dữ liệu quá lớn.");
  return request.json();
}
export default {
  async fetch(request,env) {
    const url=new URL(request.url),path=url.pathname;
    if(path==="/"||path==="/admin") return new Response(shell,{headers:{"content-type":"text/html; charset=utf-8"}});
    if(path==="/style.css") return new Response(STYLES,{headers:{"content-type":"text/css; charset=utf-8","cache-control":"public, max-age=3600"}});
    if(path==="/client.js") return new Response(CLIENT_JS,{headers:{"content-type":"text/javascript; charset=utf-8","cache-control":"public, max-age=3600"}});
    if(path==="/logo.png") {
      const bytes=Uint8Array.from(atob(LOGO_BASE64),c=>c.charCodeAt(0));
      return new Response(bytes,{headers:{"content-type":"image/png","cache-control":"public, max-age=86400"}});
    }
    if(path==="/api/catalog"&&request.method==="GET")
      return json({products:PRODUCTS,recipes:[...SAMPLE_RECIPES,...await customRecipes(env)],sampleDate:SAMPLE_DATE,region:"TP.HCM"});
    if(path==="/api/plan"&&request.method==="POST") {
      try {return json(buildPlan(await readJson(request),[...SAMPLE_RECIPES,...await customRecipes(env)]));}
      catch(e){return error(e.message||"Không thể tạo thực đơn.",400);}
    }
    if(path==="/api/admin/session"&&request.method==="GET")
      return json({allowed:adminAllowed(request,env),storageAvailable:!!env.DB});
    if(path==="/api/admin/recipes") {
      if(!adminAllowed(request,env)) return error("Khu vực này chỉ dành cho admin FiFi đã đăng nhập.",403);
      if(!env.DB) return error("Chưa kết nối kho công thức.",503);
      if(request.method==="GET") return json({recipes:await customRecipes(env,true)});
      if(["POST","PUT","DELETE"].includes(request.method)) {
        const origin=request.headers.get("origin");
        if(origin&&origin!==url.origin) return error("Yêu cầu khác nguồn bị từ chối.",403);
        try {
          const body=await readJson(request);
          if(request.method==="DELETE") {
            if(!/^custom-[a-f0-9-]{36}$/.test(body.id||"")) return error("ID công thức không hợp lệ.",400);
            await env.DB.prepare("DELETE FROM custom_recipes WHERE id=?").bind(body.id).run();
            return json({ok:true});
          }
          const clean=validRecipe(body);
          const id=request.method==="PUT"?String(body.id||""):`custom-${crypto.randomUUID()}`;
          if(!/^custom-[a-f0-9-]{36}$/.test(id)) return error("ID công thức không hợp lệ.",400);
          if(request.method==="PUT") {
            const prior=await env.DB.prepare("SELECT id FROM custom_recipes WHERE id=?").bind(id).first();
            if(!prior) return error("Không tìm thấy công thức để sửa.",404);
          }
          const recipe={id,...clean};
          await env.DB.prepare("INSERT INTO custom_recipes(id,payload,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at")
            .bind(id,JSON.stringify(recipe),new Date().toISOString()).run();
          return json({ok:true,recipe},request.method==="POST"?201:200);
        } catch(e) {console.error("Admin recipe request failed",e);return error(e.message||"Không lưu được công thức.",400);}
      }
    }
    return new Response("Không tìm thấy",{status:404});
  }
};
