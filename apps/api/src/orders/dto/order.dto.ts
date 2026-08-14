import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { OrderStatus, PaymentMethod } from "../../common/enums";

export class CreateAddressDto {
  @ApiProperty()
  @IsString()
  label!: string;

  @ApiProperty()
  @IsString()
  street!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty()
  @IsNumber()
  longitude!: number;

  @ApiProperty()
  @IsNumber()
  latitude!: number;

  @ApiPropertyOptional()
  @IsOptional()
  isDefault?: boolean;
}

export class OrderLineDto {
  @ApiProperty()
  @IsString()
  menuItemId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsNumber()
  menuVersion!: number;

  @ApiProperty()
  @IsString()
  addressId!: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiProperty({ type: [OrderLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  lines!: OrderLineDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateKitchenStatusDto {
  @ApiProperty({
    enum: [
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.EXCEPTION_REPORTED,
    ],
  })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

export class ResolveAdminReviewDto {
  @ApiProperty({
    enum: [
      OrderStatus.ADMIN_REVIEW,
      OrderStatus.PREPARING,
      OrderStatus.CANCELLED,
    ],
    description:
      "ADMIN_REVIEW = escalate; PREPARING = send back to kitchen; CANCELLED = cancel",
  })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
