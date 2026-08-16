export type CreateMenuVersionRequest = {
  notes?: string;
};

export type CreateCategoryRequest = {
  name: string;
  sortOrder?: number;
};

export type CreateMenuItemRequest = {
  categoryId: string;
  name: string;
  description?: string;
  /** Price in cents */
  priceCents: number;
  prepWeight?: number;
  imageUrl?: string;
  tags?: string[];
  isActive?: boolean;
  recipeIngredients?: Array<{ name: string; weightGrams: number }>;
  cookTimeSeconds?: number;
  handoffTempC?: number;
  requiresNumberedSeal?: boolean;
  requiresReadyPhoto?: boolean;
  checklistTemplate?: string[];
};

export type UpdateMenuItemRequest = {
  name?: string;
  description?: string;
  priceCents?: number;
  prepWeight?: number;
  isActive?: boolean;
  imageUrl?: string;
  recipeIngredients?: Array<{ name: string; weightGrams: number }>;
  cookTimeSeconds?: number;
  handoffTempC?: number;
  requiresNumberedSeal?: boolean;
  requiresReadyPhoto?: boolean;
  checklistTemplate?: string[];
};

export type MenuVersion = {
  id: string;
  version: number;
  published: boolean;
  publishedAt?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Category = {
  id: string;
  menuVersionId?: string;
  name: string;
  sortOrder: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type MenuItem = {
  id: string;
  menuVersionId?: string;
  categoryId: string;
  name: string;
  description: string;
  priceCents: number;
  prepWeight: number;
  isActive?: boolean;
  imageUrl?: string;
  tags: string[];
  recipeIngredients?: Array<{ name: string; weightGrams: number }>;
  cookTimeSeconds?: number;
  handoffTempC?: number;
  requiresNumberedSeal?: boolean;
  requiresReadyPhoto?: boolean;
  checklistTemplate?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type PublishedMenuVersion = {
  id: string;
  version: number;
  publishedAt?: string;
};

export type PublishedMenuCategory = {
  id: string;
  name: string;
  sortOrder: number;
};

export type PublishedMenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  priceCents: number;
  prepWeight: number;
  imageUrl?: string;
  tags: string[];
};

export type PublishedMenuResponse = {
  version: PublishedMenuVersion | null;
  categories: PublishedMenuCategory[];
  items: PublishedMenuItem[];
};

export type MenuVersionDetail = {
  version: MenuVersion;
  categories: Category[];
  items: MenuItem[];
};
