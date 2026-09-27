import { generateKeyPairSync } from "crypto";
import { JwtService } from "@nestjs/jwt";
import { OAuth2Client } from "google-auth-library";
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
  function configureFacebook() {
    Object.assign(service, {config: {get: (key: string) => ({FACEBOOK_APP_ID: "fb-app", FACEBOOK_APP_SECRET: "test-secret", FACEBOOK_API_VERSION: "v23.0"})[key]}});
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ok: true, json: async () => ({data: {is_valid: true, app_id: "fb-app", type: "USER", user_id: "fb-user", expires_at: Date.now()/1000+3600}})})
      .mockResolvedValueOnce({ok: true, json: async () => ({id: "fb-user", email: "fb@example.com", first_name: "Test"})});
  }
  it("verifies Facebook identity before creating an account", async () => {
    configureFacebook();
    await service.socialLogin({provider: "facebook", idToken: "test-token", nonce});
    expect(users.create).toHaveBeenCalledWith(expect.objectContaining({facebookSub: "fb-user", email: "fb@example.com"}));
  });
  it("rejects Facebook tokens issued to another app", async () => {
    configureFacebook();
    (global.fetch as jest.Mock).mockReset().mockResolvedValueOnce({ok:true,json:async()=>({data:{is_valid:true,app_id:"another-app",user_id:"fb-user",type:"USER",expires_at:Date.now()/1000+3600}})});
    await expect(service.socialLogin({provider:"facebook",idToken:"test-token",nonce})).rejects.toThrow("Unable to verify");
    expect(users.create).not.toHaveBeenCalled();
  });
  it("rejects Facebook profile identity mismatches", async () => {
    configureFacebook();
    (global.fetch as jest.Mock).mockReset()
      .mockResolvedValueOnce({ok:true,json:async()=>({data:{is_valid:true,app_id:"fb-app",user_id:"fb-user",type:"USER",expires_at:Date.now()/1000+3600}})})
      .mockResolvedValueOnce({ok:true,json:async()=>({id:"another-user",email:"fb@example.com"})});
    await expect(service.socialLogin({provider:"facebook",idToken:"test-token",nonce})).rejects.toThrow("Unable to verify");
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
  it("falls back to Google's JWKS endpoint when the legacy certificate endpoint is forbidden", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: { get: () => "public, max-age=3600" },
      json: async () => ({
        keys: [{ ...publicKey.export({ format: "jwk" }), kid: "test-key" }],
      }),
    });
    const client = new OAuth2Client("google-client");
    jest
      .spyOn(client, "verifyIdToken")
      .mockImplementation(async () => {
        throw new Error(
          "Failed to retrieve verification certificates: 403 Forbidden",
        );
      });
    Object.assign(service, {
      googleClient: client,
      config: {
        get: (key: string) =>
          key === "GOOGLE_CLIENT_ID" ? "google-client" : undefined,
      },
    });
    const idToken = sign(
      { sub: "google-user", email: "google@example.com" },
      {
        issuer: "https://accounts.google.com",
        audience: "google-client",
      },
    );

    await service.socialLogin({ provider: "google", idToken, nonce });

    expect(global.fetch).toHaveBeenCalledWith(
      new URL("https://www.googleapis.com/oauth2/v3/certs"),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({ googleSub: "google-user" }),
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
  it("accepts a verified Google token when Google omits the optional nonce claim", async () => {
    Object.assign(service, {
      googleClient: {
        verifyIdToken: async () => ({
          getPayload: () => ({
            sub: "google-user",
            email: "google@example.com",
            email_verified: true,
          }),
        }),
      },
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

    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({ googleSub: "google-user" }),
    );
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
  it("links a provider-verified email to an existing customer without creating a duplicate", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const existing = { id: "existing", email: "user@example.com", isActive: true, roles: [UserRole.CUSTOMER], save };
    users.findOne.mockReturnValueOnce({ exec: async () => null }).mockReturnValueOnce({ exec: async () => existing });
    await service.socialLogin(dto(sign()));
    expect(save).toHaveBeenCalled();
    expect(existing).toHaveProperty("appleSub");
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
