import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  CreateProviderDto,
  ProviderSelfUpdateDto,
  UpdateProviderDto,
} from "./dto/provider.dto";
import { Provider, ProviderDocument } from "./schemas/provider.schema";

@Injectable()
export class ProvidersService {
  constructor(
    @InjectModel(Provider.name)
    private readonly providers: Model<ProviderDocument>,
  ) {}

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
    const doc = await this.providers
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: dto },
        { new: true },
      )
      .exec();
    if (!doc) throw new NotFoundException("errors.notFound");
    return doc;
  }

  findNearby(lng: number, lat: number, radiusMeters: number) {
    return this.providers
      .find({
        isActive: true,
        acceptingOrders: true,
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: radiusMeters,
          },
        },
      })
      .exec();
  }

  async bumpOpenOrders(providerId: string, delta: number) {
    await this.providers
      .findByIdAndUpdate(providerId, { $inc: { openOrders: delta } })
      .exec();
  }
}
