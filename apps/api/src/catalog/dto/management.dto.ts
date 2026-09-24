import { IngredientOptionDto } from "../ingredient-options";
import { PartialType, ApiProperty } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";
import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsMongoId,
  IsObject,
  IsIn,
  IsArray,
  ArrayMaxSize,
  ValidateNested,
} from "class-validator";
import type { ProductCustomization } from "../customization";
import type { PizzaPresentation } from "../presentation";
import { CreateProductDto } from "../products/product.dto";
export class CatalogListDto {
  @ApiProperty({ required: false, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
  @ApiProperty({ required: false, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  q?: string;
  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  type?: string;
  @IsOptional()
  @IsIn(["draft", "active", "inactive", "archived"])
  @ApiProperty({ required: false, type: String })
  status?: string;
  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsMongoId()
  categoryId?: string;
  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsIn(["true", "false"])
  isActive?: string;
}
export class CreateMenuDto {
  @ApiProperty({ required: true, type: String })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;
  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
  @ApiProperty({ required: false, type: Boolean })
  @IsOptional()
  @Transform(
    ({ obj, key }: { obj: Record<string, unknown>; key: string }) => obj[key],
  )
  @IsBoolean()
  isActive?: boolean;
}
export class UpdateMenuDto extends PartialType(CreateMenuDto) {}
export class ActiveStatusDto {
  @ApiProperty({ required: true, type: Boolean })
  @Transform(
    ({ obj, key }: { obj: Record<string, unknown>; key: string }) => obj[key],
  )
  @IsBoolean()
  isActive!: boolean;
}
export class UpdateVersionDto {
  @ApiProperty({ required: true, type: String })
  @IsString()
  @MaxLength(2000)
  notes!: string;
}
export class AddProductToMenuDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => IngredientOptionDto)
  ingredientOptions?: IngredientOptionDto[];
  @IsOptional() @IsString() @MaxLength(2000) toppingBaseImageUrl?: string;
  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsMongoId()
  productId?: string;
  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsMongoId()
  productRevisionId?: string;
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProductDto)
  @ApiProperty({ required: false, type: CreateProductDto })
  product?: CreateProductDto;
  @ApiProperty({ required: true, type: String })
  @IsMongoId()
  categoryId!: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsMongoId({ each: true })
  @ApiProperty({ required: false, type: [String] })
  additionalCategoryIds?: string[];
  @ApiProperty({ required: true, type: Number })
  @IsInt()
  @Min(0)
  @Max(1000000)
  priceCents!: number;
  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  customization?: ProductCustomization;
  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  presentation?: PizzaPresentation;
  @ApiProperty({ required: false, type: Number })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
  @ApiProperty({ required: false, type: Boolean })
  @IsOptional()
  @Transform(
    ({ obj, key }: { obj: Record<string, unknown>; key: string }) => obj[key],
  )
  @IsBoolean()
  isActive?: boolean;
}
