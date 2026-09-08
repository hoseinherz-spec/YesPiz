import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsOptional,
  IsString,
  IsMongoId,
  MaxLength,
  MinLength,
} from "class-validator";
import { PaymentMethod } from "../../common/enums";

export class InitiatePaymentDto {
  @ApiProperty()
  @IsMongoId()
  orderId!: string;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;
}

export class CancelPaymentOrderDto {
  @IsMongoId() orderId!: string;
  @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}
