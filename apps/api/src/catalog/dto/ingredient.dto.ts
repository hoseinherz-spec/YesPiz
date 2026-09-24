import { PartialType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from "class-validator";
export class CreateIngredientDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Length(1, 100)
  name!: string;
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(1000)
  description?: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(2048)
  @Matches(/^(?:https?:\/\/[^\s]+)?$/, {
    message: "Image must be an HTTP or HTTPS URL.",
  })
  image?: string;
}
export class UpdateIngredientDto extends PartialType(CreateIngredientDto) {}
