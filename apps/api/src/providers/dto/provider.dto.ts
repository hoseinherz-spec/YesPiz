import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  ArrayMaxSize,
  ValidateNested,
  Matches,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsInt,
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

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    minimum: 1,
    description: "Max concurrent open orders; null removes the limit",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  acceptCap?: number | null;
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

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    minimum: 1,
    description: "Max concurrent open orders; null removes the limit",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  acceptCap?: number | null;

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
  @ApiProperty({
    type: [String],
    description: "Menu item ids to mark unavailable",
  })
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

export class OpeningPeriodDto {
  @IsInt() @Min(0) @Max(6) day!: number;
  @IsString() @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/) opens!: string;
  @IsString() @Matches(/^(?:(?:[01]\d|2[0-3]):[0-5]\d|24:00)$/) closes!: string;
}
export class OpeningHoursDto {
  @IsBoolean() hoursEnabled!: boolean;
  @IsString() timezone!: string;
  @IsArray()
  @ArrayMaxSize(28)
  @ValidateNested({ each: true })
  @Type(() => OpeningPeriodDto)
  openingHours!: OpeningPeriodDto[];
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  closedDates!: string[];
}
