// All demo services use a disposable database and isolated Next build folders.
const {spawn} = require('node:child_process');
const path = require('node:path');
const {mkdirSync,openSync,closeSync,writeFileSync} = require('node:fs');
const root = path.resolve(__dirname,'..');
const children=[];
const env={...process.env, API_PORT:'8258', TEST_STRIPE_SANDBOX:'0', YESPIZZ_FEATURE_TEST:'0', YESPIZZ_EXPANSION_PREVIEW:'0', YESPIZZ_DEMO_OUTPUT:'1', NEXT_PUBLIC_API_URL:'http://localhost:8258', NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:'', NEXT_DISABLE_WEBPACK_CACHE:'1', NODE_OPTIONS:'--max-old-space-size=1536'};
mkdirSync(path.join(root,'.qa/demo'),{recursive:true});
writeFileSync(path.join(root,'.qa/demo/runner.pid'),String(process.pid));
function start(name,args,cwd=root){
 const fd=openSync(path.join(root,'.qa/demo',`${name}.log`),'w');
 const child=spawn(process.execPath,args,{cwd,env,stdio:['ignore',fd,fd]});closeSync(fd);children.push(child);
 child.on('error',error=>{console.error(error);stop(1)});
 child.on('exit',code=>{if(!stopping){console.error(`${name} exited (${code}); see .qa/demo/${name}.log`);stop(1)}});
 return child;
}
let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;for(const child of children) child.kill('SIGTERM');setTimeout(()=>process.exit(code),1500);}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
async function ready(url){const deadline=Date.now()+180000;while(Date.now()<deadline){try{const response=await fetch(url,{signal:AbortSignal.timeout(2500)});await response.body?.cancel();if(response.ok)return;}catch{}await new Promise(resolve=>setTimeout(resolve,500));}throw new Error(`Timed out: ${url}`)}
(async()=>{
 start('api',['e2e/start-api.cjs']);
 await ready('http://localhost:8258/api/v1');
 const records=await require('./demo-scenarios.cjs')('http://localhost:8258');
 writeFileSync(path.join(root,'.qa/demo/orders.json'),JSON.stringify(records,null,2));
 for(const [workspace,port] of [['mobile',8251],['admin',8252],['courier-mobile',8253],['provider-panel',8284]]){
  start(workspace,[require.resolve('next/dist/bin/next'),'dev','--webpack','--port',String(port)],path.join(root,'apps',workspace));
  await ready(`http://localhost:${port}/login/`);
  const routes = {
    mobile: ['/home/', '/menu/', '/orders/', '/tracking/', '/rewards/', '/settings/', '/checkout/', '/payment/'],
    admin: ['/live/', '/config/'],
    'courier-mobile': ['/home/', '/home/batch/', '/home/order/', '/profile/'],
    'provider-panel': ['/kitchen/', '/batches/', '/operations/'],
  };
  for (const route of routes[workspace]) await ready(`http://localhost:${port}${route}`);
  console.log(`${workspace}: http://localhost:${port}`);
 }
 console.log('Demo ready. Stop with Ctrl+C. Orders reset on restart; no production data is used.');
})().catch(error=>{console.error(error);stop(1)});
