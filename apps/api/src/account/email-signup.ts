import {
  BadRequestException,
  ConflictException,
  Controller,
  Injectable,
  Post,
  Body,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import { Model } from "mongoose";
import {
  IsEmail,
  IsString,
  Matches,
  MinLength,
  MaxLength,
} from "class-validator";
import { Transform } from "class-transformer";
import { createHash, randomBytes, randomInt } from "crypto";
import * as bcrypt from "bcrypt";
import { User, UserDocument } from "./schemas/user.schema";
import { UserRole } from "../common/enums";

export class StartSignupDto {
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;
  @IsEmail() email!: string;
}
export class VerifySignupDto {
  @IsString() @Matches(/^[a-f0-9]{64}$/) challengeId!: string;
  @IsString() @Matches(/^\d{5}$/) code!: string;
}
export class CompleteSignupDto {
  @IsString() @Matches(/^[a-f0-9]{64}$/) token!: string;
  @IsString() @MinLength(8) @MaxLength(72) password!: string;
}
@Schema({ collection: "email_signups", timestamps: true })
export class EmailSignup {
  @Prop({ required: true, unique: true }) challengeId!: string;
  @Prop({ required: true }) email!: string;
  @Prop({ required: true }) firstName!: string;
  @Prop({ required: true }) lastName!: string;
  @Prop({ required: true }) codeHash!: string;
  @Prop({ default: 0 }) attempts!: number;
  @Prop({ default: false }) verified!: boolean;
  @Prop() tokenHash?: string;
  @Prop({ required: true }) expiresAt!: Date;
}
export const EmailSignupSchema = SchemaFactory.createForClass(EmailSignup);
EmailSignupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
@Injectable()
export class EmailSignupService {
  constructor(
    @InjectModel(EmailSignup.name) private readonly signups: Model<EmailSignup>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    private readonly config: ConfigService,
  ) {}
  async start(dto: StartSignupDto) {
    const email = dto.email.trim().toLowerCase();
    const isProduction = this.config.get<string>("NODE_ENV") === "production";
    const provider = this.config.get<string>("AUTH_EMAIL_PROVIDER") || "mock";
    const key = this.config.get<string>("RESEND_API_KEY");
    const from = this.config.get<string>("AUTH_EMAIL_FROM");
    const mockDomains = (this.config.get<string>("AUTH_EMAIL_MOCK_DOMAINS") || "").split(",").map(domain => domain.trim().toLowerCase()).filter(Boolean);
    const demoEmail = mockDomains.includes(email.split("@")[1]);
    const useMock = provider === "mock" && (!isProduction || (this.config.get<string>("AUTH_EMAIL_MOCK_ENABLED") === "true" && demoEmail));
    if (!useMock && (!key || !from))
      throw new ServiceUnavailableException(
        "Email verification is temporarily unavailable.",
      );
    if (await this.users.exists({ email }))
      throw new ConflictException(
        "An account with this email already exists. Please sign in.",
      );
    const challengeId = randomBytes(32).toString("hex");
    const code = String(randomInt(10000, 100000));
    await this.signups.create({
      ...dto,
      email,
      challengeId,
      codeHash: hash(challengeId + code),
      expiresAt: new Date(Date.now() + 600000),
    });
    if (useMock) {
      return { challengeId, email, verificationCode: code };
    }
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: "Verify your Yespiz email",
          text: `Your Yespiz verification code is ${code}. It expires in 10 minutes. If you did not request it, ignore this email.`,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("Delivery failed");
    } catch {
      await this.signups.deleteOne({ challengeId });
      throw new ServiceUnavailableException(
        "Could not send the verification code. Please try again.",
      );
    }
    return { challengeId, email };
  }
  async verify(dto: VerifySignupDto) {
    // Reserve an attempt atomically, including concurrent requests.
    const challenge = await this.signups
      .findOneAndUpdate(
        {
          challengeId: dto.challengeId,
          verified: false,
          attempts: { $lt: 5 },
          expiresAt: { $gt: new Date() },
        },
        { $inc: { attempts: 1 } },
        { new: true },
      )
      .exec();
    if (!challenge || challenge.codeHash !== hash(dto.challengeId + dto.code))
      throw new UnauthorizedException(
        "Invalid or expired code. Request a new code if needed.",
      );
    const token = randomBytes(32).toString("hex");
    const verified = await this.signups
      .findOneAndUpdate(
        {
          challengeId: dto.challengeId,
          verified: false,
          expiresAt: { $gt: new Date() },
        },
        {
          $set: {
            verified: true,
            tokenHash: hash(token),
            expiresAt: new Date(Date.now() + 600000),
          },
        },
      )
      .exec();
    if (!verified)
      throw new UnauthorizedException("This code has already been used.");
    return { token };
  }
  async complete(dto: CompleteSignupDto) {
    if (Buffer.byteLength(dto.password, "utf8") > 72)
      throw new BadRequestException("Password must be at most 72 bytes.");
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const signup = await this.signups
      .findOneAndDelete({
        tokenHash: hash(dto.token),
        verified: true,
        expiresAt: { $gt: new Date() },
      })
      .exec();
    if (!signup)
      throw new UnauthorizedException(
        "Your verification has expired. Please sign up again.",
      );
    try {
      await this.users.create({
        firstName: signup.firstName,
        lastName: signup.lastName,
        email: signup.email,
        passwordHash,
        emailVerifiedAt: new Date(),
        roles: [UserRole.CUSTOMER],
        activeRole: UserRole.CUSTOMER,
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000)
        throw new ConflictException(
          "An account with this email already exists. Please sign in.",
        );
      throw error;
    }
    return { status: "created" };
  }
}
@Controller("account/auth/signup")
export class EmailSignupController {
  constructor(private readonly signup: EmailSignupService) {}
  @Post() @Throttle({ default: { limit: 5, ttl: 60000 } }) start(
    @Body() dto: StartSignupDto,
  ) {
    return this.signup.start(dto);
  }
  @Post("verify") @Throttle({ default: { limit: 10, ttl: 60000 } }) verify(
    @Body() dto: VerifySignupDto,
  ) {
    return this.signup.verify(dto);
  }
  @Post("complete") @Throttle({ default: { limit: 5, ttl: 60000 } }) complete(
    @Body() dto: CompleteSignupDto,
  ) {
    return this.signup.complete(dto);
  }
}
