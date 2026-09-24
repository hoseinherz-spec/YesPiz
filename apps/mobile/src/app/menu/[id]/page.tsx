import { PizzaDetail } from "@/features/catalog/components/PizzaDetail";
export { generateStaticParams } from "@/lib/menu-static-params";
import { PizzaDetailSkeleton } from "@/features/catalog/components/PizzaDetail/PizzaSkeletons";
import { Suspense } from "react";

export const dynamicParams = false;

export default async function MenuDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<PizzaDetailSkeleton />}>
      <PizzaDetail key={id} id={id} />
    </Suspense>
  );
}
