// Audit by default. Apply only during a maintenance window, after a backup.
const mongoose = require("mongoose");
const fields = {
  invites: ["createdBy", "usedBy"],
  password_resets: ["userId"],
  categories: ["menuVersionId"],
  menu_items: ["menuVersionId", "categoryId"],
  orders: [
    "customerId",
    "addressId",
    "providerId",
    "courierId",
    "batchId",
    "lines.menuItemId",
    "offers.providerId",
  ],
  courier_sessions: ["courierId", "issuedBy"],
  courier_profiles: ["userId"],
  providers: ["userId", "eightySixedItemIds"],
  payments: ["orderId", "customerId"],
  addresses: ["userId"],
  batches: ["providerId", "courierId", "orderIds"],
  delivery_proofs: ["orderId", "courierId"],
  incidents: ["orderId", "batchId", "courierId", "replacementCourierId"],
  proof_media: ["orderId"],
  order_messages: ["orderId"],
  push_devices: ["userId"],
  push_notifications: ["userId", "providerId"],
};
const apply = process.argv.includes("--apply");
function convert(parent, path) {
  if (Array.isArray(parent))
    return parent.reduce((n, item) => n + convert(item, path), 0);
  if (!parent || typeof parent !== "object") return 0;
  const [key, ...rest] = path;
  if (rest.length) return convert(parent[key], rest);
  let count = 0;
  const value = parent[key];
  function cast(item) {
    if (typeof item === "string" && /^[a-f0-9]{24}$/i.test(item)) {
      count++;
      return new mongoose.Types.ObjectId(item);
    }
    return item;
  }
  if (Array.isArray(value)) parent[key] = value.map(cast);
  else if (value != null) parent[key] = cast(value);
  return count;
}
(async () => {
  if (!process.env.MONGODB_URI)
    throw new Error("Set MONGODB_URI through your secret environment.");
  await mongoose.connect(process.env.MONGODB_URI);
  for (const [name, paths] of Object.entries(fields)) {
    const collection = mongoose.connection.db.collection(name);
    let count = 0;
    const projection = Object.fromEntries(
      paths.map((path) => [path.split(".")[0], 1]),
    );
    for await (const doc of collection.find({}, { projection })) {
      let changed = 0;
      for (const path of paths) changed += convert(doc, path.split("."));
      if (!changed) continue;
      count += changed;
      if (apply) {
        const { _id, ...values } = doc;
        await collection.updateOne({ _id }, { $set: values });
      }
    }
    console.log(
      JSON.stringify({
        collection: name,
        convertibleReferences: count,
        applied: apply,
      }),
    );
  }
  const duplicates = await mongoose.connection.db
    .collection("courier_sessions")
    .aggregate([
      { $match: { status: { $in: ["active", "pending"] } } },
      {
        $group: {
          _id: { courierId: { $toString: "$courierId" }, status: "$status" },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $count: "groups" },
    ])
    .toArray();
  if (duplicates.length) {
    console.error(
      "Duplicate open shifts require operator review before enabling unique_open_shift. No shifts were removed.",
    );
    process.exitCode = 1;
  }
  const duplicatePayments = await mongoose.connection.db
    .collection("payments")
    .aggregate([
      { $group: { _id: { $toString: "$orderId" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: "groups" },
    ])
    .toArray();
  if (duplicatePayments.length) {
    console.error(
      "Duplicate payments require operator review before enabling unique_payment_order. No payments were removed.",
    );
    process.exitCode = 1;
  }
})()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
