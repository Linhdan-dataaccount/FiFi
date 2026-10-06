import http from "node:http";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import worker from "../dist/server/index.js";

const sqlite=new DatabaseSync(":memory:");
for(const name of ["0000_fifi_recipes.sql","0001_fifi_catalog_users.sql"])
  sqlite.exec(readFileSync(new URL("../drizzle/"+name,import.meta.url),"utf8"));
const DB={
  prepare(query){
    const statement=sqlite.prepare(query);
    return {args:[],bind(...args){this.args=args;return this},
      async all(){return {results:statement.all(...this.args)}},
      async first(){return statement.get(...this.args)||null},
      async run(){return statement.run(...this.args)}};
  },
  async batch(statements){for(const statement of statements)await statement.run()}
};
const env={DB,FIFI_ADMIN_EMAILS:"admin@example.com"};
const server=http.createServer(async(req,res)=>{
  try{
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    const headers=new Headers(req.headers);
    headers.set("oai-authenticated-user-id","local-preview-user");
    headers.set("oai-authenticated-user-email","admin@example.com");
    const response=await worker.fetch(new Request("http://127.0.0.1:4177"+req.url,{
      method:req.method,headers,body:chunks.length?Buffer.concat(chunks):undefined
    }),env);
    res.writeHead(response.status,Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  }catch(error){console.error(error);res.writeHead(500);res.end("Preview error")}
});
server.listen(4177,"127.0.0.1",()=>console.log("FiFi local preview: http://127.0.0.1:4177"));

