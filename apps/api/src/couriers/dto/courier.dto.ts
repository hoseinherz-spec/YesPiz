import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsUrl,
  IsMongoId,
  MaxLength,
  MinLength,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class UpdateCourierProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["car", "motorcycle", "scooter", "bicycle", "bike", "e-bike"])
  vehicleType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  vehicleModel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(24)
  plateNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(2048)
  avatarUrl?: string;
}

export class SessionCodeDto {
  @ApiProperty({ description: "QR payload or OTP code" })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  code!: string;
}

export class UpdateCourierLocationDto {
  @ApiProperty({ example: 11.5755 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiProperty({ example: 48.1374 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;
}

export class IssueSessionCodeDto {
  @IsMongoId() courierId!: string;
  @IsIn(["start", "end"]) action!: "start" | "end";
}
