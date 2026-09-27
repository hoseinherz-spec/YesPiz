import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
export type IngredientDocument = HydratedDocument<Ingredient>;
@Schema({ timestamps: true, collection: "ingredients" })
export class Ingredient {
  @Prop({ required: true, trim: true, maxlength: 100 }) name!: string;
  @Prop({ default: "", maxlength: 1000 }) description!: string;
  @Prop({ required: true, trim: true }) slug!: string;
  @Prop({ default: "" }) image!: string;
  @Prop({ default: false }) isTopping!: boolean;
  @Prop({ default: "" }) toppingImageUrl!: string;
  @Prop({ default: false }) deleted!: boolean;
}
export const IngredientSchema = SchemaFactory.createForClass(Ingredient);

IngredientSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { deleted: false } },
);
