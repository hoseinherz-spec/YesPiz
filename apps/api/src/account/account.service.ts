import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
  ServiceUnavailableException,
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
  ConfirmPasswordResetOtpDto,
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

import { UpdateProfileDto } from "./dto/update-profile.dto";

const PRIVILEGED: UserRole[] = [
  UserRole.ADMIN,
  UserRole.PROVIDER,
  UserRole.COURIER,
];

const MAX_OTP_ATTEMPTS = 5;
const OTP_COOLDOWN_MS = 60_000;

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);
  private googleClient: OAuth2Client | null = null;
  private googleJwksCache: {
    certs: Record<string, string>;
    expiresAt: number;
  } | null = null;
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
      this.twilio = Twilio(sid, token, { timeout: 15000, autoRetry: false });
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
    const serviceSid = this.config.get<string>("TWILIO_VERIFY_SERVICE_SID");
    if (!bypass && (!this.twilio || !serviceSid))
      throw new BadRequestException("errors.twilioNotConfigured");
    const code = bypass ? "000000" : String(randomInt(100000, 999999));
    const codeHash = this.hashCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.otps.deleteMany({ phone, role }).exec();
    const challenge = await this.otps.create({
      phone,
      role,
      codeHash,
      expiresAt,
      attempts: 0,
    });

    if (!bypass) {
      try {
        await this.twilio!.verify.v2.services(serviceSid!).verifications.create(
          { to: phone, channel: "sms" },
        );
      } catch (error) {
        // A failed send never leaves a usable local challenge or reveals provider details.
        await this.otps.deleteMany({ _id: challenge._id }).exec();
        const providerCode = (error as { code?: number }).code;
        if (
          (error as { status?: number }).status === 429 ||
          [60203, 60212].includes(providerCode ?? 0)
        )
          throw new HttpException(
            "errors.rateLimited",
            HttpStatus.TOO_MANY_REQUESTS,
          );
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
      } else if (!bypass || challenge.codeHash !== this.hashCode(dto.code)) {
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
    const email = dto.email.trim().toLowerCase();
    const isProd = this.config.get<string>("NODE_ENV") === "production";
    const provider = this.config.get<string>("AUTH_EMAIL_PROVIDER") || "mock";
    const mailKey = this.config.get<string>("RESEND_API_KEY");
    const mailFrom = this.config.get<string>("AUTH_EMAIL_FROM");
    const useMock = provider === "mock" && !isProd;
    if (!useMock && (!mailKey || !mailFrom))
      throw new ServiceUnavailableException(
        "Password recovery is temporarily unavailable. Please try again later.",
      );
    const challengeId = randomBytes(32).toString("hex");
    const code = String(randomInt(10000, 100000));
    const opaque = {
      status: "sent" as const,
      challengeId,
      email,
      ...(useMock ? { verificationCode: code } : {}),
    };
    const user = await this.users.findOne({ email }).exec();
    if (!user?.passwordHash || !user.isActive) {
      return opaque;
    }
    await this.passwordResets.deleteMany({ userId: user._id }).exec();
    await this.passwordResets.create({
      userId: user._id,
      challengeId,
      codeHash: this.hashCode(challengeId + code),
      // Keep the existing unique token index populated without exposing a
      // usable reset token until the email code has been verified.
      tokenHash: this.hashCode(randomBytes(32).toString("hex")),
      attempts: 0,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    this.audit.record("auth.password_reset.request", {
      targetUserId: user.id,
      meta: { email },
    });
    if (!useMock) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${mailKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: mailFrom,
            to: [email],
            subject: "Reset your Yespiz password",
            text: `Your Yespiz password reset code is ${code}. It expires in 10 minutes. If you did not request it, ignore this email.`,
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error("Email delivery failed");
      } catch {
        await this.passwordResets.deleteMany({ challengeId }).exec();
        throw new ServiceUnavailableException(
          "Could not send the reset code. Please try again later.",
        );
      }
    }
    return opaque;
  }

  async confirmPasswordResetOtp(dto: ConfirmPasswordResetOtpDto) {
    const challenge = await this.passwordResets
      .findOneAndUpdate(
        {
          challengeId: dto.challengeId,
          verifiedAt: null,
          usedAt: null,
          attempts: { $lt: MAX_OTP_ATTEMPTS },
          expiresAt: { $gt: new Date() },
        },
        { $inc: { attempts: 1 } },
        { new: true },
      )
      .exec();
    if (
      !challenge ||
      challenge.codeHash !== this.hashCode(dto.challengeId + dto.code)
    ) {
      throw new UnauthorizedException("errors.otpInvalid");
    }

    const token = randomBytes(32).toString("hex");
    const verified = await this.passwordResets
      .findOneAndUpdate(
        {
          _id: challenge._id,
          verifiedAt: null,
          usedAt: null,
          expiresAt: { $gt: new Date() },
        },
        {
          $set: {
            verifiedAt: new Date(),
            tokenHash: this.hashCode(token),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          },
        },
        { new: true },
      )
      .exec();
    if (!verified) throw new UnauthorizedException("errors.otpInvalid");
    return { token };
  }

  async confirmPasswordReset(dto: ResetPasswordDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const reset = await this.passwordResets
      .findOneAndUpdate(
        {
          tokenHash: this.hashCode(dto.token),
          usedAt: null,
          expiresAt: { $gt: new Date() },
        },
        { $set: { usedAt: new Date() } },
        { new: true },
      )
      .exec();
    if (!reset) {
      throw new UnauthorizedException("errors.resetInvalid");
    }
    const user = await this.users.findById(reset.userId).exec();
    if (!user || !user.isActive) {
      throw new UnauthorizedException("errors.resetInvalid");
    }
    user.passwordHash = passwordHash;
    await user.save();
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

  private enabledSocialProviders() {
    return (
      this.config.get<string>("SOCIAL_AUTH_PROVIDERS") ??
      "google,apple,facebook"
    )
      .split(",")
      .map((provider) => provider.trim());
  }

  socialProviders() {
    const enabled = this.enabledSocialProviders();
    return {
      google:
        enabled.includes("google") &&
        Boolean(this.config.get("GOOGLE_CLIENT_ID")),
      apple:
        enabled.includes("apple") &&
        Boolean(
          this.config.get("APPLE_CLIENT_ID") ||
          this.config.get("APPLE_NATIVE_CLIENT_ID"),
        ),
      facebook:
        enabled.includes("facebook") &&
        Boolean(
          this.config.get("FACEBOOK_APP_ID") &&
          this.config.get("FACEBOOK_APP_SECRET") &&
          /^v\d+\.\d+$/.test(
            this.config.get<string>("FACEBOOK_API_VERSION") || "",
          ),
        ),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const current = await this.users.findById(userId).exec();
    if (!current || !current.isActive) throw new UnauthorizedException();
    const user = await this.users
      .findOneAndUpdate(
        {
          _id: userId,
          isActive: true,
          ...(dto.revision === 0
            ? {
                $or: [
                  { profileRevision: 0 },
                  { profileRevision: { $exists: false } },
                ],
              }
            : { profileRevision: dto.revision }),
        },
        {
          $set: {
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
          },
          $inc: { profileRevision: 1 },
        },
        { new: true, runValidators: true },
      )
      .exec();
    if (!user)
      throw new ConflictException(
        "Your profile changed on another device. Reload and try again.",
      );
    return this.toProfile(user);
  }

  async getProfile(userId: string) {
    const user = await this.users.findById(userId).exec();
    if (!user || !user.isActive) {
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
    if (!user?.passwordHash || !user.isActive) {
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
      const ticket = await this.verifyGoogleIdToken(
        dto.idToken,
        this.config.get<string>("GOOGLE_CLIENT_ID")!,
      );
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
    if (!this.enabledSocialProviders().includes(dto.provider)) {
      throw new BadRequestException(
        "This sign-in provider is currently disabled.",
      );
    }
    let payload: {
      sub?: string;
      email?: string;
      email_verified?: boolean | string;
      nonce?: string;
      given_name?: string;
      family_name?: string;
    };
    try {
      if (dto.provider === "facebook") {
        const appId = this.config.get<string>("FACEBOOK_APP_ID");
        const appSecret = this.config.get<string>("FACEBOOK_APP_SECRET");
        const version = this.config.get<string>("FACEBOOK_API_VERSION");
        if (!appId || !appSecret || !version || !/^v\d+\.\d+$/.test(version))
          throw new BadRequestException("Facebook sign-in is not configured.");
        const debugUrl = new URL(
          `https://graph.facebook.com/${version}/debug_token`,
        );
        debugUrl.searchParams.set("input_token", dto.idToken);
        const inspected = await fetch(debugUrl, {
          headers: { Authorization: `Bearer ${appId}|${appSecret}` },
          signal: AbortSignal.timeout(5000),
        });
        if (!inspected.ok) throw new Error("Token verification failed");
        const { data } = await inspected.json();
        const now = Date.now() / 1000;
        if (
          !data?.is_valid ||
          data.app_id !== appId ||
          data.type !== "USER" ||
          !data.user_id ||
          !data.expires_at ||
          data.expires_at <= now ||
          (data.data_access_expires_at && data.data_access_expires_at <= now)
        )
          throw new Error("Invalid Facebook identity");
        const profileResponse = await fetch(
          `https://graph.facebook.com/${version}/me?fields=id,email,first_name,last_name`,
          {
            headers: { Authorization: `Bearer ${dto.idToken}` },
            signal: AbortSignal.timeout(5000),
          },
        );
        if (!profileResponse.ok) throw new Error("Profile unavailable");
        const profile = await profileResponse.json();
        if (profile.id !== data.user_id) throw new Error("Identity mismatch");
        payload = {
          sub: profile.id,
          email: profile.email,
          email_verified: Boolean(profile.email),
          given_name: profile.first_name,
          family_name: profile.last_name,
        };
      } else if (dto.provider === "google") {
        const audience = this.config.get<string>("GOOGLE_CLIENT_ID");
        if (!audience || !this.googleClient)
          throw new BadRequestException("Google sign-in is not configured.");
        const ticket = await this.verifyGoogleIdToken(dto.idToken, audience);
        payload = ticket.getPayload()!;
      } else {
        const audience = [
          this.config.get<string>("APPLE_CLIENT_ID"),
          this.config.get<string>("APPLE_NATIVE_CLIENT_ID"),
        ].filter((value): value is string => Boolean(value));
        if (!audience.length)
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
          audience: audience as [string, ...string[]],
        });
      }
      if (
        !payload?.sub ||
        (dto.provider === "apple" && payload.nonce !== dto.nonce) ||
        (dto.provider === "google" &&
          payload.nonce !== undefined &&
          payload.nonce !== dto.nonce)
      )
        throw new Error("Invalid identity");
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const reason = error instanceof Error ? error.message : "Unknown error";
      this.logger?.warn(
        `Social sign-in verification failed provider=${dto.provider} reason=${reason}`,
      );
      const message =
        this.config.get<string>("NODE_ENV") === "production"
          ? "Unable to verify your social sign-in."
          : `Unable to verify your social sign-in: ${reason}`;
      throw new UnauthorizedException(message);
    }
    const identity =
      dto.provider === "apple"
        ? { appleSub: payload.sub }
        : dto.provider === "facebook"
          ? { facebookSub: payload.sub }
          : { googleSub: payload.sub };
    let user = await this.users.findOne(identity).exec();
    if (!user) {
      if (!payload.email || ![true, "true"].includes(payload.email_verified!)) {
        throw new UnauthorizedException("A verified email is required.");
      }
      const email = payload.email.toLowerCase();
      // A provider-verified email proves control of the address. Attach the
      // new provider identity to an existing account instead of making social
      // sign-in fail with a conflict (or creating a duplicate account).
      user = await this.users.findOne({ email }).exec();
      if (user) {
        Object.assign(user, identity);
        user.activeRole = UserRole.CUSTOMER;
        user.emailVerifiedAt = user.emailVerifiedAt || new Date();
        await user.save();
      } else {
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

  private async verifyGoogleIdToken(idToken: string, audience: string) {
    if (!this.googleClient)
      throw new BadRequestException("Google sign-in is not configured.");
    try {
      return await this.googleClient.verifyIdToken({ idToken, audience });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "";
      if (!reason.includes("Failed to retrieve verification certificates")) {
        throw error;
      }
    }

    const now = Date.now();
    let certs =
      this.googleJwksCache && this.googleJwksCache.expiresAt > now
        ? this.googleJwksCache.certs
        : null;
    if (!certs) {
      const configuredJwksUrl =
        this.config.get<string>("GOOGLE_JWKS_URL")?.trim() ||
        "https://www.googleapis.com/oauth2/v3/certs";
      const jwksUrl = new URL(configuredJwksUrl);
      if (
        jwksUrl.protocol !== "https:" &&
        !(
          this.config.get<string>("NODE_ENV") !== "production" &&
          ["localhost", "127.0.0.1"].includes(jwksUrl.hostname)
        )
      ) {
        throw new Error("Google JWKS URL must use HTTPS");
      }
      const fetchJwks = async () => {
        let lastError: unknown;
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          try {
            return await fetch(jwksUrl, {
              signal: AbortSignal.timeout(5000),
            });
          } catch (error) {
            lastError = error;
          }
        }
        throw lastError;
      };
      const response = await fetchJwks();
      if (!response.ok)
        throw new Error(`Google JWKS request failed (${response.status})`);
      const body = (await response.json()) as {
        keys?: Array<import("crypto").JsonWebKey & { kid?: string }>;
      };
      certs = {};
      for (const key of body.keys ?? []) {
        if (!key.kid) continue;
        certs[key.kid] = createPublicKey({ key, format: "jwk" })
          .export({ type: "spki", format: "pem" })
          .toString();
      }
      if (!Object.keys(certs).length)
        throw new Error("Google JWKS response contained no usable keys");
      const maxAge = Number(
        /max-age=(\d+)/i.exec(response.headers.get("cache-control") ?? "")?.[1] ??
          300,
      );
      this.googleJwksCache = {
        certs,
        expiresAt: now + Math.max(60, maxAge) * 1000,
      };
    }

    return this.googleClient.verifySignedJwtWithCertsAsync(
      idToken,
      certs,
      audience,
      ["accounts.google.com", "https://accounts.google.com"],
    );
  }

  passkeyToken(user: UserDocument) {
    this.audit.record("auth.login", {
      targetUserId: user.id,
      meta: { role: UserRole.CUSTOMER, method: "passkey" },
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
        profileRevision: user.profileRevision ?? 0,
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
      profileRevision: user.profileRevision ?? 0,
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
      adminPermissions: user.roles.includes(UserRole.ADMIN)
        ? user.adminPermissions
        : undefined,
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
