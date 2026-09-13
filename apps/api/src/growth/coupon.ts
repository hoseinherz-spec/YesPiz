import { BadRequestException } from "@nestjs/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
@Schema({ timestamps: true, collection: "discount_codes" })
export class Coupon {
  @Prop({ required: true, unique: true }) code!: string;
  @Prop({ required: true }) name!: string;
  @Prop({ required: true }) kind!: "fixed" | "percent";
  @Prop({ required: true }) value!: number;
  @Prop({ required: true }) minSubtotalCents!: number;
  @Prop({ required: true }) maxDiscountCents!: number;
  @Prop({ required: true }) startAt!: Date;
  @Prop({ required: true }) endAt!: Date;
  @Prop({ default: true }) active!: boolean;
  @Prop({ required: true }) createdBy!: string;
}
export const CouponSchema = SchemaFactory.createForClass(Coupon);
export class CreateCouponDto {
  @IsString() @Matches(/^[A-Z0-9-]{3,32}$/) code!: string;
  @IsString() @MinLength(3) @MaxLength(100) name!: string;
  @IsIn(["fixed", "percent"]) kind!: "fixed" | "percent";
  @IsInt() @Min(1) @Max(1000000) value!: number;
  @IsInt() @Min(0) @Max(1000000) minSubtotalCents!: number;
  @IsInt() @Min(1) @Max(1000000) maxDiscountCents!: number;
  @IsDateString() startAt!: string;
  @IsDateString() endAt!: string;
}
export class CouponStatusDto {
  @IsBoolean() active!: boolean;
}
export function couponDiscount(
  coupon: Pick<
    Coupon,
    | "active"
    | "startAt"
    | "endAt"
    | "minSubtotalCents"
    | "maxDiscountCents"
    | "kind"
    | "value"
  >,
  subtotal: number,
  now = new Date(),
) {
  if (!coupon.active || now < coupon.startAt || now >= coupon.endAt)
    throw new BadRequestException("This discount code is not active.");
  if (subtotal < coupon.minSubtotalCents)
    throw new BadRequestException(
      `This code requires a pizza subtotal of €${(coupon.minSubtotalCents / 100).toFixed(2)}.`,
    );
  return Math.min(
    subtotal,
    coupon.maxDiscountCents,
    coupon.kind === "percent"
      ? Math.floor((subtotal * coupon.value) / 100)
      : coupon.value,
  );
}
