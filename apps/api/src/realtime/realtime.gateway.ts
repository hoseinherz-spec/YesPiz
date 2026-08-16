import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

export type RealtimeEvent =
  | "order.status"
  | "offer.created"
  | "offer.expired"
  | "courier.location"
  | "incident.created";

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: "/realtime",
})
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string | undefined) ||
      (typeof client.handshake.headers.authorization === "string"
        ? client.handshake.headers.authorization.replace(/^Bearer\s+/i, "")
        : undefined);

    if (!token) {
      this.logger.debug(`Socket ${client.id} connected without JWT`);
      return;
    }

    try {
      const secret = this.config.get<string>("JWT_SECRET") || "dev-secret";
      const payload = this.jwt.verify<{ sub: string }>(token, { secret });
      client.data.userId = payload.sub;
      void client.join(`user:${payload.sub}`);
      this.logger.debug(`Socket ${client.id} authed as user:${payload.sub}`);
    } catch {
      this.logger.debug(`Socket ${client.id} JWT invalid — allowing anonymous`);
    }
  }

  @SubscribeMessage("join")
  handleJoin(
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
    const rooms = new Set<string>(body.rooms ?? []);
    if (body.orderId) rooms.add(`order:${body.orderId}`);
    if (body.providerId) rooms.add(`provider:${body.providerId}`);
    if (body.courierId) rooms.add(`courier:${body.courierId}`);
    if (body.userId) rooms.add(`user:${body.userId}`);

    for (const room of rooms) {
      void client.join(room);
    }
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
    this.emitToUser(customerId, "order.status", payload);
  }
}
