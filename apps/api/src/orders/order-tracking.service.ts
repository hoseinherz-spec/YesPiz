import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ConfigService } from "@nestjs/config";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "../account/schemas/user.schema";
import {
  CourierProfile,
  CourierProfileDocument,
} from "../couriers/schemas/courier.schema";
import { OrderStatus } from "../common/enums";
import { Order, OrderDocument } from "./schemas/order.schema";
import { OrdersService } from "./orders.service";
import { toCustomerView } from "./orders.sanitizer";

type Point = { latitude: number; longitude: number };
const point = (
  latitude?: number | null,
  longitude?: number | null,
): Point | null =>
  typeof latitude === "number" &&
  typeof longitude === "number" &&
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  Math.abs(latitude) <= 90 &&
  Math.abs(longitude) <= 180
    ? { latitude, longitude }
    : null;

@Injectable()
export class OrderTrackingService {
  private readonly routes = new Map<
    string,
    { expires: number; value: [number, number][] | null }
  >();
  constructor(
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(CourierProfile.name)
    private readonly profiles: Model<CourierProfileDocument>,
    private readonly orderService: OrdersService,
    private readonly config: ConfigService,
  ) {}

  async get(userId: string, orderId: string) {
    if (!Types.ObjectId.isValid(orderId))
      throw new NotFoundException("errors.notFound");
    const order = await this.orders
      .findOne({ _id: orderId, customerId: userId })
      .exec();
    if (!order) throw new NotFoundException("errors.notFound");
    const view = toCustomerView(order);
    const active = view.orderState === "active";
    const destination = point(order.deliveryLatitude, order.deliveryLongitude);
    const location = active
      ? await this.orderService.getCourierLocationForCustomer(userId, orderId)
      : { latitude: null, longitude: null, updatedAt: null };
    let rider: {
      name: string;
      avatarUrl: string | null;
      vehicleType: string | null;
      vehicleModel: string | null;
      plateNumber: string | null;
      memberSince: string | null;
      completedOrders: number;
    } | null = null;
    if (active && order.courierId) {
      const [user, profile, completedOrders] = await Promise.all([
        this.users
          .findById(order.courierId)
          .select("firstName lastName")
          .exec(),
        this.profiles
          .findOne({ userId: order.courierId, isActive: true })
          .exec(),
        this.orders
          .countDocuments({
            courierId: order.courierId,
            status: { $in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
          })
          .exec(),
      ]);
      if (user && profile)
        rider = {
          name: [user.firstName, user.lastName].filter(Boolean).join(" "),
          avatarUrl: profile.avatarUrl?.startsWith("https://")
            ? profile.avatarUrl
            : null,
          vehicleType: profile.vehicleType || null,
          vehicleModel: profile.vehicleModel || profile.vehicleType || null,
          plateNumber: profile.plateNumber || null,
          memberSince: profile.createdAt?.toISOString() ?? null,
          completedOrders,
        };
    }
    const from = point(location.latitude, location.longitude);
    return {
      order: view,
      destination,
      location,
      rider,
      route:
        from && destination
          ? await this.route(orderId, from, destination)
          : null,
    };
  }

  /** Optional server-configured OSRM; never draw an invented road route. */
  private async route(
    orderId: string,
    from: Point,
    to: Point,
  ): Promise<[number, number][] | null> {
    const base = this.config.get<string>("TRACKING_OSRM_URL");
    if (!base) return null;
    const key = `${orderId}:${to.latitude}:${to.longitude}`;
    const cached = this.routes.get(key);
    if (cached && cached.expires > Date.now()) return cached.value;
    let value: [number, number][] | null = null;
    try {
      const response = await fetch(
        `${base.replace(/\/$/, "")}/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`,
        { signal: AbortSignal.timeout(2500) },
      );
      if (response.ok) {
        const data = (await response.json()) as {
          routes?: { geometry?: { coordinates?: unknown[] } }[];
        };
        const coords = data.routes?.[0]?.geometry?.coordinates;
        if (
          coords?.length &&
          coords.length <= 20000 &&
          coords.every((p) => Array.isArray(p) && point(p[1], p[0]))
        )
          value = coords.map((p) => {
            const c = p as number[];
            return [c[1], c[0]];
          });
      }
    } catch {
      /* GPS remains usable when routing is offline. */
    }
    if (this.routes.size >= 500)
      this.routes.delete(this.routes.keys().next().value!);
    this.routes.set(key, { expires: Date.now() + 30_000, value });
    return value;
  }
}
