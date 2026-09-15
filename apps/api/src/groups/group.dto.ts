import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsMongoId,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { OrderLineDto } from "../orders/dto/order.dto";
export class CreateGroupDto {
  @IsString() @MaxLength(60) title!: string;
  @IsInt() @Min(1) menuVersion!: number;
  @IsBoolean() split!: boolean;
  @IsDateString() deadline!: string;
}
export class GroupContributionDto {
  @IsInt() @Min(0) revision!: number;
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  lines!: OrderLineDto[];
}
export class GroupRevisionDto {
  @IsInt() @Min(0) revision!: number;
}
export class GroupLockDto extends GroupRevisionDto {
  @IsMongoId() addressId!: string;
}
export class GroupSubmitDto extends GroupRevisionDto {
  @IsInt() @Min(0) expectedTotalCents!: number;
}
