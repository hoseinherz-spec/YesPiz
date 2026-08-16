import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { IncidentKind, IncidentStatus } from "../../common/enums";

export class CreateIncidentDto {
  @ApiProperty({ enum: IncidentKind })
  @IsEnum(IncidentKind)
  kind!: IncidentKind;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;
}

export class ResolveIncidentDto {
  @ApiProperty({ enum: [IncidentStatus.RESOLVED, IncidentStatus.CANCELLED] })
  @IsEnum(IncidentStatus)
  status!: IncidentStatus.RESOLVED | IncidentStatus.CANCELLED;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ description: "Replacement courier user id" })
  @IsOptional()
  @IsString()
  replacementCourierId?: string;
}
