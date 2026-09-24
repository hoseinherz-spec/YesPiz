import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { AccountService } from "./account.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UserRole } from "../common/enums";

describe("MongoDB profile sync", () => {
  const profile = {
    id: "user-1",
    firstName: "Ada",
    lastName: "Lovelace",
    roles: [UserRole.CUSTOMER],
    activeRole: UserRole.CUSTOMER,
    isActive: true,
    profileRevision: 3,
  };
  const query = (value: unknown) => ({
    exec: jest.fn().mockResolvedValue(value),
  });
  let users: { findById: jest.Mock; findOneAndUpdate: jest.Mock };
  let service: AccountService;
  beforeEach(() => {
    users = {
      findById: jest.fn(() => query(profile)),
      findOneAndUpdate: jest.fn(() =>
        query({ ...profile, profileRevision: 4 }),
      ),
    };
    service = Object.assign(Object.create(AccountService.prototype), { users });
  });
  it("updates only the authenticated account with a matching revision", async () => {
    const result = await service.updateProfile("user-1", {
      firstName: " Ada ",
      lastName: "Lovelace",
      revision: 3,
    });
    expect(result.profileRevision).toBe(4);
    expect(users.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: "user-1", isActive: true, profileRevision: 3 },
      {
        $set: { firstName: "Ada", lastName: "Lovelace" },
        $inc: { profileRevision: 1 },
      },
      { new: true, runValidators: true },
    );
  });
  it("rejects a stale save instead of overwriting another device", async () => {
    users.findOneAndUpdate.mockReturnValue(query(null));
    await expect(
      service.updateProfile("user-1", {
        firstName: "Ada",
        lastName: "Lovelace",
        revision: 2,
      }),
    ).rejects.toThrow("another device");
  });
  it("accepts legacy documents without a revision", async () => {
    await service.updateProfile("user-1", {
      firstName: "Ada",
      lastName: "Lovelace",
      revision: 0,
    });
    expect(users.findOneAndUpdate.mock.calls[0][0].$or).toEqual([
      { profileRevision: 0 },
      { profileRevision: { $exists: false } },
    ]);
  });
  it("does not read or update disabled accounts", async () => {
    users.findById.mockReturnValue(query({ ...profile, isActive: false }));
    await expect(service.getProfile("user-1")).rejects.toThrow();
    await expect(
      service.updateProfile("user-1", {
        firstName: "Ada",
        lastName: "Lovelace",
        revision: 3,
      }),
    ).rejects.toThrow();
    expect(users.findOneAndUpdate).not.toHaveBeenCalled();
  });
  it.each([
    { firstName: "   ", lastName: "Name", revision: 0 },
    { firstName: "Name", lastName: "Name", revision: -1 },
    { firstName: "Name", lastName: "Name", revision: 0, roles: ["admin"] },
    {
      firstName: "Name",
      lastName: "Name",
      revision: 0,
      email: "attacker@example.com",
    },
  ])("rejects invalid or privileged fields: %j", async (body) => {
    const errors = await validate(plainToInstance(UpdateProfileDto, body), {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});
