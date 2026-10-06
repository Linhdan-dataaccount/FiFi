const SAMPLE_DATE = "06/10/2026";
const PRODUCTS = [
  {id:"chicken",name:"Ức gà",category:"Thịt",packGrams:500,priceVnd:59000,nutrition:{kcal:120,protein:22.5,carbs:0,fat:2.6},source:"Giá mẫu TP.HCM"},
  {id:"rice",name:"Gạo trắng (khô)",category:"Ngũ cốc",packGrams:1000,priceVnd:28000,nutrition:{kcal:365,protein:7,carbs:80,fat:0.7},source:"Giá mẫu TP.HCM"},
  {id:"broccoli",name:"Bông cải xanh",category:"Rau",packGrams:400,priceVnd:22000,nutrition:{kcal:34,protein:2.8,carbs:6.6,fat:0.4},source:"Giá mẫu TP.HCM"},
  {id:"carrot",name:"Cà rốt",category:"Rau",packGrams:500,priceVnd:16000,nutrition:{kcal:41,protein:0.9,carbs:9.6,fat:0.2},source:"Giá mẫu TP.HCM"},
  {id:"oil",name:"Dầu ăn",category:"Gia vị",packGrams:920,priceVnd:50000,nutrition:{kcal:884,protein:0,carbs:0,fat:100},source:"Giá mẫu TP.HCM"},
  {id:"yogurt",name:"Sữa chua Hy Lạp không đường",category:"Sữa",packGrams:400,priceVnd:56000,nutrition:{kcal:90,protein:9,carbs:4,fat:4},source:"Giá mẫu TP.HCM"},
  {id:"oats",name:"Yến mạch",category:"Ngũ cốc",packGrams:500,priceVnd:42000,nutrition:{kcal:389,protein:16.9,carbs:66.3,fat:6.9},source:"Giá mẫu TP.HCM"},
  {id:"banana",name:"Chuối",category:"Trái cây",packGrams:1000,priceVnd:26000,nutrition:{kcal:89,protein:1.1,carbs:22.8,fat:0.3},source:"Giá mẫu TP.HCM"},
  {id:"milk",name:"Sữa tươi ít đường",category:"Sữa",packGrams:1000,priceVnd:32000,nutrition:{kcal:60,protein:3.2,carbs:5,fat:3.3},source:"Giá mẫu TP.HCM"},
  {id:"peanut",name:"Bơ đậu phộng",category:"Gia vị",packGrams:340,priceVnd:68000,nutrition:{kcal:588,protein:25,carbs:20,fat:50},source:"Giá mẫu TP.HCM"},
  {id:"egg",name:"Trứng gà (phần ăn được)",category:"Trứng",packGrams:500,priceVnd:35000,nutrition:{kcal:143,protein:12.6,carbs:0.7,fat:9.5},source:"Giá mẫu TP.HCM"},
  {id:"bread",name:"Bánh mì nguyên cám",category:"Ngũ cốc",packGrams:400,priceVnd:38000,nutrition:{kcal:247,protein:13,carbs:41,fat:4.2},source:"Giá mẫu TP.HCM"},
  {id:"cucumber",name:"Dưa leo",category:"Rau",packGrams:500,priceVnd:16000,nutrition:{kcal:15,protein:0.7,carbs:3.6,fat:0.1},source:"Giá mẫu TP.HCM"},
  {id:"tofu",name:"Đậu hũ cứng",category:"Đậu",packGrams:300,priceVnd:14000,nutrition:{kcal:110,protein:11,carbs:2.5,fat:6.5},source:"Giá mẫu TP.HCM"},
  {id:"mushroom",name:"Nấm bào ngư",category:"Rau",packGrams:200,priceVnd:21000,nutrition:{kcal:33,protein:3.3,carbs:6.1,fat:0.4},source:"Giá mẫu TP.HCM"},
  {id:"tuna",name:"Cá ngừ hộp (phần ráo nước)",category:"Cá",packGrams:150,priceVnd:39000,nutrition:{kcal:116,protein:25,carbs:0,fat:1},source:"Giá mẫu TP.HCM"},
  {id:"pasta",name:"Mì Ý (khô)",category:"Ngũ cốc",packGrams:500,priceVnd:32000,nutrition:{kcal:371,protein:13,carbs:74.7,fat:1.5},source:"Giá mẫu TP.HCM"},
  {id:"tomato",name:"Cà chua",category:"Rau",packGrams:500,priceVnd:19000,nutrition:{kcal:18,protein:0.9,carbs:3.9,fat:0.2},source:"Giá mẫu TP.HCM"},
  {id:"beef",name:"Thịt bò nạc",category:"Thịt",packGrams:500,priceVnd:98000,nutrition:{kcal:155,protein:21,carbs:0,fat:7},source:"Giá mẫu TP.HCM"},
  {id:"spinach",name:"Rau bó xôi",category:"Rau",packGrams:300,priceVnd:18000,nutrition:{kcal:23,protein:2.9,carbs:3.6,fat:0.4},source:"Giá mẫu TP.HCM"},
  {id:"lettuce",name:"Xà lách",category:"Rau",packGrams:300,priceVnd:17000,nutrition:{kcal:15,protein:1.4,carbs:2.9,fat:0.2},source:"Giá mẫu TP.HCM"},
  {id:"wrap",name:"Bánh tortilla",category:"Ngũ cốc",packGrams:270,priceVnd:49000,nutrition:{kcal:310,protein:8,carbs:52,fat:8},source:"Giá mẫu TP.HCM"},
];

const photo = {
  chicken:"https://images.unsplash.com/photo-1762631383628-77f92d18b184?auto=format&fit=crop&w=900&q=82",
  oats:"https://images.unsplash.com/photo-1670843839025-d50924a51f31?auto=format&fit=crop&w=900&q=82",
  tofu:"https://images.unsplash.com/photo-1644527199925-a8a596b22ff7?auto=format&fit=crop&w=900&q=82",
};
const SAMPLE_RECIPES = [
  {id:"oat-yogurt",title:"Yến mạch sữa chua & chuối",slot:"breakfast",mode:"prep",servings:1,prepMinutes:8,cookMinutes:0,ingredients:[{productId:"yogurt",grams:180},{productId:"oats",grams:60},{productId:"banana",grams:100},{productId:"milk",grams:100},{productId:"peanut",grams:12}],steps:["Trộn yến mạch với sữa và sữa chua.","Thêm chuối cắt lát cùng bơ đậu phộng khi ăn."],image:photo.oats,imageCredit:"Ảnh minh họa: Joanna Stołowicz / Unsplash",sourceUrl:"https://unsplash.com/photos/a-bowl-of-yogurt-with-strawberries-on-top-Qze7zeiMz0A",status:"published",vegetarian:true},
  {id:"egg-toast",title:"Bánh mì trứng & rau",slot:"breakfast",mode:"cook",servings:1,prepMinutes:6,cookMinutes:8,ingredients:[{productId:"egg",grams:120},{productId:"bread",grams:90},{productId:"cucumber",grams:100},{productId:"yogurt",grams:80}],steps:["Làm chín trứng theo ý thích.","Ăn cùng bánh mì, dưa leo và sữa chua."],image:photo.oats,imageCredit:"Ảnh minh họa món sáng: Joanna Stołowicz / Unsplash",sourceUrl:"https://unsplash.com/photos/a-bowl-of-yogurt-with-strawberries-on-top-Qze7zeiMz0A",status:"published",vegetarian:true},
  {id:"chicken-rice",title:"Cơm gà & bông cải",slot:"lunch",mode:"prep",servings:1,prepMinutes:12,cookMinutes:20,ingredients:[{productId:"chicken",grams:180},{productId:"rice",grams:75},{productId:"broccoli",grams:150},{productId:"carrot",grams:60},{productId:"oil",grams:8}],steps:["Nấu gạo theo lượng khô đã cân.","Áp chảo ức gà đến khi chín; luộc hoặc hấp rau.","Chia cùng cơm thành một phần ăn."],image:photo.chicken,imageCredit:"Ảnh minh họa: joe boshra / Unsplash",sourceUrl:"https://unsplash.com/photos/healthy-chicken-and-rice-bowl-with-fresh-vegetables-tB2MPTiSrsg",status:"published",vegetarian:false},
  {id:"tofu-rice",title:"Cơm đậu hũ & nấm",slot:"lunch",mode:"cook",servings:1,prepMinutes:10,cookMinutes:18,ingredients:[{productId:"tofu",grams:240},{productId:"rice",grams:75},{productId:"mushroom",grams:120},{productId:"carrot",grams:80},{productId:"oil",grams:8}],steps:["Nấu gạo theo lượng khô đã cân.","Áp chảo đậu hũ, xào nấm và cà rốt.","Ăn cùng cơm; nêm gia vị sẵn có theo khẩu vị."],image:photo.tofu,imageCredit:"Ảnh minh họa: Healthy Bowl / Unsplash",sourceUrl:"https://unsplash.com/photos/a-plate-of-food-with-rice-and-vegetables-CULeu3m_tXo",status:"published",vegetarian:true},
  {id:"tuna-pasta",title:"Mì Ý cá ngừ cà chua",slot:"lunch",mode:"cook",servings:1,prepMinutes:8,cookMinutes:16,ingredients:[{productId:"tuna",grams:130},{productId:"pasta",grams:85},{productId:"tomato",grams:180},{productId:"oil",grams:8}],steps:["Luộc mì từ lượng mì khô đã cân.","Làm nóng cà chua với cá ngừ, trộn cùng mì."],image:photo.chicken,imageCredit:"Ảnh minh họa bữa chính: joe boshra / Unsplash",sourceUrl:"https://unsplash.com/photos/healthy-chicken-and-rice-bowl-with-fresh-vegetables-tB2MPTiSrsg",status:"published",vegetarian:false},
  {id:"chicken-wrap",title:"Wrap gà & xà lách",slot:"dinner",mode:"cook",servings:1,prepMinutes:10,cookMinutes:12,ingredients:[{productId:"chicken",grams:160},{productId:"wrap",grams:90},{productId:"lettuce",grams:80},{productId:"yogurt",grams:60},{productId:"tomato",grams:100}],steps:["Làm chín gà và cắt miếng vừa ăn.","Trải rau, cà chua, gà và sữa chua lên bánh; cuộn lại."],image:photo.chicken,imageCredit:"Ảnh minh họa bữa gà: joe boshra / Unsplash",sourceUrl:"https://unsplash.com/photos/healthy-chicken-and-rice-bowl-with-fresh-vegetables-tB2MPTiSrsg",status:"published",vegetarian:false},
  {id:"egg-tofu",title:"Trứng đậu hũ & cơm",slot:"dinner",mode:"prep",servings:1,prepMinutes:10,cookMinutes:17,ingredients:[{productId:"egg",grams:110},{productId:"tofu",grams:180},{productId:"rice",grams:65},{productId:"spinach",grams:120},{productId:"oil",grams:6}],steps:["Nấu cơm bằng lượng gạo khô đã cân.","Làm chín trứng và đậu hũ với rau bó xôi.","Chia thành phần ăn cùng cơm."],image:photo.tofu,imageCredit:"Ảnh minh họa bữa đậu hũ: Healthy Bowl / Unsplash",sourceUrl:"https://unsplash.com/photos/a-plate-of-food-with-rice-and-vegetables-CULeu3m_tXo",status:"published",vegetarian:true},
  {id:"beef-rice",title:"Cơm bò & rau",slot:"dinner",mode:"cook",servings:1,prepMinutes:12,cookMinutes:18,ingredients:[{productId:"beef",grams:150},{productId:"rice",grams:75},{productId:"spinach",grams:150},{productId:"carrot",grams:70},{productId:"oil",grams:8}],steps:["Nấu cơm từ gạo khô.","Xào bò và rau đến khi chín, ăn cùng cơm."],image:photo.chicken,imageCredit:"Ảnh minh họa bữa cơm: joe boshra / Unsplash",sourceUrl:"https://unsplash.com/photos/healthy-chicken-and-rice-bowl-with-fresh-vegetables-tB2MPTiSrsg",status:"published",vegetarian:false},
];

const productById = Object.fromEntries(PRODUCTS.map(p => [p.id,p]));
const vnd = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "đ";
function recipeMacro(r) {
  return r.ingredients.reduce((m,i) => {
    const p=productById[i.productId]; if(!p) return m;
    const k=i.grams/100/r.servings;
    return {kcal:m.kcal+p.nutrition.kcal*k,protein:m.protein+p.nutrition.protein*k,carbs:m.carbs+p.nutrition.carbs*k,fat:m.fat+p.nutrition.fat*k};
  },{kcal:0,protein:0,carbs:0,fat:0});
}
function recipeConsumedCost(r) {
  return r.ingredients.reduce((sum,i)=>sum+(productById[i.productId]?.priceVnd??0)*i.grams/(productById[i.productId]?.packGrams??1)/r.servings,0);
}
