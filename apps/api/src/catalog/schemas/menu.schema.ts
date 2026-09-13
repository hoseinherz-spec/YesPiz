import type { PizzaPresentation } from "../presentation";
import type { PizzaCustomization } from "../customization";
import { Schema as MongoSchema } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type MenuVersionDocument = HydratedDocument<MenuVersion>;
export type CategoryDocument = HydratedDocument<Category>;
export type MenuItemDocument = HydratedDocument<MenuItem>;

@Schema({ _id: false })
export class RecipeIngredient {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, min: 0 })
  weightGrams!: number;
}

const RecipeIngredientSchema = SchemaFactory.createForClass(RecipeIngredient);

@Schema({ timestamps: true, collection: "menu_versions" })
export class MenuVersion {
  @Prop({ type: Date }) scheduledPublishAt?: Date;
  @Prop() publishError?: string;
  @Prop({ required: true, unique: true })
  version!: number;

  @Prop({ default: false })
  published!: boolean;

  @Prop()
  publishedAt?: Date;

  @Prop({ default: "" })
  notes?: string;
}

export const MenuVersionSchema = SchemaFactory.createForClass(MenuVersion);

@Schema({ timestamps: true, collection: "categories" })
export class Category {
  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: MenuVersion.name,
    required: true,
  })
  menuVersionId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ default: 0 })
  sortOrder!: number;

  @Prop({ default: true })
  isActive!: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

@Schema({ timestamps: true, collection: "menu_items" })
export class MenuItem {
  @Prop({ type: [MongoSchema.Types.ObjectId], default: [] })
  additionalCategoryIds!: Types.ObjectId[];
  @Prop({ type: MongoSchema.Types.Mixed }) presentation?: PizzaPresentation;
  @Prop({ index: true })
  pizzaId!: string;

  @Prop({ type: MongoSchema.Types.Mixed })
  customization?: PizzaCustomization;

  @Prop({ default: 0 })
  sortOrder!: number;

  @Prop({ enum: ["pizza", "unclassified"], default: "unclassified" })
  productType!: string;

  @Prop({ type: [String], default: [] })
  ingredients!: string[];

  @Prop({ type: [String], default: [] })
  allergens!: string[];

  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: MenuVersion.name,
    required: true,
  })
  menuVersionId!: Types.ObjectId;

  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: Category.name,
    required: true,
  })
  categoryId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ default: "" })
  description!: string;

  /** Server-side unit price in cents */
  @Prop({ required: true })
  priceCents!: number;

  /** Prep weight for batch/kitchen scoring */
  @Prop({ default: 1 })
  prepWeight!: number;

  /** Kitchen Quality OS — standard recipe */
  @Prop({ type: [RecipeIngredientSchema], default: [] })
  recipeIngredients!: RecipeIngredient[];

  @Prop({ default: 0, min: 0 })
  cookTimeSeconds!: number;

  @Prop({ default: 65 })
  handoffTempC!: number;

  @Prop({ default: true })
  requiresNumberedSeal!: boolean;

  @Prop({ default: false })
  requiresReadyPhoto!: boolean;

  /** Pre-handoff checklist template labels */
  @Prop({
    type: [String],
    default: ["Weight check", "Packaging seal", "Temperature"],
  })
  checklistTemplate!: string[];

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  imageUrl?: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);
MenuItemSchema.index({ menuVersionId: 1, categoryId: 1 });
