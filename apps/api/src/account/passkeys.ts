import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { InjectModel, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ConfigService } from "@nestjs/config";
import { Model, HydratedDocument, Types } from "mongoose";
import {
  IsObject,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";
import { Throttle } from "@nestjs/throttler";
import { randomUUID } from "crypto";
import * as bcrypt from "bcrypt";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from "@simplewebauthn/server";
import { User, UserDocument } from "./schemas/user.schema";
import { AccountService } from "./account.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { UserRole } from "../common/enums";
@Schema({ timestamps: true, collection: "passkeys" })
export class Passkey {
  @Prop({ required: true, index: true }) userId!: string;
  @Prop({ required: true, unique: true }) credentialId!: string;
  @Prop({ required: true }) publicKey!: string;
  @Prop({ required: true }) counter!: number;
  @Prop({ required: true }) name!: string;
  @Prop({ type: Date }) lastUsedAt?: Date;
}
export const PasskeySchema = SchemaFactory.createForClass(Passkey);
@Schema({ collection: "passkey_challenges" })
export class PasskeyChallenge {
  @Prop({ required: true, unique: true }) requestId!: string;
  @Prop({ required: true }) challenge!: string;
  @Prop() userId?: string;
  @Prop({ required: true }) kind!: string;
  @Prop({ required: true }) expiresAt!: Date;
}
export const PasskeyChallengeSchema =
  SchemaFactory.createForClass(PasskeyChallenge);
PasskeyChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
class EnrollDto {
  @IsString() @MinLength(1) @MaxLength(200) password!: string;
}
class VerifyDto {
  @IsUUID() requestId!: string;
  @IsObject() response!: RegistrationResponseJSON;
  @IsString() @MinLength(1) @MaxLength(60) name!: string;
}
class AuthDto {
  @IsUUID() requestId!: string;
  @IsObject() response!: AuthenticationResponseJSON;
}
@Injectable()
export class PasskeysService {
  constructor(
    @InjectModel(Passkey.name) private keys: Model<HydratedDocument<Passkey>>,
    @InjectModel(PasskeyChallenge.name)
    private challenges: Model<HydratedDocument<PasskeyChallenge>>,
    @InjectModel(User.name) private users: Model<UserDocument>,
    private config: ConfigService,
    private account: AccountService,
  ) {}
  private settings() {
    const rpID =
      this.config.get<string>("WEBAUTHN_RP_ID") ||
      (this.config.get("NODE_ENV") !== "production" ? "localhost" : "");
    const origin =
      this.config.get<string>("WEBAUTHN_ORIGIN") ||
      (this.config.get("NODE_ENV") !== "production"
        ? "http://localhost:8151"
        : "");
    if (!rpID || !origin)
      throw new BadRequestException("Passkey domain is not configured.");
    return { rpID, origin };
  }
  private async user(id: string) {
    const user = await this.users.findById(id);
    if (!user || !user.isActive || !user.roles.includes(UserRole.CUSTOMER))
      throw new UnauthorizedException();
    return user;
  }
  async list(id: string) {
    return this.keys
      .find({ userId: id })
      .select("name createdAt lastUsedAt")
      .lean();
  }
  async remove(id: string, keyId: string) {
    if (!Types.ObjectId.isValid(keyId))
      throw new BadRequestException("Invalid passkey.");
    await this.keys.deleteOne({ _id: keyId, userId: id });
    return { removed: true };
  }
  private async challenge(kind: string, challenge: string, userId?: string) {
    const requestId = randomUUID();
    await this.challenges.create({
      kind,
      challenge,
      userId,
      requestId,
      expiresAt: new Date(Date.now() + 300000),
    });
    return requestId;
  }
  private async consume(kind: string, requestId: string, userId?: string) {
    const result = await this.challenges.findOneAndDelete({
      kind,
      requestId,
      ...(userId ? { userId } : {}),
      expiresAt: { $gt: new Date() },
    });
    if (!result)
      throw new BadRequestException(
        "Passkey request expired or was already used. Start again.",
      );
    return result.challenge;
  }
  async registerOptions(id: string, password: string) {
    const user = await this.user(id);
    if (
      !user.passwordHash ||
      !(await bcrypt.compare(password, user.passwordHash))
    )
      throw new UnauthorizedException(
        "Confirm your current password before adding a passkey.",
      );
    const keys = await this.keys.find({ userId: id });
    if (keys.length >= 10)
      throw new BadRequestException(
        "Remove an unused passkey before adding another.",
      );
    const { rpID } = this.settings();
    const options = await generateRegistrationOptions({
      rpName: "Yespiz",
      rpID,
      userID: Buffer.from(id),
      userName: user.email || user.phone || id,
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "required",
        authenticatorAttachment: "platform",
      },
      excludeCredentials: keys.map((k) => ({ id: k.credentialId })),
    });
    return {
      options,
      requestId: await this.challenge("register", options.challenge, id),
    };
  }
  async register(id: string, dto: VerifyDto) {
    await this.user(id);
    const challenge = await this.consume("register", dto.requestId, id);
    const { rpID, origin } = this.settings();
    let result;
    try {
      result = await verifyRegistrationResponse({
        response: dto.response,
        expectedChallenge: challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: true,
      });
    } catch {
      throw new BadRequestException(
        "The passkey could not be verified. Start again.",
      );
    }
    if (!result.verified || !result.registrationInfo)
      throw new BadRequestException("Passkey verification failed.");
    const c = result.registrationInfo.credential;
    await this.keys.create({
      userId: id,
      credentialId: c.id,
      publicKey: Buffer.from(c.publicKey).toString("base64"),
      counter: c.counter,
      name: dto.name.trim() || "My device",
    });
    return { registered: true };
  }
  async authOptions() {
    const { rpID } = this.settings();
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "required",
    });
    return {
      options,
      requestId: await this.challenge("authenticate", options.challenge),
    };
  }
  async authenticate(dto: AuthDto) {
    const challenge = await this.consume("authenticate", dto.requestId);
    const key = await this.keys.findOne({ credentialId: dto.response.id });
    if (!key) throw new UnauthorizedException("Passkey is not registered.");
    const { rpID, origin } = this.settings();
    let result;
    try {
      result = await verifyAuthenticationResponse({
        response: dto.response,
        expectedChallenge: challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: true,
        credential: {
          id: key.credentialId,
          publicKey: Buffer.from(key.publicKey, "base64"),
          counter: key.counter,
        },
      });
    } catch {
      throw new UnauthorizedException("Passkey verification failed.");
    }
    if (!result.verified) throw new UnauthorizedException();
    const updated = await this.keys.updateOne(
      { _id: key._id, counter: key.counter },
      {
        $set: {
          counter: result.authenticationInfo.newCounter,
          lastUsedAt: new Date(),
        },
      },
    );
    if (!updated.matchedCount)
      throw new UnauthorizedException("Passkey changed. Retry sign in.");
    return this.account.passkeyToken(await this.user(key.userId));
  }
}
@Controller("account/passkeys")
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class PasskeysController {
  constructor(private service: PasskeysService) {}
  @Get() @UseGuards(JwtAuthGuard) list(@CurrentUser() u: JwtPayloadUser) {
    return this.service.list(u.userId);
  }
  @Delete(":id") @UseGuards(JwtAuthGuard) remove(
    @CurrentUser() u: JwtPayloadUser,
    @Param("id") id: string,
  ) {
    return this.service.remove(u.userId, id);
  }
  @Post("register/options") @UseGuards(JwtAuthGuard) options(
    @CurrentUser() u: JwtPayloadUser,
    @Body() dto: EnrollDto,
  ) {
    return this.service.registerOptions(u.userId, dto.password);
  }
  @Post("register/verify") @UseGuards(JwtAuthGuard) register(
    @CurrentUser() u: JwtPayloadUser,
    @Body() dto: VerifyDto,
  ) {
    return this.service.register(u.userId, dto);
  }
  @Post("authenticate/options") authOptions() {
    return this.service.authOptions();
  }
  @Post("authenticate/verify") authenticate(@Body() dto: AuthDto) {
    return this.service.authenticate(dto);
  }
}
