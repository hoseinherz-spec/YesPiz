import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional, Max, Min } from "class-validator";

export class WaveRespondDto {
  @ApiProperty({ description: "Kitchen is ready to take the order" })
  @IsBoolean()
  ready!: boolean;

  @ApiPropertyOptional({ description: "Quoted prep time in minutes" })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(90)
  quotedPrepMinutes?: number;
}
