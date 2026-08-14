import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type AppConfigDocument = HydratedDocument<AppConfig>;

@Schema({ timestamps: true, collection: "app_config" })
export class AppConfig {
  @Prop({ default: "default", unique: true })
  key!: string;

  /** Dispatch score weights */
  @Prop({ default: 0.4 })
  w1Rating!: number;

  @Prop({ default: 0.4 })
  w2Proximity!: number;

  @Prop({ default: 0.2 })
  w3QueueEmptiness!: number;

  @Prop({ default: 5 })
  dispatchTopN!: number;

  @Prop({ default: 3000 })
  dispatchInitialRadiusMeters!: number;

  @Prop({ default: 6000 })
  dispatchExpandedRadiusMeters!: number;

  @Prop({ default: 90 })
  offerTimeoutSeconds!: number;

  /** Failed cash deliveries after which cash is banned for the customer */
  @Prop({ default: 1 })
  cashFailThreshold!: number;

  @Prop({ default: 3 })
  maxBatchSize!: number;
}

export const AppConfigSchema = SchemaFactory.createForClass(AppConfig);
