import { PushService } from "./push.service";
const send = jest.fn();
jest.mock("google-auth-library", () => ({
  GoogleAuth: jest
    .fn()
    .mockImplementation(() => ({ getClient: async () => ({ request: send }) })),
}));

describe("FCM durable delivery", () => {
  function setup() {
    const notification = {
      id: "notification",
      userId: "user",
      title: "Order update",
      body: "Delivery on the way",
      data: { orderId: "order" },
      deliveryStatus: "sending",
      attempts: 1,
      deliveredTokens: [] as string[],
      lastError: undefined as string | undefined,
      nextAttemptAt: new Date(),
      save: jest.fn(),
    };
    const claim = jest
      .fn()
      .mockReturnValueOnce({ exec: async () => notification })
      .mockReturnValue({ exec: async () => null });
    const remove = jest.fn().mockReturnValue({ exec: async () => undefined });
    const service = new PushService(
      { findOneAndUpdate: claim } as never,
      {
        get: (key: string) =>
          key === "FCM_PROJECT_ID" ? "test-project" : undefined,
      } as never,
      {
        find: () => ({
          exec: async () => [{ _id: "device", token: "fake-fcm-token" }],
        }),
        deleteOne: remove,
      } as never,
      {} as never,
    );
    return { service, notification, remove };
  }
  beforeEach(() => send.mockReset());
  it("sends an authenticated HTTP v1 message and records delivery", async () => {
    send.mockResolvedValue({});
    const { service, notification } = setup();
    await service.deliverQueued();
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://fcm.googleapis.com/v1/projects/test-project/messages:send",
        method: "POST",
      }),
    );
    expect(notification.deliveryStatus).toBe("delivered");
    expect(notification.deliveredTokens).toHaveLength(1);
    expect(notification.deliveredTokens[0]).not.toContain("fake-fcm-token");
  });
  it("queues a transient failure with backoff", async () => {
    send.mockRejectedValue(new Error("offline"));
    const { service, notification } = setup();
    await service.deliverQueued();
    expect(notification.deliveryStatus).toBe("queued");
    expect(notification.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
  });
  it("removes unregistered tokens instead of retrying them forever", async () => {
    send.mockRejectedValue({
      response: {
        data: { error: { details: [{ errorCode: "UNREGISTERED" }] } },
      },
    });
    const { service, remove } = setup();
    await service.deliverQueued();
    expect(remove).toHaveBeenCalledWith({
      _id: "device",
      token: "fake-fcm-token",
    });
  });
});
