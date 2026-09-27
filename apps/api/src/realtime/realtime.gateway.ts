import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Provider,
  ProviderDocument,
} from "../providers/schemas/provider.schema";
import { ORDER_STATUS_TO_CUSTOMER, OrderStatus } from "../common/enums";

export type RealtimeEvent =
  | "order.status"
  | "offer.created"
  | "offer.expired"
  | "courier.location"
  | "incident.created"
  | "messages.updated";

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: "/realtime",
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectModel(Provider.name)
    private readonly providers: Model<ProviderDocument>,
  ) {}

  handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string | undefined) ||
      (typeof client.handshake.headers.authorization === "string"
        ? client.handshake.headers.authorization.replace(/^Bearer\s+/i, "")
        : undefined);

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const secret = this.config.get<string>("JWT_SECRET") || "dev-secret";
      const payload = this.jwt.verify<{
        sub: string;
        roles: string[];
        exp: number;
      }>(token, { secret });
      if (
        !Types.ObjectId.isValid(payload.sub) ||
        !Array.isArray(payload.roles) ||
        !payload.exp
      )
        throw new Error("Invalid session");
      client.data.roles = payload.roles;
      client.data.expiresAt = payload.exp * 1000;
      client.data.expiryTimer = setTimeout(
        () => client.disconnect(true),
        Math.min(2_147_483_647, Math.max(0, payload.exp * 1000 - Date.now())),
      );
      client.data.expiryTimer.unref();
      client.data.userId = payload.sub;
      void client.join(`user:${payload.sub}`);
      this.logger.debug(`Socket ${client.id} authed as user:${payload.sub}`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    clearTimeout(client.data.expiryTimer);
  }

  @SubscribeMessage("join")
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: {
      rooms?: string[];
      orderId?: string;
      providerId?: string;
      courierId?: string;
      userId?: string;
    },
  ) {
    if (!client.data.userId || client.data.expiresAt <= Date.now())
      throw new WsException("Unauthorized");
    if (
      !body ||
      (body.rooms !== undefined &&
        (!Array.isArray(body.rooms) || body.rooms.length > 30))
    )
      throw new WsException("Invalid rooms");
    const rooms = new Set<string>(body.rooms ?? []);
    if (body.orderId) rooms.add(`order:${body.orderId}`);
    if (body.providerId) rooms.add(`provider:${body.providerId}`);
    if (body.courierId) rooms.add(`courier:${body.courierId}`);
    if (body.userId) rooms.add(`user:${body.userId}`);

    for (const room of rooms) {
      if (typeof room !== "string") throw new WsException("Invalid room");
      const match = /^(order|provider|courier|user):([a-f0-9]{24})$/i.exec(
        room,
      );
      if (!match) throw new WsException("Invalid room");
      const [, kind, id] = match;
      const roles: string[] = client.data.roles;
      const self = id === client.data.userId;
      const allowed =
        roles.includes("admin") ||
        (kind === "user" && self) ||
        (kind === "courier" && self && roles.includes("courier")) ||
        (kind === "provider" &&
          roles.includes("provider") &&
          !!(await this.providers.exists({
            _id: id,
            userId: client.data.userId,
          })));
      // Raw order rooms are operations-only. Customers use their own blind user feed.
      if (!allowed) throw new WsException("Forbidden room");
    }
    for (const room of rooms) await client.join(room);
    return { joined: [...rooms] };
  }

  emitToOrder(orderId: string, event: RealtimeEvent, payload: unknown) {
    this.server?.to(`order:${orderId}`).emit(event, payload);
  }

  emitToProvider(providerId: string, event: RealtimeEvent, payload: unknown) {
    this.server?.to(`provider:${providerId}`).emit(event, payload);
  }

  emitToCourier(courierId: string, event: RealtimeEvent, payload: unknown) {
    this.server?.to(`courier:${courierId}`).emit(event, payload);
  }

  emitToUser(userId: string, event: RealtimeEvent, payload: unknown) {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }

  emitOrderStatus(orderId: string, customerId: string, status: string) {
    const payload = { orderId, status, at: new Date().toISOString() };
    this.emitToOrder(orderId, "order.status", payload);
    this.emitToUser(customerId, "order.status", {
      orderId,
      customerStatus: ORDER_STATUS_TO_CUSTOMER[status as OrderStatus] ?? null,
      at: payload.at,
    });
  }
}
