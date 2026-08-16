import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { IncidentKind, IncidentStatus } from "../../common/enums";

export type IncidentDocument = HydratedDocument<Incident>;

@Schema({ timestamps: true, collection: "incidents" })
export class Incident {
  @Prop({ type: Types.ObjectId, ref: "Order", required: true, index: true })
  orderId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Batch" })
  batchId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  courierId!: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(IncidentKind), required: true })
  kind!: IncidentKind;

  @Prop({
    type: String,
    enum: Object.values(IncidentStatus),
    default: IncidentStatus.OPEN,
  })
  status!: IncidentStatus;

  @Prop({ default: "" })
  notes!: string;

  @Prop()
  longitude?: number;

  @Prop()
  latitude?: number;

  /** Workflow payload: timers, debt, replacement courier, etc. */
  @Prop({ type: Object, default: {} })
  workflow!: Record<string, unknown>;

  @Prop({ type: Types.ObjectId, ref: "User" })
  replacementCourierId?: Types.ObjectId;

  @Prop()
  resolvedAt?: Date;

  @Prop()
  resolveNotes?: string;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);
