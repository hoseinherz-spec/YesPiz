import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class PickupProofDto {
  @ApiProperty({ description: "Kitchen QR / OTP pickup code" })
  @IsString()
  code!: string;

  @ApiProperty()
  @IsNumber()
  longitude!: number;

  @ApiProperty()
  @IsNumber()
  latitude!: number;

  @ApiPropertyOptional({ description: "Confirm numbered seal id" })
  @IsOptional()
  @IsString()
  sealId?: string;
}

export class EnRouteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;
}

export class DeliverProofDto {
  @ApiPropertyOptional({ description: "Customer door PIN" })
  @IsOptional()
  @IsString()
  pin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signatureUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiProperty()
  @IsNumber()
  longitude!: number;

  @ApiProperty()
  @IsNumber()
  latitude!: number;
}

export class CashReceiptDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  amountCents!: number;
}
