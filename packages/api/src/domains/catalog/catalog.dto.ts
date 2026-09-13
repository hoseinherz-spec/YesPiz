export type PizzaPresentation = {
  gallery: string[];
  fields: Array<{
    name: string;
    type: "text" | "number" | "boolean";
    value: string;
    visibility: "public" | "internal";
  }>;
  availability: {
    enabled: boolean;
    timezone: string;
    periods: Array<{ day: number; opens: string; closes: string }>;
    closedDates: string[];
  };
};
export type PublicPizzaPresentation = {
  gallery: string[];
  fields: Array<{
    name: string;
    type: "text" | "number" | "boolean";
    value: string;
  }>;
};
export type PizzaCustomization = {
  variants: Array<{
    id: string;
    name: string;
    priceCents: number;
    isActive: boolean;
  }>;
  groups: Array<{
    id: string;
    name: string;
    min: number;
    max: number;
    options: Array<{
      id: string;
      name: string;
      priceCents: number;
      isActive: boolean;
      variantIds: string[];
      priceOverrides?: Array<{ variantId: string; priceCents: number }>;
    }>;
  }>;
};
export type PizzaSelection = { groupId: string; optionIds: string[] };

export type CreateMenuVersionRequest = {
  notes?: string;
};

export type CreateCategoryRequest = {
  name: string;
  sortOrder?: number;
};

export type CreateMenuItemRequest = {
  additionalCategoryIds?: string[];
  presentation?: PizzaPresentation;
  customization?: PizzaCustomization;
  sortOrder?: number;
  pizzaId?: string;
  ingredients?: string[];
  allergens?: string[];
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
  additionalCategoryIds?: string[];
  presentation?: PizzaPresentation;
  categoryId?: string;
  tags?: string[];
  customization?: PizzaCustomization;
  sortOrder?: number;
  pizzaId?: string;
  productType?: "pizza" | "unclassified";
  ingredients?: string[];
  allergens?: string[];
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
  scheduledPublishAt?: string;
  publishError?: string;
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
  additionalCategoryIds?: string[];
  presentation?: PizzaPresentation;
  customization?: PizzaCustomization;
  sortOrder?: number;
  pizzaId?: string;
  productType?: "pizza" | "unclassified";
  ingredients?: string[];
  allergens?: string[];
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
  additionalCategoryIds?: string[];
  presentation?: PublicPizzaPresentation;
  customization?: PizzaCustomization;
  sortOrder?: number;
  pizzaId?: string;
  ingredients?: string[];
  allergens?: string[];
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
