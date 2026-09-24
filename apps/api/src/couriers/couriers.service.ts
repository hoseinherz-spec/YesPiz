import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "../account/schemas/user.schema";
import { UserRole } from "../common/enums";
import { createHash, randomBytes } from "crypto";
import { Order, OrderDocument } from "../orders/schemas/order.schema";
import { OrderStatus } from "../common/enums";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import {
  SessionCodeDto,
  UpdateCourierLocationDto,
  UpdateCourierProfileDto,
} from "./dto/courier.dto";
import {
  CourierProfile,
  CourierProfileDocument,
  CourierSession,
  CourierSessionDocument,
} from "./schemas/courier.schema";

@Injectable()
export class CouriersService implements OnModuleInit {
  constructor(
    @InjectModel(CourierProfile.name)
    private readonly profiles: Model<CourierProfileDocument>,
    @InjectModel(CourierSession.name)
    private readonly sessions: Model<CourierSessionDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    private readonly realtime: RealtimeGateway,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
  ) {}

  async onModuleInit() {
    await Promise.all([this.profiles.init(), this.sessions.init()]);
  }

  async listAvailable() {
    const sessions = await this.sessions.find({ status: "active" }).exec();
    const ids = sessions.map((session) => session.courierId);
    const profiles = await this.profiles
      .find({ userId: { $in: ids }, onDuty: true, isActive: true })
      .exec();
    const users = await this.users
      .find({
        _id: { $in: profiles.map((profile) => profile.userId) },
        roles: UserRole.COURIER,
        isActive: true,
      })
      .exec();
    return users.map((user) => ({
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      vehicleType: profiles.find((p) => String(p.userId) === user.id)
        ?.vehicleType,
    }));
  }

  async assertAvailable(userId: string) {
    const available = await this.listAvailable();
    if (!available.some((courier) => courier.userId === userId))
      throw new BadRequestException("Choose an active courier who is on duty.");
  }

  async getOrCreateProfile(userId: string) {
    let profile = await this.profiles
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!profile) {
      profile = await this.profiles.create({
        userId: new Types.ObjectId(userId),
      });
    }
    const active = await this.currentSession(userId);
    if (profile.onDuty !== Boolean(active)) {
      profile.onDuty = Boolean(active);
      await profile.save();
    }
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateCourierProfileDto) {
    const profile = await this.profiles
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: dto },
        { new: true, upsert: true },
      )
      .exec();
    return profile;
  }

  private codeHash(code: string) {
    return createHash("sha256").update(code.trim()).digest("hex");
  }

  async listForOperations() {
    const users = await this.users
      .find({ roles: UserRole.COURIER, isActive: true })
      .exec();
    return Promise.all(
      users.map(async (user) => ({
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        session: await this.currentSession(user.id),
      })),
    );
  }

  async currentSession(userId: string) {
    return this.sessions
      .findOne({ courierId: userId, status: "active" })
      .select("-startCode -endCode")
      .exec();
  }

  async issueSessionCode(
    actorId: string,
    courierId: string,
    action: "start" | "end",
  ) {
    const user = await this.users
      .findOne({ _id: courierId, roles: UserRole.COURIER, isActive: true })
      .exec();
    if (!user) throw new NotFoundException("errors.notFound");
    const profile = await this.getOrCreateProfile(courierId);
    if (!profile.isActive)
      throw new BadRequestException("Courier is inactive.");
    const active = await this.currentSession(courierId);
    const code = randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60_000);
    if (action === "start") {
      if (active)
        throw new BadRequestException("Courier already has an active shift.");
      await this.sessions
        .findOneAndUpdate(
          { courierId, status: "pending" },
          {
            $set: {
              startCode: this.codeHash(code),
              codeExpiresAt: expiresAt,
              issuedBy: actorId,
            },
          },
          { upsert: true },
        )
        .exec();
    } else {
      if (!active) throw new BadRequestException("No active shift.");
      await this.sessions
        .updateOne(
          { _id: active._id, status: "active" },
          {
            $set: {
              endCode: this.codeHash(code),
              codeExpiresAt: expiresAt,
              issuedBy: actorId,
            },
          },
        )
        .exec();
    }
    return { code, expiresAt, action, courierId };
  }

  async startSession(userId: string, dto: SessionCodeDto) {
    const profile = await this.getOrCreateProfile(userId);
    if (!profile.isActive || (await this.currentSession(userId)))
      throw new BadRequestException("Courier is inactive or already on duty.");
    const session = await this.sessions
      .findOneAndUpdate(
        {
          courierId: userId,
          status: "pending",
          startCode: this.codeHash(dto.code),
          codeExpiresAt: { $gt: new Date() },
        },
        {
          $set: { status: "active", startedAt: new Date() },
          $unset: { startCode: 1, codeExpiresAt: 1 },
        },
        { new: true },
      )
      .exec();
    if (!session)
      throw new BadRequestException("Invalid or expired shift code.");
    profile.onDuty = true;
    await profile.save();
    return this.currentSession(userId);
  }

  async endSession(userId: string, dto: SessionCodeDto) {
    const unfinished = await this.orders.exists({
      courierId: userId,
      status: {
        $nin: [
          OrderStatus.COMPLETED,
          OrderStatus.CANCELLED,
          OrderStatus.FAILED_CASH,
        ],
      },
    });
    if (unfinished)
      throw new BadRequestException(
        "Complete or reassign your deliveries before ending the shift.",
      );
    const session = await this.sessions
      .findOneAndUpdate(
        {
          courierId: userId,
          status: "active",
          endCode: this.codeHash(dto.code),
          codeExpiresAt: { $gt: new Date() },
        },
        {
          $set: { status: "ended", endedAt: new Date() },
          $unset: { endCode: 1, codeExpiresAt: 1 },
        },
        { new: true },
      )
      .select("-startCode -endCode")
      .exec();
    if (!session)
      throw new BadRequestException("Invalid or expired shift code.");
    await this.profiles.updateOne({ userId }, { onDuty: false }).exec();
    return session;
  }

  async updateLocation(userId: string, dto: UpdateCourierLocationDto) {
    const session = await this.sessions
      .findOne({ courierId: new Types.ObjectId(userId), status: "active" })
      .exec();
    if (!session) {
      throw new NotFoundException("errors.notFound");
    }
    const updatedAt = new Date();
    session.lastLongitude = dto.longitude;
    session.lastLatitude = dto.latitude;
    session.locationUpdatedAt = updatedAt;
    await session.save();

    this.realtime.emitToCourier(userId, "courier.location", {
      courierId: userId,
      longitude: dto.longitude,
      latitude: dto.latitude,
      updatedAt: updatedAt.toISOString(),
    });

    // Invalidate only the owning customers' tracking snapshots. GPS stays behind
    // the existing ownership, active-shift, freshness and pickup-origin checks.
    const deliveries = await this.orders
      .find({ courierId: userId, status: OrderStatus.ON_THE_WAY })
      .select("_id customerId")
      .exec();
    for (const order of deliveries) {
      this.realtime.emitToUser(String(order.customerId), "courier.location", {
        orderId: String(order._id),
        updatedAt: updatedAt.toISOString(),
      });
    }

    return {
      longitude: dto.longitude,
      latitude: dto.latitude,
      updatedAt,
    };
  }
}
