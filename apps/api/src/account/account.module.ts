import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { PassportModule } from "@nestjs/passport";
import { AuditService } from "../common/security/audit.service";
import { AccountController } from "./account.controller";
import { AccountService } from "./account.service";
import { Invite, InviteSchema } from "./schemas/invite.schema";
import { OtpChallenge, OtpChallengeSchema } from "./schemas/otp.schema";
import {
  PasswordReset,
  PasswordResetSchema,
} from "./schemas/password-reset.schema";
import { User, UserSchema } from "./schemas/user.schema";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET") || "dev-secret",
        signOptions: {
          expiresIn: (config.get<string>("JWT_EXPIRES_IN") ||
            "7d") as `${number}d`,
        },
      }),
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: OtpChallenge.name, schema: OtpChallengeSchema },
      { name: Invite.name, schema: InviteSchema },
      { name: PasswordReset.name, schema: PasswordResetSchema },
    ]),
  ],
  controllers: [AccountController],
  providers: [AccountService, JwtStrategy, AuditService],
  exports: [AccountService, MongooseModule, AuditService],
})
export class AccountModule {}
