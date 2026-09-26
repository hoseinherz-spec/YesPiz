import { MenuWorkspace } from "@/components/MenuWorkspace";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MenuWorkspace section="edit" itemId={id} />;
}
