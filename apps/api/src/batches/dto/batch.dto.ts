import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsString } from "class-validator";

export class CreateBatchDto {
  @ApiProperty()
  @IsString()
  providerId!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  orderIds!: string[];
}

export class SuggestBatchDto {
  @ApiProperty()
  @IsString()
  providerId!: string;
}

export class ReduceBatchDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  keepOrderIds!: string[];
}

export class AssignCourierDto {
  @ApiProperty()
  @IsString()
  courierId!: string;
}
