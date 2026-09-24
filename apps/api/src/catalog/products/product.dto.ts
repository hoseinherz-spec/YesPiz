import { Type, Transform } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsMongoId,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  Max,
  MaxLength,
  ArrayMaxSize,
  ValidateNested,
  MinLength,
} from "class-validator";
import { PartialType, ApiProperty } from "@nestjs/swagger";
import type { ProductStatus } from "./product.schema";
import type { RecipeChoice } from "../recipe-coverage";
import { RecipeIngredientDto } from "../dto/catalog.dto";

export class PreparationProfileDto {
  @ApiProperty({ required: true, type: String })
  @IsIn(["cook", "assemble", "pack"])
  mode!: "cook" | "assemble" | "pack";
  @ApiProperty({ required: true, type: Number })
  @IsNumber()
  @Min(0)
  @Max(10000)
  prepWeight!: number;
  @ApiProperty({ required: true, type: Number })
  @IsInt()
  @Min(0)
  @Max(86400)
  cookTimeSeconds!: number;
  @ApiProperty({ required: true, type: Number })
  @IsNumber()
  @Min(-30)
  @Max(200)
  handoffTempC!: number;
  @ApiProperty({ required: true, type: Boolean })
  @Transform(
    ({ obj, key }: { obj: Record<string, unknown>; key: string }) => obj[key],
  )
  @IsBoolean()
  requiresNumberedSeal!: boolean;
  @ApiProperty({ required: true, type: Boolean })
  @Transform(
    ({ obj, key }: { obj: Record<string, unknown>; key: string }) => obj[key],
  )
  @IsBoolean()
  requiresReadyPhoto!: boolean;
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(150, { each: true })
  @ApiProperty({ required: true, type: [String] })
  checklistTemplate!: string[];
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  @ApiProperty({ required: true, type: [RecipeIngredientDto] })
  recipeIngredients!: RecipeIngredientDto[];
}
export class ProductContentDto {
  @ApiProperty({ required: true, type: String })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;
  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;
  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  imageUrl?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(2000, { each: true })
  @ApiProperty({ required: false, type: [String] })
  gallery?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @IsMongoId({ each: true })
  @ApiProperty({ required: false, type: [String] })
  ingredientIds?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  @ApiProperty({ required: false, type: [String] })
  ingredients?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  @ApiProperty({ required: false, type: [String] })
  allergens?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  @ApiProperty({ required: false, type: [String] })
  tags?: string[];
  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
  @ApiProperty({ required: false, type: Number })
  @IsOptional()
  @IsInt()
  @Min(1)
  attributesSchemaVersion?: number;
  @IsOptional()
  @ValidateNested()
  @Type(() => PreparationProfileDto)
  @ApiProperty({ required: false, type: PreparationProfileDto })
  preparation?: PreparationProfileDto;
}
export class CreateProductDto extends ProductContentDto {
  @ApiProperty({ required: true, type: String })
  @IsString()
  @MaxLength(40)
  type!: string;
  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsIn(["draft", "active", "inactive"])
  status?: ProductStatus;
}
export class UpdateProductDto extends PartialType(ProductContentDto) {
  @ApiProperty({ required: true, type: String })
  @IsMongoId()
  expectedRevisionId!: string;
}
export class ProductStatusDto {
  @ApiProperty({ required: true, type: String })
  @IsIn(["draft", "active", "inactive", "archived"])
  status!: ProductStatus;
}
export type ProductContent = ProductContentDto & {
  recipeChoices?: RecipeChoice[];
};
