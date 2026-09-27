// Build demo records through the public business API; never fabricate status or wallet balances.
const { randomUUID } = require('node:crypto');
// A 1x1 transparent PNG: the smallest valid proof photo the media API accepts.
const READY_PHOTO_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
module.exports = async function scenarios(base) {
  const api = async (route, token, data, method = data === undefined ? 'GET' : 'POST') => {
    const response = await fetch(`${base}/api/v1/${route}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {}) }, ...(data === undefined ? {} : {body: JSON.stringify(data)}) });
    const result = await response.json();
    if (!response.ok) throw new Error(`${method} ${route}: ${response.status} ${JSON.stringify(result)}`);
    return result;
  };
  const login = async (role, email, password) => api(`account/auth/${role}/login`, null, {method:'password', email, password});
  const admin = await login('admin','admin@yespizz.local','Admin123!');
  const kitchen = await login('provider','provider.munich@yespizz.local','Provider123!');
  const customer = await login('client','customer@yespizz.local','Customer123!');
  const rider = await login('courier','courier@yespizz.local','Courier123!');
  const provider = await api('providers/me/profile', kitchen.accessToken);
  const providerId = provider.id || provider._id;
  const riderId = rider.user.id || rider.user._id;
  await api('app-config',admin.accessToken,{bidWindowSeconds:60},'PATCH');
  const code = await api('couriers/sessions/code',admin.accessToken,{courierId:riderId, action:'start'});
  await api('couriers/sessions/start',rider.accessToken,{code:code.code});
  for (const vehicle of ['car', 'motorcycle']) {
    const email = `courier.${vehicle}@yespizz.local`;
    const invite = await api('account/admin/invites', admin.accessToken, {role:'courier', email});
    const invited = await api('account/auth/invites/accept', null, {token:invite.token, firstName:vehicle === 'car' ? 'Alex' : 'Sam', lastName:'Courier', email, password:'Courier123!'});
    const token = invited.accessToken;
    const courierId = invited.user.id || invited.user._id;
    await api('couriers/me',token,{vehicleType:vehicle, vehicleModel:vehicle === 'car' ? 'White compact car' : 'Blue city motorcycle'},'PATCH');
    const shift = await api('couriers/sessions/code',admin.accessToken,{courierId,action:'start'});
    await api('couriers/sessions/start',token,{code:shift.code});
  }
  const menu = await api('catalog/menu');
  const pizzas = menu.items.filter(item => !item.comboComponents?.length && item.isActive !== false);
  if (!pizzas.length) throw new Error('Publish at least one pizza before building demo orders.');
  const addresses = await api('orders/addresses',customer.accessToken);
  const address = addresses[0];
  const addressId = address.id || address._id;
  const records = [];
  const recordsLines = new Map();
  async function order(stage, quantity=1, couponCode) {
    const chosen = Array.from({length:quantity},(_,index)=>pizzas[(records.length + index) % pizzas.length].id);
    const created = await api('orders', customer.accessToken, {menuVersion:menu.version.version, addressId, paymentMethod:'cash', idempotencyKey:randomUUID(), lines:chosen.map(id=>({menuItemId:id,quantity:1})), ...(couponCode ? {couponCode} : {})});
    const id = created.id || created._id;
    recordsLines.set(id, chosen);
    if (stage === 'cancelled') {
      await api('payments/cancel-order',customer.accessToken,{orderId:id,reason:'Plans changed'});
      records.push({stage,id,totalCents:created.totalCents});
      return;
    }
    if (stage !== 'unpaid') await api('payments/initiate',customer.accessToken,{orderId:id,method:'cash'});
    if (!['unpaid','matching'].includes(stage)) {
      await api(`dispatch/orders/${id}/respond`,kitchen.accessToken,{ready:true,quotedPrepMinutes:18});
      await api(`orders/${id}/kitchen-status`,kitchen.accessToken,{status:'PREPARING'},'PATCH');
    }
    if (['ready','assigned','onway','completed'].includes(stage)) {
      await api(`quality/orders/${id}/checklist`,kitchen.accessToken,{answers:[{item:'Weight check',ok:true},{item:'Packaging seal',ok:true},{item:'Temperature',ok:true}]});
      await api(`quality/orders/${id}/seal`,kitchen.accessToken,{sealId:`DEMO-${id.slice(-8)}`});
      if (pizzas.some(pizza => (recordsLines.get(id) ?? []).includes(pizza.id) && pizza.tags?.includes('premium'))) {
        const media = await api('media',kitchen.accessToken,{orderId:id,purpose:'ready',contentType:'image/png',base64:READY_PHOTO_PNG});
        await api(`quality/orders/${id}/ready-photo`,kitchen.accessToken,{photoUrl:media.reference});
      }
      await api(`orders/${id}/kitchen-status`,kitchen.accessToken,{status:'READY_FOR_PICKUP'},'PATCH');
    }
    if (['assigned','onway','completed'].includes(stage)) {
      const batch = await api('batches',kitchen.accessToken,{providerId,orderIds:[id]});
      await api(`batches/${batch.id || batch._id}/assign-courier`,kitchen.accessToken,{courierId:riderId});
      await api(`communications/orders/${id}/kitchen-messages`,kitchen.accessToken,{clientId:randomUUID(),text:'The sealed order is ready at the pickup counter.'});
    }
    if (['onway','completed'].includes(stage)) {
      const codes = await api(`proof/orders/${id}/codes`,kitchen.accessToken);
      await api(`proof/orders/${id}/pickup`,rider.accessToken,{code:codes.pickupCode,sealId:codes.sealId,longitude:11.5755,latitude:48.1374});
      await api(`proof/orders/${id}/en-route`,rider.accessToken,{longitude:11.578,latitude:48.139});
    }
    if (stage === 'completed') {
      const tracking = await api(`orders/${id}`,customer.accessToken);
      await api(`proof/orders/${id}/deliver`,rider.accessToken,{pin:tracking.deliveryPin,longitude:address.longitude ?? 11.5755,latitude:address.latitude ?? 48.1374});
      await api(`proof/orders/${id}/cash-receipt`,rider.accessToken,{amountCents:created.totalCents});
      await api(`proof/orders/${id}/complete`,rider.accessToken,{});
    }
    records.push({stage,id,totalCents:created.totalCents});
  }
  // Five paid group deliveries produce the loyalty progression through normal accounting.
  for(let i=0;i<5;i++) await order('completed',3,i === 0 ? 'PIZZA10' : undefined);
  for(const stage of ['onway','assigned','ready','preparing','matching','cancelled','unpaid']) await order(stage);
  console.log('Demo scenarios ready:', records);
  return records;
};
