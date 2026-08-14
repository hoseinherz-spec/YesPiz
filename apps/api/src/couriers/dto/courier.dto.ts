import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateCourierProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleType?: string;
}

export class SessionCodeDto {
  @ApiProperty({ description: "QR payload or OTP code" })
  @IsString()
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
