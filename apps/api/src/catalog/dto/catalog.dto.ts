import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class CreateMenuVersionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class RecipeIngredientDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  weightGrams!: number;
}

export class CreateMenuItemDto {
  @ApiProperty()
  @IsString()
  categoryId!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "Price in cents" })
  @IsInt()
  @Min(0)
  priceCents!: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  prepWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [RecipeIngredientDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  recipeIngredients?: RecipeIngredientDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  cookTimeSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  handoffTempC?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresNumberedSeal?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresReadyPhoto?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  checklistTemplate?: string[];
}

export class UpdateMenuItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  prepWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ type: [RecipeIngredientDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  recipeIngredients?: RecipeIngredientDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  cookTimeSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  handoffTempC?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresNumberedSeal?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresReadyPhoto?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  checklistTemplate?: string[];
}
