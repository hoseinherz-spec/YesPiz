import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import * as bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { Model } from "mongoose";
import { createHash, randomInt } from "crypto";
import Twilio from "twilio";
import { normalizeRole, toPublicRole, UserRole } from "../common/enums";
import {
  ConfirmOtpDto,
  LocationDto,
  LoginDto,
  RegisterDto,
  SendOtpDto,
} from "./dto/auth.dto";
import { OtpChallenge, OtpChallengeDocument } from "./schemas/otp.schema";
import { User, UserDocument } from "./schemas/user.schema";

@Injectable()
export class AccountService {
  private googleClient: OAuth2Client | null = null;
  private twilio: ReturnType<typeof Twilio> | null = null;

  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(OtpChallenge.name)
    private readonly otps: Model<OtpChallengeDocument>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    const googleId = this.config.get<string>("GOOGLE_CLIENT_ID");
    if (googleId) {
      this.googleClient = new OAuth2Client(googleId);
    }
    const sid = this.config.get<string>("TWILIO_ACCOUNT_SID");
    const token = this.config.get<string>("TWILIO_AUTH_TOKEN");
    if (sid && token) {
      this.twilio = Twilio(sid, token);
    }
  }

  async register(dto: RegisterDto) {
    const role = normalizeRole(dto.role);
    const existing = await this.users
      .findOne({ email: dto.email.toLowerCase() })
      .exec();
    if (existing) {
      throw new ConflictException("errors.conflict");
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email.toLowerCase(),
      passwordHash,
      roles: [role],
      activeRole: role,
      location: this.mapLocation(dto.location),
      emailVerifiedAt: new Date(),
    });
    return this.tokenResponse(user, role);
  }

  async sendOtp(dto: SendOtpDto) {
    const role = normalizeRole(dto.role);
    const phone = dto.phone.trim();
    const bypass = this.config.get<string>("OTP_DEV_BYPASS") === "true";
    const code = bypass ? "000000" : String(randomInt(100000, 999999));
    const codeHash = this.hashCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.otps.deleteMany({ phone, role }).exec();
    await this.otps.create({ phone, role, codeHash, expiresAt });

    if (!bypass) {
      const serviceSid = this.config.get<string>("TWILIO_VERIFY_SERVICE_SID");
      if (!this.twilio || !serviceSid) {
        throw new BadRequestException("errors.twilioNotConfigured");
      }
      try {
        await this.twilio.verify.v2.services(serviceSid).verifications.create({
          to: phone,
          channel: dto.channel || "sms",
        });
      } catch {
        throw new BadRequestException("errors.otpSendFailed");
      }
    }

    return {
      status: "sent",
      phone,
      role: toPublicRole(role),
      channel: dto.channel || "sms",
    };
  }

  async confirmOtp(dto: ConfirmOtpDto) {
    const role = normalizeRole(dto.role);
    const phone = dto.phone.trim();
    const bypass = this.config.get<string>("OTP_DEV_BYPASS") === "true";

    if (!(bypass && dto.code === "000000")) {
      const challenge = await this.otps.findOne({ phone, role }).exec();
      if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
        throw new UnauthorizedException("errors.otpInvalid");
      }
      const serviceSid = this.config.get<string>("TWILIO_VERIFY_SERVICE_SID");
      if (this.twilio && serviceSid && !bypass) {
        try {
          const check = await this.twilio.verify.v2
            .services(serviceSid)
            .verificationChecks.create({ to: phone, code: dto.code });
          if (check.status !== "approved") {
            throw new UnauthorizedException("errors.otpInvalid");
          }
        } catch {
          throw new UnauthorizedException("errors.otpInvalid");
        }
      } else if (challenge.codeHash !== this.hashCode(dto.code)) {
        challenge.attempts += 1;
        await challenge.save();
        throw new UnauthorizedException("errors.otpInvalid");
      }
      await this.otps.deleteMany({ phone, role }).exec();
    }

    let user = await this.users.findOne({ phone }).exec();
    if (!user) {
      if (!dto.firstName || !dto.lastName) {
        throw new BadRequestException("errors.profileNameRequired");
      }
      user = await this.users.create({
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone,
        roles: [role],
        activeRole: role,
        location: this.mapLocation(dto.location),
        phoneVerifiedAt: new Date(),
      });
    } else {
      if (!user.roles.includes(role)) {
        user.roles.push(role);
      }
      user.activeRole = role;
      user.phoneVerifiedAt = new Date();
      if (dto.location) {
        user.location = this.mapLocation(dto.location);
      }
      await user.save();
    }

    return this.tokenResponse(user, role);
  }

  async login(dto: LoginDto) {
    const role = normalizeRole(dto.role);
    if (dto.method === "password") {
      return this.passwordLogin(dto.email, dto.password, role);
    }
    return this.googleLogin(dto, role);
  }

  async getProfile(userId: string) {
    const user = await this.users.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException("errors.unauthorized");
    }
    return this.toProfile(user);
  }

  async findById(userId: string) {
    return this.users.findById(userId).exec();
  }

  private async passwordLogin(
    email?: string,
    password?: string,
    role: UserRole = UserRole.CUSTOMER,
  ) {
    if (!email || !password) {
      throw new BadRequestException("errors.badRequest");
    }
    const user = await this.users
      .findOne({ email: email.toLowerCase() })
      .exec();
    if (!user?.passwordHash) {
      throw new UnauthorizedException("errors.invalidCredentials");
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("errors.invalidCredentials");
    }
    if (!user.roles.includes(role)) {
      throw new UnauthorizedException("errors.roleNotAllowed");
    }
    user.activeRole = role;
    await user.save();
    return this.tokenResponse(user, role);
  }

  private async googleLogin(dto: LoginDto, role: UserRole) {
    if (!this.googleClient) {
      throw new BadRequestException("errors.googleNotConfigured");
    }
    if (!dto.idToken) {
      throw new BadRequestException("errors.badRequest");
    }
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
        audience: this.config.get<string>("GOOGLE_CLIENT_ID") || undefined,
      });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email) {
        throw new UnauthorizedException("errors.googleAuthFailed");
      }
      let user = await this.users
        .findOne({
          $or: [
            { googleSub: payload.sub },
            { email: payload.email.toLowerCase() },
          ],
        })
        .exec();
      if (!user) {
        const firstName = dto.firstName || payload.given_name || "User";
        const lastName = dto.lastName || payload.family_name || "Google";
        user = await this.users.create({
          firstName,
          lastName,
          email: payload.email.toLowerCase(),
          googleSub: payload.sub,
          roles: [role],
          activeRole: role,
          emailVerifiedAt: new Date(),
        });
      } else {
        if (!user.roles.includes(role)) {
          user.roles.push(role);
        }
        user.googleSub = payload.sub;
        user.activeRole = role;
        user.emailVerifiedAt = user.emailVerifiedAt || new Date();
        await user.save();
      }
      return this.tokenResponse(user, role);
    } catch (err) {
      if (
        err instanceof BadRequestException ||
        err instanceof UnauthorizedException
      ) {
        throw err;
      }
      throw new UnauthorizedException("errors.googleAuthFailed");
    }
  }

  private tokenResponse(user: UserDocument, activeRole: UserRole) {
    const expiresIn = this.parseExpires(
      this.config.get<string>("JWT_EXPIRES_IN") || "7d",
    );
    const publicRoles = user.roles.map(toPublicRole);
    const accessToken = this.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        phone: user.phone,
        roles: publicRoles,
        activeRole: toPublicRole(activeRole),
      },
      {
        secret: this.config.get<string>("JWT_SECRET") || "dev-secret",
        expiresIn,
      },
    );
    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        roles: publicRoles,
        activeRole: toPublicRole(activeRole),
      },
    };
  }

  private toProfile(user: UserDocument) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      roles: user.roles.map(toPublicRole),
      activeRole: toPublicRole(user.activeRole),
      location: user.location,
      isActive: user.isActive,
      phoneVerifiedAt: user.phoneVerifiedAt?.toISOString(),
      emailVerifiedAt: user.emailVerifiedAt?.toISOString(),
      createdAt:
        (
          user as UserDocument & { createdAt: Date }
        ).createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt:
        (
          user as UserDocument & { updatedAt: Date }
        ).updatedAt?.toISOString?.() ?? new Date().toISOString(),
      cashBanned: user.cashBanned,
      failedCashCount: user.failedCashCount,
    };
  }

  private mapLocation(location?: LocationDto) {
    if (!location) return undefined;
    const longitude = location.longitude;
    const latitude = location.latitude;
    return {
      ...location,
      coordinates:
        longitude != null && latitude != null
          ? {
              type: "Point" as const,
              coordinates: [longitude, latitude] as [number, number],
            }
          : undefined,
    };
  }

  private hashCode(code: string) {
    return createHash("sha256").update(code).digest("hex");
  }

  private parseExpires(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) return 7 * 24 * 3600;
    const n = Number(match[1]);
    const unit = match[2];
    switch (unit) {
      case "s":
        return n;
      case "m":
        return n * 60;
      case "h":
        return n * 3600;
      case "d":
        return n * 86400;
      default:
        return 7 * 24 * 3600;
    }
  }
}
