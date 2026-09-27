import { EmailSignupService, VerifySignupDto } from "./email-signup";
import { createHash } from "crypto";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";

const query = (value: unknown) => ({
  exec: jest.fn().mockResolvedValue(value),
});
describe("Email signup", () => {
  let service: EmailSignupService;
  let signups: any;
  let users: any;
  const originalFetch = global.fetch;
  beforeEach(() => {
    signups = {
      create: jest.fn(),
      deleteOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
    };
    users = { exists: jest.fn().mockResolvedValue(false), create: jest.fn() };
    service = new EmailSignupService(signups, users, {
      get: (key: string) =>
        ({
          NODE_ENV: "test",
          AUTH_EMAIL_PROVIDER: "resend",
          RESEND_API_KEY: "configured",
          AUTH_EMAIL_FROM: "configured",
        })[key],
    } as any);
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });
  it("returns the verification code from the mock provider outside production", async () => {
    service = new EmailSignupService(signups, users, {
      get: (key: string) =>
        ({ NODE_ENV: "development", AUTH_EMAIL_PROVIDER: "mock" })[key],
    } as any);
    const result = await service.start({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
    });
    expect(result.verificationCode).toMatch(/^\d{5}$/);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it("limits explicitly enabled production mocks to demo domains and keeps real delivery", async () => {
    service = new EmailSignupService(signups, users, { get: (key: string) => ({ NODE_ENV: "production", AUTH_EMAIL_PROVIDER: "mock", AUTH_EMAIL_MOCK_ENABLED: "true", AUTH_EMAIL_MOCK_DOMAINS: "yespizz.local", RESEND_API_KEY: "configured", AUTH_EMAIL_FROM: "configured" })[key] } as any);
    const demo = await service.start({ firstName: "Demo", lastName: "User", email: "demo@yespizz.local" });
    expect(demo.verificationCode).toMatch(/^\d{5}$/);
    expect(global.fetch).not.toHaveBeenCalled();
    const real = await service.start({ firstName: "Real", lastName: "User", email: "real@example.com" });
    expect(real.verificationCode).toBeUndefined();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });
  it("emails exactly five digits without creating a user or returning the code", async () => {
    const result = await service.start({
      firstName: "Jane",
      lastName: "Doe",
      email: "Jane@example.com",
    });
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.text).toMatch(/code is \d{5}\./);
    expect(body.to).toEqual(["jane@example.com"]);
    expect(users.create).not.toHaveBeenCalled();
    expect(Object.keys(result).sort()).toEqual(["challengeId", "email"]);
  });
  it("removes a challenge if delivery fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    await expect(
      service.start({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
      }),
    ).rejects.toThrow("Could not send");
    expect(signups.deleteOne).toHaveBeenCalled();
  });
  it("rejects expired or exhausted challenges and reserves attempts atomically", async () => {
    signups.findOneAndUpdate.mockReturnValue(query(null));
    await expect(
      service.verify({ challengeId: "a".repeat(64), code: "12345" }),
    ).rejects.toThrow("Invalid or expired");
    expect(signups.findOneAndUpdate.mock.calls[0][0]).toMatchObject({
      verified: false,
      attempts: { $lt: 5 },
      expiresAt: { $gt: expect.any(Date) },
    });
    expect(signups.findOneAndUpdate.mock.calls[0][1]).toEqual({
      $inc: { attempts: 1 },
    });
  });
  it("exchanges a correct code for a separate password token", async () => {
    const challengeId = "a".repeat(64);
    signups.findOneAndUpdate
      .mockReturnValueOnce(
        query({
          codeHash: createHash("sha256")
            .update(challengeId + "12345")
            .digest("hex"),
        }),
      )
      .mockReturnValueOnce(query({}));
    const result = await service.verify({ challengeId, code: "12345" });
    expect(result.token).toMatch(/^[a-f0-9]{64}$/);
    expect(users.create).not.toHaveBeenCalled();
  });
  it("rejects incorrect codes", async () => {
    signups.findOneAndUpdate.mockReturnValue(query({ codeHash: "wrong" }));
    await expect(
      service.verify({ challengeId: "a".repeat(64), code: "12345" }),
    ).rejects.toThrow();
    expect(signups.findOneAndUpdate).toHaveBeenCalledTimes(1);
  });
  it("creates a verified customer with a hashed password only from a consumed token", async () => {
    signups.findOneAndDelete.mockReturnValue(
      query({ firstName: "Jane", lastName: "Doe", email: "jane@example.com" }),
    );
    await service.complete({ token: "b".repeat(64), password: "password123" });
    expect(users.create.mock.calls[0][0]).toMatchObject({
      emailVerifiedAt: expect.any(Date),
      passwordHash: expect.stringMatching(/^\$2/),
      roles: ["customer"],
    });
    signups.findOneAndDelete.mockReturnValue(query(null));
    await expect(
      service.complete({ token: "b".repeat(64), password: "password123" }),
    ).rejects.toThrow("expired");
    expect(users.create).toHaveBeenCalledTimes(1);
  });
  it("validates the code length", async () => {
    expect(
      await validate(
        plainToInstance(VerifySignupDto, {
          challengeId: "a".repeat(64),
          code: "123456",
        }),
      ),
    ).not.toHaveLength(0);
  });
});
