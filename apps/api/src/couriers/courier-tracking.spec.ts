import { CouriersService } from "./couriers.service";
import { OrderStatus } from "../common/enums";

describe("Courier GPS customer invalidation", () => {
  it("notifies only the owners of this rider's on-the-way orders, without sending raw GPS", async () => {
    const courier = "507f1f77bcf86cd799439011";
    const session = { save: jest.fn().mockResolvedValue(undefined) };
    const sessions = {
      findOne: jest.fn(() => ({ exec: async () => session })),
    };
    const orders = {
      find: jest.fn(() => ({
        select: jest
          .fn()
          .mockReturnValue({
            exec: async () => [{ _id: "order-a", customerId: "customer-a" }],
          }),
      })),
    };
    const realtime = { emitToCourier: jest.fn(), emitToUser: jest.fn() };
    const service = new CouriersService(
      {} as never,
      sessions as never,
      {} as never,
      realtime as never,
      orders as never,
    );
    await service.updateLocation(courier, {
      latitude: 48.13,
      longitude: 11.58,
    });
    expect(session.save).toHaveBeenCalledTimes(1);
    expect(orders.find).toHaveBeenCalledWith({
      courierId: courier,
      status: OrderStatus.ON_THE_WAY,
    });
    expect(realtime.emitToUser).toHaveBeenCalledWith(
      "customer-a",
      "courier.location",
      { orderId: "order-a", updatedAt: expect.any(String) },
    );
    expect(realtime.emitToUser.mock.calls[0][2]).not.toHaveProperty("latitude");
    expect(realtime.emitToUser.mock.calls[0][2]).not.toHaveProperty(
      "courierId",
    );
  });
});
