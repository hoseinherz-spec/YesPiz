import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

/** Public signup/login role selection — never privileged. */
export const PUBLIC_ROLES = ["customer", "client"] as const;
export const ALL_LOGIN_ROLES = [
  "customer",
  "client",
  "admin",
  "provider",
  "courier",
] as const;
export const INVITE_ROLES = ["admin", "provider", "courier"] as const;

export class LocationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;
}

export class RegisterDto {
  @ApiProperty()
  @IsString()
  firstName!: string;

  @ApiProperty()
  @IsString()
  lastName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password!: string;

  /** Ignored if present; public registration is always customer. */
  @ApiPropertyOptional({ enum: PUBLIC_ROLES })
  @IsOptional()
  @IsIn(PUBLIC_ROLES)
  role?: string;

  @ApiPropertyOptional({ type: LocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}

export class SendOtpDto {
  @ApiProperty()
  @IsString()
  phone!: string;

  @ApiPropertyOptional({ enum: PUBLIC_ROLES })
  @IsOptional()
  @IsIn(PUBLIC_ROLES)
  role?: string;

  @ApiPropertyOptional({ default: "sms" })
  @IsOptional()
  @IsString()
  channel?: string;
}

export class ConfirmOtpDto {
  @ApiProperty()
  @IsString()
  phone!: string;

  @ApiProperty()
  @IsString()
  code!: string;

  @ApiPropertyOptional({ enum: PUBLIC_ROLES })
  @IsOptional()
  @IsIn(PUBLIC_ROLES)
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ type: LocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}

export class LoginDto {
  @ApiProperty({ enum: ["password", "google"] })
  @IsIn(["password", "google"])
  method!: "password" | "google";

  @ApiProperty({ enum: ALL_LOGIN_ROLES })
  @IsIn(ALL_LOGIN_ROLES)
  role!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  /** Required to attach a privileged role via Google when invited. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inviteToken?: string;
}

export class RoleLoginDto {
  @ApiProperty({ enum: ["password", "google"] })
  @IsIn(["password", "google"])
  method!: "password" | "google";

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inviteToken?: string;
}

export class CreateInviteDto {
  @ApiProperty({ enum: INVITE_ROLES })
  @IsIn(INVITE_ROLES)
  role!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  /** Hours until expiry (default 72, max 168). */
  @ApiPropertyOptional({ default: 72 })
  @IsOptional()
  @IsNumber()
  expiresInHours?: number;
}

export class AcceptInviteDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty()
  @IsString()
  firstName!: string;

  @ApiProperty()
  @IsString()
  lastName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ type: LocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}

export class BootstrapAdminDto {
  @ApiProperty()
  @IsString()
  firstName!: string;

  @ApiProperty()
  @IsString()
  lastName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bootstrapSecret?: string;
}

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password!: string;
}
