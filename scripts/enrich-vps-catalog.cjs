// Run from /app inside the API container; uses validated catalog services.
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('/app/apps/api/dist/app.module');
const { CatalogService } = require('/app/apps/api/dist/catalog/catalog.service');
const { IngredientsService } = require('/app/apps/api/dist/catalog/ingredients.service');
async function main() {
 const app = await NestFactory.createApplicationContext(AppModule, {logger:['error','warn']});
 try {
 const catalog=app.get(CatalogService), library=app.get(IngredientsService);
 const current=await catalog.getPublishedMenu();
 if(!current.version || current.items.filter(x=>x.productType==='pizza').length!==10) throw Error('Expected existing ten-pizza menu');
 if(current.items.filter(x=>x.productType==='pizza').every(x=>Object.keys(x.attributes??{}).length===6 && x.ingredientDetails?.length && x.ingredientOptions?.length)) { console.log('Published pizzas already enriched; no changes.'); return; }
 const extras=[['Mozzarella',150,40],['Mushrooms',100,30],['Peppers',100,25],['Red onion',80,20],['Olives',100,20],['Pepperoni',200,30],['Chicken',250,40],['Fresh basil',50,3],['Jalapeño',100,15],['Cherry tomatoes',100,30]];
 const names=[...new Set(['Pizza dough',...current.items.filter(x=>x.productType==='pizza').flatMap(x=>x.ingredients),...extras.map(x=>x[0])])];
 const existing=await library.list(), ids=new Map(existing.map(x=>[x.name,x.id]));
 for(const name of names) if(!ids.has(name)) {
  const row=await library.create({name,slug:name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/-$/,''),description:`Ingredient used in YesPizz pizza recipes: ${name}.`,image:''}); ids.set(name,row.id);
 }
 const draft=await catalog.cloneVersion(current.version.id);
 const detail=await catalog.getVersionDetail(draft.id);
 for(const item of detail.items.filter(x=>x.productType==='pizza')) {
 const names=[...item.ingredients];
 if(item.name==='Vegetariana'&&!names.includes('Cherry tomatoes')) names.push('Cherry tomatoes');
 const weight=name=>name==='Pizza dough'?250:/tomato|sauce/i.test(name)?70:/mozzarella|fior/i.test(name)?80:/cheese|gorgonzola|parmesan|fontina|burrata/i.test(name)?35:/basil|oregano|parsley|flakes|truffle/i.test(name)?3:/oil|garlic|honey/i.test(name)?5:30;
 const options=[...new Set([...names,...extras.map(x=>x[0])])].filter(name=>!['Tomato','San Marzano tomato','BBQ sauce','Olive oil'].includes(name)).map(name=>({ingredientId:ids.get(name),priceCents:extras.find(x=>x[0]===name)?.[1]??150,portionGrams:extras.find(x=>x[0]===name)?.[2]??weight(name)}));
 await catalog.updateItem(item.id,{
 attributes:{shape:'round',doughThickness:'thin',baseCrispiness:'crispy',innerTexture:'airy',crustType:'puffy',spiceLevel:item.name==='Diavola'?3:item.name==='Pepperoni'?1:0},attributesSchemaVersion:1,
 ingredients:names,ingredientIds:names.map(name=>ids.get(name)),ingredientOptions:options,
 recipeIngredients:['Pizza dough',...names].map(name=>({name,weightGrams:weight(name)})),recipeRevision:1,
 });
 }
 await catalog.publish(draft.id);
 const final=await catalog.getPublishedMenu();
 for(const x of final.items.filter(x=>x.productType==='pizza')) if(Object.keys(x.attributes).length!==6 || !x.ingredientDetails.length || !x.ingredientOptions.length)throw Error('Incomplete '+x.name);
 console.log(JSON.stringify({previousVersion:current.version.id,publishedVersion:final.version,ingredients:(await library.list()).length,pizzas:final.items.filter(x=>x.productType==='pizza').map(x=>({name:x.name,attributes:x.attributes,ingredients:x.ingredientDetails.length,toppings:x.ingredientOptions.length}))},null,2));
 } finally {await app.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
