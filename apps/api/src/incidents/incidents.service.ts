import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { IncidentKind, IncidentStatus, OrderStatus } from "../common/enums";
import { Order, OrderDocument } from "../orders/schemas/order.schema";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { CreateIncidentDto, ResolveIncidentDto } from "./dto/incident.dto";
import { Incident, IncidentDocument } from "./schemas/incident.schema";

const WORKFLOW_BY_KIND: Record<
  IncidentKind,
  { initialStatus: IncidentStatus; steps: string[] }
> = {
  [IncidentKind.CRASH]: {
    initialStatus: IncidentStatus.REASSIGNING,
    steps: ["secure_scene", "reassign_courier", "notify_customer"],
  },
  [IncidentKind.NO_ANSWER]: {
    initialStatus: IncidentStatus.WAITING,
    steps: ["wait_timer_5m", "call_retry", "leave_or_return"],
  },
  [IncidentKind.NO_PAY]: {
    initialStatus: IncidentStatus.OPEN,
    steps: ["record_debt", "failed_cash_path", "escalate_admin"],
  },
  [IncidentKind.WRONG_ADDRESS]: {
    initialStatus: IncidentStatus.OPEN,
    steps: ["confirm_address", "reroute_or_return"],
  },
  [IncidentKind.DAMAGED_PACK]: {
    initialStatus: IncidentStatus.OPEN,
    steps: ["photo_evidence", "quality_incident", "remake_or_credit"],
  },
  [IncidentKind.VEHICLE]: {
    initialStatus: IncidentStatus.REASSIGNING,
    steps: ["safe_stop", "reassign_courier"],
  },
  [IncidentKind.SOS]: {
    initialStatus: IncidentStatus.OPEN,
    steps: ["share_location", "alert_ops", "emergency_contacts"],
  },
};

@Injectable()
export class IncidentsService {
  constructor(
    @InjectModel(Incident.name)
    private readonly incidents: Model<IncidentDocument>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    private readonly realtime: RealtimeGateway,
  ) {}

  async report(courierId: string, orderId: string, dto: CreateIncidentDto) {
    const order = await this.orders.findById(orderId).exec();
    if (!order) throw new NotFoundException("errors.notFound");
    if (String(order.courierId) !== courierId) {
      throw new ForbiddenException("errors.forbidden");
    }
    const activeStatuses = new Set([
      OrderStatus.ASSIGNED_TO_COURIER,
      OrderStatus.PICKED_UP,
      OrderStatus.ON_THE_WAY,
      OrderStatus.DELIVERED,
    ]);
    if (!activeStatuses.has(order.status)) {
      throw new BadRequestException("errors.badRequest");
    }

    const plan = WORKFLOW_BY_KIND[dto.kind];
    const incident = await this.incidents.create({
      orderId: order._id,
      batchId: order.batchId,
      courierId: new Types.ObjectId(courierId),
      kind: dto.kind,
      status: plan.initialStatus,
      notes: dto.notes ?? "",
      longitude: dto.longitude,
      latitude: dto.latitude,
      workflow: {
        steps: plan.steps,
        currentStep: plan.steps[0],
        startedAt: new Date().toISOString(),
        waitUntil:
          dto.kind === IncidentKind.NO_ANSWER
            ? new Date(Date.now() + 5 * 60_000).toISOString()
            : undefined,
        debtCents:
          dto.kind === IncidentKind.NO_PAY ? order.totalCents : undefined,
        sos: dto.kind === IncidentKind.SOS,
      },
    });

    // Flag order for ops visibility without leaking kitchen failure wording
    if (
      dto.kind === IncidentKind.CRASH ||
      dto.kind === IncidentKind.SOS ||
      dto.kind === IncidentKind.VEHICLE
    ) {
      order.status = OrderStatus.EXCEPTION_REPORTED;
      await order.save();
      this.realtime.emitOrderStatus(
        order.id,
        String(order.customerId),
        order.status,
      );
    }

    this.realtime.emitToUser(String(order.customerId), "incident.created", {
      orderId: order.id,
      kind: dto.kind,
      // Blind: no kitchen/courier identity
    });

    return incident;
  }

  listForCourier(courierId: string) {
    return this.incidents
      .find({ courierId: new Types.ObjectId(courierId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  listOpen() {
    return this.incidents
      .find({
        status: {
          $in: [
            IncidentStatus.OPEN,
            IncidentStatus.WAITING,
            IncidentStatus.REASSIGNING,
          ],
        },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async get(id: string) {
    const doc = await this.incidents.findById(id).exec();
    if (!doc) throw new NotFoundException("errors.notFound");
    return doc;
  }

  async resolve(id: string, dto: ResolveIncidentDto) {
    if (
      dto.status !== IncidentStatus.RESOLVED &&
      dto.status !== IncidentStatus.CANCELLED
    ) {
      throw new BadRequestException("errors.badRequest");
    }
    const doc = await this.get(id);
    doc.status = dto.status;
    doc.resolveNotes = dto.notes;
    doc.resolvedAt = new Date();
    if (dto.replacementCourierId) {
      doc.replacementCourierId = new Types.ObjectId(dto.replacementCourierId);
      doc.workflow = {
        ...doc.workflow,
        replacementCourierId: dto.replacementCourierId,
        currentStep: "reassigned",
      };

      const order = await this.orders.findById(doc.orderId).exec();
      if (order) {
        order.courierId = doc.replacementCourierId;
        if (order.status === OrderStatus.EXCEPTION_REPORTED) {
          order.status = OrderStatus.ASSIGNED_TO_COURIER;
        }
        await order.save();
        this.realtime.emitOrderStatus(
          order.id,
          String(order.customerId),
          order.status,
        );
      }
    }
    await doc.save();
    return doc;
  }
}
