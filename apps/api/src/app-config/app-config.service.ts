import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AppConfig, AppConfigDocument } from "./schemas/app-config.schema";

@Injectable()
export class AppConfigService implements OnModuleInit {
  private cache: AppConfigDocument | null = null;

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
    }
    this.cache = doc;
    return doc;
  }

  async get(): Promise<AppConfigDocument> {
    if (this.cache) {
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
    this.cache = doc;
    return doc!;
  }
}
