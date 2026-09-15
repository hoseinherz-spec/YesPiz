import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export type JwtPayloadUser = {
  userId: string;
  adminPermissions?: string[];
  tokenExpiresAt?: number;
  email?: string;
  phone?: string;
  roles: string[];
  activeRole: string;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayloadUser => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayloadUser }>();
    return request.user;
  },
);
