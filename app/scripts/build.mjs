import {readFile,writeFile,mkdir,cp,rm} from "node:fs/promises";
import {resolve} from "node:path";
const root=resolve(import.meta.dirname,".."),out=resolve(root,"dist");
await rm(out,{recursive:true,force:true});
await mkdir(resolve(out,"server"),{recursive:true});
await mkdir(resolve(out,".openai"),{recursive:true});
const [data,logic,index,client,css,logo]=await Promise.all([
  "data.js","logic.js","index.js","client.js","style.css","logo.png"
].map(name=>readFile(resolve(root,"worker",name),name.endsWith(".png")?undefined:"utf8")));
const filled=index.replace("__CLIENT_JSON__",JSON.stringify(client))
  .replace("__CSS_JSON__",JSON.stringify(css))
  .replace("__LOGO_BASE64__",logo.toString("base64"));
await writeFile(resolve(out,"server/index.js"),data+"\n"+logic+"\n"+filled);
await cp(resolve(root,".openai/hosting.json"),resolve(out,".openai/hosting.json"));
await cp(resolve(root,"drizzle"),resolve(out,"drizzle"),{recursive:true});
console.log("Built FiFi Worker and D1 migration");
