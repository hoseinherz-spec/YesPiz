import { CatalogService } from "../catalog/catalog.service";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Provider,
  ProviderDocument,
} from "../providers/schemas/provider.schema";
import { Order, OrderDocument } from "../orders/schemas/order.schema";
import { OrderStatus } from "../common/enums";
import {
  ModerateFeedbackDto,
  CreateSupportDto,
  ResolveSupportDto,
  SubmitFeedbackDto,
} from "./care.dto";
import {
  OrderFeedback,
  OrderFeedbackDocument,
  SupportCase,
  SupportCaseDocument,
} from "./care.schema";

export const CARE_RESPONSES: Record<string, string> = {
  received: "Your request is with the Yespizz support team.",
  investigating:
    "Yespizz is reviewing your order. You can follow the outcome here.",
  contact_requested:
    "Please contact Yespizz through this request if you have more information.",
  resolved:
    "Yespizz has completed the review. Any payment refund is tracked separately in your order.",
};
// Explicit public projection: never serialize internal notes, staff or kitchen identifiers.
export function customerCase(doc: SupportCaseDocument) {
  return {
    id: doc.id,
    orderId: String(doc.orderId),
    category: doc.category,
    message: doc.message,
    status: doc.status,
    response: CARE_RESPONSES[doc.response] ?? CARE_RESPONSES.received,
    createdAt: (doc as SupportCaseDocument & { createdAt: Date }).createdAt,
  };
}
@Injectable()
export class CareService implements OnModuleInit {
  constructor(
    private readonly catalog: CatalogService,
    @InjectModel(Provider.name)
    private readonly providers: Model<ProviderDocument>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    @InjectModel(OrderFeedback.name)
    private readonly feedback: Model<OrderFeedbackDocument>,
    @InjectModel(SupportCase.name)
    private readonly cases: Model<SupportCaseDocument>,
  ) {}
  async onModuleInit() {
    await Promise.all([this.feedback.init(), this.cases.init()]);
  }
  private async ownedOrder(customerId: string, orderId: string) {
    if (!Types.ObjectId.isValid(orderId))
      throw new NotFoundException("Order not found.");
    const order = await this.orders
      .findOne({ _id: orderId, customerId: new Types.ObjectId(customerId) })
      .exec();
    if (!order) throw new NotFoundException("Order not found.");
    return order;
  }
  async feedbackState(customerId: string, orderId: string) {
    const order = await this.ownedOrder(customerId, orderId);
    const feedback = await this.feedback
      .findOne({ orderId: order._id })
      .select("allowPublication")
      .exec();
    return {
      submitted: Boolean(feedback),
      allowPublication: feedback?.allowPublication ?? false,
      eligible:
        !order.isTestOrder &&
        Boolean(order.providerId) &&
        [OrderStatus.COMPLETED, OrderStatus.DELIVERED].includes(order.status),
    };
  }
  async submitFeedback(
    customerId: string,
    orderId: string,
    dto: SubmitFeedbackDto,
  ) {
    const order = await this.ownedOrder(customerId, orderId);
    if (
      order.isTestOrder ||
      !order.providerId ||
      ![OrderStatus.COMPLETED, OrderStatus.DELIVERED].includes(order.status)
    ) {
      throw new BadRequestException(
        "Feedback is available after your pizza is delivered.",
      );
    }
    // One immutable, verified response per order; retries cannot inflate metrics.
    await this.feedback
      .updateOne(
        { orderId: order._id },
        {
          $setOnInsert: {
            orderId: order._id,
            customerId: order.customerId,
            providerId: order.providerId,
            taste: dto.taste,
            temperature: dto.temperature,
            packaging: dto.packaging,
            delivery: dto.delivery,
            wouldOrderAgain: dto.wouldOrderAgain,
            comment: dto.comment.trim(),
            allowPublication: dto.allowPublication === true,
            pizzaItems: [
              ...new Map(
                order.lines.map((line) => [
                  String(line.menuItemId),
                  { id: String(line.menuItemId), name: line.name },
                ]),
              ).values(),
            ],
          },
        },
        { upsert: true },
      )
      .exec()
      .catch((error: { code?: number }) => {
        if (error.code !== 11000) throw error;
      });
    return { submitted: true };
  }
  async publicationPermission(
    customerId: string,
    orderId: string,
    allowPublication: boolean,
  ) {
    const order = await this.ownedOrder(customerId, orderId);
    const row = await this.feedback
      .findOneAndUpdate(
        { orderId: order._id, customerId: order.customerId },
        {
          $set: { allowPublication, published: false },
          $inc: { moderationRevision: 1 },
          $push: {
            moderationHistory: {
              actorId: customerId,
              at: new Date(),
              published: false,
              pizzaId: "",
              text: allowPublication
                ? "Customer permitted review for publication"
                : "Customer withdrew publication permission",
            },
          },
        },
        { new: true },
      )
      .exec();
    if (!row)
      throw new NotFoundException(
        "Submit feedback before changing publication permission.",
      );
    return { allowPublication: row.allowPublication };
  }
  async publicComments(pizzaId: string) {
    if (!Types.ObjectId.isValid(pizzaId)) return [];
    const rows = await this.feedback
      .find({
        published: true,
        allowPublication: true,
        publishedPizzaId: { $in: await this.catalog.commentAliases(pizzaId) },
      })
      .sort({ publishedAt: -1 })
      .limit(20)
      .select("_id publishedText publishedAt")
      .lean()
      .exec();
    return rows.map((row) => ({
      id: String(row._id),
      text: row.publishedText,
      publishedAt: row.publishedAt,
    }));
  }
  async moderate(id: string, actorId: string, dto: ModerateFeedbackDto) {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException("Feedback not found.");
    const row = await this.feedback.findById(id).exec();
    if (!row) throw new NotFoundException("Feedback not found.");
    const text = dto.text.trim();
    if (
      dto.published &&
      (!row.allowPublication ||
        !text ||
        !row.comment.includes(text) ||
        !row.pizzaItems.some((item) => item.id === dto.pizzaId))
    ) {
      throw new BadRequestException(
        "Publication needs customer permission, an exact excerpt and a pizza from this order.",
      );
    }
    if (dto.published) {
      const provider = await this.providers
        .findById(row.providerId)
        .select("name address")
        .lean()
        .exec();
      const normalized = text.normalize("NFKC").toLocaleLowerCase();
      if (
        [provider?.name, provider?.address].some(
          (value) =>
            value &&
            value.length > 2 &&
            normalized.includes(value.normalize("NFKC").toLocaleLowerCase()),
        )
      ) {
        throw new BadRequestException(
          "Remove the restaurant identity from the public excerpt.",
        );
      }
    }
    const updated = await this.feedback
      .findOneAndUpdate(
        { _id: row._id, moderationRevision: dto.revision },
        {
          $set: {
            published: dto.published,
            publishedPizzaId: dto.pizzaId,
            publishedText: text,
            publishedAt: new Date(),
          },
          $inc: { moderationRevision: 1 },
          $push: {
            moderationHistory: {
              actorId,
              at: new Date(),
              published: dto.published,
              pizzaId: dto.pizzaId,
              text,
            },
          },
        },
        { new: true },
      )
      .exec();
    if (!updated)
      throw new ConflictException(
        "Another administrator changed this comment. Refresh before reviewing.",
      );
    return updated;
  }
  async createCase(
    customerId: string,
    dto: CreateSupportDto,
  ): Promise<ReturnType<typeof customerCase>> {
    const order = await this.ownedOrder(customerId, dto.orderId);
    if (dto.message.trim().length < 5)
      throw new BadRequestException("Tell us what happened.");
    const existing = await this.cases
      .findOne({ customerId: order.customerId, requestKey: dto.requestKey })
      .exec();
    if (existing) {
      if (
        String(existing.orderId) !== dto.orderId ||
        existing.category !== dto.category ||
        existing.message !== dto.message.trim()
      )
        throw new ConflictException("This request key is already used.");
      return customerCase(existing);
    }
    try {
      const doc = await this.cases.create({
        customerId: order.customerId,
        orderId: order._id,
        providerId: order.providerId,
        category: dto.category,
        message: dto.message.trim(),
        requestKey: dto.requestKey,
        dueAt: new Date(
          Date.now() + (dto.category === "late" ? 10 : 60) * 60_000,
        ),
        events: [{ at: new Date(), action: "created" }],
      });
      return customerCase(doc);
    } catch (error) {
      if ((error as { code?: number }).code === 11000)
        return this.createCase(customerId, dto);
      throw error;
    }
  }
  async customerCases(customerId: string) {
    const rows = await this.cases
      .find({ customerId: new Types.ObjectId(customerId) })
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();
    return rows.map(customerCase);
  }
  listCases() {
    return this.cases.find().sort({ status: 1, dueAt: 1 }).limit(200).exec();
  }
  async claim(id: string, adminId: string) {
    const doc = await this.cases
      .findOneAndUpdate(
        {
          _id: id,
          status: { $ne: "resolved" },
          $or: [
            { ownerId: { $exists: false } },
            { ownerId: new Types.ObjectId(adminId) },
          ],
        },
        {
          $set: { ownerId: new Types.ObjectId(adminId) },
          $inc: { revision: 1 },
          $push: {
            events: {
              at: new Date(),
              action: "claimed",
              actorId: new Types.ObjectId(adminId),
            },
          },
        },
        { new: true },
      )
      .exec();
    if (!doc)
      throw new ConflictException(
        "This request has been claimed or closed. Refresh the queue.",
      );
    return doc;
  }
  async resolve(id: string, adminId: string, dto: ResolveSupportDto) {
    if (
      dto.internalNote.trim().length < 5 ||
      (dto.status === "resolved") !== (dto.response === "resolved")
    )
      throw new BadRequestException(
        "Choose a matching outcome and add a review note.",
      );
    const doc = await this.cases
      .findOneAndUpdate(
        {
          _id: id,
          revision: dto.revision,
          ownerId: new Types.ObjectId(adminId),
          status: { $ne: "resolved" },
        },
        {
          $set: { status: dto.status, response: dto.response },
          $inc: { revision: 1 },
          $push: {
            events: {
              at: new Date(),
              action: dto.status,
              actorId: new Types.ObjectId(adminId),
              internalNote: dto.internalNote.trim(),
            },
          },
        },
        { new: true },
      )
      .exec();
    if (!doc)
      throw new ConflictException(
        "Claim this request first, or refresh its updated state.",
      );
    return doc;
  }
  async metrics() {
    const since = new Date(Date.now() - 90 * 86400_000);
    const [providers, recent] = await Promise.all([
      this.feedback.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: "$providerId",
            responses: { $sum: 1 },
            taste: { $avg: "$taste" },
            temperature: { $avg: "$temperature" },
            packaging: { $avg: "$packaging" },
            delivery: { $avg: "$delivery" },
            repeatIntent: { $avg: { $cond: ["$wouldOrderAgain", 1, 0] } },
          },
        },
        {
          $lookup: {
            from: "providers",
            localField: "_id",
            foreignField: "_id",
            as: "provider",
          },
        },
        {
          $project: {
            providerId: "$_id",
            name: { $arrayElemAt: ["$provider.name", 0] },
            responses: 1,
            taste: 1,
            temperature: 1,
            packaging: 1,
            delivery: 1,
            repeatIntent: 1,
            score: {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        { $add: ["$taste", "$temperature", "$packaging"] },
                        3,
                      ],
                    },
                    20,
                  ],
                },
                1,
              ],
            },
          },
        },
        { $sort: { score: 1 } },
      ]),
      this.feedback
        .find({ createdAt: { $gte: since } })
        .sort({ createdAt: -1 })
        .limit(100)
        .exec(),
    ]);
    return { periodDays: 90, providers, recent };
  }
}
