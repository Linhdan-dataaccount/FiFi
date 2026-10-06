state.step=0;
state.view=location.pathname==="/admin"?"admin":"wizard";
state.profile={goal:"maintain",training:true,trainingDays:3,ageRange:"18-25",weightKg:"",healthFlag:"skip",allergens:[],avoidProductIds:[],vegetarian:false};
state.consent=false;
state.own=null;
state.adminTab="overview";
state.productEditing=null;
state.sources=[];
state.customers=[];
const ALLERGENS=["sữa","trứng","đậu phộng","đậu nành","lúa mì","cá"];
const STEP_TITLES=["Mục tiêu","Sức khỏe","Dinh dưỡng","Bữa ăn","Ngân sách"];
const goalLabels={maintain:"Duy trì",gain:"Tăng cơ",cut:"Giảm mỡ"};
const ageLabels={under18:"Dưới 18","18-25":"18–25","26-40":"26–40","41-60":"41–60",over60:"Trên 60",skip:"Không muốn nói"};
const healthLabels={none:"Không có lưu ý riêng",specific:"Có chỉ định ăn uống riêng",skip:"Không muốn nói"};
const checked=(v)=>v?"checked":"";
const selected=(a,b)=>a===b?"selected":"";
const options=(items,value)=>items.map(([id,label])=>`<option value="${esc(id)}" ${selected(value,id)}>${esc(label)}</option>`).join("");
const requestJson=async(path,opts)=>{const r=await fetch(path,opts);let data=await r.json();if(!r.ok)throw Error(data.error||"Yêu cầu không thành công.");return data};
const bodyOpts=(method,body)=>({method,headers:{"content-type":"application/json"},body:JSON.stringify(body)});
function wizardFields(){
 const p=state.profile,i=state.input,s=state.step;
 if(s===0)return `<div class="choice-intro"><span class="question-mark">01</span><h1>M đang ăn uống để đạt mục tiêu gì?</h1><p>FiFi sẽ ưu tiên món hợp với lịch tập và mục tiêu của m.</p></div>
 <div class="choice-grid">${[["maintain","Ăn cân bằng","Duy trì thể trạng"],["gain","Tăng cơ","Ưu tiên đủ protein"],["cut","Giảm mỡ","Theo dõi năng lượng"]].map(([v,title,sub])=>`<label class="choice"><input type="radio" name="goal" value="${v}" ${checked(p.goal===v)}><span><b>${title}</b><small>${sub}</small></span></label>`).join("")}</div>
 <div class="wizard-row"><label class="field"><span>Có tập luyện không?</span><select name="training"><option value="yes" ${selected(p.training?"yes":"no","yes")}>Có</option><option value="no" ${selected(p.training?"yes":"no","no")}>Không</option></select></label><label class="field"><span>Số buổi tập / tuần</span><input name="trainingDays" type="number" min="0" max="7" value="${p.trainingDays}"></label></div>`;
 if(s===1)return `<div class="choice-intro"><span class="question-mark">02</span><h1>Có điều gì FiFi cần tránh không?</h1><p>Các thông tin này do m tự khai và có thể bỏ qua. FiFi sẽ loại món chứa nguyên liệu m chọn.</p></div>
 <div class="wizard-row"><label class="field"><span>Độ tuổi</span><select name="ageRange">${options(Object.entries(ageLabels),p.ageRange)}</select></label><label class="field"><span>Cân nặng (kg) · không bắt buộc</span><input name="weightKg" type="number" min="30" max="300" step="0.1" value="${esc(p.weightKg??"")}" placeholder="Để trống nếu không muốn chia sẻ"></label></div>
 <label class="field"><span>Có chỉ định dinh dưỡng riêng từ chuyên gia y tế không?</span><select name="healthFlag">${options(Object.entries(healthLabels),p.healthFlag)}</select></label>
 <div class="field"><span>Dị ứng hoặc không dùng được</span><div class="chip-grid">${ALLERGENS.map(a=>`<label class="chip-check"><input type="checkbox" name="allergens" value="${a}" ${checked(p.allergens.includes(a))}><span>${a}</span></label>`).join("")}</div></div>
 <p class="wizard-note">Nếu có bệnh lý, đang mang thai hoặc cần chế độ ăn theo chỉ định, hãy kiểm tra thực đơn với chuyên gia trước khi dùng. Tag dị ứng trong dữ liệu mẫu chưa được xác minh, không dùng FiFi để quyết định món nào an toàn khi dị ứng.</p>`;
 if(s===2)return `<div class="choice-intro"><span class="question-mark">03</span><h1>M muốn đạt bao nhiêu macro mỗi ngày?</h1><p>Nhập mục tiêu m đang theo. Kết quả sẽ hiển thị mức đạt được của từng ngày.</p></div>
 <div class="macro-grid wizard-macros">${[["kcal","Calories","kcal"],["protein","Protein","g"],["carbs","Carbs","g"],["fat","Fat","g"]].map(([key,title,unit])=>`<label class="field"><span>${title}</span><div class="suffix"><input name="${key}" type="number" min="1" value="${i[key]}" required><b>${unit}</b></div></label>`).join("")}</div><p class="wizard-note">Các số đang điền chỉ là ví dụ để thử app, không phải mức FiFi khuyến nghị riêng cho m.</p>`;
 if(s===3)return `<div class="choice-intro"><span class="question-mark">04</span><h1>M muốn ăn và nấu kiểu nào?</h1><p>Chọn cách chuẩn bị phù hợp với thời gian của m.</p></div>
 <div class="wizard-row"><label class="field"><span>Số bữa / ngày</span><select name="mealsPerDay">${options([["3","3 bữa"],["2","2 bữa chính"]],String(i.mealsPerDay))}</select></label><label class="field"><span>Cách chuẩn bị</span><select name="style">${options([["both","Kết hợp"],["prep","Ưu tiên meal prep"],["cook","Nấu ngay từng bữa"]],i.style)}</select></label></div>
 <label class="check"><input name="vegetarian" type="checkbox" ${checked(p.vegetarian)}> Chỉ chọn món chay</label>
 <details class="avoid-details"><summary>Nguyên liệu t không muốn ăn (tùy chọn)</summary><div class="chip-grid">${(state.catalog?.products||[]).filter(x=>x.enabled!==false).map(x=>`<label class="chip-check"><input type="checkbox" name="avoidProductIds" value="${esc(x.id)}" ${checked(p.avoidProductIds.includes(x.id))}><span>${esc(x.name)}</span></label>`).join("")}</div></details>`;
 return `<div class="choice-intro"><span class="question-mark">05</span><h1>Đi chợ cho mấy ngày, trong bao nhiêu tiền?</h1><p>FiFi tính tổng ngân sách cho cả kỳ và làm tròn giá mua theo từng gói hàng.</p></div>
 <label class="field"><span>Trung bình m muốn chi / ngày</span><div class="suffix budget-input"><input name="dailyBudget" type="number" min="30000" max="1000000" step="10000" value="${i.dailyBudget}" required><b>đ</b></div></label>
 <div class="wizard-row"><label class="field"><span>Thời gian</span><select name="days">${options([[1,"1 ngày"],[2,"2 ngày"],[3,"3 ngày"],[7,"1 tuần"]].map(x=>[String(x[0]),x[1]]),String(i.days))}</select></label><div class="budget-line final-budget"><span>Tổng ngân sách kỳ này</span><strong id="wizard-total">${money(i.days*i.dailyBudget)}</strong></div></div>
 <div class="privacy-box"><label class="check"><input name="consent" type="checkbox" ${checked(state.consent)}><span>Lưu hồ sơ và lịch sử thực đơn để dùng lại</span></label><p>Nếu chọn lưu, admin FiFi có thể xem câu trả lời và các kế hoạch của m. M có thể xóa dữ liệu đã lưu trong app. Không chọn vẫn tạo được thực đơn.</p></div><p class="wizard-note">Khu vực giá: TP.HCM · giá hiện là dữ liệu mẫu hoặc do admin nhập, chưa đồng bộ nhà bán.</p>`;
}
function renderWizard(){
 const s=state.step;
 $("#app").innerHTML=header("planner")+`<main class="wizard-shell"><section class="wizard-card"><div class="wizard-top"><div class="eyebrow">FIFI · LẬP THỰC ĐƠN THEO M</div><span>Bước ${s+1} / 5</span></div><div class="progress-track"><span style="width:${(s+1)*20}%"></span></div><div class="step-tags">${STEP_TITLES.map((x,n)=>`<span class="${n===s?"on":n<s?"done":""}">${x}</span>`).join("")}</div><form id="wizard-form">${wizardFields()}<div class="wizard-actions">${s?'<button type="button" id="wizard-back" class="button outline">← Quay lại</button>':""}<button class="button primary" type="submit">${s===4?"Tạo thực đơn":"Tiếp theo"} <span aria-hidden="true">→</span></button></div></form></section><aside class="wizard-side"><div class="side-plate">✳</div><div class="eyebrow">MỘT BẢN PLAN, NHIỀU THỨ ĐƯỢC GỠ RỐI</div><h2>Ăn đủ chất.<br>Đi chợ đúng ý.</h2><p>FiFi ghép mục tiêu macro, sở thích ăn uống và ngân sách để chọn món, gom nguyên liệu thành giỏ và hướng dẫn chuẩn bị.</p><div class="side-summary"><span>${goalLabels[state.profile.goal]}</span><span>${state.input.days} ngày</span><span>${money(state.input.dailyBudget)}/ngày</span></div></aside></main>`+foot();
 $("#wizard-form").addEventListener("submit",submitWizard);
 $("#wizard-back")?.addEventListener("click",()=>{readStep($("#wizard-form"));state.step--;renderWizard()});
 $("#wizard-form").addEventListener("input",()=>{const f=$("#wizard-form");if(f.elements.dailyBudget&&f.elements.days)$("#wizard-total").textContent=money(Number(f.elements.dailyBudget.value)*Number(f.elements.days.value))});
}
function readStep(f){
 const e=f.elements,s=state.step,p=state.profile,i=state.input;
 if(s===0){p.goal=e.goal.value;p.training=e.training.value==="yes";p.trainingDays=p.training?Number(e.trainingDays.value):0}
 if(s===1){p.ageRange=e.ageRange.value;p.weightKg=e.weightKg.value;p.healthFlag=e.healthFlag.value;p.allergens=[...f.querySelectorAll('[name="allergens"]:checked')].map(x=>x.value)}
 if(s===2){for(const k of ["kcal","protein","carbs","fat"])i[k]=Number(e[k].value)}
 if(s===3){i.mealsPerDay=Number(e.mealsPerDay.value);i.style=e.style.value;p.vegetarian=e.vegetarian.checked;p.avoidProductIds=[...f.querySelectorAll('[name="avoidProductIds"]:checked')].map(x=>x.value)}
 if(s===4){i.dailyBudget=Number(e.dailyBudget.value);i.days=Number(e.days.value);state.consent=e.consent.checked}
}
async function submitWizard(ev){
 ev.preventDefault();readStep(ev.currentTarget);
 if(state.step<4){state.step++;renderWizard();window.scrollTo(0,0);return}
 state.day=0;state.input.overrides={};await generate(state.consent);
}
function renderPlanner(){
 if(state.view!=="result"){renderWizard();return}
 $("#app").innerHTML=header("planner")+`<main class="results-shell"><div class="results-toolbar"><div><div class="eyebrow">KẾ HOẠCH CỦA M</div><h1>Món ngon vừa mục tiêu</h1><p>${goalLabels[state.profile.goal]} · ${state.profile.training?state.profile.trainingDays+" buổi tập/tuần":"Không tập luyện"} · ${state.consent?"Đã chọn lưu hồ sơ":"Không lưu hồ sơ"}</p></div><div class="results-actions"><button id="edit-plan" class="button outline">← Chỉnh câu trả lời</button>${state.consent?'<button id="save-plan" class="button outline">Lưu plan hiện tại</button>':""}</div></div>${state.profile.healthFlag==="specific"?'<div class="health-banner">M đã chọn “có chỉ định dinh dưỡng riêng”. FiFi chỉ tính macro và giá; hãy kiểm tra plan với chuyên gia y tế trước khi áp dụng.</div>':""}<div class="result-wrap">${result()}</div><div class="saved-data"><div><strong>Dữ liệu của m</strong><p>${state.own?.plans?.length||0} kế hoạch đã lưu trong tài khoản.</p></div><button id="delete-my-data" class="text-button">Xóa hồ sơ và lịch sử đã lưu</button></div></main>`+foot();
 $("#edit-plan").addEventListener("click",()=>{state.view="wizard";state.step=0;renderWizard()});
 $("#save-plan")?.addEventListener("click",()=>generate(true));
 $("#show-shopping")?.addEventListener("click",()=>$("#shopping")?.scrollIntoView({behavior:"smooth"}));
 document.querySelectorAll(".day-tabs button").forEach(b=>b.addEventListener("click",()=>{state.day=Number(b.dataset.day);renderPlanner()}));
 document.querySelectorAll(".swap").forEach(el=>el.addEventListener("change",async()=>{if(!el.value)return;state.input.overrides[el.dataset.day+":"+el.dataset.slot]=el.value;await generate(false)}));
 $("#delete-my-data").addEventListener("click",async()=>{if(!confirm("Xóa hồ sơ và toàn bộ lịch sử plan đã lưu?"))return;try{await requestJson("/api/me",{method:"DELETE"});state.own={profile:null,plans:[]};state.consent=false;showToast("Đã xóa dữ liệu đã lưu.");renderPlanner()}catch(e){showToast(e.message,true)}});
}
async function generate(save=false){
 try{
  const p=await requestJson("/api/plan",bodyOpts("POST",{...state.input,profile:state.profile,save:!!save,consent:!!save}));
  state.plan=p;state.view="result";state.error="";if(save){try{state.own=await requestJson("/api/me")}catch{}}
  renderPlanner();window.scrollTo(0,0);if(p.shopping.checkout>p.totalBudget)showToast("Giỏ hiện vượt ngân sách. Thử đổi món hoặc tăng ngân sách mẫu.",true);
 }catch(e){showToast(e.message,true)}
}
function adminNav(){
 const tabs=[["overview","Tổng quan"],["recipes","Công thức"],["products","Nguyên liệu & giá"],["sources","Nguồn API"],["customers","Người dùng"]];
 return `<nav class="admin-tabs" aria-label="Quản trị FiFi">${tabs.map(([id,label])=>`<button data-tab="${id}" class="${state.adminTab===id?"active":""}">${label}</button>`).join("")}</nav>`;
}
function adminOverview(){
 const count=state.customers.reduce((n,c)=>n+c.plans.length,0);
 return `<div class="dashboard-cards"><div><small>Người dùng đồng ý lưu</small><strong>${state.customers.length}</strong></div><div><small>Kế hoạch đã lưu</small><strong>${count}</strong></div><div><small>Công thức riêng</small><strong>${state.custom.length}</strong></div><div><small>Nguyên liệu</small><strong>${state.catalog?.products.length||0}</strong></div></div><div class="panel admin-explain"><h2>FiFi Studio</h2><p>Giá và dinh dưỡng đang ở bộ dữ liệu mẫu. M có thể sửa sản phẩm trong “Nguyên liệu & giá”; mọi kế hoạch tạo sau đó dùng giá mới. “Nguồn API” lưu cấu hình và cho biết trạng thái khóa, chưa tự động kéo dữ liệu khi chưa có hợp đồng dữ liệu và mapping.</p><p>Trang “Người dùng” chỉ hiện hồ sơ của người đã chủ động chọn lưu. Họ có thể tự xóa toàn bộ lịch sử.</p></div>`;
}
function adminRecipes(){
 return `<div class="admin-grid"><section class="panel"><h2>${state.editing?"Sửa công thức":"Thêm công thức"}</h2>${adminForm()}</section><section class="panel library"><div class="library-head"><h2>Món đã thêm</h2><span>${state.custom.length} món</span></div>${state.custom.length?state.custom.map(r=>`<article class="library-row"><div><strong>${esc(r.title)}</strong><small>${esc(slots[r.slot])} · ${r.prepMinutes+r.cookMinutes} phút · ${r.status==="published"?"Đã đăng":"Bản nháp"}</small></div><div><button data-edit="${esc(r.id)}">Sửa</button><button data-delete="${esc(r.id)}">Xóa</button></div></article>`).join(""):'<p class="empty-admin">Chưa có món riêng. Tám món mẫu vẫn hiện ở app người dùng.</p>'}</section></div>`;
}
function adminProducts(){
 const all=state.catalog?.products||[],r=state.productEditing||{};
 return `<div class="admin-grid"><section class="panel"><h2>${r.id?"Sửa nguyên liệu & giá":"Thêm nguyên liệu"}</h2><form id="product-form" class="admin-form">
 <div class="form-grid"><label class="field wide"><span>Tên nguyên liệu</span><input name="name" required value="${esc(r.name||"")}"></label><label class="field"><span>Nhóm</span><input name="category" required value="${esc(r.category||"Rau")}"></label><label class="field"><span>Khối lượng gói (g)</span><input name="packGrams" type="number" min="1" value="${r.packGrams||500}" required></label><label class="field"><span>Giá một gói (VND)</span><input name="priceVnd" type="number" min="0" value="${r.priceVnd??20000}" required></label><label class="field"><span>Ngày ghi nhận giá</span><input name="priceAsOf" value="${esc(r.priceAsOf||"06/10/2026")}"></label><label class="field wide"><span>Nguồn giá</span><input name="source" value="${esc(r.source||"Giá nhập thủ công TP.HCM")}"></label></div>
 <div class="section-caption">DINH DƯỠNG / 100G</div><div class="form-grid">${["kcal","protein","carbs","fat"].map(k=>`<label class="field"><span>${k}</span><input name="${k}" type="number" min="0" max="1000" step="0.01" value="${r.nutrition?.[k]??0}" required></label>`).join("")}</div>
 <div class="field"><span>Nhóm dị ứng liên quan</span><div class="chip-grid">${ALLERGENS.map(a=>`<label class="chip-check"><input name="allergens" type="checkbox" value="${a}" ${checked((r.allergens||[]).includes(a))}><span>${a}</span></label>`).join("")}</div></div>
 <label class="check"><input name="enabled" type="checkbox" ${checked(r.enabled!==false)}> Được dùng trong kế hoạch</label>
 <div class="admin-buttons"><button class="button primary" type="submit">${r.id?"Lưu sản phẩm":"Thêm sản phẩm"}</button>${r.id?'<button id="product-reset" class="button outline" type="button">Xóa bản chỉnh sửa / sản phẩm</button>':""}</div></form></section>
 <section class="panel library"><div class="library-head"><h2>Catalog TP.HCM</h2><span>${all.length} mặt hàng</span></div><div class="product-list">${all.map(p=>`<button class="product-row" data-product="${esc(p.id)}"><span><strong>${esc(p.name)}</strong><small>${esc(p.category)} · ${fmt(p.packGrams)}g · ${esc(p.source)}</small></span><b>${money(p.priceVnd)}</b></button>`).join("")}</div><button id="new-product" class="text-button">+ Thêm mặt hàng mới</button></section></div>`;
}
function adminSources(){
 return `<div class="source-grid">${state.sources.map(s=>`<section class="panel source-card"><div class="source-top"><h2>${esc(s.label)}</h2><span class="status-tag">${s.keyConfigured?"Đã có khóa":"Chưa có khóa"}</span></div><p>${s.provider==="dicho"?"Giá và sản phẩm đi chợ tại TP.HCM":"Tham chiếu dinh dưỡng trên 100g"}</p><p class="source-warning">Chế độ hiện tại: nhập thủ công. Chưa đồng bộ tự động.</p><form data-source="${s.provider}" class="admin-form"><label class="field"><span>Endpoint tham chiếu</span><input name="endpoint" type="url" value="${esc(s.endpoint)}" required></label><label class="field"><span>Ghi chú mapping / quyền truy cập</span><textarea name="note" rows="4">${esc(s.note)}</textarea></label><button class="button outline" type="submit">Lưu cấu hình nguồn</button></form><p class="source-help">API key chỉ đặt trong biến môi trường của web, không nhập vào trang này. Khi có key và đặc tả dữ liệu, mới triển khai đồng bộ thật.</p></section>`).join("")}</div>`;
}
function adminCustomers(){
 return `<div class="panel"><div class="library-head"><h2>Người dùng đồng ý lưu</h2><span>${state.customers.length} hồ sơ</span></div>
 <p class="admin-muted">Hồ sơ tự khai và toàn bộ lịch sử plan đã chọn lưu. Mỗi người có thể tự xóa dữ liệu.</p>
 ${state.customers.length?state.customers.map(c=>`<details class="customer-row"><summary><span><strong>${esc(c.email||"Tài khoản ẩn email")}</strong><small>${esc(goalLabels[c.profile.goal]||"Duy trì")} · ${c.profile.training?c.profile.trainingDays+" buổi tập/tuần":"Không tập"} · ${c.plans.length} plan</small></span><span>${esc(c.updatedAt.slice(0,10))}</span></summary>
 <div class="customer-detail"><p><b>Độ tuổi:</b> ${esc(ageLabels[c.profile.ageRange]||"Bỏ qua")} · <b>Cân nặng:</b> ${c.profile.weightKg?esc(c.profile.weightKg)+" kg":"Không cung cấp"}</p>
 <p><b>Lưu ý dinh dưỡng:</b> ${esc(healthLabels[c.profile.healthFlag]||"Bỏ qua")} · <b>Dị ứng/kiêng:</b> ${esc((c.profile.allergens||[]).join(", ")||"Không khai báo")}</p>
 <p><b>Tránh nguyên liệu:</b> ${esc((c.profile.avoidProductIds||[]).join(", ")||"Không")} · <b>Ăn chay:</b> ${c.profile.vegetarian?"Có":"Không"}</p><p><b>Đồng ý lưu:</b> ${esc(c.consentAt)}</p>
 <div class="customer-plans">${c.plans.map(x=>`<details class="customer-plan"><summary><strong>${esc(x.createdAt.slice(0,16).replace("T"," "))}</strong><span>${x.plan.days} ngày · ${money(x.input.dailyBudget)}/ngày · giỏ ${money(x.plan.shopping.checkout)} · mục tiêu P ${x.input.protein}g</span></summary>
 <div class="plan-detail">${x.plan.dayPlans.map(d=>`<p><b>Ngày ${d.day}:</b> ${d.meals.map(m=>esc(m.recipe.title)).join(" · ")} · ${Math.round(d.macros.kcal)} kcal · P ${Math.round(d.macros.protein)}g</p>`).join("")}<p><b>Giỏ đi chợ:</b> ${x.plan.shopping.items.map(i=>esc(i.name)+" × "+i.packs).join(", ")}</p></div></details>`).join("")}</div>
 <button data-customer-delete="${esc(c.userId)}" class="text-button">Xóa dữ liệu người này</button></div></details>`).join(""):'<p class="empty-admin">Chưa ai chọn lưu hồ sơ. App vẫn tạo plan không cần lưu.</p>'}</div>`;
}
function renderAdmin(){
 const allowed=state.admin?.allowed;
 $("#app").innerHTML=header("admin")+`<main class="admin-layout"><div class="admin-intro"><div class="eyebrow">FIFI STUDIO · QUẢN TRỊ</div><h1>Điều khiển FiFi</h1><p>Công thức, nguyên liệu, giá, nguồn dữ liệu và hồ sơ người dùng trong một nơi.</p></div>${!allowed?'<section class="admin-lock"><h2>Chỉ dành cho admin FiFi</h2><p>Đăng nhập bằng tài khoản được cấp quyền để quản lý dữ liệu.</p></section>':adminNav()+(state.adminTab==="overview"?adminOverview():state.adminTab==="recipes"?adminRecipes():state.adminTab==="products"?adminProducts():state.adminTab==="sources"?adminSources():adminCustomers())}</main>`+foot();
 if(!allowed)return;
 document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{state.adminTab=b.dataset.tab;renderAdmin()}));
 if(state.adminTab==="recipes")bindRecipesAdmin();
 if(state.adminTab==="products")bindProductsAdmin();
 if(state.adminTab==="sources")document.querySelectorAll("[data-source]").forEach(f=>f.addEventListener("submit",saveSource));
 if(state.adminTab==="customers")document.querySelectorAll("[data-customer-delete]").forEach(b=>b.addEventListener("click",()=>deleteCustomer(b.dataset.customerDelete)));
}
function bindRecipesAdmin(){
 $("#recipe-form").addEventListener("submit",saveRecipe);
 $("#add-ingredient").addEventListener("click",()=>{state.ingredientRows++;$("#ingredient-rows").insertAdjacentHTML("beforeend",ingredientRow(null,state.ingredientRows-1))});
 $("#ingredient-rows").addEventListener("click",e=>{if(e.target.matches(".remove-ing")&&$("#ingredient-rows").children.length>1)e.target.closest(".ingredient-row").remove()});
 $("#cancel-edit")?.addEventListener("click",()=>{state.editing=null;state.ingredientRows=1;renderAdmin()});
 document.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>{state.editing=state.custom.find(r=>r.id===b.dataset.edit);state.ingredientRows=state.editing.ingredients.length;renderAdmin();window.scrollTo(0,0)}));
 document.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",async()=>{const r=state.custom.find(x=>x.id===b.dataset.delete);if(!confirm("Xóa “"+r.title+"” khỏi thư viện?"))return;try{await requestJson("/api/admin/recipes",bodyOpts("DELETE",{id:r.id}));await loadAdmin();showToast("Đã xóa công thức.")}catch(e){showToast(e.message,true)}}));
}
function bindProductsAdmin(){
 $("#product-form").addEventListener("submit",saveProduct);
 document.querySelectorAll("[data-product]").forEach(b=>b.addEventListener("click",()=>{state.productEditing=state.catalog.products.find(p=>p.id===b.dataset.product);renderAdmin();window.scrollTo(0,0)}));
 $("#new-product").addEventListener("click",()=>{state.productEditing=null;renderAdmin();window.scrollTo(0,0)});
 $("#product-reset")?.addEventListener("click",async()=>{let p=state.productEditing;if(!confirm((p.id.startsWith("item-")?"Xóa mặt hàng":"Khôi phục mặt hàng mẫu")+" “"+p.name+"”?"))return;try{await requestJson("/api/admin/products",bodyOpts("DELETE",{id:p.id}));state.productEditing=null;await loadAdmin();showToast("Đã cập nhật catalog.")}catch(e){showToast(e.message,true)}});
}
async function saveProduct(ev){
 ev.preventDefault();const f=ev.currentTarget,e=f.elements;
 const payload={id:state.productEditing?.id,name:e.name.value,category:e.category.value,packGrams:Number(e.packGrams.value),priceVnd:Number(e.priceVnd.value),priceAsOf:e.priceAsOf.value,source:e.source.value,enabled:e.enabled.checked,allergens:[...f.querySelectorAll('[name="allergens"]:checked')].map(x=>x.value),nutrition:Object.fromEntries(["kcal","protein","carbs","fat"].map(k=>[k,Number(e[k].value)]))};
 try{await requestJson("/api/admin/products",bodyOpts(payload.id?"PUT":"POST",payload));state.productEditing=null;await loadAdmin();showToast("Đã lưu giá và dinh dưỡng.")}catch(err){showToast(err.message,true)}
}
async function saveSource(ev){
 ev.preventDefault();const f=ev.currentTarget;
 try{await requestJson("/api/admin/sources",bodyOpts("PUT",{provider:f.dataset.source,endpoint:f.elements.endpoint.value,note:f.elements.note.value}));await loadAdmin();showToast("Đã lưu cấu hình tham chiếu. Chưa bật đồng bộ API.")}catch(e){showToast(e.message,true)}
}
async function deleteCustomer(userId){
 if(!confirm("Xóa toàn bộ hồ sơ và lịch sử plan của người này?"))return;
 try{await requestJson("/api/admin/customers",bodyOpts("DELETE",{userId}));await loadAdmin();showToast("Đã xóa dữ liệu người dùng.")}catch(e){showToast(e.message,true)}
}
async function loadAdmin(){
 try{
  state.admin=await requestJson("/api/admin/session");
  if(state.admin.allowed){
   const [recipes,products,sources,customers]=await Promise.all([
    requestJson("/api/admin/recipes"),requestJson("/api/admin/products"),requestJson("/api/admin/sources"),requestJson("/api/admin/customers")
   ]);
   state.custom=recipes.recipes;state.catalog.products=products.products;state.sources=sources.sources;state.customers=customers.customers;
  }
  renderAdmin();
 }catch(e){showToast(e.message,true);$("#app").innerHTML=header("admin")+'<main class="admin-lock"><h2>Không tải được FiFi Studio</h2><p>'+esc(e.message)+'</p></main>'}
}
async function init(){
 try{state.catalog=await requestJson("/api/catalog")}catch(e){$("#app").innerHTML='<main class="admin-lock"><h2>Chưa tải được nguyên liệu</h2><p>'+esc(e.message)+'</p></main>';return}
 if(state.view==="admin"){await loadAdmin();return}
 try{state.own=await requestJson("/api/me");if(state.own.profile){for(const k of Object.keys(state.profile))if(k in state.own.profile)state.profile[k]=state.own.profile[k]}}catch{state.own={profile:null,plans:[]}}
 renderWizard();
}
init();
