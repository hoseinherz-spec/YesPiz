import { apiRequest, withAuth, type AuthRequestOptions } from "../../core";
export type IngredientStock = {
  id: string;
  enabled: boolean;
  revision: number;
  items: { name: string; grams: number }[];
};
export const inventoryClient = {
  read: (id: string, o?: AuthRequestOptions) =>
    apiRequest<IngredientStock>(
      `/api/v1/inventory/${encodeURIComponent(id)}`,
      withAuth({ ...o, method: "GET" }),
    ),
  update: (
    id: string,
    body: Omit<IngredientStock, "id">,
    o?: AuthRequestOptions,
  ) =>
    apiRequest<IngredientStock>(
      `/api/v1/inventory/${encodeURIComponent(id)}`,
      withAuth({ ...o, method: "POST", body }),
    ),
};
