import type { IngredientOptionConfig } from "./catalog.dto";
import { apiRequest, withAuth, type AuthRequestOptions } from "../../core";
import type {
  PizzaCustomization,
  PizzaPresentation,
  MenuVersion,
  MenuItem,
  Category,
} from "./catalog.dto";
export type ProductType = "pizza" | "drink" | "burger" | (string & {});
export type ProductStatus = "draft" | "active" | "inactive" | "archived";
export type ProductCustomization = PizzaCustomization;
export type PreparationProfile = {
  mode: "cook" | "assemble" | "pack";
  prepWeight: number;
  cookTimeSeconds: number;
  handoffTempC: number;
  requiresNumberedSeal: boolean;
  requiresReadyPhoto: boolean;
  checklistTemplate: string[];
  recipeIngredients: Array<{ name: string; weightGrams: number }>;
};
export type ProductContent = {
  name: string;
  description?: string;
  imageUrl?: string;
  gallery?: string[];
  ingredientIds?: string[];
  ingredients?: string[];
  allergens?: string[];
  tags?: string[];
  attributes?: Record<string, unknown>;
  attributesSchemaVersion?: number;
  preparation?: PreparationProfile;
};
export type Product = {
  _id: string;
  type: ProductType;
  status: ProductStatus;
  currentRevisionId: string;
  legacyPizzaId?: string;
};
export type ProductRevision = {
  _id: string;
  productId: string;
  type: ProductType;
  revision: number;
  attributesSchemaVersion: number;
  content: ProductContent;
};
export type ProductDetail = { product: Product; revision: ProductRevision };
export type Menu = {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
};
export type CatalogPage<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
};
export type CatalogQuery = {
  page?: number;
  limit?: number;
  q?: string;
  type?: string;
  status?: ProductStatus;
  categoryId?: string;
  isActive?: boolean;
};
export type CreateProduct = ProductContent & {
  type: ProductType;
  status?: Exclude<ProductStatus, "archived">;
};
export type AddMenuProduct = {
  ingredientOptions?: IngredientOptionConfig[];
  toppingBaseImageUrl?: string;
  productId?: string;
  productRevisionId?: string;
  product?: CreateProduct;
  categoryId: string;
  additionalCategoryIds?: string[];
  priceCents: number;
  customization?: ProductCustomization;
  presentation?: PizzaPresentation;
  sortOrder?: number;
  isActive?: boolean;
};
const segment = encodeURIComponent;
function queryString(query: CatalogQuery = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    if (value !== undefined) params.set(key, String(value));
  return params.size ? `?${params}` : "";
}
function request<T>(
  path: string,
  method: string,
  options?: AuthRequestOptions,
  body?: unknown,
) {
  return apiRequest<T>(
    `/api/v1${path}`,
    withAuth({ ...options, method, ...(body !== undefined ? { body } : {}) }),
  );
}
export const productsClient = {
  types: (options?: AuthRequestOptions) =>
    request<
      Record<
        string,
        {
          schemaVersion: number;
          preparation: string;
          attributes: Record<
            string,
            { type: string; values?: string[]; min?: number; max?: number }
          >;
        }
      >
    >("/products/types", "GET", options),
  list: (query?: CatalogQuery, options?: AuthRequestOptions) =>
    request<CatalogPage<Product & { revision: ProductRevision }>>(
      `/products${queryString(query)}`,
      "GET",
      options,
    ),
  get: (id: string, options?: AuthRequestOptions) =>
    request<ProductDetail>(`/products/${segment(id)}`, "GET", options),
  revisions: (id: string, query?: CatalogQuery, options?: AuthRequestOptions) =>
    request<CatalogPage<ProductRevision>>(
      `/products/${segment(id)}/revisions${queryString(query)}`,
      "GET",
      options,
    ),
  revision: (id: string, revisionId: string, options?: AuthRequestOptions) =>
    request<ProductDetail>(
      `/products/${segment(id)}/revisions/${segment(revisionId)}`,
      "GET",
      options,
    ),
  create: (body: CreateProduct, options?: AuthRequestOptions) =>
    request<ProductDetail>("/products", "POST", options, body),
  update: (
    id: string,
    body: Partial<ProductContent> & { expectedRevisionId: string },
    options?: AuthRequestOptions,
  ) =>
    request<ProductDetail>(`/products/${segment(id)}`, "PATCH", options, body),
  status: (id: string, status: ProductStatus, options?: AuthRequestOptions) =>
    request<Product>(`/products/${segment(id)}/status`, "PATCH", options, {
      status,
    }),
  remove: (id: string, options?: AuthRequestOptions) =>
    request<Product>(`/products/${segment(id)}`, "DELETE", options),
};
export const menusClient = {
  list: (query?: CatalogQuery, options?: AuthRequestOptions) =>
    request<CatalogPage<Menu>>(`/menus${queryString(query)}`, "GET", options),
  get: (id: string, options?: AuthRequestOptions) =>
    request<Menu>(`/menus/${segment(id)}`, "GET", options),
  create: (
    body: Pick<Menu, "name"> & Partial<Pick<Menu, "description" | "isActive">>,
    options?: AuthRequestOptions,
  ) => request<Menu>("/menus", "POST", options, body),
  update: (
    id: string,
    body: Partial<Pick<Menu, "name" | "description" | "isActive">>,
    options?: AuthRequestOptions,
  ) => request<Menu>(`/menus/${segment(id)}`, "PATCH", options, body),
  status: (id: string, isActive: boolean, options?: AuthRequestOptions) =>
    request<Menu>(`/menus/${segment(id)}/status`, "PATCH", options, {
      isActive,
    }),
  remove: (id: string, options?: AuthRequestOptions) =>
    request<{ deleted: boolean }>(`/menus/${segment(id)}`, "DELETE", options),
  versions: (id: string, options?: AuthRequestOptions) =>
    request<MenuVersion[]>(`/menus/${segment(id)}/versions`, "GET", options),
  createVersion: (
    id: string,
    body: { notes?: string },
    options?: AuthRequestOptions,
  ) =>
    request<MenuVersion>(
      `/menus/${segment(id)}/versions`,
      "POST",
      options,
      body,
    ),
  updateVersion: (id: string, notes: string, options?: AuthRequestOptions) =>
    request<MenuVersion>(`/catalog/versions/${segment(id)}`, "PATCH", options, {
      notes,
    }),
  removeVersion: (id: string, options?: AuthRequestOptions) =>
    request<{ deleted: boolean }>(
      `/catalog/versions/${segment(id)}`,
      "DELETE",
      options,
    ),
  categories: (
    versionId: string,
    query?: CatalogQuery,
    options?: AuthRequestOptions,
  ) =>
    request<CatalogPage<Category>>(
      `/catalog/versions/${segment(versionId)}/categories${queryString(query)}`,
      "GET",
      options,
    ),
  category: (id: string, options?: AuthRequestOptions) =>
    request<Category>(`/catalog/categories/${segment(id)}`, "GET", options),
  categoryStatus: (
    id: string,
    isActive: boolean,
    options?: AuthRequestOptions,
  ) =>
    request<Category>(
      `/catalog/categories/${segment(id)}/status`,
      "PATCH",
      options,
      { isActive },
    ),
  removeCategory: (id: string, options?: AuthRequestOptions) =>
    request<{ deleted: boolean }>(
      `/catalog/categories/${segment(id)}`,
      "DELETE",
      options,
    ),
  items: (
    versionId: string,
    query?: CatalogQuery,
    options?: AuthRequestOptions,
  ) =>
    request<CatalogPage<MenuItem>>(
      `/catalog/versions/${segment(versionId)}/items${queryString(query)}`,
      "GET",
      options,
    ),
  item: (id: string, options?: AuthRequestOptions) =>
    request<MenuItem>(`/catalog/items/${segment(id)}`, "GET", options),
  addProduct: (
    versionId: string,
    body: AddMenuProduct,
    options?: AuthRequestOptions,
  ) =>
    request<MenuItem>(
      `/catalog/versions/${segment(versionId)}/products`,
      "POST",
      options,
      body,
    ),
  itemStatus: (id: string, isActive: boolean, options?: AuthRequestOptions) =>
    request<MenuItem>(
      `/catalog/items/${segment(id)}/status`,
      "PATCH",
      options,
      { isActive },
    ),
  removeItem: (id: string, options?: AuthRequestOptions) =>
    request<{ deleted: boolean }>(
      `/catalog/items/${segment(id)}`,
      "DELETE",
      options,
    ),
};
