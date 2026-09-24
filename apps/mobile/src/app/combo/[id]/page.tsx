import { ComboDetail } from "@/features/catalog/components/ComboDetail";
export { generateStaticParams } from "@/lib/combo-static-params";

export const dynamicParams = false;

export default async function ComboDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ComboDetail id={id} />;
}
