import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class CreateProviderDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  address!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty()
  @IsNumber()
  longitude!: number;

  @ApiProperty()
  @IsNumber()
  latitude!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;
}

export class UpdateProviderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  acceptingOrders?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: "Max concurrent open orders" })
  @IsOptional()
  @IsNumber()
  @Min(1)
  acceptCap?: number;
}

export class ProviderSelfUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  acceptingOrders?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  acceptCap?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pauseReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  pausedUntil?: string;
}

export class EightySixDto {
  @ApiProperty({ type: [String], description: "Menu item ids to mark unavailable" })
  @IsArray()
  @IsString({ each: true })
  menuItemIds!: string[];
}

export class PauseOrdersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: "ISO date when pause ends" })
  @IsOptional()
  @IsDateString()
  until?: string;
}

export class PrepOverrideDto {
  @ApiProperty({ description: "Prep minutes override for this order" })
  @IsNumber()
  @Min(1)
  @Max(120)
  prepOverrideMinutes!: number;
}
