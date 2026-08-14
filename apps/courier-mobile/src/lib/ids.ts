export function entityId(doc: { id?: string; _id?: unknown } | null | undefined): string {
  if (!doc) return '';
  if (doc.id) return String(doc.id);
  if (doc._id != null) return String(doc._id);
  return '';
}
