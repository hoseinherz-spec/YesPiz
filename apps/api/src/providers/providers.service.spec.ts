import { validate } from "class-validator";
import type { Model } from "mongoose";
import { ProvidersService } from "./providers.service";
import { ProviderSelfUpdateDto, UpdateProviderDto } from "./dto/provider.dto";
import type { ProviderDocument } from "./schemas/provider.schema";

describe("provider capacity", () => {
  it.each([ProviderSelfUpdateDto, UpdateProviderDto])(
    "validates whole-order limits and allows clearing (%p)",
    async (Dto) => {
      for (const acceptCap of [null, undefined, 1, 12]) {
        expect(
          await validate(Object.assign(new Dto(), { acceptCap })),
        ).toHaveLength(0);
      }
      for (const acceptCap of [0, -1, 1.5, "12"]) {
        expect(
          (await validate(Object.assign(new Dto(), { acceptCap }))).length,
        ).toBeGreaterThan(0);
      }
    },
  );

  it("clears an existing limit with null, but leaves it unchanged when omitted", async () => {
    const findOneAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ acceptCap: null }),
    });
    const service = new ProvidersService({
      findOneAndUpdate,
    } as unknown as Model<ProviderDocument>);
    const userId = "507f1f77bcf86cd799439011";
    await service.updateSelf(userId, { acceptCap: null });
    expect(findOneAndUpdate.mock.calls[0][1]).toEqual({
      $set: { acceptCap: null },
    });
    await service.updateSelf(userId, { logoUrl: "logo.png" });
    expect(findOneAndUpdate.mock.calls[1][1]).toEqual({
      $set: { logoUrl: "logo.png" },
    });
  });
});
