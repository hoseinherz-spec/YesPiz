import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongoSchema, Types, HydratedDocument } from "mongoose";
import type { ProductContent } from "./product.dto";
export type ProductStatus = "draft" | "active" | "inactive" | "archived";
@Schema({ timestamps: true, collection: "products" })
export class Product {
  @Prop({ required: true }) type!: string;
  @Prop({
    required: true,
    enum: ["draft", "active", "inactive", "archived"],
    default: "draft",
  })
  status!: ProductStatus;
  @Prop({ type: MongoSchema.Types.ObjectId, ref: "ProductRevision" })
  currentRevisionId?: Types.ObjectId;
  @Prop({ unique: true, sparse: true }) legacyPizzaId?: string;
}
export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);
@Schema({ timestamps: true, collection: "product_revisions" })
export class ProductRevision {
  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: Product.name,
    required: true,
    index: true,
  })
  productId!: Types.ObjectId;
  @Prop({ required: true }) revision!: number;
  @Prop({ required: true }) type!: string;
  @Prop({ required: true, default: 1 }) attributesSchemaVersion!: number;
  @Prop({ type: MongoSchema.Types.Mixed, required: true })
  content!: ProductContent;
}
export type ProductRevisionDocument = HydratedDocument<ProductRevision>;
export const ProductRevisionSchema =
  SchemaFactory.createForClass(ProductRevision);
ProductRevisionSchema.index({ productId: 1, revision: 1 }, { unique: true });
