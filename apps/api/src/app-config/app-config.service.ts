import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AppConfig, AppConfigDocument } from "./schemas/app-config.schema";

@Injectable()
export class AppConfigService implements OnModuleInit {
  private cache: AppConfigDocument | null = null;

  private cacheAt = 0;
  constructor(
    @InjectModel(AppConfig.name)
    private readonly model: Model<AppConfigDocument>,
  ) {}

  async onModuleInit() {
    await this.ensureDefaults();
  }

  async ensureDefaults() {
    let doc = await this.model.findOne({ key: "default" }).exec();
    if (!doc) {
      doc = await this.model.create({ key: "default" });
    } else {
      let dirty = false;
      const defaults: Partial<AppConfig> = {
        cashHardCapCents: 50_000,
        qualityAutoSuspendThreshold: 40,
        waveSize: 3,
        bidWindowSeconds: 15,
        w4Fairness: 0.15,
        w5Quality: 0.25,
        maxBatchHoldMinutes: 8,
        maxBagMinutes: 8,
        pickupGeoRadiusMeters: 250,
        dropoffGeoRadiusMeters: 150,
        etaBasePrepMinutes: 18,
        etaBaseDeliveryMinutes: 22,
        etaWindowPaddingMinutes: 5,
      };
      for (const [key, value] of Object.entries(defaults)) {
        if ((doc as unknown as Record<string, unknown>)[key] == null) {
          (doc as unknown as Record<string, unknown>)[key] = value;
          dirty = true;
        }
      }
      if (dirty) await doc.save();
    }
    this.cacheAt = Date.now();
    this.cache = doc;
    return doc;
  }

  async get(): Promise<AppConfigDocument> {
    if (this.cache && Date.now() - this.cacheAt < 5000) {
      return this.cache;
    }
    return this.ensureDefaults();
  }

  async update(partial: Partial<AppConfig>): Promise<AppConfigDocument> {
    const doc = await this.model
      .findOneAndUpdate(
        { key: "default" },
        { $set: partial },
        { new: true, upsert: true },
      )
      .exec();
    this.cacheAt = Date.now();
    this.cache = doc;
    return doc!;
  }
}
