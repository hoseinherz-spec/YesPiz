import { ConfigService } from "@nestjs/config";
import { validate } from "class-validator";
import { AccountService } from "./account.service";
import { SendOtpDto, ConfirmOtpDto } from "./dto/auth.dto";
function fixture() {
  const challenge = {
    _id: "challenge",
    expiresAt: new Date(Date.now() + 600000),
    attempts: 0,
    save: jest.fn(),
  };
  const otps = {
    deleteMany: jest.fn(() => ({ exec: jest.fn(async () => ({})) })),
    create: jest.fn(async () => challenge),
    findOne: jest.fn(() => ({ exec: async () => challenge })),
  };
  const users = { findOne: jest.fn(() => ({ exec: async () => null })) };
  const config = new ConfigService({
    NODE_ENV: "test",
    OTP_DEV_BYPASS: "false",
    TWILIO_VERIFY_SERVICE_SID: "VA_fixture",
    JWT_SECRET: "test-secret",
  });
  const args = [
    users,
    otps,
    {},
    {},
    {},
    config,
    {},
  ] as unknown as ConstructorParameters<typeof AccountService>;
  const service = new AccountService(...args);
  const send = jest.fn(async () => ({ status: "pending" }));
  const check = jest.fn(async () => ({ status: "pending" }));
  Object.assign(service, {
    twilio: {
      verify: {
        v2: {
          services: () => ({
            verifications: { create: send },
            verificationChecks: { create: check },
          }),
        },
      },
    },
  });
  return { service, send, check, otps, users, challenge };
}
describe("SMS verification adapter", () => {
  it("sends SMS without returning the OTP and enforces resend cooldown", async () => {
    const f = fixture();
    const result = await f.service.sendOtp({ phone: "+4915123456789" });
    expect(f.send).toHaveBeenCalledWith({
      to: "+4915123456789",
      channel: "sms",
    });
    expect(result).not.toHaveProperty("code");
    await expect(
      f.service.sendOtp({ phone: "+4915123456789" }),
    ).rejects.toMatchObject({ status: 429 });
    expect(f.send).toHaveBeenCalledTimes(1);
  });
  it("removes the challenge on delivery failure and hides provider details", async () => {
    const f = fixture();
    f.send.mockRejectedValueOnce({
      status: 400,
      message: "provider secret",
    } as never);
    await expect(
      f.service.sendOtp({ phone: "+4915123456789" }),
    ).rejects.toThrow("errors.otpSendFailed");
    expect(f.otps.deleteMany).toHaveBeenLastCalledWith({ _id: "challenge" });
  });
  it("returns rate limiting for provider quota exhaustion", async () => {
    const f = fixture();
    f.send.mockRejectedValueOnce({ code: 60203 } as never);
    await expect(
      f.service.sendOtp({ phone: "+4915123456789" }),
    ).rejects.toMatchObject({ status: 429 });
  });
  it("rejects invalid and expired codes before authenticating a user", async () => {
    const f = fixture();
    await expect(
      f.service.confirmOtp({ phone: "+4915123456789", code: "123456" }),
    ).rejects.toThrow("errors.otpInvalid");
    expect(f.challenge.attempts).toBe(1);
    expect(f.users.findOne).not.toHaveBeenCalled();
    f.challenge.expiresAt = new Date(0);
    f.check.mockClear();
    await expect(
      f.service.confirmOtp({ phone: "+4915123456789", code: "123456" }),
    ).rejects.toThrow("errors.otpInvalid");
    expect(f.check).not.toHaveBeenCalled();
  });
  it("rejects unsupported channels, malformed phone numbers and non-six-digit codes", async () => {
    expect(
      (
        await validate(
          Object.assign(new SendOtpDto(), { phone: "123", channel: "email" }),
        )
      ).length,
    ).toBe(2);
    expect(
      (
        await validate(
          Object.assign(new ConfirmOtpDto(), {
            phone: "+4915123456789",
            code: "00000",
          }),
        )
      ).length,
    ).toBe(1);
  });
});
