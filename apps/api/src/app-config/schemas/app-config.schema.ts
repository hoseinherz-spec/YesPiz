import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type AppConfigDocument = HydratedDocument<AppConfig>;

@Schema({ timestamps: true, collection: "app_config" })
export class AppConfig {
  @Prop({ default: 299 }) deliveryFeeCents!: number;
  @Prop({ default: -200 }) smallSizeDeltaCents!: number;
  @Prop({ default: 0 }) mediumSizeDeltaCents!: number;
  @Prop({ default: 300 }) largeSizeDeltaCents!: number;
  @Prop({ default: 150 }) extraCheeseCents!: number;
  @Prop({ default: 100 }) jalapenosCents!: number;
  @Prop({ default: 100 }) olivesCents!: number;
  @Prop({ default: 90 }) garlicDipCents!: number;

  @Prop({ default: "default", unique: true })
  key!: string;

  /** Dispatch score weights */
  @Prop({ default: 0.4 })
  w1Rating!: number;

  @Prop({ default: 0.4 })
  w2Proximity!: number;

  @Prop({ default: 0.2 })
  w3QueueEmptiness!: number;

  /** Fairness / anti-monopoly weight in wave pick (0–1) */
  @Prop({ default: 0.15 })
  w4Fairness!: number;

  /** Quality score weight in wave pick among ready bidders (0–1) */
  @Prop({ default: 0.25 })
  w5Quality!: number;

  /** Legacy top-N for ranking pool before wave slice */
  @Prop({ default: 5 })
  dispatchTopN!: number;

  /** Wave size — how many kitchens get a bid window (target: 3) */
  @Prop({ default: 3 })
  waveSize!: number;

  /** Bid window for ready + quoted prep (target: 10–20s) */
  @Prop({ default: 15 })
  bidWindowSeconds!: number;

  @Prop({ default: 3000 })
  dispatchInitialRadiusMeters!: number;

  @Prop({ default: 6000 })
  dispatchExpandedRadiusMeters!: number;

  /** Kept for backward compat; wave uses bidWindowSeconds */
  @Prop({ default: 90 })
  offerTimeoutSeconds!: number;

  /** Failed cash deliveries after which cash is banned for the customer */
  @Prop({ default: 1 })
  cashFailThreshold!: number;

  /** Hard cap for cash orders in cents (€500). P0 hygiene — Cash Trust Score is P1. */
  @Prop({ default: 50_000 })
  cashHardCapCents!: number;

  /** Internal quality score below which the kitchen is auto-suspended */
  @Prop({ default: 40 })
  qualityAutoSuspendThreshold!: number;

  @Prop({ default: 3 })
  maxBatchSize!: number;

  /** Max minutes food may wait in bag for batching */
  @Prop({ default: 8 })
  maxBatchHoldMinutes!: number;

  /** Max route deviation minutes added by an extra stop */
  @Prop({ default: 8 })
  maxBagMinutes!: number;

  /** Pickup must be within this radius of kitchen (meters) */
  @Prop({ default: 250 })
  pickupGeoRadiusMeters!: number;

  /** Drop-off must be within this radius of customer address (meters) */
  @Prop({ default: 150 })
  dropoffGeoRadiusMeters!: number;

  /** ETA base minutes when history is thin */
  @Prop({ default: 18 })
  etaBasePrepMinutes!: number;

  @Prop({ default: 22 })
  etaBaseDeliveryMinutes!: number;

  /** Half-width of ETA window (± minutes) */
  @Prop({ default: 5 })
  etaWindowPaddingMinutes!: number;

  /** One-time SLA miss credit in cents (e.g. €5). */
  @Prop({ default: 500 })
  slaCompensationCents!: number;
}

export const AppConfigSchema = SchemaFactory.createForClass(AppConfig);
