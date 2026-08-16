import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class ChecklistAnswerDto {
  @ApiProperty()
  @IsString()
  item!: string;

  @ApiProperty()
  @IsBoolean()
  ok!: boolean;
}

export class SubmitChecklistDto {
  @ApiProperty({ type: [ChecklistAnswerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChecklistAnswerDto)
  answers!: ChecklistAnswerDto[];
}

export class SubmitSealDto {
  @ApiProperty({ description: "Numbered seal identifier on the package" })
  @IsString()
  sealId!: string;
}

export class SubmitReadyPhotoDto {
  @ApiProperty()
  @IsString()
  photoUrl!: string;
}

export class RecordQualityIncidentDto {
  @ApiProperty({ enum: ["complaint", "delay", "error"] })
  @IsIn(["complaint", "delay", "error"])
  kind!: "complaint" | "delay" | "error";
}

export class UnsuspendProviderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateTestOrderDto {
  @ApiProperty()
  @IsString()
  providerId!: string;

  @ApiProperty()
  @IsString()
  addressId!: string;

  @ApiProperty()
  @IsString()
  customerId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  menuVersion!: number;

  @ApiProperty({
    type: "array",
    items: {
      type: "object",
      properties: {
        menuItemId: { type: "string" },
        quantity: { type: "number" },
      },
    },
  })
  @IsArray()
  @ArrayMinSize(1)
  lines!: Array<{ menuItemId: string; quantity: number }>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
