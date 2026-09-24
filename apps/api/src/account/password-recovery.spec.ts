import { AccountService } from "./account.service";
import { createHash } from "crypto";
import * as bcrypt from "bcrypt";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ResetPasswordDto } from "./dto/auth.dto";

describe("Password recovery", () => {
  const originalFetch = global.fetch;
  const query = (value: unknown) => ({
    exec: jest.fn().mockResolvedValue(value),
  });
  let service: AccountService;
  let users: { findOne: jest.Mock; findById: jest.Mock };
  let resets: {
    deleteMany: jest.Mock;
    create: jest.Mock;
    findOneAndUpdate: jest.Mock;
  };
  let config: Record<string, string>;
  let user: {
    id: string;
    _id: string;
    email: string;
    isActive: boolean;
    passwordHash: string;
    save: jest.Mock;
  };
  beforeEach(() => {
    user = {
      id: "user1",
      _id: "user1",
      email: "user@example.com",
      isActive: true,
      passwordHash: "old-hash",
      save: jest.fn().mockResolvedValue(undefined),
    };
    users = {
      findOne: jest.fn(() => query(user)),
      findById: jest.fn(() => query(user)),
    };
    resets = {
      deleteMany: jest.fn(() => query({})),
      create: jest.fn().mockResolvedValue({}),
      findOneAndUpdate: jest.fn(() =>
        query({ _id: "reset1", userId: "user1" }),
      ),
    };
    config = {
      NODE_ENV: "production",
      RESEND_API_KEY: "test-only",
      AUTH_EMAIL_FROM: "Yespiz <auth@example.com>",
      CUSTOMER_APP_URL: "https://app.example.com",
    };
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    service = Object.assign(Object.create(AccountService.prototype), {
      users,
      passwordResets: resets,
      config: { get: (key: string) => config[key] },
      audit: { record: jest.fn() },
    });
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });
  it("sends a five-digit reset code and exposes no code in production", async () => {
    const result = await service.requestPasswordReset({
      email: "USER@example.com",
    });
    expect(result).toEqual({
      status: "sent",
      challengeId: expect.stringMatching(/^[a-f0-9]{64}$/),
      email: "user@example.com",
    });
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.to).toEqual(["user@example.com"]);
    const code = body.text.match(/\b\d{5}\b/)[0];
    expect(resets.create).toHaveBeenCalledWith(
      expect.objectContaining({
        challengeId: result.challengeId,
        codeHash: createHash("sha256")
          .update(result.challengeId + code)
          .digest("hex"),
        attempts: 0,
        expiresAt: expect.any(Date),
      }),
    );
  });
  it("returns the same acknowledgement for an unknown email", async () => {
    users.findOne.mockReturnValue(query(null));
    await expect(
      service.requestPasswordReset({ email: "unknown@example.com" }),
    ).resolves.toEqual({
      status: "sent",
      challengeId: expect.stringMatching(/^[a-f0-9]{64}$/),
      email: "unknown@example.com",
    });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(resets.create).not.toHaveBeenCalled();
  });
  it("rejects unavailable production delivery before looking up the account", async () => {
    delete config.RESEND_API_KEY;
    await expect(
      service.requestPasswordReset({ email: "user@example.com" }),
    ).rejects.toThrow("temporarily unavailable");
    expect(users.findOne).not.toHaveBeenCalled();
  });
  it("surfaces delivery failures and removes the undelivered token", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    await expect(
      service.requestPasswordReset({ email: "user@example.com" }),
    ).rejects.toThrow("Could not send");
    expect(resets.deleteMany).toHaveBeenLastCalledWith({
      challengeId: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
  });
  it("returns the local mock code without sending email", async () => {
    config = { NODE_ENV: "development" };
    const result = await service.requestPasswordReset({
      email: "user@example.com",
    });
    expect(result.verificationCode).toMatch(/^\d{5}$/);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it("exchanges a correct five-digit code for a one-time reset token", async () => {
    config = { NODE_ENV: "development" };
    const challenge = await service.requestPasswordReset({
      email: "user@example.com",
    });
    const created = resets.create.mock.calls[0][0];
    resets.findOneAndUpdate
      .mockReturnValueOnce(query({ _id: "reset1", codeHash: created.codeHash }))
      .mockReturnValueOnce(query({ _id: "reset1" }));

    const result = await service.confirmPasswordResetOtp({
      challengeId: challenge.challengeId,
      code: challenge.verificationCode!,
    });

    expect(result.token).toMatch(/^[a-f0-9]{64}$/);
    expect(resets.findOneAndUpdate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        challengeId: challenge.challengeId,
        attempts: { $lt: 5 },
      }),
      { $inc: { attempts: 1 } },
      { new: true },
    );
    expect(resets.findOneAndUpdate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ _id: "reset1", verifiedAt: null }),
      {
        $set: expect.objectContaining({
          verifiedAt: expect.any(Date),
          tokenHash: createHash("sha256").update(result.token).digest("hex"),
        }),
      },
      { new: true },
    );
  });
  it("claims only an unused unexpired token and stores a password hash", async () => {
    await expect(
      service.confirmPasswordReset({
        token: "test-token",
        password: "ChangedPass123!",
      }),
    ).resolves.toEqual({ status: "reset" });
    expect(resets.findOneAndUpdate).toHaveBeenCalledWith(
      {
        tokenHash: expect.any(String),
        usedAt: null,
        expiresAt: { $gt: expect.any(Date) },
      },
      { $set: { usedAt: expect.any(Date) } },
      { new: true },
    );
    expect(await bcrypt.compare("ChangedPass123!", user.passwordHash)).toBe(
      true,
    );
  });
  it("does not change a password for an expired or replayed token", async () => {
    resets.findOneAndUpdate.mockReturnValue(query(null));
    await expect(
      service.confirmPasswordReset({
        token: "used-token",
        password: "ChangedPass123!",
      }),
    ).rejects.toThrow();
    expect(user.save).not.toHaveBeenCalled();
  });
  it("enforces the same minimum password length as the UI", async () => {
    const errors = await validate(
      plainToInstance(ResetPasswordDto, {
        token: "token",
        password: "1234567",
      }),
    );
    expect(errors.some((error) => error.property === "password")).toBe(true);
  });
});
