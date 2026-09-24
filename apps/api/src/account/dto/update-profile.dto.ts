import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, Length, Min } from "class-validator";
import { Transform } from "class-transformer";
export class UpdateProfileDto {
  @ApiProperty()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Length(1, 80)
  firstName!: string;
  @ApiProperty()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Length(1, 80)
  lastName!: string;
  @ApiProperty()
  @IsInt()
  @Min(0)
  revision!: number;
}
