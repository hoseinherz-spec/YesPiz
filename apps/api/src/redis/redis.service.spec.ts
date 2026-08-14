import { ConfigService } from "@nestjs/config";
import { RedisService } from "./redis.service";

describe("RedisService (in-memory locks)", () => {
  let service: RedisService;

  beforeEach(() => {
    const config = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    service = new RedisService(config);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it("acquires a lock for the owner", async () => {
    const ok = await service.acquireLock("order:accept:1", "provider-a", 5_000);
    expect(ok).toBe(true);
  });

  it("rejects a conflicting acquire from another owner", async () => {
    await service.acquireLock("order:accept:1", "provider-a", 5_000);
    const conflict = await service.acquireLock(
      "order:accept:1",
      "provider-b",
      5_000,
    );
    expect(conflict).toBe(false);
  });

  it("allows re-acquire by the same owner", async () => {
    await service.acquireLock("order:accept:1", "provider-a", 5_000);
    const again = await service.acquireLock(
      "order:accept:1",
      "provider-a",
      5_000,
    );
    expect(again).toBe(true);
  });

  it("releases lock so another owner can acquire", async () => {
    await service.acquireLock("order:accept:1", "provider-a", 5_000);
    await service.releaseLock("order:accept:1", "provider-a");

    const ok = await service.acquireLock("order:accept:1", "provider-b", 5_000);
    expect(ok).toBe(true);
  });

  it("does not release when owner mismatches", async () => {
    await service.acquireLock("order:accept:1", "provider-a", 5_000);
    await service.releaseLock("order:accept:1", "provider-b");

    const stillHeld = await service.acquireLock(
      "order:accept:1",
      "provider-b",
      5_000,
    );
    expect(stillHeld).toBe(false);
  });
});
