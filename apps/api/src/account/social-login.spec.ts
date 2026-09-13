import { generateKeyPairSync } from "crypto";
import { JwtService } from "@nestjs/jwt";
import { AccountService } from "./account.service";
import { UserRole } from "../common/enums";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const jwt = new JwtService();
const nonce = "a-unique-login-nonce";
const dto = (idToken: string) => ({
  provider: "apple" as const,
  idToken,
  nonce,
});
const sign = (claims = {}, options = {}) =>
  jwt.sign(
    {
      sub: "apple-user",
      nonce,
      email: "user@example.com",
      email_verified: true,
      ...claims,
    },
    {
      privateKey: privateKey
        .export({ type: "pkcs8", format: "pem" })
        .toString(),
      algorithm: "RS256",
      keyid: "test-key",
      issuer: "https://appleid.apple.com",
      audience: "app.yespizz",
      expiresIn: 300,
      ...options,
    },
  );

describe("Social sign-in verification", () => {
  const originalFetch = global.fetch;
  let service: AccountService;
  let users: { findOne: jest.Mock; exists: jest.Mock; create: jest.Mock };
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        keys: [{ ...publicKey.export({ format: "jwk" }), kid: "test-key" }],
      }),
    });
    users = {
      findOne: jest.fn().mockReturnValue({ exec: async () => null }),
      exists: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: "u1",
        roles: [UserRole.CUSTOMER],
        isActive: true,
      }),
    };
    service = Object.assign(Object.create(AccountService.prototype), {
      users,
      jwt,
      config: {
        get: (key: string) =>
          key === "APPLE_CLIENT_ID" ? "app.yespizz" : undefined,
      },
      audit: { record: jest.fn() },
    });
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });
  it("verifies Google tokens against the configured audience", async () => {
    const verifyIdToken = jest.fn().mockResolvedValue({
      getPayload: () => ({
        sub: "google-user",
        nonce,
        email: "google@example.com",
        email_verified: true,
      }),
    });
    Object.assign(service, {
      googleClient: { verifyIdToken },
      config: {
        get: (key: string) =>
          key === "GOOGLE_CLIENT_ID" ? "google-client" : undefined,
      },
    });
    await service.socialLogin({
      provider: "google",
      idToken: "google-token",
      nonce,
    });
    expect(verifyIdToken).toHaveBeenCalledWith({
      idToken: "google-token",
      audience: "google-client",
    });
    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        googleSub: "google-user",
        roles: [UserRole.CUSTOMER],
      }),
    );
  });
  it("rejects a Google nonce mismatch", async () => {
    Object.assign(service, {
      googleClient: {
        verifyIdToken: async () => ({
          getPayload: () => ({ sub: "google-user", nonce: "wrong" }),
        }),
      },
      config: { get: () => "google-client" },
    });
    await expect(
      service.socialLogin({
        provider: "google",
        idToken: "google-token",
        nonce,
      }),
    ).rejects.toThrow();
    expect(users.create).not.toHaveBeenCalled();
  });
  it("verifies an Apple signature and creates only a customer", async () => {
    const result = await service.socialLogin(dto(sign()));
    expect(result.accessToken).toBeTruthy();
    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        appleSub: "apple-user",
        roles: [UserRole.CUSTOMER],
      }),
    );
  });
  it.each([
    [{ nonce: "wrong" }, {}],
    [{}, { audience: "another-app" }],
    [{}, { issuer: "https://attacker.example" }],
    [{}, { expiresIn: -1 }],
    [{ email_verified: false }, {}],
  ])("rejects invalid claims %j %j", async (claims, options) => {
    await expect(
      service.socialLogin(dto(sign(claims, options))),
    ).rejects.toThrow();
    expect(users.create).not.toHaveBeenCalled();
  });
  it("rejects an invalid signature", async () => {
    const parts = sign().split(".");
    parts[2] = Buffer.alloc(256).toString("base64url");
    await expect(service.socialLogin(dto(parts.join(".")))).rejects.toThrow();
  });
  it("does not link an existing email to a new social identity", async () => {
    users.exists.mockResolvedValue({ _id: "existing" });
    await expect(service.socialLogin(dto(sign()))).rejects.toThrow(
      "already exists",
    );
    expect(users.create).not.toHaveBeenCalled();
  });
  it("rejects a disabled account", async () => {
    users.findOne.mockReturnValue({
      exec: async () => ({ isActive: false, roles: [UserRole.CUSTOMER] }),
    });
    await expect(service.socialLogin(dto(sign()))).rejects.toThrow(
      "cannot sign in",
    );
  });
});
