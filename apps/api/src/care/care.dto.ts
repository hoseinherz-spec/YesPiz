import {
  IsOptional,
  IsBoolean,
  IsIn,
  IsInt,
  IsMongoId,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
export class SubmitFeedbackDto {
  @IsOptional() @IsBoolean() allowPublication?: boolean;
  @IsInt() @Min(1) @Max(5) taste!: number;
  @IsInt() @Min(1) @Max(5) temperature!: number;
  @IsInt() @Min(1) @Max(5) packaging!: number;
  @IsInt() @Min(1) @Max(5) delivery!: number;
  @IsBoolean() wouldOrderAgain!: boolean;
  @IsString() @MaxLength(2000) comment!: string;
}
export class CreateSupportDto {
  @IsMongoId() orderId!: string;
  @IsIn(["late", "missing", "quality", "payment", "other"]) category!: string;
  @IsString() @MinLength(5) @MaxLength(2000) message!: string;
  @IsString() @MinLength(8) @MaxLength(100) requestKey!: string;
}
export class ResolveSupportDto {
  @IsInt() @Min(0) revision!: number;
  @IsIn(["investigating", "resolved"]) status!: "investigating" | "resolved";
  @IsIn(["investigating", "contact_requested", "resolved"]) response!: string;
  @IsString() @MinLength(5) @MaxLength(2000) internalNote!: string;
}

export class ModerateFeedbackDto {
  @IsInt() @Min(0) revision!: number;
  @IsBoolean() published!: boolean;
  @IsMongoId() pizzaId!: string;
  @IsString() @MaxLength(2000) text!: string;
}

export class PublicationPermissionDto {
  @IsBoolean() allowPublication!: boolean;
}
