import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type MenuVersionDocument = HydratedDocument<MenuVersion>;
export type CategoryDocument = HydratedDocument<Category>;
export type MenuItemDocument = HydratedDocument<MenuItem>;

@Schema({ timestamps: true, collection: "menu_versions" })
export class MenuVersion {
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
  @Prop({ type: Types.ObjectId, ref: MenuVersion.name, required: true })
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
  @Prop({ type: Types.ObjectId, ref: MenuVersion.name, required: true })
  menuVersionId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Category.name, required: true })
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

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  imageUrl?: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);
MenuItemSchema.index({ menuVersionId: 1, categoryId: 1 });
