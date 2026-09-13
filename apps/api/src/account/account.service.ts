import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import * as bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { Model, Types } from "mongoose";
import { createHash, createPublicKey, randomBytes, randomInt } from "crypto";
import Twilio from "twilio";
import { AuditService } from "../common/security/audit.service";
import { isOtpDevBypassEnabled } from "../common/security/production-guards";
import { normalizeRole, toPublicRole, UserRole } from "../common/enums";
import {
  applyCashRestoreScore,
  applyFailedCashPenalty,
  tierFromScore,
} from "./cash-trust.util";
import {
  SocialLoginDto,
  AcceptInviteDto,
  BootstrapAdminDto,
  ConfirmOtpDto,
  CreateInviteDto,
  ForgotPasswordDto,
  LocationDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  SendOtpDto,
} from "./dto/auth.dto";
import { Invite, InviteDocument } from "./schemas/invite.schema";
import { OtpChallenge, OtpChallengeDocument } from "./schemas/otp.schema";
import {
  PasswordReset,
  PasswordResetDocument,
} from "./schemas/password-reset.schema";
import { User, UserDocument } from "./schemas/user.schema";

const PRIVILEGED: UserRole[] = [
  UserRole.ADMIN,
  UserRole.PROVIDER,
  UserRole.COURIER,
];

const MAX_OTP_ATTEMPTS = 5;
const OTP_COOLDOWN_MS = 60_000;

@Injectable()
export class AccountService {
  private googleClient: OAuth2Client | null = null;
  private twilio: ReturnType<typeof Twilio> | null = null;
  private readonly otpSendAt = new Map<string, number>();

  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(OtpChallenge.name)
    private readonly otps: Model<OtpChallengeDocument>,
    @InjectModel(Invite.name) private readonly invites: Model<InviteDocument>,
    @InjectModel(PasswordReset.name)
    private readonly passwordResets: Model<PasswordResetDocument>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
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
    if (dto.role) {
      const requested = normalizeRole(dto.role);
      if (requested !== UserRole.CUSTOMER) {
        throw new ForbiddenException("errors.forbidden");
      }
    }
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
      roles: [UserRole.CUSTOMER],
      activeRole: UserRole.CUSTOMER,
      location: this.mapLocation(dto.location),
    });
    this.audit.record("auth.register", {
      targetUserId: user.id,
      meta: { role: UserRole.CUSTOMER },
    });
    return this.tokenResponse(user, UserRole.CUSTOMER);
  }

  async sendOtp(dto: SendOtpDto) {
    const role = UserRole.CUSTOMER;
    if (dto.role && normalizeRole(dto.role) !== UserRole.CUSTOMER) {
      throw new ForbiddenException("errors.forbidden");
    }
    const phone = dto.phone.trim();
    const cooldownKey = `${phone}:${role}`;
    const last = this.otpSendAt.get(cooldownKey) ?? 0;
    if (Date.now() - last < OTP_COOLDOWN_MS) {
      throw new HttpException(
        "errors.rateLimited",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.otpSendAt.set(cooldownKey, Date.now());

    const bypass = isOtpDevBypassEnabled(this.config);
    const code = bypass ? "000000" : String(randomInt(100000, 999999));
    const codeHash = this.hashCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.otps.deleteMany({ phone, role }).exec();
    await this.otps.create({ phone, role, codeHash, expiresAt, attempts: 0 });

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

    this.audit.record("auth.otp.send", { meta: { phone, bypass } });
    return {
      status: "sent",
      phone,
      role: toPublicRole(role),
      channel: dto.channel || "sms",
    };
  }

  async confirmOtp(dto: ConfirmOtpDto) {
    if (dto.role && normalizeRole(dto.role) !== UserRole.CUSTOMER) {
      throw new ForbiddenException("errors.forbidden");
    }
    const role = UserRole.CUSTOMER;
    const phone = dto.phone.trim();
    const bypass = isOtpDevBypassEnabled(this.config);

    if (!(bypass && dto.code === "000000")) {
      const challenge = await this.otps.findOne({ phone, role }).exec();
      if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
        throw new UnauthorizedException("errors.otpInvalid");
      }
      if ((challenge.attempts ?? 0) >= MAX_OTP_ATTEMPTS) {
        throw new HttpException(
          "errors.rateLimited",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      const serviceSid = this.config.get<string>("TWILIO_VERIFY_SERVICE_SID");
      if (this.twilio && serviceSid && !bypass) {
        try {
          const check = await this.twilio.verify.v2
            .services(serviceSid)
            .verificationChecks.create({ to: phone, code: dto.code });
          if (check.status !== "approved") {
            challenge.attempts = (challenge.attempts ?? 0) + 1;
            await challenge.save();
            throw new UnauthorizedException("errors.otpInvalid");
          }
        } catch (err) {
          if (err instanceof UnauthorizedException) throw err;
          challenge.attempts = (challenge.attempts ?? 0) + 1;
          await challenge.save();
          throw new UnauthorizedException("errors.otpInvalid");
        }
      } else if (challenge.codeHash !== this.hashCode(dto.code)) {
        challenge.attempts = (challenge.attempts ?? 0) + 1;
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

    this.audit.record("auth.otp.confirm", { targetUserId: user.id });
    return this.tokenResponse(user, role);
  }

  async login(dto: LoginDto) {
    const role = normalizeRole(dto.role);
    if (dto.method === "password") {
      return this.passwordLogin(dto.email, dto.password, role);
    }
    return this.googleLogin(dto, role);
  }

  async requestPasswordReset(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase();
    const user = await this.users.findOne({ email }).exec();
    const opaque = { status: "sent" as const };
    if (!user?.passwordHash) {
      return opaque;
    }
    await this.passwordResets.deleteMany({ userId: user._id }).exec();
    const rawToken = randomBytes(32).toString("hex");
    await this.passwordResets.create({
      userId: user._id,
      tokenHash: this.hashCode(rawToken),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    this.audit.record("auth.password_reset.request", {
      targetUserId: user.id,
      meta: { email },
    });
    const isProd = this.config.get<string>("NODE_ENV") === "production";
    if (!isProd) {
      return { ...opaque, resetToken: rawToken };
    }
    return opaque;
  }

  async confirmPasswordReset(dto: ResetPasswordDto) {
    const reset = await this.passwordResets
      .findOne({ tokenHash: this.hashCode(dto.token) })
      .exec();
    if (!reset || reset.usedAt || reset.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException("errors.resetInvalid");
    }
    const user = await this.users.findById(reset.userId).exec();
    if (!user) {
      throw new UnauthorizedException("errors.resetInvalid");
    }
    user.passwordHash = await bcrypt.hash(dto.password, 10);
    await user.save();
    reset.usedAt = new Date();
    await reset.save();
    await this.passwordResets
      .deleteMany({ userId: user._id, _id: { $ne: reset._id } })
      .exec();
    this.audit.record("auth.password_reset.confirm", {
      targetUserId: user.id,
    });
    return { status: "reset" as const };
  }

  async createInvite(adminUserId: string, dto: CreateInviteDto) {
    const role = normalizeRole(dto.role);
    if (!PRIVILEGED.includes(role)) {
      throw new BadRequestException("errors.badRequest");
    }
    const hours = Math.min(Math.max(dto.expiresInHours ?? 72, 1), 168);
    const rawToken = randomBytes(32).toString("hex");
    const invite = await this.invites.create({
      tokenHash: this.hashCode(rawToken),
      role,
      email: dto.email?.toLowerCase(),
      createdBy: new Types.ObjectId(adminUserId),
      expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
    });
    this.audit.record("auth.invite.create", {
      actorUserId: adminUserId,
      meta: { role, email: invite.email },
    });
    return {
      id: invite.id,
      role: toPublicRole(role),
      email: invite.email,
      expiresAt: invite.expiresAt.toISOString(),
      token: rawToken,
    };
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const invite = await this.findValidInvite(dto.token);
    if (invite.email && invite.email !== dto.email.toLowerCase()) {
      throw new ForbiddenException("errors.inviteEmailMismatch");
    }
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
      roles: [invite.role],
      activeRole: invite.role,
      location: this.mapLocation(dto.location),
      emailVerifiedAt: new Date(),
    });
    invite.usedAt = new Date();
    invite.usedBy = user._id as Types.ObjectId;
    await invite.save();
    this.audit.record("auth.invite.accept", {
      targetUserId: user.id,
      meta: { role: invite.role },
    });
    return this.tokenResponse(user, invite.role);
  }

  async bootstrapAdmin(dto: BootstrapAdminDto) {
    const adminCount = await this.users
      .countDocuments({ roles: UserRole.ADMIN })
      .exec();
    if (adminCount > 0) {
      throw new ForbiddenException("errors.bootstrapUnavailable");
    }
    const isProd = this.config.get<string>("NODE_ENV") === "production";
    const expected = this.config.get<string>("BOOTSTRAP_ADMIN_SECRET");
    if (isProd) {
      if (!expected || dto.bootstrapSecret !== expected) {
        throw new ForbiddenException("errors.bootstrapUnavailable");
      }
    }
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
      roles: [UserRole.ADMIN],
      activeRole: UserRole.ADMIN,
      emailVerifiedAt: new Date(),
    });
    this.audit.record("auth.bootstrap_admin", { targetUserId: user.id });
    return this.tokenResponse(user, UserRole.ADMIN);
  }

  async provisionUser(input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: UserRole;
  }) {
    if (input.role === UserRole.CUSTOMER) {
      throw new BadRequestException("errors.badRequest");
    }
    const existing = await this.users
      .findOne({ email: input.email.toLowerCase() })
      .exec();
    if (existing) {
      return existing;
    }
    return this.users.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.toLowerCase(),
      passwordHash: await bcrypt.hash(input.password, 10),
      roles: [input.role],
      activeRole: input.role,
      emailVerifiedAt: new Date(),
    });
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

  private async findValidInvite(rawToken: string) {
    const invite = await this.invites
      .findOne({ tokenHash: this.hashCode(rawToken) })
      .exec();
    if (!invite) {
      throw new UnauthorizedException("errors.inviteInvalid");
    }
    if (invite.usedAt) {
      throw new UnauthorizedException("errors.inviteUsed");
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException("errors.inviteExpired");
    }
    return invite;
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
    this.audit.record("auth.login", {
      targetUserId: user.id,
      meta: { role, method: "password" },
    });
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

      let invite: InviteDocument | null = null;
      if (PRIVILEGED.includes(role)) {
        if (!dto.inviteToken) {
          throw new ForbiddenException("errors.inviteRequired");
        }
        invite = await this.findValidInvite(dto.inviteToken);
        if (invite.role !== role) {
          throw new ForbiddenException("errors.inviteRoleMismatch");
        }
        if (invite.email && invite.email !== payload.email.toLowerCase()) {
          throw new ForbiddenException("errors.inviteEmailMismatch");
        }
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
        const assignedRole = invite ? invite.role : UserRole.CUSTOMER;
        if (PRIVILEGED.includes(role) && assignedRole !== role) {
          throw new ForbiddenException("errors.inviteRequired");
        }
        if (!invite && role !== UserRole.CUSTOMER) {
          throw new ForbiddenException("errors.inviteRequired");
        }
        user = await this.users.create({
          firstName,
          lastName,
          email: payload.email.toLowerCase(),
          googleSub: payload.sub,
          roles: [assignedRole],
          activeRole: assignedRole,
          emailVerifiedAt: new Date(),
        });
        if (invite) {
          invite.usedAt = new Date();
          invite.usedBy = user._id as Types.ObjectId;
          await invite.save();
        }
        this.audit.record("auth.login", {
          targetUserId: user.id,
          meta: { role: assignedRole, method: "google", created: true },
        });
        return this.tokenResponse(user, assignedRole);
      }

      if (!user.roles.includes(role)) {
        if (!invite || invite.role !== role) {
          throw new ForbiddenException("errors.inviteRequired");
        }
        user.roles.push(role);
        invite.usedAt = new Date();
        invite.usedBy = user._id as Types.ObjectId;
        await invite.save();
      }
      user.googleSub = payload.sub;
      user.activeRole = role;
      user.emailVerifiedAt = user.emailVerifiedAt || new Date();
      await user.save();
      this.audit.record("auth.login", {
        targetUserId: user.id,
        meta: { role, method: "google" },
      });
      return this.tokenResponse(user, role);
    } catch (err) {
      if (
        err instanceof BadRequestException ||
        err instanceof UnauthorizedException ||
        err instanceof ForbiddenException
      ) {
        throw err;
      }
      throw new UnauthorizedException("errors.googleAuthFailed");
    }
  }

  async socialLogin(dto: SocialLoginDto) {
    let payload: {
      sub?: string;
      email?: string;
      email_verified?: boolean | string;
      nonce?: string;
      given_name?: string;
      family_name?: string;
    };
    try {
      if (dto.provider === "google") {
        const audience = this.config.get<string>("GOOGLE_CLIENT_ID");
        if (!audience || !this.googleClient)
          throw new BadRequestException("Google sign-in is not configured.");
        const ticket = await this.googleClient.verifyIdToken({
          idToken: dto.idToken,
          audience,
        });
        payload = ticket.getPayload()!;
      } else {
        const audience = this.config.get<string>("APPLE_CLIENT_ID");
        if (!audience)
          throw new BadRequestException("Apple sign-in is not configured.");
        const header = JSON.parse(
          Buffer.from(dto.idToken.split(".")[0], "base64url").toString(),
        );
        if (header.alg !== "RS256" || typeof header.kid !== "string")
          throw new Error("Invalid token header");
        const response = await fetch("https://appleid.apple.com/auth/keys", {
          signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error("Unable to verify Apple token");
        const { keys } = (await response.json()) as {
          keys: Array<import("crypto").JsonWebKey & { kid: string }>;
        };
        const key = keys.find((candidate) => candidate.kid === header.kid);
        if (!key) throw new Error("Unknown signing key");
        const publicKey = createPublicKey({ key, format: "jwk" })
          .export({ type: "spki", format: "pem" })
          .toString();
        payload = await this.jwt.verifyAsync(dto.idToken, {
          publicKey,
          algorithms: ["RS256"],
          issuer: "https://appleid.apple.com",
          audience,
        });
      }
      if (!payload?.sub || payload.nonce !== dto.nonce)
        throw new Error("Invalid identity");
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new UnauthorizedException("Unable to verify your social sign-in.");
    }
    const identity =
      dto.provider === "apple"
        ? { appleSub: payload.sub }
        : { googleSub: payload.sub };
    let user = await this.users.findOne(identity).exec();
    if (!user) {
      if (!payload.email || ![true, "true"].includes(payload.email_verified!)) {
        throw new UnauthorizedException("A verified email is required.");
      }
      const email = payload.email.toLowerCase();
      // Never silently link an existing account based on an email claim.
      if (await this.users.exists({ email })) {
        throw new ConflictException(
          "An account with this email already exists. Use your existing sign-in method.",
        );
      }
      user = await this.users.create({
        ...identity,
        email,
        firstName: payload.given_name || "User",
        lastName: payload.family_name || dto.provider,
        roles: [UserRole.CUSTOMER],
        activeRole: UserRole.CUSTOMER,
        emailVerifiedAt: new Date(),
      });
    }
    if (!user.isActive || !user.roles.includes(UserRole.CUSTOMER)) {
      throw new ForbiddenException(
        "This account cannot sign in as a customer.",
      );
    }
    this.audit.record("auth.login", {
      targetUserId: user.id,
      meta: { role: UserRole.CUSTOMER, method: dto.provider },
    });
    return this.tokenResponse(user, UserRole.CUSTOMER);
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
      cashTrustScore: user.cashTrustScore,
      cashTrustTier: user.cashTrustTier,
      creditCents: user.creditCents,
      cashRestoredAt: user.cashRestoredAt?.toISOString(),
      cashRestoreReason: user.cashRestoreReason,
    };
  }

  applyCashTrustFailed(user: UserDocument) {
    user.cashTrustScore = applyFailedCashPenalty(user.cashTrustScore ?? 100);
    user.cashTrustTier = tierFromScore(user.cashTrustScore, user.cashBanned);
  }

  applyCashTrustRestore(user: UserDocument) {
    user.cashTrustScore = applyCashRestoreScore();
    user.cashBanned = false;
    user.cashTrustTier = tierFromScore(user.cashTrustScore, false);
  }

  async restoreCash(userId: string, reason: string, actorUserId?: string) {
    const user = await this.users.findById(userId).exec();
    if (!user) {
      throw new BadRequestException("errors.badRequest");
    }
    this.applyCashTrustRestore(user);
    user.cashRestoredAt = new Date();
    user.cashRestoreReason = reason;
    await user.save();
    this.audit.record("cash.restore", {
      actorUserId,
      targetUserId: userId,
      meta: { reason },
    });
    return this.toProfile(user);
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
