import {
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { UserRole } from "../common/enums";
import { AuditService } from "../common/security/audit.service";
import { AccountService } from "./account.service";
import { Invite } from "./schemas/invite.schema";
import { OtpChallenge } from "./schemas/otp.schema";
import { PasswordReset } from "./schemas/password-reset.schema";
import { User } from "./schemas/user.schema";

describe("AccountService SEC-001", () => {
  let service: AccountService;
  let users: {
    findOne: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    countDocuments: jest.Mock;
  };
  let invites: {
    findOne: jest.Mock;
    create: jest.Mock;
  };
  let otps: {
    deleteMany: jest.Mock;
    create: jest.Mock;
    findOne: jest.Mock;
  };

  const saveMock = jest.fn();

  beforeEach(async () => {
    users = {
      findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      findById: jest.fn(),
      create: jest.fn(),
      countDocuments: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
    };
    invites = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    otps = {
      deleteMany: jest.fn().mockReturnValue({ exec: jest.fn() }),
      create: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        { provide: getModelToken(User.name), useValue: users },
        { provide: getModelToken(OtpChallenge.name), useValue: otps },
        { provide: getModelToken(Invite.name), useValue: invites },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue("token") },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "JWT_SECRET") return "test-secret";
              if (key === "JWT_EXPIRES_IN") return "1h";
              if (key === "OTP_DEV_BYPASS") return "true";
              if (key === "NODE_ENV") return "test";
              return undefined;
            }),
          },
        },
        {
          provide: AuditService,
          useValue: { record: jest.fn() },
        },
        {
          provide: getModelToken(PasswordReset.name),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            deleteMany: jest.fn().mockReturnValue({ exec: jest.fn() }),
          },
        },
      ],
    }).compile();

    service = module.get(AccountService);
  });

  it("register always creates customer and never sets emailVerifiedAt", async () => {
    users.create.mockImplementation(async (doc) => ({
      id: "u1",
      ...doc,
      roles: doc.roles,
      activeRole: doc.activeRole,
    }));

    const result = await service.register({
      firstName: "A",
      lastName: "B",
      email: "a@test.local",
      password: "secret1",
      role: "client",
    });

    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: [UserRole.CUSTOMER],
        activeRole: UserRole.CUSTOMER,
      }),
    );
    const created = users.create.mock.calls[0][0] as Record<string, unknown>;
    expect(created.emailVerifiedAt).toBeUndefined();
    expect(result.user.activeRole).toBe("client");
  });

  it("register rejects privileged role in DTO path via optional role check", async () => {
    // DTO validation blocks admin; service also rejects if somehow passed
    await expect(
      service.register({
        firstName: "A",
        lastName: "B",
        email: "evil@test.local",
        password: "secret1",
        role: "admin" as "client",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("confirmOtp rejects privileged role", async () => {
    await expect(
      service.confirmOtp({
        phone: "+49111",
        code: "000000",
        role: "courier" as "client",
        firstName: "C",
        lastName: "D",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("acceptInvite creates bound role once", async () => {
    const inviteDoc = {
      role: UserRole.PROVIDER,
      email: "kitchen@test.local",
      usedAt: undefined,
      expiresAt: new Date(Date.now() + 60_000),
      save: saveMock,
    };
    invites.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(inviteDoc),
    });
    users.create.mockImplementation(async (doc) => ({
      id: "p1",
      _id: "p1",
      ...doc,
    }));
    saveMock.mockResolvedValue(undefined);

    const result = await service.acceptInvite({
      token: "raw-token",
      firstName: "Kit",
      lastName: "Chen",
      email: "kitchen@test.local",
      password: "Provider123!",
    });

    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: [UserRole.PROVIDER],
        emailVerifiedAt: expect.any(Date),
      }),
    );
    expect(inviteDoc.usedAt).toBeInstanceOf(Date);
    expect(result.user.activeRole).toBe("provider");
  });

  it("acceptInvite rejects reused invite", async () => {
    invites.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        role: UserRole.COURIER,
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      }),
    });
    await expect(
      service.acceptInvite({
        token: "used",
        firstName: "A",
        lastName: "B",
        email: "c@test.local",
        password: "Courier123!",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("acceptInvite rejects email mismatch", async () => {
    invites.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        role: UserRole.COURIER,
        email: "bound@test.local",
        usedAt: undefined,
        expiresAt: new Date(Date.now() + 60_000),
      }),
    });
    await expect(
      service.acceptInvite({
        token: "tok",
        firstName: "A",
        lastName: "B",
        email: "other@test.local",
        password: "Courier123!",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("bootstrapAdmin refuses when an admin already exists", async () => {
    users.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(1),
    });
    await expect(
      service.bootstrapAdmin({
        firstName: "A",
        lastName: "B",
        email: "a@test.local",
        password: "Admin123!",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("createInvite rejects customer role", async () => {
    await expect(
      service.createInvite("admin1", {
        role: "customer" as "provider",
      }),
    ).rejects.toBeInstanceOf(Error);
  });
});
