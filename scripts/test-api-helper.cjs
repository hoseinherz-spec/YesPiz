const {readFileSync}=require('node:fs');
const assert=require('node:assert/strict');
const ts=require('typescript');
const mod={exports:{}};
new Function('exports','require','module',ts.transpileModule(readFileSync(require('node:path').join(__dirname,'../packages/api/src/core/api-helper.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(mod.exports,require,mod);
const {apiRequest}=mod.exports;
(async()=>{
 global.fetch=async()=>new Response(JSON.stringify({message:['Email invalid','Password required']}),{status:400,headers:{'content-type':'application/json'}});
 await assert.rejects(apiRequest('/test'),e=>e.status===400&&e.message==='Email invalid. Password required');
 global.fetch=async()=>{throw new TypeError('fetch failed')};
 await assert.rejects(apiRequest('/test'),e=>e.status===0&&e.message.includes('Check your connection'));
 global.fetch=async(_,options)=>new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(options.signal.reason)));
 await assert.rejects(apiRequest('/test',{timeoutMs:10}),/timed out/);
 console.log('PASS: validation messages, offline error, bounded request timeout');
})();
