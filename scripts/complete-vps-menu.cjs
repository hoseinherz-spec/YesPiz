// Run inside the API container after staging current food images in the gateway.
const {NestFactory}=require('@nestjs/core');
const {getModelToken}=require('@nestjs/mongoose');
const {AppModule}=require('/app/apps/api/dist/app.module');
const {CatalogService}=require('/app/apps/api/dist/catalog/catalog.service');
const {IngredientsService}=require('/app/apps/api/dist/catalog/ingredients.service');
const {priceCustomization}=require('/app/apps/api/dist/catalog/customization');
const {selectedRecipe}=require('/app/apps/api/dist/catalog/recipe-coverage');
const origin='http://185.105.239.140:8051';
const option=(id,name,priceCents)=>({id,name,priceCents,isActive:true,variantIds:[]});
async function main(){
 const app=await NestFactory.createApplicationContext(AppModule,{logger:['error','warn']});
 try {
 const catalog=app.get(CatalogService),lib=app.get(IngredientsService),model=app.get(getModelToken('MenuItem'));
 const menu=await catalog.getPublishedMenu();
 if(menu.items.filter(x=>x.productType==='pizza').every(x=>x.customization?.variants.length===3)&&menu.items.filter(x=>x.productType==='combo').every(x=>x.allergens.length&&x.ingredients.length)){console.log('Menu already complete');return;}
 const ingredients=await lib.list(); const ids=new Map(ingredients.map(x=>[x.name,x.id]));
 for(const name of ['Garlic dip','Chili oil'])if(!ids.has(name)){const x=await lib.create({name,slug:name.toLowerCase().replace(/ /g,'-'),description:`Optional ${name.toLowerCase()} side portion.`,image:''});ids.set(name,x.id);}
 const draft=await app.get(getModelToken("MenuVersion")).findOne({menuId:menu.version.menuId,version:menu.version.version+1,published:false}).exec() || await catalog.cloneVersion(menu.version.id);
 const items=await model.find({menuVersionId:draft._id,deletedAt:null}).exec();
 for(const item of items.filter(x=>x.productType==='pizza')){
  const medium=item.recipeIngredients.map(x=>({name:x.name,weightGrams:x.weightGrams}));
  if(!medium.length)throw Error('Missing measured recipe: '+item.name);
  const customization={variants:[{id:'small',name:'Small',priceCents:item.priceCents-200,isActive:true},{id:'medium',name:'Medium',priceCents:item.priceCents,isActive:true},{id:'large',name:'Large',priceCents:item.priceCents+300,isActive:true}],groups:[
   {id:'dough',name:'Dough',min:0,max:1,options:[option('thick','Thick dough',100)]},
   {id:'crust',name:'Crust',min:0,max:1,options:[option('cheese','Mozzarella-stuffed crust',200)]},
   {id:'sauce',name:'Sauce on the side',min:0,max:1,options:[option('garlic','Garlic dip',100),option('bbq','BBQ dip',100),option('chili','Chili oil',80)]},
  ]};
  const recipeChoices=[...customization.variants.map(v=>({kind:'variant',key:v.id,ingredients:medium.map(x=>({name:x.name,weightGrams:Math.round(x.weightGrams*(v.id==='small'?.75:v.id==='large'?1.3:1)*10)/10}))})),
   {kind:'option',key:'dough/thick',ingredients:[{name:'Pizza dough',weightGrams:80}]},
   {kind:'option',key:'crust/cheese',ingredients:[{name:'Mozzarella',weightGrams:40}]},
   {kind:'option',key:'sauce/garlic',ingredients:[{name:'Garlic dip',weightGrams:30}]},
   {kind:'option',key:'sauce/bbq',ingredients:[{name:'BBQ sauce',weightGrams:30}]},
   {kind:'option',key:'sauce/chili',ingredients:[{name:'Chili oil',weightGrams:10}]},
  ];
  const slug=item.name.toLowerCase().replace(/ /g,'-');
  const gallery=[`${origin}/images/pizza-cutouts/${slug}.webp`,`${origin}${item.imageUrl}`];
  const cookTimeSeconds=item.tags.includes('premium')?600:480;
  await catalog.updateItem(item.id,{ingredientOptions:item.ingredientOptions.map(o=>({ingredientId:o.ingredientId,priceCents:o.priceCents,portionGrams:o.portionGrams,...(o.toppingImageUrl?{toppingImageUrl:o.toppingImageUrl}:{})})),customization,recipeIngredients:medium,recipeChoices,recipeRevision:2,cookTimeSeconds,toppingBaseImageUrl:`${origin}/images/toppings/pizza-neutral-base.png`,presentation:{gallery,fields:[
   {name:'Cooking time',type:'text',value:`${cookTimeSeconds/60} min`,visibility:'public'},
   {name:'Size guide',type:'text',value:'Small 24 cm · Medium 30 cm · Large 36 cm',visibility:'public'},
   {name:'Recipe notes',type:'text',value:'Thin dough and a plain crust are standard. Thick dough, stuffed crust and a side sauce are optional.',visibility:'public'},
   {name:'Data source',type:'text',value:'Sample catalog configuration; prices, portions and cooking times require kitchen review before live service.',visibility:'internal'},
  ],availability:{enabled:false,timezone:'Europe/Berlin',periods:[],closedDates:[]}}});
 }
 const refreshed=await model.find({menuVersionId:draft._id,productType:'pizza'}).exec();const byId=new Map(refreshed.map(x=>[x.id,x]));
 for(const combo of items.filter(x=>x.productType==='combo')){
  const members=combo.comboComponents.map(c=>({item:byId.get(c.menuItemId),quantity:c.quantity}));if(members.some(x=>!x.item))throw Error('Missing combo member');
  const names=[...new Set(members.flatMap(x=>x.item.ingredients))];
  const allergens=[...new Set(members.flatMap(x=>x.item.allergens))];
  const totals=new Map();for(const {item,quantity}of members)for(const x of item.recipeIngredients)totals.set(x.name,(totals.get(x.name)||0)+x.weightGrams*quantity);
  const gallery=[...new Set(members.map(x=>`${origin}${x.item.imageUrl}`))];
  await catalog.updateItem(combo.id,{ingredientOptions:[],ingredients:names,ingredientIds:names.map(n=>ids.get(n)),allergens,recipeIngredients:[...totals].map(([name,weightGrams])=>({name,weightGrams})),recipeRevision:2,cookTimeSeconds:Math.max(...members.map(x=>x.item.cookTimeSeconds)),comboComponents:members.map(({item,quantity})=>({menuItemId:item.id,variantId:'medium',quantity})),presentation:{gallery,fields:[{name:'Contents',type:'text',value:members.map(x=>`${x.quantity} × ${x.item.name} (Medium)`).join(' · '),visibility:'public'}],availability:{enabled:false,timezone:'Europe/Berlin',periods:[],closedDates:[]}}});
 }
 const full=await model.find({menuVersionId:draft._id}).exec();let checked=0;
 for(const item of full.filter(x=>x.productType==='pizza'))for(const v of item.customization.variants){
  for(const selections of [[],[{groupId:'dough',optionIds:['thick']},{groupId:'crust',optionIds:['cheese']},{groupId:'sauce',optionIds:['garlic']}],[{groupId:'sauce',optionIds:['bbq']}],[{groupId:'sauce',optionIds:['chili']}]] ){
   const priced=priceCustomization(item.customization,v.id,selections);const recipe=selectedRecipe(item,'medium',[],v.id,selections);
   if(!recipe.complete||priced.unitPriceCents<v.priceCents||recipe.ingredients.some(x=>x.weightGrams<=0))throw Error('Invalid size/options: '+item.name);checked++;
  }
 }
 await catalog.publish(draft.id);
 console.log(JSON.stringify({previousVersion:menu.version,publishedVersion:(await catalog.getPublishedMenu()).version,pizzas:refreshed.length,combos:items.filter(x=>x.productType==='combo').length,verifiedSizeAndOptionRecipes:checked,ingredients:(await lib.list()).length},null,2));
 }finally{await app.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
