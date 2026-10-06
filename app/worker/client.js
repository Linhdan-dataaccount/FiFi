const state={
  catalog:null,plan:null,day:0,view:location.pathname==="/admin"?"admin":"planner",admin:null,
  custom:[],editing:null,ingredientRows:1,error:"",notice:"",
  input:{dailyBudget:260000,days:3,mealsPerDay:3,kcal:1800,protein:120,carbs:190,fat:55,style:"both",vegetarian:false,overrides:{}}
};
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=n=>new Intl.NumberFormat("vi-VN").format(Math.round(n||0));
const money=n=>fmt(n)+"đ";
const pct=(value,target)=>Math.round(value/target*100);
const nutrients=m=>`${Math.round(m.kcal)} kcal · P ${Math.round(m.protein)}g · C ${Math.round(m.carbs)}g · F ${Math.round(m.fat)}g`;
const safeImg=url=>typeof url==="string"&&/^https:\/\//i.test(url)?esc(url):"";
const slots={breakfast:"Bữa sáng",lunch:"Bữa trưa",dinner:"Bữa tối"};
function header(active) {
  return `<header class="topbar"><div class="top-inner"><a class="brand" href="/" aria-label="FiFi trang chủ"><img src="/logo.png" alt="FiFi"></a><nav aria-label="Điều hướng"><a class="${active==="planner"?"active":""}" href="/">Lên thực đơn</a><a class="${active==="admin"?"active":""}" href="/admin">Quản lý công thức</a></nav><span class="location">⌖ TP.HCM · dữ liệu mẫu</span></div></header>`;
}
function foot(){return `<footer class="footer">FiFi · Dự án học tập <span>Giá và macro là ước tính demo, chưa phải dữ liệu trực tiếp hay tư vấn dinh dưỡng cá nhân.</span></footer>`;}
function form() {
  const i=state.input;
  return `<section class="form-card">
    <div class="eyebrow"><span class="eyedot"></span> BƯỚC 01 · THIẾT LẬP</div>
    <h1>Hôm nay ăn gì,<br><em>vừa đủ chất vừa đúng ví?</em></h1>
    <p class="intro">Cho FiFi biết mục tiêu mỗi ngày. Mình sẽ tính thực đơn và số tiền cần chi cho cả kỳ.</p>
    <form id="planner-form">
      <label class="field"><span>Ngân sách trung bình / ngày</span><div class="suffix"><input name="dailyBudget" type="number" min="30000" max="1000000" step="10000" value="${i.dailyBudget}" required><b>đ</b></div></label>
      <div class="budget-line"><span>Tổng ngân sách ${i.days} ngày</span><strong id="totalBudget">${money(i.days*i.dailyBudget)}</strong></div>
      <div class="form-grid"><label class="field"><span>Lên kế hoạch</span><select name="days">${[1,2,3,7].map(n=>`<option value="${n}" ${i.days===n?"selected":""}>${n} ngày</option>`).join("")}</select></label>
      <label class="field"><span>Số bữa / ngày</span><select name="mealsPerDay"><option value="3" ${i.mealsPerDay===3?"selected":""}>3 bữa</option><option value="2" ${i.mealsPerDay===2?"selected":""}>2 bữa</option></select></label></div>
      <div class="section-caption">MỤC TIÊU DINH DƯỠNG / NGÀY</div>
      <div class="macro-grid">
      ${[["kcal","Calories","kcal"],["protein","Protein","g"],["carbs","Carbs","g"],["fat","Fat","g"]].map(([key,label,unit])=>`<label class="field"><span>${label}</span><div class="suffix"><input name="${key}" type="number" min="1" value="${i[key]}" required><b>${unit}</b></div></label>`).join("")}
      </div>
      <label class="field"><span>Cách chuẩn bị</span><select name="style"><option value="both" ${i.style==="both"?"selected":""}>Kết hợp nấu ngay và meal prep</option><option value="prep" ${i.style==="prep"?"selected":""}>Ưu tiên meal prep</option><option value="cook" ${i.style==="cook"?"selected":""}>Nấu ngay từng bữa</option></select></label>
      <label class="check"><input name="vegetarian" type="checkbox" ${i.vegetarian?"checked":""}><span>Chỉ gợi ý món chay</span></label>
      <button class="button primary generate" type="submit">Tạo thực đơn cho mình <span aria-hidden="true">↗</span></button>
    </form>
    <p class="data-note">Giá mẫu TP.HCM · chưa kết nối API Đi Chợ. Dinh dưỡng ước tính, sẽ đối chiếu USDA ở bản dữ liệu tiếp theo.</p>
  </section>`;
}
function result() {
  const p=state.plan;
  if(!p) return `<section class="result empty"><div class="plate-mark">✦</div><h2>Thực đơn sẽ hiện ở đây</h2><p>Điền mục tiêu của m và chọn “Tạo thực đơn” để xem món ăn, macro và giỏ đi chợ.</p></section>`;
  const day=p.dayPlans[state.day]||p.dayPlans[0],over=p.shopping.checkout>p.totalBudget;
  return `<section class="result">
    <div class="result-head"><div><div class="eyebrow">BƯỚC 02 · THỰC ĐƠN CỦA BẠN</div><h2>Kế hoạch ${p.days} ngày</h2><p>${p.mealsPerDay} bữa/ngày · ${p.priceRegion} · giá minh họa ngày ${p.priceDate}</p></div><button id="show-shopping" class="button outline" type="button">Xem giỏ đi chợ ↓</button></div>
    <div class="stats">
      <div class="stat featured"><small>Cần trả khi đi chợ</small><strong>${money(p.shopping.checkout)}</strong><span class="${over?"bad":"good"}">${over?"Vượt":"Trong"} ngân sách ${money(p.totalBudget)}</span></div>
      <div class="stat"><small>Trung bình / ngày</small><strong>${money(p.averageDailyCheckout)}</strong><span>Mục tiêu ${money(p.dailyBudget)}/ngày</span></div>
      <div class="stat"><small>Protein ngày ${state.day+1}</small><strong>${Math.round(day.macros.protein)}g <i>/ ${p.targets.protein}g</i></strong><span>${pct(day.macros.protein,p.targets.protein)}% mục tiêu</span></div>
    </div>
    <div class="day-tabs" role="tablist" aria-label="Chọn ngày">${p.dayPlans.map((d,index)=>`<button role="tab" aria-selected="${state.day===index}" class="${state.day===index?"selected":""}" data-day="${index}">Ngày ${d.day}</button>`).join("")}</div>
    <div class="day-meta"><span><strong>${Math.round(day.macros.kcal)}</strong> / ${p.targets.kcal} kcal</span><span>P ${Math.round(day.macros.protein)} / ${p.targets.protein}g</span><span>C ${Math.round(day.macros.carbs)} / ${p.targets.carbs}g</span><span>F ${Math.round(day.macros.fat)} / ${p.targets.fat}g</span><span>~${day.cookingMinutes} phút nếu nấu từng bữa</span></div>
    <div class="meal-list">${day.meals.map(m=>mealCard(m,state.day)).join("")}</div>
    ${p.batches.length?`<div class="prep-banner"><div class="prep-icon">✳</div><div><strong>Gợi ý meal prep</strong><p>${p.batches.map(b=>`${esc(b.title)}: ${b.count} phần, khoảng ${b.minutes} phút cho một mẻ theo công thức mẫu`).join(" · ")}. Chia phần theo số bữa trước khi sử dụng.</p></div></div>`:""}
    <section class="shopping" id="shopping"><div class="section-heading"><div><div class="eyebrow">BƯỚC 03 · GIỎ ĐI CHỢ</div><h2>Gom nguyên liệu, mua theo gói</h2></div><span>${p.shopping.items.length} sản phẩm</span></div>
      <p>Cộng lượng cần dùng cho cả kỳ, sau đó làm tròn theo gói bán. Chi phí phần đã dùng khoảng <strong>${money(p.shopping.used)}</strong>; tiền trả tại quầy là <strong>${money(p.shopping.checkout)}</strong>.</p>
      <div class="shopping-list">${p.shopping.items.map(x=>`<div class="shop-row"><div class="shop-info"><img class="shop-thumb" src="${safeImg(x.photo?.url)}" alt="Ảnh minh họa nhóm thực phẩm" loading="lazy"><div><strong>${esc(x.name)}</strong><small>${esc(x.category)} · cần ${fmt(x.requiredGrams)}g · gói ${fmt(x.packGrams)}g</small><small><a href="${safeImg(x.photo?.sourceUrl)}" target="_blank" rel="noopener noreferrer">Ảnh minh họa: ${esc(x.photo?.credit)}</a></small></div></div><div><span>${x.packs} gói</span><strong>${money(x.checkoutCost)}</strong></div></div>`).join("")}</div>
      <div class="shopping-total"><span>Tổng thanh toán ước tính</span><strong>${money(p.shopping.checkout)}</strong></div>
    </section>
  </section>`;
}
function mealCard(m,day) {
  const r=m.recipe,mins=r.prepMinutes+r.cookMinutes;
  return `<article class="meal-card">
    <div class="meal-photo">${safeImg(r.image)?`<img src="${safeImg(r.image)}" alt="Ảnh minh họa ${esc(r.title)}" loading="lazy">`:"<span>🥗</span>"}</div>
    <div class="meal-content"><div class="meal-top"><span class="slot">${esc(m.slotLabel)}</span><span class="mode">${r.mode==="prep"?"Chuẩn bị trước":"Nấu ngay"} · ${mins} phút</span></div><h3>${esc(r.title)}</h3><p class="nutrients">${nutrients(m.macro)}</p>
      <div class="meal-actions"><details><summary>Xem cách làm</summary><div class="details-body"><p><b>Nguyên liệu / phần:</b> ${r.ingredients.map(x=>`${esc(state.catalog?.products.find(p=>p.id===x.productId)?.name||x.productId)} ${Math.round(x.grams/r.servings)}g`).join(", ")}</p><ol>${r.steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol>${r.sourceUrl?`<a href="${safeImg(r.sourceUrl)}" target="_blank" rel="noopener noreferrer">Nguồn ảnh / tham khảo ↗</a>`:""}<small>${esc(r.imageCredit||"")}</small></div></details>
      ${m.alternatives.length?`<label class="swap-label"><span>Đổi món</span><select class="swap" data-day="${day}" data-slot="${esc(m.slot)}"><option value="">Chọn món khác</option>${m.alternatives.map(a=>`<option value="${esc(a.id)}">${esc(a.title)}</option>`).join("")}</select></label>`:""}</div>
    </div>
  </article>`;
}
function renderPlanner() {
  $("#app").innerHTML=header("planner")+`<main class="layout">${form()}${result()}</main>`+foot();
  $("#planner-form").addEventListener("submit",submitPlan);
  $("#planner-form").addEventListener("input",e=>{
    if(["dailyBudget","days"].includes(e.target.name)) {
      const f=$("#planner-form");$("#totalBudget").textContent=money(Number(f.elements.dailyBudget.value)*Number(f.elements.days.value));
    }
  });
  document.querySelectorAll("[data-day]").forEach(el=>{if(el.classList.contains("day-tabs")||el.matches(".day-tabs button"))el.addEventListener("click",()=>{state.day=Number(el.dataset.day);renderPlanner();});});
  document.querySelectorAll(".swap").forEach(el=>el.addEventListener("change",async()=>{if(!el.value)return;state.input.overrides[`${el.dataset.day}:${el.dataset.slot}`]=el.value;await generate();}));
  $("#show-shopping")?.addEventListener("click",()=>$("#shopping")?.scrollIntoView({behavior:"smooth"}));
  if(state.error) showToast(state.error,true);
}
async function submitPlan(event) {
  event.preventDefault();
  const f=event.currentTarget;
  state.input={...state.input,dailyBudget:Number(f.elements.dailyBudget.value),days:Number(f.elements.days.value),
    mealsPerDay:Number(f.elements.mealsPerDay.value),kcal:Number(f.elements.kcal.value),protein:Number(f.elements.protein.value),
    carbs:Number(f.elements.carbs.value),fat:Number(f.elements.fat.value),style:f.elements.style.value,
    vegetarian:f.elements.vegetarian.checked,overrides:{}};
  state.day=0;await generate();
}
async function generate() {
  try {
    const res=await fetch("/api/plan",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(state.input)});
    const data=await res.json();if(!res.ok)throw Error(data.error||"Không tạo được kế hoạch.");
    state.plan=data;state.error="";renderPlanner();
  } catch(e){state.error=e.message;showToast(e.message,true);}
}
function showToast(message,bad=false) {
  document.querySelector(".toast")?.remove();
  const el=document.createElement("div");el.className="toast"+(bad?" danger":"");el.textContent=message;document.body.append(el);
  setTimeout(()=>el.remove(),5000);
}
function adminForm() {
  const r=state.editing||{},rows=r.ingredients?.length||state.ingredientRows;
  return `<form id="recipe-form" class="admin-form"><div class="form-grid">
    <label class="field wide"><span>Tên món</span><input name="title" required minlength="3" value="${esc(r.title||"")}" placeholder="Ví dụ: Cơm gà nấm"></label>
    <label class="field"><span>Bữa ăn</span><select name="slot">${Object.entries(slots).map(([v,label])=>`<option value="${v}" ${(r.slot||"lunch")===v?"selected":""}>${label}</option>`).join("")}</select></label>
    <label class="field"><span>Kiểu nấu</span><select name="mode"><option value="cook" ${r.mode!=="prep"?"selected":""}>Nấu ngay</option><option value="prep" ${r.mode==="prep"?"selected":""}>Meal prep</option></select></label>
    <label class="field"><span>Khẩu phần</span><input name="servings" type="number" min="1" max="12" value="${r.servings||1}" required></label>
    <label class="field"><span>Sơ chế (phút)</span><input name="prepMinutes" type="number" min="0" max="240" value="${r.prepMinutes??10}" required></label>
    <label class="field"><span>Nấu (phút)</span><input name="cookMinutes" type="number" min="0" max="240" value="${r.cookMinutes??15}" required></label>
  </div><div class="section-caption">NGUYÊN LIỆU · LƯỢNG CHO CẢ CÔNG THỨC</div><div id="ingredient-rows">
    ${Array.from({length:rows},(_,idx)=>ingredientRow(r.ingredients?.[idx],idx)).join("")}
  </div><button type="button" id="add-ingredient" class="text-button">+ Thêm nguyên liệu</button>
  <label class="field"><span>Các bước nấu · mỗi dòng một bước</span><textarea name="steps" rows="4" required placeholder="Sơ chế...&#10;Nấu...">${esc((r.steps||[]).join("\n"))}</textarea></label>
  <div class="form-grid"><label class="field wide"><span>URL ảnh được phép sử dụng</span><input name="image" type="url" value="${esc(r.image||"")}" placeholder="https://..."></label><label class="field wide"><span>Nguồn ảnh / tác giả</span><input name="imageCredit" value="${esc(r.imageCredit||"")}" placeholder="Ảnh: ..."></label></div>
  <label class="check"><input name="vegetarian" type="checkbox" ${r.vegetarian?"checked":""}> Món chay</label>
  <label class="check"><input name="imageApproved" type="checkbox"> Tôi xác nhận ảnh này được phép dùng cho FiFi</label>
  <label class="field"><span>Trạng thái</span><select name="status"><option value="draft" ${r.status!=="published"?"selected":""}>Bản nháp</option><option value="published" ${r.status==="published"?"selected":""}>Đăng cho người dùng</option></select></label>
  <div class="admin-buttons"><button class="button primary" type="submit">${r.id?"Lưu thay đổi":"Thêm công thức"}</button>${r.id?'<button class="button outline" type="button" id="cancel-edit">Hủy sửa</button>':""}</div>
  </form>`;
}
function ingredientRow(ing,idx) {
  return `<div class="ingredient-row"><label class="field"><span>Nguyên liệu ${idx+1}</span><select name="productId">${(state.catalog?.products||[]).map(p=>`<option value="${esc(p.id)}" ${ing?.productId===p.id?"selected":""}>${esc(p.name)}</option>`).join("")}</select></label><label class="field"><span>Lượng (g)</span><input name="grams" type="number" min="1" max="5000" value="${ing?.grams||100}" required></label><button type="button" class="remove-ing" title="Bỏ nguyên liệu">×</button></div>`;
}
function renderAdmin() {
  const allowed=state.admin?.allowed;
  $("#app").innerHTML=header("admin")+`<main class="admin-layout"><div class="admin-intro"><div class="eyebrow">FIFI STUDIO · QUẢN LÝ CÔNG THỨC</div><h1>Thư viện món ăn</h1><p>Tạo công thức bằng gram, kiểm tra ảnh và dinh dưỡng ước tính trước khi đăng.</p></div>
    ${!allowed?`<section class="admin-lock"><h2>Chỉ dành cho admin FiFi</h2><p>Đăng nhập bằng tài khoản được cấp quyền để quản lý công thức. Trang người dùng vẫn ở mục “Lên thực đơn”.</p></section>`:
    `<div class="admin-grid"><section class="panel"><h2>${state.editing?"Sửa công thức":"Thêm công thức"}</h2>${adminForm()}</section><section class="panel library"><div class="library-head"><h2>Món đã thêm</h2><span>${state.custom.length} món</span></div>${state.custom.length?state.custom.map(r=>`<article class="library-row"><div><strong>${esc(r.title)}</strong><small>${esc(slots[r.slot])} · ${r.prepMinutes+r.cookMinutes} phút · ${r.status==="published"?"Đã đăng":"Bản nháp"}</small></div><div><button data-edit="${esc(r.id)}">Sửa</button><button data-delete="${esc(r.id)}" aria-label="Xóa ${esc(r.title)}">Xóa</button></div></article>`).join(""):`<p class="empty-admin">Chưa có món riêng. Món mẫu vẫn có sẵn ở trang người dùng.</p>`}</section></div>`}
    </main>`+foot();
  if(!allowed)return;
  $("#recipe-form").addEventListener("submit",saveRecipe);
  $("#add-ingredient").addEventListener("click",()=>{state.ingredientRows++;$("#ingredient-rows").insertAdjacentHTML("beforeend",ingredientRow(null,state.ingredientRows-1));});
  $("#ingredient-rows").addEventListener("click",e=>{if(e.target.matches(".remove-ing")&&$("#ingredient-rows").children.length>1)e.target.closest(".ingredient-row").remove();});
  $("#cancel-edit")?.addEventListener("click",()=>{state.editing=null;state.ingredientRows=1;renderAdmin();});
  document.querySelectorAll("[data-edit]").forEach(btn=>btn.addEventListener("click",()=>{state.editing=state.custom.find(r=>r.id===btn.dataset.edit);state.ingredientRows=state.editing.ingredients.length;renderAdmin();window.scrollTo(0,0);}));
  document.querySelectorAll("[data-delete]").forEach(btn=>btn.addEventListener("click",async()=>{
    const r=state.custom.find(x=>x.id===btn.dataset.delete);
    if(!confirm(`Xóa “${r.title}” khỏi thư viện?`))return;
    const res=await fetch("/api/admin/recipes",{method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({id:r.id})});
    if(!res.ok){showToast((await res.json()).error,true);return;}await loadAdmin();showToast("Đã xóa công thức.");
  }));
}
async function saveRecipe(event) {
  event.preventDefault();
  const f=event.currentTarget;
  const ingredients=Array.from($("#ingredient-rows").children).map(row=>({productId:row.querySelector('[name="productId"]').value,grams:Number(row.querySelector('[name="grams"]').value)}));
  const body={id:state.editing?.id,title:f.elements.title.value,slot:f.elements.slot.value,mode:f.elements.mode.value,
    servings:Number(f.elements.servings.value),prepMinutes:Number(f.elements.prepMinutes.value),cookMinutes:Number(f.elements.cookMinutes.value),
    ingredients,steps:f.elements.steps.value.split("\n"),image:f.elements.image.value,imageCredit:f.elements.imageCredit.value,
    vegetarian:f.elements.vegetarian.checked,imageApproved:f.elements.imageApproved.checked,status:f.elements.status.value};
  const res=await fetch("/api/admin/recipes",{method:state.editing?"PUT":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  const data=await res.json();if(!res.ok){showToast(data.error||"Không lưu được.",true);return;}
  state.editing=null;state.ingredientRows=1;await loadAdmin();showToast("Đã lưu công thức.");
}
async function loadAdmin() {
  state.admin=await (await fetch("/api/admin/session")).json();
  if(state.admin.allowed) {
    const res=await fetch("/api/admin/recipes");state.custom=res.ok?(await res.json()).recipes:[];
  }
  renderAdmin();
}
async function init() {
  try {state.catalog=await (await fetch("/api/catalog")).json();}
  catch {$("#app").innerHTML="<p>Chưa tải được dữ liệu. Hãy thử làm mới trang.</p>";return;}
  if(state.view==="admin") await loadAdmin();
  else {renderPlanner();await generate();}
}
// The interactive wizard and admin workspace are layered in client-plus.js.
