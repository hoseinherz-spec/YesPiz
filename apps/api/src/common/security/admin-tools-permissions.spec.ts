import {
  adminToolPermissions,
  requiredAdminPermission,
} from "./admin-permissions";
import { RolesGuard } from "../guards/roles.guard";
import { Reflector } from "@nestjs/core";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { UserRole } from "../enums";
function access(
  path: string,
  method: string,
  permissions: string[] | undefined,
) {
  const reflector = {
    getAllAndOverride: () => [UserRole.ADMIN],
  } as unknown as Reflector;
  const context = {
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({
      getRequest: () => ({
        user: { roles: [UserRole.ADMIN], adminPermissions: permissions },
        originalUrl: path,
        method,
      }),
    }),
  } as unknown as ExecutionContext;
  return new RolesGuard(reflector).canActivate(context);
}
describe("Admin entity and media permissions", () => {
  it("rejects inherited object keys as lookup kinds", () => {
    expect(
      adminToolPermissions("/api/v1/operations/lookups/constructor", "GET"),
    ).toBeNull();
    expect(
      adminToolPermissions("/api/v1/operations/lookups/__proto__", "GET"),
    ).toBeNull();
  });
  it("allows finance staff to choose a courier without granting order mutation access", () => {
    expect(
      access("/api/v1/operations/lookups/courier?q=Lee", "GET", [
        "finance:read",
      ]),
    ).toBe(true);
    expect(() =>
      access("/api/v1/orders/123", "PATCH", ["finance:read"]),
    ).toThrow(ForbiddenException);
  });
  it("keeps provider owners restricted to operations staff", () => {
    expect(() =>
      access("/api/v1/operations/lookups/user", "GET", ["catalog:read"]),
    ).toThrow(ForbiddenException);
    expect(
      access("/api/v1/operations/lookups/user", "GET", ["operations:read"]),
    ).toBe(true);
  });
  it("requires write access to upload catalog or provider images", () => {
    expect(access("/api/v1/catalog/media", "POST", ["catalog:write"])).toBe(
      true,
    );
    expect(access("/api/v1/catalog/media", "POST", ["operations:write"])).toBe(
      true,
    );
    expect(() =>
      access("/api/v1/catalog/media", "POST", ["catalog:read"]),
    ).toThrow(ForbiddenException);
  });
  it("does not extend media exceptions to other catalog mutation routes", () => {
    expect(
      adminToolPermissions("/api/v1/catalog/media/abc", "DELETE"),
    ).toBeNull();
    expect(requiredAdminPermission("/api/v1/catalog/media/abc", "DELETE")).toBe(
      "catalog:write",
    );
    expect(() =>
      access("/api/v1/catalog/items/abc", "PATCH", ["operations:write"]),
    ).toThrow(ForbiddenException);
  });
});
