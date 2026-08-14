/** Normalize Nest/Mongoose documents that may expose `id` or `_id`. */
export function entityId(doc: {
  id?: string;
  _id?: string | { toString(): string };
}): string {
  if (doc.id) return String(doc.id);
  if (doc._id != null) return String(doc._id);
  return '';
}
