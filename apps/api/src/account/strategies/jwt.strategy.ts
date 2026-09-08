import { Injectable } from "@nestjs/common";
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
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_SECRET") || "dev-secret",
    });
  }

  validate(payload: RawJwt): JwtPayloadUser {
    return {
      userId: payload.sub,
      tokenExpiresAt: payload.exp,
      email: payload.email,
      phone: payload.phone,
      roles: payload.roles,
      activeRole: payload.activeRole,
    };
  }
}
