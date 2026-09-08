import { RealtimeGateway } from "./realtime.gateway";
import { OrderStatus } from "../common/enums";
const own = "507f1f77bcf86cd799439011";
const other = "507f1f77bcf86cd799439012";
function setup(roles = ["client"]) {
  const jwt = {
    verify: jest.fn(() => ({
      sub: own,
      roles,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })),
  };
  const providers = { exists: jest.fn().mockResolvedValue(null) };
  const gateway = new RealtimeGateway(
    jwt as any,
    { get: () => "test" } as any,
    providers as any,
  );
  const socket = {
    handshake: { auth: { token: "signed" }, headers: {} },
    data: {},
    join: jest.fn(),
    disconnect: jest.fn(),
  } as any;
  gateway.handleConnection(socket);
  gateway.handleDisconnect(socket);
  socket.join.mockClear();
  return { gateway, socket, jwt, providers };
}
describe("Realtime role isolation", () => {
  it("disconnects anonymous and invalid credentials", () => {
    const { gateway, socket, jwt } = setup();
    socket.handshake.auth = {};
    gateway.handleConnection(socket);
    expect(socket.disconnect).toHaveBeenCalledWith(true);
    socket.disconnect.mockClear();
    socket.handshake.auth.token = "invalid";
    jwt.verify.mockImplementation(() => {
      throw Error("invalid");
    });
    gateway.handleConnection(socket);
    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });
  it("allows only a customer own blind feed and rejects a whole mixed request", async () => {
    const { gateway, socket } = setup();
    await expect(gateway.handleJoin(socket, { userId: own })).resolves.toEqual({
      joined: [`user:${own}`],
    });
    socket.join.mockClear();
    await expect(
      gateway.handleJoin(socket, { rooms: [`user:${own}`, `user:${other}`] }),
    ).rejects.toThrow("Forbidden");
    expect(socket.join).not.toHaveBeenCalled();
    await expect(
      gateway.handleJoin(socket, { orderId: other }),
    ).rejects.toThrow("Forbidden");
    await expect(
      gateway.handleJoin(socket, { courierId: own }),
    ).rejects.toThrow("Forbidden");
  });
  it("limits kitchen and courier rooms to their owners", async () => {
    const kitchen = setup(["provider"]);
    await expect(
      kitchen.gateway.handleJoin(kitchen.socket, { providerId: other }),
    ).rejects.toThrow("Forbidden");
    kitchen.providers.exists.mockResolvedValue({ _id: other });
    await expect(
      kitchen.gateway.handleJoin(kitchen.socket, { providerId: other }),
    ).resolves.toBeDefined();
    expect(kitchen.providers.exists).toHaveBeenLastCalledWith({
      _id: other,
      userId: own,
    });
    const courier = setup(["courier"]);
    await expect(
      courier.gateway.handleJoin(courier.socket, { courierId: own }),
    ).resolves.toBeDefined();
    await expect(
      courier.gateway.handleJoin(courier.socket, { courierId: other }),
    ).rejects.toThrow("Forbidden");
  });
  it("allows operations rooms for admins and blocks expired sessions", async () => {
    const { gateway, socket } = setup(["admin"]);
    await expect(
      gateway.handleJoin(socket, { orderId: other }),
    ).resolves.toBeDefined();
    socket.data.expiresAt = Date.now() - 1;
    await expect(
      gateway.handleJoin(socket, { orderId: other }),
    ).rejects.toThrow("Unauthorized");
  });
  it("never emits raw kitchen status to the customer feed", () => {
    const { gateway } = setup();
    const user = jest.spyOn(gateway, "emitToUser");
    gateway.emitOrderStatus(other, own, OrderStatus.ACCEPTED_BY_PROVIDER);
    expect(user).toHaveBeenCalledWith(
      own,
      "order.status",
      expect.objectContaining({ orderId: other, customerStatus: "kitchen" }),
    );
    expect(user.mock.calls[0]![2]).not.toHaveProperty("status");
  });
});
