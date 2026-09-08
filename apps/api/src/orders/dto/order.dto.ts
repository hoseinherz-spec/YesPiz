import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  ArrayMaxSize,
  ArrayUnique,
  IsIn,
  IsInt,
  IsMongoId,
  Max,
  MaxLength,
  IsArray,
  IsBoolean,
  IsDateString,
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
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiProperty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entrance?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  doorCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class OrderLineDto {
  @ApiProperty()
  @IsMongoId()
  menuItemId!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;

  @ApiPropertyOptional({ enum: ["small", "medium", "large"] })
  @IsOptional()
  @IsIn(["small", "medium", "large"])
  size?: "small" | "medium" | "large";

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(4)
  @IsIn(["extra-cheese", "jalapenos", "olives", "garlic-dip"], { each: true })
  extras?: string[];
}

export class CreateOrderDto {
  @ApiPropertyOptional({
    description: "Reuse for retries of the same checkout",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  idempotencyKey?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  menuVersion!: number;

  @ApiProperty()
  @IsMongoId()
  addressId!: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiProperty({ type: [OrderLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  lines!: OrderLineDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  leaveAtDoor?: boolean;

  @ApiPropertyOptional({ description: "ISO8601 delivery slot; omit for ASAP" })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryEntrance?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryFloor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryUnit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryDoorCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryInstructions?: string;
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
