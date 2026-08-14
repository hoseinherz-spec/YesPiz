import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { randomInt } from "crypto";
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
export class CouriersService {
  constructor(
    @InjectModel(CourierProfile.name)
    private readonly profiles: Model<CourierProfileDocument>,
    @InjectModel(CourierSession.name)
    private readonly sessions: Model<CourierSessionDocument>,
    private readonly realtime: RealtimeGateway,
  ) {}

  async getOrCreateProfile(userId: string) {
    let profile = await this.profiles
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!profile) {
      profile = await this.profiles.create({
        userId: new Types.ObjectId(userId),
      });
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

  async startSession(userId: string, dto: SessionCodeDto) {
    const profile = await this.getOrCreateProfile(userId);
    const active = await this.sessions
      .findOne({ courierId: new Types.ObjectId(userId), status: "active" })
      .exec();
    if (active) {
      throw new BadRequestException("errors.conflict");
    }

    // Accept any non-empty QR/OTP in phase-1; generate expected code for demo
    if (!dto.code?.trim()) {
      throw new BadRequestException("errors.badRequest");
    }

    const session = await this.sessions.create({
      courierId: new Types.ObjectId(userId),
      startCode: dto.code.trim(),
      startedAt: new Date(),
      status: "active",
      endCode: String(randomInt(100000, 999999)),
    });
    profile.onDuty = true;
    await profile.save();
    return session;
  }

  async endSession(userId: string, dto: SessionCodeDto) {
    const session = await this.sessions
      .findOne({ courierId: new Types.ObjectId(userId), status: "active" })
      .exec();
    if (!session) {
      throw new NotFoundException("errors.notFound");
    }
    if (
      session.endCode &&
      dto.code.trim() !== session.endCode &&
      dto.code.trim() !== "000000"
    ) {
      // Dev bypass 000000 for end OTP as well when convenient
      throw new BadRequestException("errors.otpInvalid");
    }
    session.status = "ended";
    session.endedAt = new Date();
    await session.save();

    await this.profiles
      .updateOne({ userId: new Types.ObjectId(userId) }, { onDuty: false })
      .exec();
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

    return {
      longitude: dto.longitude,
      latitude: dto.latitude,
      updatedAt,
    };
  }
}
