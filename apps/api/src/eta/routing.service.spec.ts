import { RoutingService } from "./routing.service";
import { ConfigService } from "@nestjs/config";
describe("Routing fallback", () => {
  const from = { latitude: 48, longitude: 11 },
    to = { latitude: 48.1, longitude: 11.1 };
  afterEach(() => jest.restoreAllMocks());
  it("does not contact a routing provider before activation", async () => {
    const f = jest.spyOn(global, "fetch");
    expect(
      await new RoutingService(
        new ConfigService({ GEOAPIFY_API_KEY: "test" }),
      ).minutes(from, to),
    ).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });
  it("uses road duration and caches repeated coordinates", async () => {
    const f = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({ features: [{ properties: { time: 420 } }] }),
          { status: 200 },
        ),
      );
    const s = new RoutingService(
      new ConfigService({ GEOAPIFY_API_KEY: "test", ROUTING_ENABLED: "true" }),
    );
    expect(await s.minutes(from, to)).toBe(7);
    expect(await s.minutes(from, to)).toBe(7);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("falls back safely on service failure", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("offline"));
    expect(
      await new RoutingService(
        new ConfigService({
          GEOAPIFY_API_KEY: "test",
          ROUTING_ENABLED: "true",
        }),
      ).minutes(from, to),
    ).toBeNull();
  });
});
