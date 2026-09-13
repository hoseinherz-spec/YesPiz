// Only called by the disposable MongoMemoryServer browser runner, never production seed.
module.exports = async function featureFixtures(uri) {
  const mongoose = require('mongoose');
  const db = await mongoose.createConnection(uri).asPromise();
  try {
    const customer = await db.collection('users').findOne({ email: 'customer@yespizz.local' });
    const courier = await db.collection('users').findOne({ email: 'courier@yespizz.local' });
    const provider = await db.collection('providers').findOne({ name: { $exists: true } });
    const item = await db.collection('menu_items').findOne({ name: 'Margherita' });
    const version = await db.collection('menu_versions').findOne({ published: true });
    const addressId = new mongoose.Types.ObjectId();
    await db.collection('addresses').insertOne({ _id: addressId, userId: customer._id, label: 'Home', street: 'Example 12', city: 'Munich', zipcode: '80331', country: 'DE', longitude: 11.58, latitude: 48.14, isDefault: true });
    await db.collection('orders').insertOne({ customerId: customer._id, providerId: provider._id, courierId: courier._id, addressId, menuVersion: version.version, lines: [{ menuItemId: item._id, name: item.name, unitPriceCents: item.priceCents, quantity: 1, prepWeight: 1 }], subtotalCents: item.priceCents, deliveryFeeCents: 299, totalCents: item.priceCents + 299, status: 'COMPLETED', paymentMethod: 'card', paymentStatus: 'captured', deliveryStreet: 'Example 12', deliveryCity: 'Munich', deliveryZipcode: '80331', createdAt: new Date(), updatedAt: new Date(), completedAt: new Date() });
  } finally { await db.close(); }
};
