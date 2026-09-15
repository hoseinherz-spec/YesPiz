// Opt-in sample data for the isolated mock preview. Never used by production seed.
module.exports = async function expansionFixtures(uri) {
 const mongoose=require("mongoose"),db=await mongoose.createConnection(uri).asPromise();
 try{
  const customer=await db.collection("users").findOne({email:"customer@yespizz.local"});
  const sample=await db.collection("orders").findOne({customerId:customer._id,status:"COMPLETED"});
  if(sample){const {_id,...copy}=sample;await db.collection("orders").insertMany(Array.from({length:4},()=>({...copy,createdAt:new Date(),updatedAt:new Date()})));}
  await db.collection("users").updateOne({_id:customer._id},{$set:{creditCents:700},$push:{creditEntries:{key:"preview:credit",amountCents:700,orderId:"",at:new Date()}}});
  await db.collection("delivery_slots").insertMany([2,3,4].map(hours=>({startsAt:new Date(Date.now()+hours*3600000),endsAt:new Date(Date.now()+hours*3600000+1800000),capacityUnits:20,maxOrders:5,leadMinutes:45,createdAt:new Date(),updatedAt:new Date()})));
 }finally{await db.close();}
};
