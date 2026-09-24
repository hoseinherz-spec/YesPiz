import { Types } from "mongoose";
import { DispatchService } from "./dispatch.service";
import { OrderStatus, OfferStatus } from "../common/enums";

function setup(result: unknown) {
  const exec = jest.fn().mockResolvedValue(result);
  const orders = { findOneAndUpdate: jest.fn().mockReturnValue({ exec }) };
  const realtime = { emitOrderStatus: jest.fn() };
  const service = Object.assign(Object.create(DispatchService.prototype), {
    orders,
    realtime,
  }) as DispatchService;
  return { service, orders, realtime };
}
describe("restaurant view acknowledgement", () => {
  const orderId = new Types.ObjectId().toString();
  const providerId = new Types.ObjectId().toString();
  it("atomically limits the update to the invited restaurant and emits an owner update", async () => {
    const { service, orders, realtime } = setup({
      id: orderId,
      customerId: "owner",
      status: OrderStatus.PENDING_OFFERS,
    });
    await expect(service.markOfferViewed(orderId, providerId)).resolves.toEqual(
      { acknowledged: true },
    );
    expect(orders.findOneAndUpdate.mock.calls[0][0]).toEqual({
      _id: orderId,
      status: OrderStatus.PENDING_OFFERS,
      offers: {
        $elemMatch: {
          providerId: new Types.ObjectId(providerId),
          status: OfferStatus.PENDING,
          viewedAt: { $exists: false },
        },
      },
    });
    expect(realtime.emitOrderStatus).toHaveBeenCalledWith(
      orderId,
      "owner",
      OrderStatus.PENDING_OFFERS,
    );
  });
  it("does not emit for a repeat, non-invited restaurant or closed order", async () => {
    const { service, realtime } = setup(null);
    await expect(service.markOfferViewed(orderId, providerId)).resolves.toEqual(
      { acknowledged: false },
    );
    expect(realtime.emitOrderStatus).not.toHaveBeenCalled();
  });
  it("rejects malformed order IDs without touching storage", async () => {
    const { service, orders } = setup(null);
    await expect(
      service.markOfferViewed("invalid", providerId),
    ).rejects.toThrow();
    expect(orders.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
