import { Types } from "mongoose";
import { PushService } from "./push.service";

describe("customer notification inbox", () => {
  const userId = "507f1f77bcf86cd799439011";
  const cursor = "607f1f77bcf86cd799439011";
  function setup() {
    const rows = Array.from({ length: 31 }, (_, index) => ({
      _id: new Types.ObjectId(),
      title: "Order update",
      body: "Preparing",
      createdAt: new Date(),
      readAt: index ? new Date() : undefined,
      data: { orderId: "order" },
    }));
    const query: any = {
      select: jest.fn(() => query),
      sort: jest.fn(() => query),
      limit: jest.fn(() => query),
      lean: jest.fn(() => query),
      exec: jest.fn(async () => rows),
    };
    const model = {
      find: jest.fn(() => query),
      countDocuments: jest.fn(() => ({ exec: async () => 7 })),
      updateMany: jest.fn(() => ({ exec: async () => ({ modifiedCount: 1 }) })),
    };
    return {
      service: new PushService(
        model as never,
        {} as never,
        {} as never,
        {} as never,
      ),
      model,
      query,
      rows,
    };
  }
  it("scopes pages and unread counts to the signed-in customer, excluding provider alerts", async () => {
    const { service, model, query, rows } = setup();
    const result = await service.inbox(userId, cursor);
    expect(model.find).toHaveBeenCalledWith({
      userId: new Types.ObjectId(userId),
      providerId: null,
      _id: { $lt: new Types.ObjectId(cursor) },
    });
    expect(model.countDocuments).toHaveBeenCalledWith({
      userId: new Types.ObjectId(userId),
      providerId: null,
      readAt: null,
    });
    expect(query.limit).toHaveBeenCalledWith(31);
    expect(result.items).toHaveLength(30);
    expect(result.nextCursor).toBe(String(rows[29]._id));
    expect(result.unreadCount).toBe(7);
    expect(result.items[0]).toMatchObject({ unread: true, kind: "order" });
    expect(result.items[0]).not.toHaveProperty("deliveredTokens");
  });
  it("only marks owned notifications through the displayed snapshot as read", async () => {
    const { service, model } = setup();
    await service.readInbox(userId, cursor);
    expect(model.updateMany).toHaveBeenCalledWith(
      {
        userId: new Types.ObjectId(userId),
        providerId: null,
        _id: { $lte: new Types.ObjectId(cursor) },
        readAt: null,
      },
      { $set: { readAt: expect.any(Date) } },
    );
  });
  it("rejects invalid cursors before accessing storage", async () => {
    const { service, model } = setup();
    await expect(service.inbox(userId, "invalid")).rejects.toThrow(
      "Invalid cursor",
    );
    await expect(service.readInbox(userId, "")).rejects.toThrow(
      "Invalid cursor",
    );
    expect(model.find).not.toHaveBeenCalled();
    expect(model.updateMany).not.toHaveBeenCalled();
  });
});
