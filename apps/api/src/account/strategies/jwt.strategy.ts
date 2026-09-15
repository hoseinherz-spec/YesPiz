import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "../schemas/user.schema";
import { UserRole } from "../../common/enums";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { JwtPayloadUser } from "../../common/decorators/current-user.decorator";

type RawJwt = {
  sub: string;
  exp?: number;
  email?: string;
  phone?: string;
  roles: string[];
  activeRole: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_SECRET") || "dev-secret",
    });
  }

  async validate(payload: RawJwt): Promise<JwtPayloadUser> {
    if (!Array.isArray(payload.roles)) throw new UnauthorizedException();
    let adminPermissions: string[] | undefined;
    if (payload.roles.includes("admin")) {
      const user = await this.users
        .findById(payload.sub)
        .select("roles isActive adminPermissions")
        .lean()
        .exec();
      if (
        !user ||
        user.isActive === false ||
        !user.roles.includes(UserRole.ADMIN)
      )
        throw new UnauthorizedException();
      adminPermissions =
        user.adminPermissions === undefined
          ? undefined
          : Array.isArray(user.adminPermissions)
            ? user.adminPermissions
            : [];
    }
    return {
      userId: payload.sub,
      adminPermissions,
      tokenExpiresAt: payload.exp,
      email: payload.email,
      phone: payload.phone,
      roles: payload.roles,
      activeRole: payload.activeRole,
    };
  }
}
