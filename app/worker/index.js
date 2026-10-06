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
function validRecipe(body,products) {
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
  const available=new Set(products.filter(p=>p.enabled!==false).map(p=>p.id));
  if(cleanIngredients.some(i=>!available.has(i.productId)||!Number.isFinite(i.grams)||i.grams<=0||i.grams>5000)) throw new Error("Kiểm tra nguyên liệu và lượng gram.");
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
function sameOrigin(request,url){const origin=request.headers.get("origin");return !origin||origin===url.origin;}
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
    if(path==="/api/catalog"&&request.method==="GET") {
      try {return json({products:await allProducts(env),recipes:[...SAMPLE_RECIPES,...await customRecipes(env)],sampleDate:SAMPLE_DATE,region:"TP.HCM"});}
      catch(e){console.error("Catalog unavailable",e);return error("Chưa tải được kho nguyên liệu.",503);}
    }
    if(path==="/api/plan"&&request.method==="POST") {
      try {
        if(!sameOrigin(request,url))return error("Yêu cầu khác nguồn bị từ chối.",403);
        const input=await readJson(request),products=await allProducts(env);
        const profile=validateProfile(input.profile||{},products);
        const plan=buildPlan({...input,profile},[...SAMPLE_RECIPES,...await customRecipes(env)],products);
        let savedPlanId=null;
        if(input.save===true){
          const user=identity(request);
          if(!user.id)return error("Cần đăng nhập để lưu kế hoạch.",401);
          if(input.consent!==true)return error("Cần đồng ý lưu hồ sơ trước khi ghi dữ liệu.",400);
          savedPlanId=await saveOwnPlan(env,user,profile,{...input,save:undefined,consent:undefined,overrides:input.overrides||{}},plan);
        }
        return json({...plan,savedPlanId});
      } catch(e){console.error("Plan failed",e);return error(e.message||"Không thể tạo thực đơn.",env.DB?400:503);}
    }
    if(path==="/api/me"&&request.method==="GET") {
      const user=identity(request);if(!user.id)return error("Cần đăng nhập để xem hồ sơ.",401);
      try{return json(await ownData(env,user.id));}catch(e){console.error("Profile load failed",e);return error("Không tải được hồ sơ.",503);}
    }
    if(path==="/api/me"&&request.method==="DELETE") {
      const user=identity(request);if(!user.id)return error("Cần đăng nhập để xóa hồ sơ.",401);
      if(!sameOrigin(request,url))return error("Yêu cầu khác nguồn bị từ chối.",403);
      try{await deleteOwnData(env,user.id);return json({ok:true});}catch(e){console.error("Profile deletion failed",e);return error("Không xóa được hồ sơ.",503);}
    }
    if(path==="/api/admin/session"&&request.method==="GET")
      return json({allowed:adminAllowed(request,env),storageAvailable:!!env.DB});
    if(path==="/api/admin/products") {
      if(!adminAllowed(request,env))return error("Chỉ admin FiFi được phép xem dữ liệu này.",403);
      if(!env.DB)return error("Chưa kết nối database.",503);
      try{
        if(request.method==="GET")return json({products:await allProducts(env)});
        if(!sameOrigin(request,url))return error("Yêu cầu khác nguồn bị từ chối.",403);
        const body=await readJson(request),existing=await allProducts(env);
        if(request.method==="DELETE"){
          if(!existing.some(p=>p.id===body.id))return error("Không tìm thấy sản phẩm.",404);
          await env.DB.prepare("DELETE FROM product_records WHERE id=?").bind(body.id).run();
          return json({ok:true});
        }
        if(!["PUT","POST"].includes(request.method))return error("Phương thức không hỗ trợ.",405);
        const id=request.method==="PUT"?String(body.id||""):undefined;
        if(id&&!existing.some(p=>p.id===id))return error("Không tìm thấy sản phẩm.",404);
        const product=validateProduct(body,id),now=new Date().toISOString();
        await env.DB.prepare("INSERT INTO product_records(id,payload,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at")
          .bind(product.id,JSON.stringify(product),now).run();
        return json({ok:true,product},request.method==="POST"?201:200);
      }catch(e){console.error("Product request failed",e);return error(e.message||"Không lưu được nguyên liệu.",400);}
    }
    if(path==="/api/admin/sources") {
      if(!adminAllowed(request,env))return error("Chỉ admin FiFi được phép xem dữ liệu này.",403);
      if(!env.DB)return error("Chưa kết nối database.",503);
      try{
        if(request.method==="GET")return json({sources:await sourceSettings(env)});
        if(request.method!=="PUT")return error("Phương thức không hỗ trợ.",405);
        if(!sameOrigin(request,url))return error("Yêu cầu khác nguồn bị từ chối.",403);
        const source=validateSource(await readJson(request));
        await env.DB.prepare("INSERT INTO integration_sources(provider,payload,updated_at) VALUES(?,?,?) ON CONFLICT(provider) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at")
          .bind(source.provider,JSON.stringify(source),new Date().toISOString()).run();
        return json({ok:true,source});
      }catch(e){console.error("Source setting failed",e);return error(e.message||"Không lưu được nguồn API.",400);}
    }
    if(path==="/api/admin/customers") {
      if(!adminAllowed(request,env))return error("Chỉ admin FiFi được phép xem dữ liệu này.",403);
      if(!env.DB)return error("Chưa kết nối database.",503);
      try{
        if(request.method==="GET")return json({customers:await customerData(env)});
        if(request.method!=="DELETE")return error("Phương thức không hỗ trợ.",405);
        if(!sameOrigin(request,url))return error("Yêu cầu khác nguồn bị từ chối.",403);
        const body=await readJson(request),id=String(body.userId||"");if(!id||id.length>200)return error("ID không hợp lệ.",400);
        await deleteOwnData(env,id);return json({ok:true});
      }catch(e){console.error("Customer request failed",e);return error(e.message||"Không xử lý được dữ liệu khách hàng.",400);}
    }
    if(path==="/api/admin/recipes") {
      if(!adminAllowed(request,env)) return error("Khu vực này chỉ dành cho admin FiFi đã đăng nhập.",403);
      if(!env.DB) return error("Chưa kết nối kho công thức.",503);
      if(request.method==="GET") return json({recipes:await customRecipes(env,true)});
      if(["POST","PUT","DELETE"].includes(request.method)) {
        if(!sameOrigin(request,url)) return error("Yêu cầu khác nguồn bị từ chối.",403);
        try {
          const body=await readJson(request);
          if(request.method==="DELETE") {
            if(!/^custom-[a-f0-9-]{36}$/.test(body.id||"")) return error("ID công thức không hợp lệ.",400);
            await env.DB.prepare("DELETE FROM custom_recipes WHERE id=?").bind(body.id).run();
            return json({ok:true});
          }
          const clean=validRecipe(body,await allProducts(env));
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
