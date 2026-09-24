import { NotFoundException } from "@nestjs/common";
import { OrderTrackingService } from "./order-tracking.service";
import { OrderStatus } from "../common/enums";

const owner = "507f1f77bcf86cd799439011",
  id = "507f1f77bcf86cd799439012";
const query = (value: unknown) => ({
  exec: jest.fn().mockResolvedValue(value),
  select: jest.fn().mockReturnThis(),
});
describe("OrderTrackingService customer projection", () => {
  function setup(status = OrderStatus.ON_THE_WAY) {
    const order = {
      _id: id,
      customerId: owner,
      courierId: "507f1f77bcf86cd799439013",
      status,
      lines: [],
      deliveryLatitude: 48.13,
      deliveryLongitude: 11.58,
      providerId: "private-origin",
      doorPin: "1234",
    };
    const orders = {
      findOne: jest.fn(() => query(order)),
      countDocuments: jest.fn(() => query(42)),
    };
    const users = {
      findById: jest.fn(() =>
        query({
          firstName: "Sam",
          lastName: "Rider",
          phone: "+49123456789",
          passwordHash: "secret",
        }),
      ),
    };
    const profiles = {
      findOne: jest.fn(() =>
        query({
          vehicleModel: "City bike",
          plateNumber: "AB12",
          createdAt: new Date("2023-01-01"),
        }),
      ),
    };
    const orderService = {
      getCourierLocationForCustomer: jest
        .fn()
        .mockResolvedValue({
          latitude: 48.14,
          longitude: 11.59,
          updatedAt: new Date().toISOString(),
        }),
    };
    const service = new OrderTrackingService(
      orders as never,
      users as never,
      profiles as never,
      orderService as never,
      { get: () => undefined } as never,
    );
    return { service, orders, users, profiles, orderService };
  }
  it("scopes the database lookup to the authenticated order owner", async () => {
    const { service, orders } = setup();
    await service.get(owner, id);
    expect(orders.findOne).toHaveBeenCalledWith({ _id: id, customerId: owner });
  });
  it("rejects inaccessible orders before looking up rider information or GPS", async () => {
    const { service, orders, users, orderService } = setup();
    orders.findOne.mockReturnValue(query(null));
    await expect(service.get(owner, id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(users.findById).not.toHaveBeenCalled();
    expect(orderService.getCourierLocationForCustomer).not.toHaveBeenCalled();
  });
  it("rejects malformed IDs without querying the database", async () => {
    const { service, orders } = setup();
    await expect(service.get(owner, "bad-id")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(orders.findOne).not.toHaveBeenCalled();
  });
  it("returns an allowlisted rider projection and relies on guarded GPS", async () => {
    const { service, orderService } = setup();
    const view = await service.get(owner, id);
    expect(view.rider).toEqual({
      name: "Sam Rider",
      avatarUrl: null,
      vehicleModel: "City bike",
      plateNumber: "AB12",
      memberSince: "2023-01-01T00:00:00.000Z",
      completedOrders: 42,
    });
    expect(orderService.getCourierLocationForCustomer).toHaveBeenCalledWith(
      owner,
      id,
    );
    expect(JSON.stringify(view)).not.toContain("private-origin");
    expect(JSON.stringify(view)).not.toContain("passwordHash");
    expect(JSON.stringify(view)).not.toContain("+49123456789");
    expect(view.route).toBeNull();
  });
  it.each([
    OrderStatus.CANCELLED,
    OrderStatus.COMPLETED,
    OrderStatus.PENDING_PAYMENT,
  ])("does not expose rider or GPS for %s", async (status) => {
    const { service, users, orderService } = setup(status);
    const view = await service.get(owner, id);
    expect(view.rider).toBeNull();
    expect(view.location.latitude).toBeNull();
    expect(users.findById).not.toHaveBeenCalled();
    expect(orderService.getCourierLocationForCustomer).not.toHaveBeenCalled();
  });
  it("does not reconstruct hidden or stale GPS coordinates", async () => {
    const { service, orderService } = setup();
    orderService.getCourierLocationForCustomer.mockResolvedValue({
      latitude: null,
      longitude: null,
      updatedAt: null,
    });
    const view = await service.get(owner, id);
    expect(view.location).toEqual({
      latitude: null,
      longitude: null,
      updatedAt: null,
    });
    expect(view.route).toBeNull();
  });
});
