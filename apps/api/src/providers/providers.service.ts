import { canReceiveOrder, validateHours } from "./availability";
import { OpeningHoursDto } from "./dto/provider.dto";
import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  CreateProviderDto,
  EightySixDto,
  PauseOrdersDto,
  ProviderSelfUpdateDto,
  UpdateProviderDto,
} from "./dto/provider.dto";
import { Provider, ProviderDocument } from "./schemas/provider.schema";

@Injectable()
export class ProvidersService implements OnModuleInit {
  constructor(
    @InjectModel(Provider.name)
    private readonly providers: Model<ProviderDocument>,
  ) {}

  async onModuleInit() {
    await this.providers.init();
  }

  create(dto: CreateProviderDto) {
    return this.providers.create({
      userId: new Types.ObjectId(dto.userId),
      name: dto.name,
      address: dto.address,
      logoUrl: dto.logoUrl,
      longitude: dto.longitude,
      latitude: dto.latitude,
      location: {
        type: "Point",
        coordinates: [dto.longitude, dto.latitude],
      },
      rating: dto.rating ?? 4.5,
    });
  }

  list() {
    return this.providers.find().exec();
  }

  async getById(id: string) {
    const doc = await this.providers.findById(id).exec();
    if (!doc) throw new NotFoundException("errors.notFound");
    return doc;
  }

  async update(id: string, dto: UpdateProviderDto) {
    const update: Record<string, unknown> = { ...dto };
    if (dto.longitude != null && dto.latitude != null) {
      update.location = {
        type: "Point",
        coordinates: [dto.longitude, dto.latitude],
      };
    }
    const doc = await this.providers
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .exec();
    if (!doc) throw new NotFoundException("errors.notFound");
    return doc;
  }

  async getSelf(userId: string) {
    const doc = await this.providers
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!doc) throw new NotFoundException("errors.notFound");
    return doc;
  }

  async updateSelf(userId: string, dto: ProviderSelfUpdateDto) {
    if (dto.pausedUntil && new Date(dto.pausedUntil).getTime() <= Date.now())
      throw new BadRequestException("Choose a future resume time.");
    const set: Record<string, unknown> = {};
    if (dto.acceptingOrders != null) set.acceptingOrders = dto.acceptingOrders;
    if (dto.logoUrl != null) set.logoUrl = dto.logoUrl;
    if (dto.acceptCap !== undefined) set.acceptCap = dto.acceptCap;
    if (dto.pauseReason != null) set.pauseReason = dto.pauseReason;
    if (dto.pausedUntil != null) set.pausedUntil = new Date(dto.pausedUntil);
    if (dto.acceptingOrders === true) {
      set.pauseReason = undefined;
      set.pausedUntil = undefined;
    }

    const doc = await this.providers
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: set },
        { new: true },
      )
      .exec();
    if (!doc) throw new NotFoundException("errors.notFound");
    return doc;
  }

  /**
   * Nearby kitchens that can take new orders: active, accepting, not suspended,
   * not paused, under acceptCap, and not 86'd for any of the required items.
   */
  async findNearby(
    lng: number,
    lat: number,
    radiusMeters: number,
    requiredItemIds: string[] = [],
  ) {
    const now = new Date();
    const docs = await this.providers
      .find({
        isActive: true,
        $or: [
          { acceptingOrders: true },
          { acceptingOrders: false, pausedUntil: { $lte: now } },
        ],
        autoSuspended: { $ne: true },
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: radiusMeters,
          },
        },
      })
      .exec();

    return docs.filter((p) => canReceiveOrder(p, requiredItemIds, now));
  }

  async setHours(userId: string, dto: OpeningHoursDto) {
    validateHours(dto.timezone, dto.openingHours, dto.closedDates);
    const doc = await this.providers
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: dto },
        { new: true },
      )
      .exec();
    if (!doc) throw new NotFoundException("Partner not found.");
    return {
      hoursEnabled: doc.hoursEnabled,
      timezone: doc.timezone,
      openingHours: doc.openingHours,
      closedDates: doc.closedDates,
    };
  }

  async bumpOpenOrders(providerId: string, delta: number) {
    const update: Record<string, unknown> = { $inc: { openOrders: delta } };
    if (delta > 0) {
      update.$inc = {
        openOrders: delta,
        recentAcceptCount: delta,
      };
    }
    await this.providers.findByIdAndUpdate(providerId, update).exec();
    // Floor openOrders at 0
    if (delta < 0) {
      await this.providers
        .updateOne(
          { _id: new Types.ObjectId(providerId), openOrders: { $lt: 0 } },
          { $set: { openOrders: 0 } },
        )
        .exec();
    }
  }

  async applyQualityPenalty(
    providerId: string,
    kind: "complaint" | "delay" | "error",
    threshold: number,
  ) {
    const penalties = { complaint: 15, delay: 10, error: 20 } as const;
    const countField =
      kind === "complaint"
        ? "complaintCount"
        : kind === "delay"
          ? "delayCount"
          : "errorCount";

    const doc = await this.providers.findById(providerId).exec();
    if (!doc) throw new NotFoundException("errors.notFound");

    doc.qualityScore = Math.max(0, doc.qualityScore - penalties[kind]);
    doc[countField] += 1;

    if (doc.qualityScore < threshold && !doc.autoSuspended) {
      doc.autoSuspended = true;
      doc.acceptingOrders = false;
      doc.suspendedAt = new Date();
      doc.suspendReason = `quality_score_below_${threshold}`;
    }

    await doc.save();
    return doc;
  }

  async unsuspend(providerId: string, reason?: string) {
    const doc = await this.providers.findById(providerId).exec();
    if (!doc) throw new NotFoundException("errors.notFound");
    doc.autoSuspended = false;
    doc.acceptingOrders = true;
    doc.suspendedAt = undefined;
    doc.suspendReason = reason ? `unsuspended: ${reason}` : undefined;
    await doc.save();
    return doc;
  }

  async eightySix(providerId: string, dto: EightySixDto) {
    if (!dto.menuItemIds.length) {
      throw new BadRequestException("errors.badRequest");
    }
    const ids = dto.menuItemIds.map((id) => new Types.ObjectId(id));
    const doc = await this.providers
      .findByIdAndUpdate(
        providerId,
        { $addToSet: { eightySixedItemIds: { $each: ids } } },
        { new: true },
      )
      .exec();
    if (!doc) throw new NotFoundException("errors.notFound");
    return doc;
  }

  async clearEightySix(providerId: string, dto: EightySixDto) {
    const ids = dto.menuItemIds.map((id) => new Types.ObjectId(id));
    const doc = await this.providers
      .findByIdAndUpdate(
        providerId,
        { $pull: { eightySixedItemIds: { $in: ids } } },
        { new: true },
      )
      .exec();
    if (!doc) throw new NotFoundException("errors.notFound");
    return doc;
  }

  async pauseOrders(providerId: string, dto: PauseOrdersDto) {
    if (dto.until && new Date(dto.until).getTime() <= Date.now())
      throw new BadRequestException("Choose a future resume time.");
    const doc = await this.providers
      .findByIdAndUpdate(
        providerId,
        {
          $set: {
            acceptingOrders: false,
            pauseReason: dto.reason ?? "paused",
            pausedUntil: dto.until ? new Date(dto.until) : undefined,
          },
        },
        { new: true },
      )
      .exec();
    if (!doc) throw new NotFoundException("errors.notFound");
    return doc;
  }

  async resumeOrders(providerId: string) {
    const doc = await this.providers
      .findByIdAndUpdate(
        providerId,
        {
          $set: { acceptingOrders: true },
          $unset: { pauseReason: 1, pausedUntil: 1 },
        },
        { new: true },
      )
      .exec();
    if (!doc) throw new NotFoundException("errors.notFound");
    return doc;
  }
}
