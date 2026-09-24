import { PizzaReviewsPage } from "@/features/catalog/components/PizzaDetail/PizzaReviewsPage";

export { generateStaticParams } from "@/lib/menu-static-params";
export const dynamicParams = false;

export default async function MenuReviewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PizzaReviewsPage key={id} id={id} />;
}
