import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { normalizeRole, UserRole } from "../enums";
import type { JwtPayloadUser } from "../decorators/current-user.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: JwtPayloadUser }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException("errors.forbidden");
    }

    const userRoles = (user.roles ?? []).map((r) => normalizeRole(r));
    const ok = required.some((role) => userRoles.includes(role));
    if (!ok) {
      throw new ForbiddenException("errors.roleNotAllowed");
    }
    return true;
  }
}
