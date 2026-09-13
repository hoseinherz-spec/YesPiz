import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNumber, IsOptional, Max, Min } from "class-validator";

export class UpdateAppConfigDto {
  @IsOptional() @IsInt() @Min(0) @Max(10000) slaCompensationCents?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100000) deliveryFeeCents?: number;
  @IsOptional() @IsInt() @Min(-10000) @Max(100000) smallSizeDeltaCents?: number;
  @IsOptional()
  @IsInt()
  @Min(-10000)
  @Max(100000)
  mediumSizeDeltaCents?: number;
  @IsOptional() @IsInt() @Min(-10000) @Max(100000) largeSizeDeltaCents?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100000) extraCheeseCents?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100000) jalapenosCents?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100000) olivesCents?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100000) garlicDipCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  w1Rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  w2Proximity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  w3QueueEmptiness?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  w4Fairness?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  w5Quality?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  dispatchTopN?: number;

  @ApiPropertyOptional({ description: "Kitchens in bid wave (default 3)" })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  waveSize?: number;

  @ApiPropertyOptional({ description: "Bid window seconds (default 15)" })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(60)
  bidWindowSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(100)
  dispatchInitialRadiusMeters?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(100)
  dispatchExpandedRadiusMeters?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(10)
  offerTimeoutSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  cashFailThreshold?: number;

  @ApiPropertyOptional({
    description: "Cash hard cap in cents (default 50000 = €500)",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cashHardCapCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  qualityAutoSuspendThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxBatchSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  maxBatchHoldMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  maxBagMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(50)
  pickupGeoRadiusMeters?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(50)
  dropoffGeoRadiusMeters?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(5)
  etaBasePrepMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(5)
  etaBaseDeliveryMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  etaWindowPaddingMinutes?: number;
}
