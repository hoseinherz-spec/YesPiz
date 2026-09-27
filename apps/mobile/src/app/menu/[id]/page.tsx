import { PizzaDetail } from "@/features/catalog/components/PizzaDetail";
export { generateStaticParams } from "@/lib/menu-static-params";

export const dynamicParams = false;

export default async function MenuDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PizzaDetail key={id} id={id} />
  );
}
